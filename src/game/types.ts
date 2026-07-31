import type { Mode } from './limit';

export type ScreenName = 'setup' | 'game' | 'entry' | 'end' | 'history';

/** Main de chaque perdant, indexée par position de joueur. */
export type Hands = Record<number, number[]>;

/**
 * Scores saisis directement plutôt que carte par carte, indexés par position
 * de joueur. La valeur est le texte brut du champ : une clé présente signifie
 * « ce joueur est en saisie directe », même si le champ est encore vide.
 */
export type Points = Record<number, string>;

export type Round = {
  /** Index du joueur qui a posé toutes ses cartes. */
  winner: number;
  /** Points de la manche, un par joueur (0 pour le gagnant). */
  scores: number[];
  cards: Hands;
};

export type HistoryItem = {
  date: string;
  winner: string;
  line: string;
  /**
   * Instantané de la partie, de quoi la reprendre depuis l'historique. Absent
   * des parties archivées avant l'ajout de cette reprise : elles restent en
   * lecture seule.
   */
  game?: {
    players: string[];
    rounds: Round[];
    mode: Mode;
    scoreLimit: number;
    tourLimit: number;
  };
};

export type GameState = {
  screen: ScreenName;
  /** Écran vers lequel « Retour » ramène depuis l'historique. */
  historyFrom: ScreenName;
  /** Noms en cours d'édition sur l'écran de configuration. */
  names: string[];
  /** Noms figés au démarrage de la partie. */
  players: string[];
  rounds: Round[];

  /** Saisie en cours. */
  winner: number | null;
  entryCards: Hands;
  /** Joueurs dont le score est saisi directement, au lieu des cartes. */
  entryPoints: Points;
  /** Position dans la liste des perdants du joueur affiché. */
  activeIdx: number;
  editIdx: number | null;

  expanded: number | null;
  history: HistoryItem[];

  /** Condition d'arrêt : total de points atteint, ou nombre de tours joués. */
  mode: Mode;
  scoreLimit: number;
  tourLimit: number;

  /** Vrai quand la partie a été arrêtée à la main, avant la condition d'arrêt. */
  endedEarly: boolean;
  /**
   * Condition d'arrêt neutralisée après une reprise de partie, quel que soit le
   * mode : points ou tours. Sans ça, une partie reprise alors que la limite est
   * déjà franchie se reterminerait à la manche suivante. Redevient `false` dès
   * que la condition est de nouveau tenable — limite relevée, ou reprise après
   * un arrêt manuel où elle n'était pas atteinte.
   */
  endSuspended: boolean;
};
