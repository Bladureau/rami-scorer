export type Card = { l: string; p: number };

/**
 * Barème : 2–9 = valeur faciale, 10/V/D/R = 10, As = 11, Joker = 20.
 * L'index dans ce tableau est l'identifiant d'une carte partout dans l'app.
 */
export const CARDS: Card[] = [
  { l: '2', p: 2 },
  { l: '3', p: 3 },
  { l: '4', p: 4 },
  { l: '5', p: 5 },
  { l: '6', p: 6 },
  { l: '7', p: 7 },
  { l: '8', p: 8 },
  { l: '9', p: 9 },
  { l: '10', p: 10 },
  { l: 'V', p: 10 },
  { l: 'D', p: 10 },
  { l: 'R', p: 10 },
  { l: 'A', p: 11 },
  { l: 'JK', p: 20 },
];

/** Total en points d'une main (liste d'index de cartes). */
export function sumCards(list?: number[]): number {
  return (list ?? []).reduce((a, ci) => a + (CARDS[ci]?.p ?? 0), 0);
}

/** Rendu compact d'une main : `2×R · A · 7`. */
export function cardsLine(list?: number[]): string {
  if (!list || !list.length) return '—';
  const counts = new Map<number, number>();
  list.forEach((ci) => counts.set(ci, (counts.get(ci) ?? 0) + 1));
  return [...counts.entries()]
    .map(([ci, n]) => (n > 1 ? `${n}×${CARDS[ci].l}` : CARDS[ci].l))
    .join(' · ');
}

/** État des 14 touches pour un joueur : compteur + points. */
export function keysFor(hand?: number[]) {
  const list = hand ?? [];
  return CARDS.map((c, ci) => {
    const n = list.filter((x) => x === ci).length;
    return { ci, label: c.l, pts: c.p, n, hasCount: n > 0 };
  });
}
