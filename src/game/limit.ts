/** Condition d'arrêt de la partie. */
export type Mode = 'points' | 'tours';

export const LIMIT_MIN = 100;
export const LIMIT_MAX = 1000;
export const LIMIT_STEP = 50;

export const TOURS_MIN = 1;
export const TOURS_MAX = 20;
export const TOURS_STEP = 1;

/**
 * Manches dans un tour complet. Le mélangeur avance d'un siège par manche :
 * le tour est bouclé quand il revient sur le premier joueur, soit après
 * autant de manches que de joueurs.
 */
export function roundsPerTour(playerCount: number): number {
  return Math.max(1, playerCount);
}

/** Tours entièrement joués. */
export function toursPlayed(roundCount: number, playerCount: number): number {
  return Math.floor(roundCount / roundsPerTour(playerCount));
}

/** Tour en cours, compté à partir de 1. */
export function currentTour(roundCount: number, playerCount: number): number {
  return toursPlayed(roundCount, playerCount) + 1;
}

export function isGameOver(args: {
  mode: Mode;
  totals: number[];
  scoreLimit: number;
  roundCount: number;
  playerCount: number;
  tourLimit: number;
}): boolean {
  const { mode, totals, scoreLimit, roundCount, playerCount, tourLimit } = args;
  if (mode === 'points') return totals.some((v) => v >= scoreLimit);
  return roundCount >= tourLimit * roundsPerTour(playerCount);
}

/** Valeur affichée dans la tuile « Limite » du tableau. */
export function limitValue(args: {
  mode: Mode;
  scoreLimit: number;
  tourLimit: number;
  roundCount: number;
  playerCount: number;
}): string {
  const { mode, scoreLimit, tourLimit, roundCount, playerCount } = args;
  if (mode === 'points') return `${scoreLimit} pts`;
  const tour = Math.min(currentTour(roundCount, playerCount), tourLimit);
  return `${tour} / ${tourLimit}`;
}
