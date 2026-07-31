import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { sumCards } from '../cards';
import {
  LIMIT_MAX,
  LIMIT_MIN,
  TOURS_MAX,
  TOURS_MIN,
  isGameOver,
  type Mode,
} from './limit';
import type { GameState, Hands, Points, Round } from './types';

const STORAGE_KEY = 'rami-tracker-v1';

export const MIN_PLAYERS = 3;
export const MAX_SLOTS = 8;
export const MIN_SLOTS = 2;

export const INITIAL_STATE: GameState = {
  screen: 'setup',
  historyFrom: 'setup',
  names: ['', '', ''],
  players: [],
  rounds: [],
  winner: null,
  entryCards: {},
  entryPoints: {},
  activeIdx: 0,
  editIdx: null,
  expanded: null,
  history: [],
  mode: 'points',
  scoreLimit: 500,
  tourLimit: 3,
  endedEarly: false,
  endSuspended: false,
};

/** Vrai quand le joueur est en saisie directe plutôt qu'en saisie de cartes. */
export function isManual(entryPoints: Points, i: number): boolean {
  return entryPoints[i] != null;
}

/**
 * Points du joueur pour la manche en cours : score saisi à la main s'il y en a
 * un, sinon somme des cartes restantes.
 */
export function entryScore(entryCards: Hands, entryPoints: Points, i: number): number {
  const raw = entryPoints[i];
  if (raw == null) return sumCards(entryCards[i]);
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Perdants dont le score est encore vide, main comme saisie directe. Un joueur
 * qui n'a pas fini garde au moins une carte, et la plus faible vaut 2 points :
 * un perdant à 0 est donc impossible.
 */
export function missingScores(
  players: string[],
  entryCards: Hands,
  entryPoints: Points,
  winner: number | null,
): number[] {
  if (winner == null) return [];
  return players
    .map((_, i) => i)
    .filter((i) => i !== winner && entryScore(entryCards, entryPoints, i) <= 0);
}

/** Cumul par joueur sur l'ensemble des manches. */
export function totalsOf(rounds: Round[], playerCount: number): number[] {
  const t = new Array<number>(playerCount).fill(0);
  rounds.forEach((r) => r.scores.forEach((s, i) => { t[i] += s; }));
  return t;
}

function cloneRounds(rounds: Round[]): Round[] {
  return rounds.map((r) => ({
    winner: r.winner,
    scores: r.scores.slice(),
    cards: cloneHands(r.cards),
  }));
}

function cloneHands(hands: Hands): Hands {
  const out: Hands = {};
  Object.keys(hands).forEach((k) => {
    out[Number(k)] = (hands[Number(k)] ?? []).slice();
  });
  return out;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Renvoie à l'écran de configuration en y replaçant les joueurs de la partie
 * courante. L'appelant doit avoir vérifié qu'aucune manche n'est enregistrée.
 */
function backToSetup(s: GameState): GameState {
  return {
    ...s,
    screen: 'setup',
    names: s.players.length ? s.players.slice() : s.names,
    expanded: null,
  };
}

/**
 * Clôt la partie : écran de fin et archivage dans l'historique. `endedEarly`
 * distingue l'arrêt manuel de la condition d'arrêt atteinte.
 */
function conclude(s: GameState, endedEarly: boolean): GameState {
  const n = s.players.length;
  const totals = totalsOf(s.rounds, n);

  // Le plus petit score gagne.
  const best = s.players
    .map((name, i) => ({ name, total: totals[i] }))
    .sort((a, b) => a.total - b.total)[0];

  return {
    ...s,
    screen: 'end',
    expanded: null,
    endedEarly,
    endSuspended: false,
    history: [
      {
        date: today(),
        winner: best.name,
        line: `${n} joueurs · ${s.rounds.length} manches · ${best.total} pts`,
        // De quoi rouvrir la partie plus tard depuis l'historique.
        game: {
          players: s.players.slice(),
          rounds: cloneRounds(s.rounds),
          mode: s.mode,
          scoreLimit: s.scoreLimit,
          tourLimit: s.tourLimit,
        },
      },
      ...s.history,
    ],
  };
}

/** La condition d'arrêt du mode courant est-elle atteinte ? */
function gameIsOver(s: GameState): boolean {
  const n = s.players.length;
  if (!n || !s.rounds.length) return false;
  return isGameOver({
    mode: s.mode,
    totals: totalsOf(s.rounds, n),
    scoreLimit: s.scoreLimit,
    roundCount: s.rounds.length,
    playerCount: n,
    tourLimit: s.tourLimit,
  });
}

/**
 * Bascule sur l'écran de fin si la condition d'arrêt est atteinte, et archive
 * la partie. Appelé après chaque manche validée, mais aussi quand la limite
 * change en cours de partie — la baisser sous les scores déjà atteints termine
 * donc la partie immédiatement.
 */
function concludeIfOver(s: GameState): GameState {
  const over = gameIsOver(s);

  // Partie reprise alors que la condition était déjà franchie : on la laisse
  // en sommeil jusqu'à ce qu'elle redevienne tenable.
  if (s.endSuspended) return over ? s : { ...s, endSuspended: false };
  if (!over) return s;

  return conclude(s, false);
}

/**
 * Applique un changement de règle. En pleine partie, la nouvelle condition est
 * réévaluée aussitôt : la partie peut donc se terminer sur-le-champ. Sur
 * l'écran de configuration, rien n'est encore joué, on se contente de stocker.
 */
function applyLimitChange(prev: GameState, next: GameState): GameState {
  return prev.screen === 'game' ? concludeIfOver(next) : next;
}

function today(): string {
  return new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

type Actions = {
  /** Fusion partielle, équivalent du `setState` de la maquette. */
  patch: (p: Partial<GameState> | ((s: GameState) => Partial<GameState>)) => void;

  // Configuration
  setName: (i: number, value: string) => void;
  addSlot: () => void;
  removeSlot: () => void;
  removeSlotAt: (i: number) => void;
  setMode: (m: Mode) => void;
  setScoreLimit: (v: number) => void;
  setTourLimit: (v: number) => void;
  start: () => void;
  loadDemo: () => void;
  /** Retour à la configuration, sans effet dès qu'une manche est enregistrée. */
  editPlayers: () => void;

  // Partie
  toggleExpanded: (i: number) => void;
  deleteRound: (i: number) => void;
  startEntry: (editIdx: number | null) => void;
  /** Arrête la partie en cours sur les scores actuels, sans attendre la limite. */
  endGame: () => void;

  // Saisie
  setWinner: (i: number) => void;
  setActiveIdx: (i: number) => void;
  addCard: (playerIdx: number, cardIdx: number) => void;
  removeLastCard: (playerIdx: number) => void;
  /** Bascule un joueur entre saisie des cartes et saisie directe du score. */
  setEntryMode: (playerIdx: number, manual: boolean) => void;
  /** Score saisi à la main, texte brut du champ. */
  setPoints: (playerIdx: number, raw: string) => void;
  validate: () => void;
  cancelEntry: () => void;

  // Navigation
  goBack: () => void;
  openHistory: () => void;
  /** Repart de l'écran de fin sur les scores en cours, quelle qu'ait été la fin. */
  resumeGame: () => void;
  /** Rouvre une partie archivée. Écrase la partie courante s'il y en a une. */
  resumeArchived: (i: number) => void;
  rematch: () => void;
  newGame: () => void;
};

type Ctx = {
  state: GameState;
  hydrated: boolean;
  /** Vrai tant que la composition de la partie peut encore être changée. */
  canEditPlayers: boolean;
} & Actions;

const GameCtx = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);

  // Reprise de la partie interrompue.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (alive && raw) {
          const saved = JSON.parse(raw) as Partial<GameState>;
          setState((s) => ({ ...s, ...saved }));
        }
      } catch {
        // Stockage indisponible : on démarre sur l'état initial.
      } finally {
        if (alive) {
          hydratedRef.current = true;
          setHydrated(true);
        }
      }
    })();
    return () => { alive = false; };
  }, []);

  // Sauvegarde à chaque changement, une fois l'hydratation faite.
  useEffect(() => {
    if (!hydratedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const patch = useCallback<Actions['patch']>((p) => {
    setState((s) => ({ ...s, ...(typeof p === 'function' ? p(s) : p) }));
  }, []);

  const actions = useMemo<Actions>(() => ({
    patch,

    setName: (i, value) =>
      setState((s) => {
        const names = s.names.slice();
        names[i] = value;
        return { ...s, names };
      }),

    addSlot: () =>
      setState((s) =>
        s.names.length >= MAX_SLOTS ? s : { ...s, names: [...s.names, ''] },
      ),

    removeSlot: () =>
      setState((s) =>
        s.names.length <= MIN_SLOTS ? s : { ...s, names: s.names.slice(0, -1) },
      ),

    removeSlotAt: (i) =>
      setState((s) => {
        if (s.names.length <= MIN_SLOTS) return s;
        const names = s.names.slice();
        names.splice(i, 1);
        return { ...s, names };
      }),

    setMode: (mode) =>
      setState((s) => applyLimitChange(s, { ...s, mode })),

    setScoreLimit: (v) =>
      setState((s) =>
        applyLimitChange(s, { ...s, scoreLimit: clamp(v, LIMIT_MIN, LIMIT_MAX) }),
      ),

    setTourLimit: (v) =>
      setState((s) =>
        applyLimitChange(s, { ...s, tourLimit: clamp(v, TOURS_MIN, TOURS_MAX) }),
      ),

    start: () =>
      setState((s) => {
        const filled = s.names.map((n) => n.trim()).filter(Boolean);
        if (filled.length !== s.names.length || filled.length < MIN_PLAYERS) return s;
        return {
          ...s,
          players: filled,
          rounds: [],
          screen: 'game',
          expanded: null,
          endedEarly: false,
          endSuspended: false,
        };
      }),

    loadDemo: () =>
      setState((s) => {
        const players = ['Sam', 'Léa', 'Karim', 'Nadia'];
        const rounds: Round[] = [
          { winner: 0, scores: [0, 42, 18, 65], cards: { 1: [12, 11, 8, 3], 2: [9, 8], 3: [13, 13, 12, 9, 4] } },
          { winner: 2, scores: [31, 25, 0, 12], cards: { 0: [13, 10, 9, 1], 1: [13, 12, 4], 3: [9, 2] } },
          { winner: 1, scores: [20, 0, 44, 27], cards: { 0: [13, 8], 2: [13, 13, 4], 3: [12, 11, 6] } },
        ];
        return {
          ...s,
          players,
          names: players,
          rounds,
          screen: 'game',
          expanded: null,
          endedEarly: false,
          endSuspended: false,
        };
      }),

    editPlayers: () => setState((s) => (s.rounds.length ? s : backToSetup(s))),

    toggleExpanded: (i) =>
      setState((s) => ({ ...s, expanded: s.expanded === i ? null : i })),

    deleteRound: (i) =>
      setState((s) => {
        const rounds = s.rounds.slice();
        rounds.splice(i, 1);
        return { ...s, rounds, expanded: null };
      }),

    startEntry: (editIdx) =>
      setState((s) => {
        const base: Partial<GameState> = {
          screen: 'entry',
          editIdx,
          activeIdx: 0,
        };
        if (editIdx != null && s.rounds[editIdx]) {
          const r = s.rounds[editIdx];
          base.winner = r.winner;
          base.entryCards = cloneHands(r.cards);
          // Un perdant sans carte enregistrée avait été saisi en direct : on
          // rouvre la correction dans le même mode.
          const entryPoints: Points = {};
          r.scores.forEach((sc, i) => {
            if (i !== r.winner && !(r.cards[i] ?? []).length) entryPoints[i] = String(sc);
          });
          base.entryPoints = entryPoints;
        } else {
          base.winner = null;
          base.entryCards = {};
          base.entryPoints = {};
        }
        return { ...s, ...base };
      }),

    // Sans manche jouée il n'y a pas de classement à figer : on ne fait rien.
    endGame: () =>
      setState((s) =>
        s.screen === 'game' && s.players.length && s.rounds.length
          ? conclude(s, true)
          : s,
      ),

    setWinner: (i) => setState((s) => ({ ...s, winner: i, activeIdx: 0 })),

    setActiveIdx: (i) => setState((s) => ({ ...s, activeIdx: Math.max(0, i) })),

    addCard: (playerIdx, cardIdx) =>
      setState((s) => {
        const entryCards = cloneHands(s.entryCards);
        entryCards[playerIdx] = [...(entryCards[playerIdx] ?? []), cardIdx];
        return { ...s, entryCards };
      }),

    removeLastCard: (playerIdx) =>
      setState((s) => {
        const entryCards = cloneHands(s.entryCards);
        const list = entryCards[playerIdx] ?? [];
        list.pop();
        entryCards[playerIdx] = list;
        return { ...s, entryCards };
      }),

    setEntryMode: (playerIdx, manual) =>
      setState((s) => {
        const entryPoints = { ...s.entryPoints };
        if (manual) {
          // Les cartes déjà pointées servent de valeur de départ.
          const fromCards = sumCards(s.entryCards[playerIdx]);
          entryPoints[playerIdx] = fromCards ? String(fromCards) : '';
        } else {
          delete entryPoints[playerIdx];
        }
        return { ...s, entryPoints };
      }),

    setPoints: (playerIdx, raw) =>
      setState((s) => ({
        ...s,
        entryPoints: {
          ...s.entryPoints,
          [playerIdx]: raw.replace(/[^0-9]/g, '').slice(0, 4),
        },
      })),

    validate: () =>
      setState((s) => {
        if (s.winner == null) return s;
        // Chaque perdant doit avoir des cartes ou un score saisi.
        if (missingScores(s.players, s.entryCards, s.entryPoints, s.winner).length) return s;
        const winner = s.winner;
        const scores = s.players.map((_, i) =>
          i === winner ? 0 : entryScore(s.entryCards, s.entryPoints, i),
        );
        // Un score saisi en direct n'a pas de détail de cartes à conserver.
        const cards = cloneHands(s.entryCards);
        s.players.forEach((_, i) => {
          if (i === winner || isManual(s.entryPoints, i)) delete cards[i];
        });
        const round: Round = { winner, scores, cards };

        const rounds = s.rounds.slice();
        if (s.editIdx != null) rounds[s.editIdx] = round;
        else rounds.push(round);

        return concludeIfOver({
          ...s,
          rounds,
          screen: 'game',
          winner: null,
          entryCards: {},
          entryPoints: {},
          editIdx: null,
          expanded: null,
        });
      }),

    cancelEntry: () =>
      setState((s) => ({
        ...s,
        screen: 'game',
        winner: null,
        entryCards: {},
        entryPoints: {},
        editIdx: null,
      })),

    goBack: () =>
      setState((s) => {
        if (s.screen === 'entry') {
          return {
            ...s,
            screen: 'game',
            winner: null,
            entryCards: {},
            entryPoints: {},
            editIdx: null,
          };
        }
        // Depuis le tableau, on ne peut revenir en arrière que sur une partie
        // encore vierge — sinon il n'y a rien derrière.
        if (s.screen === 'game') return s.rounds.length ? s : backToSetup(s);
        // Historique : on repart d'où on l'a ouvert, sans toucher à une saisie
        // laissée en cours.
        return { ...s, screen: s.historyFrom };
      }),

    openHistory: () =>
      setState((s) =>
        s.screen === 'history' ? s : { ...s, screen: 'history', historyFrom: s.screen },
      ),

    resumeGame: () =>
      setState((s) => {
        if (s.screen !== 'end' || !s.rounds.length) return s;
        return {
          ...s,
          screen: 'game',
          expanded: null,
          endedEarly: false,
          // Fin par limite de points ou par tours : la condition est déjà
          // franchie, on la met en sommeil. Après un arrêt manuel prématuré,
          // elle reste au contraire active.
          endSuspended: gameIsOver(s),
          // La partie sera réarchivée à sa vraie fin : on retire l'entrée
          // écrite en concluant.
          history: s.history.slice(1),
        };
      }),

    resumeArchived: (i) =>
      setState((s) => {
        const archived = s.history[i]?.game;
        if (!archived) return s;
        const next: GameState = {
          ...s,
          players: archived.players.slice(),
          names: archived.players.slice(),
          rounds: cloneRounds(archived.rounds),
          mode: archived.mode,
          scoreLimit: archived.scoreLimit,
          tourLimit: archived.tourLimit,
          screen: 'game',
          historyFrom: 'game',
          expanded: null,
          // Une saisie laissée en cours appartenait à la partie remplacée.
          winner: null,
          entryCards: {},
          entryPoints: {},
          editIdx: null,
          activeIdx: 0,
          endedEarly: false,
          endSuspended: false,
          // Comme pour une reprise depuis l'écran de fin : la partie sera
          // réarchivée quand elle se terminera pour de bon.
          history: s.history.filter((_, k) => k !== i),
        };
        return { ...next, endSuspended: gameIsOver(next) };
      }),

    rematch: () =>
      setState((s) => ({
        ...s,
        rounds: [],
        screen: 'game',
        expanded: null,
        endedEarly: false,
        endSuspended: false,
      })),

    newGame: () =>
      setState((s) => ({
        ...s,
        screen: 'setup',
        rounds: [],
        expanded: null,
        endedEarly: false,
        endSuspended: false,
      })),
  }), [patch]);

  const value = useMemo<Ctx>(
    () => ({
      state,
      hydrated,
      canEditPlayers: state.rounds.length === 0,
      ...actions,
    }),
    [state, hydrated, actions],
  );

  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

export function useGame(): Ctx {
  const ctx = useContext(GameCtx);
  if (!ctx) throw new Error('useGame doit être utilisé dans <GameProvider>');
  return ctx;
}
