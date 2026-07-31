import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, EmptyState, OutlineButton, Touch } from '../components/ui';
import { useGame } from '../game/GameContext';
import { C, F } from '../theme';

export default function HistoryScreen() {
  const { state, goBack, resumeArchived } = useGame();
  const { history, rounds, historyFrom } = state;

  // Rouvrir une partie archivée écrase celle en cours, qui n'est stockée nulle
  // part ailleurs : on prévient avant. Venir de l'écran de fin est le cas sans
  // risque — cette partie-là vient justement d'être archivée.
  const atRisk = rounds.length > 0 && historyFrom !== 'end';

  const resume = (i: number) => {
    if (!atRisk) {
      resumeArchived(i);
      return;
    }
    Alert.alert(
      'Reprendre cette partie ?',
      `La partie en cours (${rounds.length} manche${rounds.length > 1 ? 's' : ''}) sera perdue.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Reprendre', style: 'destructive', onPress: () => resumeArchived(i) },
      ],
    );
  };

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

            {/* Les parties archivées avant l'ajout de l'instantané n'ont rien
                à rouvrir. */}
            {h.game ? (
              <Touch
                onPress={() => resume(i)}
                accessibilityRole="button"
                accessibilityLabel={`Reprendre la partie du ${h.date}`}
                style={s.resume}
              >
                <Text style={s.resumeText}>Reprendre</Text>
              </Touch>
            ) : null}
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
  resume: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: C.accent,
    borderRadius: 8,
  },
  resumeText: { fontFamily: F.medium, fontSize: 12.5, color: C.accent },

  footer: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 12 },
});
