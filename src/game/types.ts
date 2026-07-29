export type ScreenName = 'setup' | 'game' | 'entry' | 'end' | 'history';

/** Main de chaque perdant, indexée par position de joueur. */
export type Hands = Record<number, number[]>;

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
  /** Position dans la liste des perdants du joueur affiché. */
  activeIdx: number;
  editIdx: number | null;

  expanded: number | null;
  history: HistoryItem[];
  scoreLimit: number;
};
