import { StyleSheet, Text, View } from 'react-native';

import { cardsLine, keysFor, sumCards } from '../../cards';
import { Card, Grid, IconButton } from '../../components/ui';
import { useGame } from '../../game/GameContext';
import { C, F } from '../../theme';
import CardKey from './CardKey';

/**
 * Saisie des cartes restantes, un joueur à la fois : grille complète des 14
 * valeurs avec compteur par carte.
 */
export default function HandEntry({
  loserIdx,
  activeIdx,
  activePlayer,
}: {
  loserIdx: number[];
  /** Position dans `loserIdx`. */
  activeIdx: number;
  /** Index du joueur dans `players`. */
  activePlayer: number;
}) {
  const { state, setActiveIdx, addCard, removeLastCard } = useGame();
  const hand = state.entryCards[activePlayer];

  return (
    <View style={{ flex: 1, marginTop: 16, gap: 14 }}>
      {/* Navigation entre perdants */}
      <Card style={s.pager}>
        <IconButton
          icon="chevron-left"
          onPress={() => setActiveIdx(Math.max(0, activeIdx - 1))}
          iconSize={14}
          disabled={activeIdx <= 0}
          label="Joueur précédent"
        />
        <View style={{ flexShrink: 1, alignItems: 'center' }}>
          <Text style={s.name} numberOfLines={1}>
            {state.players[activePlayer] ?? '—'}
          </Text>
          <Text style={s.progress}>
            {loserIdx.length ? `joueur ${activeIdx + 1} sur ${loserIdx.length}` : ''}
          </Text>
        </View>
        <IconButton
          icon="chevron-right"
          onPress={() => setActiveIdx(Math.min(loserIdx.length - 1, activeIdx + 1))}
          iconSize={14}
          disabled={activeIdx >= loserIdx.length - 1}
          label="Joueur suivant"
        />
      </Card>

      {/* Grille des valeurs */}
      <Grid cols={5} gap={7} style={{ paddingTop: 6 }}>
        {keysFor(hand).map((k) => (
          <CardKey key={k.ci} k={k} onPress={() => addCard(activePlayer, k.ci)} />
        ))}
      </Grid>

      {/* Récapitulatif de la main */}
      <Card style={s.summary}>
        <Text style={s.line} numberOfLines={1}>
          {cardsLine(hand)}
        </Text>
        <IconButton
          icon="delete"
          onPress={() => removeLastCard(activePlayer)}
          size={30}
          iconSize={14}
          color={C.muted}
          label="Retirer la dernière carte"
        />
        <Text style={s.total}>{sumCards(hand)}</Text>
      </Card>
    </View>
  );
}

const s = StyleSheet.create({
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  name: { fontFamily: F.medium, fontSize: 16, color: C.text },
  progress: { fontFamily: F.regular, fontSize: 10.5, color: C.dim, marginTop: 1 },

  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  line: { flex: 1, minWidth: 0, fontFamily: F.regular, fontSize: 11.5, color: C.muted },
  total: {
    minWidth: 44,
    textAlign: 'right',
    fontFamily: F.medium,
    fontSize: 22,
    color: C.accent300,
  },
});
