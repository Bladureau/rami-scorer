import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import LimitControls from '../components/LimitControls';
import { limitValue } from '../game/limit';

import {
  Card,
  Divider,
  EmptyState,
  GhostButton,
  Overline,
  PrimaryButton,
  Rise,
  Touch,
} from '../components/ui';
import { cardsLine } from '../cards';
import { totalsOf, useGame } from '../game/GameContext';
import { ROLE_LABEL, ROLE_ORDER, ROLE_SHORT, rolesFor, rolesOfPlayer } from '../game/roles';
import { C, F } from '../theme';

const LABEL_W = 58;
const GAP = 4;

export default function GameScreen() {
  const { state, toggleExpanded, deleteRound, startEntry, editPlayers, endGame } = useGame();
  const { players, rounds, expanded, mode, scoreLimit, tourLimit, endSuspended } = state;

  // Panneau de règles, replié par défaut.
  const [showLimit, setShowLimit] = useState(false);

  const n = players.length;
  const totals = totalsOf(rounds, n);
  const lowest = totals.length ? Math.min(...totals) : 0;
  const leaderLine = n ? `${players[totals.indexOf(lowest)]} · ${lowest} pts` : '—';

  // Rôles de la manche à venir.
  const roles = rolesFor(rounds.length, n);

  // Arrêt manuel : le classement est figé, on demande confirmation.
  const confirmEnd = () =>
    Alert.alert(
      'Terminer la partie ?',
      `Le classement sera figé sur les scores actuels : ${leaderLine} en tête.`,
      [
        { text: 'Continuer à jouer', style: 'cancel' },
        { text: 'Terminer', style: 'destructive', onPress: endGame },
      ],
    );

  // Cumuls ligne par ligne, recalculés à chaque rendu.
  const running = new Array<number>(n).fill(0);
  const rows = rounds.map((r, ri) => {
    r.scores.forEach((sc, i) => { running[i] += sc; });
    return { round: r, ri, snapshot: running.slice() };
  });

  return (
    <View style={{ flex: 1, paddingHorizontal: 12, paddingTop: 14 }}>
      {/* Bandeau meneur / limite */}
      <View style={s.statsRow}>
        <Card style={s.statCard}>
          <Overline>En tête</Overline>
          <Text style={[s.statValue, { color: C.pointlead }]} numberOfLines={1}>
            {leaderLine}
          </Text>
        </Card>
        {/* Tuile de règles : un tap déplie mode et limite, modifiables en cours
            de partie. */}
        <Touch
          onPress={() => setShowLimit((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded: showLimit }}
          accessibilityLabel="Modifier la condition de fin de partie"
          style={[s.statCard, s.limitCard] as any}
        >
          {/* Après une reprise, la condition ne s'applique plus : on le dit
              ici, le détail est dans le panneau déplié. */}
          <Overline style={{ textAlign: 'right' }}>
            {endSuspended ? 'Prolongée' : mode === 'points' ? 'Limite' : 'Tour'}
          </Overline>
          <View style={s.limitValueRow}>
            <Text style={s.statValue}>
              {limitValue({
                mode,
                scoreLimit,
                tourLimit,
                roundCount: rounds.length,
                playerCount: n,
              })}
            </Text>
            <Feather
              name={showLimit ? 'chevron-up' : 'chevron-down'}
              size={12}
              color={C.faint}
            />
          </View>
        </Touch>
      </View>

      {showLimit ? (
        <Rise style={{ marginHorizontal: 4, marginBottom: 14 }}>
          <LimitControls playerCount={n} />
        </Rise>
      ) : null}

      {/* En-tête du tableau */}
      <View style={s.tableHead}>
        <Overline style={{ width: LABEL_W }}>Manche</Overline>
        {players.map((p, i) => (
          <View key={i} style={s.col}>
            <Text
              style={[s.colName, { color: totals[i] === lowest ? C.accent300 : C.text }]}
              numberOfLines={1}
            >
              {p}
            </Text>
            <Text style={s.colBadge} numberOfLines={1}>
              {rolesOfPlayer(roles, i).map((r) => ROLE_SHORT[r]).join(' · ')}
            </Text>
          </View>
        ))}
      </View>

      {/* Lignes de manches */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 8 }}>
        {rows.map(({ round, ri, snapshot }) => {
          const open = expanded === ri;
          return (
            <View key={ri} style={s.rowWrap}>
              <Touch
                onPress={() => toggleExpanded(ri)}
                accessibilityRole="button"
                style={[s.row, open ? { backgroundColor: C.surface } : null] as any}
              >
                <View style={s.rowLabel}>
                  <Text style={s.rowLabelText}>M{ri + 1}</Text>
                  <Feather
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={11}
                    color={C.faint}
                  />
                </View>
                {snapshot.map((cum, i) => (
                  <View key={i} style={s.col}>
                    <Text
                      style={[
                        s.cell,
                        { color: round.scores[i] === 0 ? C.pointlead : C.text },
                      ]}
                    >
                      {cum}
                    </Text>
                  </View>
                ))}
              </Touch>

              {open ? (
                <Rise style={s.detail}>
                  <Overline style={{ paddingHorizontal: 2, paddingTop: 6, paddingBottom: 8 }}>
                    Détail de la manche
                  </Overline>
                  <View style={{ gap: 6 }}>
                    {players.map((p, i) => (
                      <View key={i} style={s.detailRow}>
                        <Text style={s.detailName} numberOfLines={1}>
                          {p}
                        </Text>
                        <Text style={s.detailCards} numberOfLines={1}>
                          {i === round.winner
                            ? 'A posé toutes ses cartes'
                            : (round.cards[i] ?? []).length
                              ? cardsLine(round.cards[i])
                              : 'Score saisi directement'}
                        </Text>
                        <Text
                          style={[
                            s.detailPts,
                            { color: round.scores[i] === 0 ? C.accent300 : C.muted },
                          ]}
                        >
                          +{round.scores[i]}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <View style={s.detailActions}>
                    <Touch
                      onPress={() => startEntry(ri)}
                      accessibilityRole="button"
                      style={[s.smallBtn, { borderColor: C.accent }] as any}
                    >
                      <Text style={[s.smallBtnText, { color: C.accent }]}>Corriger</Text>
                    </Touch>
                    <Touch
                      onPress={() => deleteRound(ri)}
                      accessibilityRole="button"
                      style={[s.smallBtn, { borderColor: C.line }] as any}
                    >
                      <Text style={[s.smallBtnText, { color: C.muted }]}>
                        Annuler la manche
                      </Text>
                    </Touch>
                  </View>
                </Rise>
              ) : null}
            </View>
          );
        })}

        {/* Tant qu'aucune manche n'est jouée, la composition reste modifiable. */}
        {!rounds.length ? (
          <>
            <EmptyState>Aucune manche enregistrée. Lancez la première.</EmptyState>
            <GhostButton label="Modifier les joueurs" onPress={editPlayers} />
          </>
        ) : null}
      </ScrollView>

      {/* Pied : rôles de la manche à venir + nouvelle manche */}
      <Divider />
      <View style={s.roles}>
        {ROLE_ORDER.map((r) => (
          <View key={r} style={s.roleCell}>
            <Overline style={{ textAlign: 'center' }}>{ROLE_LABEL[r]}</Overline>
            <Text
              style={[
                s.roleName,
                r === 'commence' ? { color: C.accent300 } : null,
              ]}
              numberOfLines={1}
            >
              {players[roles[r]] ?? '—'}
            </Text>
          </View>
        ))}
      </View>
      <View style={s.footer}>
        <PrimaryButton
          label="Nouvelle manche"
          icon="plus"
          onPress={() => startEntry(null)}
          style={{ paddingVertical: 13 }}
        />
        {/* Rien à figer tant qu'aucune manche n'est jouée. */}
        {rounds.length ? (
          <GhostButton label="Terminer la partie" onPress={confirmEnd} />
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 8, marginHorizontal: 4, marginBottom: 14 },
  statCard: { flex: 1, paddingVertical: 10, paddingHorizontal: 12 },
  limitCard: {
    flex: 0,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
  },
  limitValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statValue: { fontFamily: F.medium, fontSize: 15, color: C.text, marginTop: 2 },

  tableHead: {
    flexDirection: 'row',
    gap: GAP,
    alignItems: 'flex-end',
    paddingHorizontal: 6,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.hairline,
  },
  col: { flex: 1, minWidth: 0 },
  colName: { fontFamily: F.medium, fontSize: 12.5, textAlign: 'center' },
  colBadge: {
    fontFamily: F.regular,
    fontSize: 9.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: C.faint,
    textAlign: 'center',
    height: 13,
  },

  rowWrap: { borderBottomWidth: 1, borderBottomColor: C.hairlineSoft },
  row: {
    flexDirection: 'row',
    gap: GAP,
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 6,
  },
  rowLabel: { width: LABEL_W, flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowLabelText: { fontFamily: F.mono, fontSize: 12.5, color: C.muted },
  cell: { fontFamily: F.medium, fontSize: 16, textAlign: 'center' },

  detail: { paddingHorizontal: 10, paddingTop: 4, paddingBottom: 14, backgroundColor: C.surface },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: C.surface2,
    borderRadius: 8,
  },
  detailName: { width: 66, fontFamily: F.medium, fontSize: 12.5, color: C.text },
  detailCards: { flex: 1, minWidth: 0, fontFamily: F.regular, fontSize: 11.5, color: C.muted },
  detailPts: { fontFamily: F.mono, fontSize: 13 },

  detailActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  smallBtn: {
    flex: 1,
    paddingVertical: 9,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBtnText: { fontFamily: F.medium, fontSize: 12.5 },

  roles: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 6,
    paddingTop: 12,
  },
  roleCell: { flex: 1, minWidth: 0, alignItems: 'center', gap: 2 },
  roleName: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.text,
    textAlign: 'center',
  },

  footer: { paddingHorizontal: 6, paddingTop: 14, paddingBottom: 12, gap: 2 },
});
