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
import type { GameState, Hands, Round, ScreenName } from './types';

const STORAGE_KEY = 'rami-tracker-v1';

export const MIN_PLAYERS = 3;
export const MAX_SLOTS = 8;
export const MIN_SLOTS = 2;
export const LIMIT_MIN = 100;
export const LIMIT_MAX = 1000;
export const LIMIT_STEP = 50;

export const INITIAL_STATE: GameState = {
  screen: 'setup',
  historyFrom: 'setup',
  names: ['', '', ''],
  players: [],
  rounds: [],
  winner: null,
  entryCards: {},
  activeIdx: 0,
  editIdx: null,
  expanded: null,
  history: [],
  scoreLimit: 500,
};

/** Cumul par joueur sur l'ensemble des manches. */
export function totalsOf(rounds: Round[], playerCount: number): number[] {
  const t = new Array<number>(playerCount).fill(0);
  rounds.forEach((r) => r.scores.forEach((s, i) => { t[i] += s; }));
  return t;
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
  setScoreLimit: (v: number) => void;
  start: () => void;
  loadDemo: () => void;
  /** Retour à la configuration, sans effet dès qu'une manche est enregistrée. */
  editPlayers: () => void;

  // Partie
  toggleExpanded: (i: number) => void;
  deleteRound: (i: number) => void;
  startEntry: (editIdx: number | null) => void;

  // Saisie
  setWinner: (i: number) => void;
  setActiveIdx: (i: number) => void;
  addCard: (playerIdx: number, cardIdx: number) => void;
  removeLastCard: (playerIdx: number) => void;
  validate: () => void;
  cancelEntry: () => void;

  // Navigation
  goBack: () => void;
  openHistory: () => void;
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

    setScoreLimit: (v) =>
      setState((s) => ({ ...s, scoreLimit: clamp(v, LIMIT_MIN, LIMIT_MAX) })),

    start: () =>
      setState((s) => {
        const filled = s.names.map((n) => n.trim()).filter(Boolean);
        if (filled.length !== s.names.length || filled.length < MIN_PLAYERS) return s;
        return { ...s, players: filled, rounds: [], screen: 'game', expanded: null };
      }),

    loadDemo: () =>
      setState((s) => {
        const players = ['Sam', 'Léa', 'Karim', 'Nadia'];
        const rounds: Round[] = [
          { winner: 0, scores: [0, 42, 18, 65], cards: { 1: [12, 11, 8, 3], 2: [9, 8], 3: [13, 13, 12, 9, 4] } },
          { winner: 2, scores: [31, 25, 0, 12], cards: { 0: [13, 10, 9, 1], 1: [13, 12, 4], 3: [9, 2] } },
          { winner: 1, scores: [20, 0, 44, 27], cards: { 0: [13, 8], 2: [13, 13, 4], 3: [12, 11, 6] } },
        ];
        return { ...s, players, names: players, rounds, screen: 'game', expanded: null };
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
        } else {
          base.winner = null;
          base.entryCards = {};
        }
        return { ...s, ...base };
      }),

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

    validate: () =>
      setState((s) => {
        if (s.winner == null) return s;
        const winner = s.winner;
        const scores = s.players.map((_, i) =>
          i === winner ? 0 : sumCards(s.entryCards[i]),
        );
        const round: Round = { winner, scores, cards: cloneHands(s.entryCards) };

        const rounds = s.rounds.slice();
        if (s.editIdx != null) rounds[s.editIdx] = round;
        else rounds.push(round);

        const t = totalsOf(rounds, s.players.length);
        const over = t.some((v) => v >= s.scoreLimit);

        let history = s.history;
        if (over) {
          // Le plus petit score gagne.
          const best = s.players
            .map((n, i) => ({ n, t: t[i] }))
            .sort((a, b) => a.t - b.t)[0];
          history = [
            {
              date: today(),
              winner: best.n,
              line: `${s.players.length} joueurs · ${rounds.length} manches · ${best.t} pts`,
            },
            ...s.history,
          ];
        }

        return {
          ...s,
          rounds,
          history,
          screen: over ? ('end' as ScreenName) : ('game' as ScreenName),
          winner: null,
          entryCards: {},
          editIdx: null,
          expanded: null,
        };
      }),

    cancelEntry: () =>
      setState((s) => ({
        ...s,
        screen: 'game',
        winner: null,
        entryCards: {},
        editIdx: null,
      })),

    goBack: () =>
      setState((s) => {
        if (s.screen === 'entry') {
          return { ...s, screen: 'game', winner: null, entryCards: {}, editIdx: null };
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

    rematch: () =>
      setState((s) => ({ ...s, rounds: [], screen: 'game', expanded: null })),

    newGame: () =>
      setState((s) => ({ ...s, screen: 'setup', rounds: [], expanded: null })),
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
