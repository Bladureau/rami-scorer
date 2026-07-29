# Rami Score — suivi de partie

## Démarrer

```bash
npm install
npx expo start
```

Puis `a` pour Android, `i` pour iOS, ou scanner le QR code avec Expo Go.

## Règles implémentées

Les cartes restantes des perdants comptent en pénalité, **le plus petit score
gagne**. Barème : 2–9 = valeur faciale, 10/V/D/R = 10, As = 11, Joker = 20.

Un joueur qui n'a pas fini garde forcément au moins une carte, et la plus
faible vaut 2 points : la validation d'une manche est donc bloquée tant qu'un
perdant a une main vide (`missingHands` dans
[GameContext.tsx](src/game/GameContext.tsx)).
La partie s'arrête dès qu'un joueur atteint la limite (500 pts par défaut,
réglable de 100 à 1000 par pas de 50 sur l'écran de configuration).

### Condition d'arrêt

Deux modes, réglables à la configuration **et en cours de partie** (tuile de
droite du tableau, un tap la déplie) — voir
[limit.ts](src/game/limit.ts) et [LimitControls.tsx](src/components/LimitControls.tsx) :

- **Aux points** (défaut) — la partie s'arrête dès qu'un joueur atteint la
  limite, réglable de 100 à 1000 par pas de 50.
- **Aux tours** — la partie s'arrête après N tours complets. Un tour vaut
  autant de manches qu'il y a de joueurs : c'est bouclé quand le mélangeur
  revient sur le premier joueur.

Changer la règle en cours de partie réévalue la condition immédiatement.
Baisser la limite sous un score déjà atteint termine donc la partie sur-le-champ.

### Rotation des rôles

On joue dans le sens horaire, et les joueurs sont listés dans l'ordre où ils
sont assis. À chaque manche, le mélangeur avance d'un siège ; coupeur, donneur
puis premier joueur occupent les trois sièges suivants
([roles.ts](src/game/roles.ts)).

À 3 joueurs, le quatrième siège retombe sur le premier : c'est donc le
mélangeur qui commence. Aucun cas particulier dans le code, `(m + 3) mod 3`
vaut `m`.

```text
4 joueurs   manche 1   mélange J1 · coupe J2 · donne J3 · commence J4
            manche 2   mélange J2 · coupe J3 · donne J4 · commence J1

3 joueurs   manche 1   mélange J1 · coupe J2 · donne J3 · commence J1
            manche 2   mélange J2 · coupe J3 · donne J1 · commence J2
```

## Écrans

| Écran | Fichier |
| --- | --- |
| Configuration (joueurs, limite) | [SetupScreen.tsx](src/screens/SetupScreen.tsx) |
| Tableau de la partie | [GameScreen.tsx](src/screens/GameScreen.tsx) |
| Saisie d'une manche | [entry/EntryScreen.tsx](src/screens/entry/EntryScreen.tsx) |
| Fin de partie | [EndScreen.tsx](src/screens/EndScreen.tsx) |
| Historique | [HistoryScreen.tsx](src/screens/HistoryScreen.tsx) |

L'app est un flux unique piloté par `state.screen` — comme la maquette — plutôt
qu'un navigateur : voir le `Router` dans [App.tsx](App.tsx).

Tant que la partie n'a aucune manche enregistrée, on peut revenir à la
configuration pour changer les joueurs ou la limite : flèche retour dans
l'en-tête, ou bouton « Modifier les joueurs » sous le tableau vide. Dès la
première manche validée, les deux disparaissent.

## La saisie

Une seule manière de saisir les cartes restantes, reprise de la variante
« Cartes » de la maquette : on choisit qui a fini, puis on parcourt les
perdants un par un sur une grille des 14 valeurs avec compteur par carte
([HandEntry.tsx](src/screens/entry/HandEntry.tsx)). Le même écran sert à
corriger une manche déjà enregistrée.

## Architecture

```text
App.tsx                    aiguillage d'écran + chargement des polices
src/theme.ts               jetons de couleur et de typographie du design
src/cards.ts               barème, totaux, rendu compact d'une main
src/game/types.ts          types de l'état de partie
src/game/roles.ts          mélange / coupe / donne / commence par manche
src/game/limit.ts          modes points / tours et condition de fin
src/game/GameContext.tsx   état + actions + persistance AsyncStorage
src/components/ui.tsx      boutons, cartes, grille mesurée, animation « rise »
src/components/Header.tsx  barre supérieure contextuelle
src/screens/               un fichier par écran
```

## Scripts

```bash
npm run typecheck   # tsc --noEmit
npm start           # serveur de développement Expo
```
