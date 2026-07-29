import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, GhostButton, PrimaryButton } from '../components/ui';
import { totalsOf, useGame } from '../game/GameContext';
import { C, F } from '../theme';

export default function EndScreen() {
  const { state, rematch, newGame } = useGame();
  const { players, rounds, scoreLimit } = state;

  const totals = totalsOf(rounds, players.length);
  // Le plus petit score gagne.
  const ranked = players
    .map((name, i) => ({ name, total: totals[i] }))
    .sort((a, b) => a.total - b.total);

  const last = ranked[ranked.length - 1];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll}>
        <Text style={s.title}>
          {ranked.length ? `${ranked[0].name} gagne` : 'Fin de partie'}
        </Text>
        <Text style={s.sub}>
          {ranked.length
            ? `${ranked[0].total} pts contre ${ranked[1]?.total ?? 0} pour le suivant`
            : ''}
        </Text>

        <View style={s.podium}>
          {ranked.map((r, i) => {
            const first = i === 0;
            return (
              <View
                key={r.name + i}
                style={[
                  s.podiumRow,
                  {
                    backgroundColor: first ? C.accent900 : C.surface,
                    borderColor: first ? C.accent800 : C.border,
                  },
                ]}
              >
                <Text style={[s.rank, { color: first ? C.accent300 : C.muted }]}>
                  {i + 1}.
                </Text>
                <Text style={s.name} numberOfLines={1}>
                  {r.name}
                </Text>
                <Text style={[s.total, { color: first ? C.accent300 : C.muted }]}>
                  {r.total}
                </Text>
              </View>
            );
          })}
        </View>

        <Card style={s.stats}>
          <Text style={s.statsText}>
            {rounds.length} manches jouées · limite {scoreLimit} pts atteinte par{' '}
            {last?.name ?? '—'}
          </Text>
        </Card>
      </ScrollView>

      <View style={s.footer}>
        <PrimaryButton label="Rejouer avec les mêmes joueurs" onPress={rematch} />
        <GhostButton label="Nouvelle configuration" onPress={newGame} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  title: {
    fontFamily: F.medium,
    fontSize: 26,
    lineHeight: 29,
    letterSpacing: -0.5,
    color: C.text,
  },
  sub: { fontFamily: F.regular, fontSize: 12.5, color: C.dim, marginTop: 6 },

  podium: { marginTop: 22, gap: 8 },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 8,
  },
  rank: { width: 24, fontFamily: F.mono, fontSize: 14 },
  name: { flex: 1, minWidth: 0, fontFamily: F.medium, fontSize: 15, color: C.text },
  total: { fontFamily: F.medium, fontSize: 19 },

  stats: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 14 },
  statsText: { fontFamily: F.regular, fontSize: 12, color: C.muted, lineHeight: 18 },

  footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 8 },
});
