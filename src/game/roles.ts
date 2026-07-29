export type Role = 'melange' | 'coupe' | 'donne' | 'commence';

/** Ordre d'affichage, qui est aussi l'ordre des sièges dans le sens horaire. */
export const ROLE_ORDER: Role[] = ['melange', 'coupe', 'donne', 'commence'];

export const ROLE_LABEL: Record<Role, string> = {
  melange: 'Mélange',
  coupe: 'Coupe',
  donne: 'Donne',
  commence: 'Commence',
};

/** Version courte, pour le badge sous le nom dans le tableau. */
export const ROLE_SHORT: Record<Role, string> = {
  melange: 'mél',
  coupe: 'coupe',
  donne: 'donne',
  commence: '1er',
};

/** Sièges parcourus depuis le mélangeur, dans le sens horaire. */
const OFFSET: Record<Role, number> = {
  melange: 0,
  coupe: 1,
  donne: 2,
  commence: 3,
};

export type RoleMap = Record<Role, number>;

/**
 * Répartit les rôles de la manche à venir.
 *
 * Le mélangeur avance d'un siège à chaque manche ; coupeur, donneur puis
 * premier joueur suivent immédiatement dans le sens horaire. À 3 joueurs le
 * quatrième siège retombe sur le premier — c'est donc le mélangeur qui
 * commence, sans qu'il faille de cas particulier : `(m + 3) mod 3 === m`.
 */
export function rolesFor(roundIndex: number, playerCount: number): RoleMap {
  const n = Math.max(1, playerCount);
  const shuffler = roundIndex % n;
  return {
    melange: (shuffler + OFFSET.melange) % n,
    coupe: (shuffler + OFFSET.coupe) % n,
    donne: (shuffler + OFFSET.donne) % n,
    commence: (shuffler + OFFSET.commence) % n,
  };
}

/** Rôles tenus par un joueur — il peut en cumuler deux à 3 joueurs. */
export function rolesOfPlayer(roles: RoleMap, playerIdx: number): Role[] {
  return ROLE_ORDER.filter((r) => roles[r] === playerIdx);
}
