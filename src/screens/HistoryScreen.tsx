import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, EmptyState, OutlineButton } from '../components/ui';
import { useGame } from '../game/GameContext';
import { C, F } from '../theme';

export default function HistoryScreen() {
  const { state, goBack } = useGame();
  const { history } = state;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll}>
        {history.map((h, i) => (
          <Card key={i} style={s.item}>
            <View style={s.itemHead}>
              <Text style={s.winner}>{h.winner}</Text>
              <Text style={s.date}>{h.date}</Text>
            </View>
            <Text style={s.line}>{h.line}</Text>
          </Card>
        ))}

        {!history.length ? (
          <EmptyState>Aucune partie terminée pour le moment.</EmptyState>
        ) : null}
      </ScrollView>

      <View style={s.footer}>
        <OutlineButton label="Retour" onPress={goBack} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 8, gap: 8 },
  item: { paddingVertical: 12, paddingHorizontal: 13 },
  itemHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
  },
  winner: { fontFamily: F.medium, fontSize: 14, color: C.text },
  date: { fontFamily: F.regular, fontSize: 11, color: C.dim },
  line: { fontFamily: F.regular, fontSize: 11.5, color: C.muted, marginTop: 4 },

  footer: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 12 },
});
