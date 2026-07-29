import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { sumCards } from '../../cards';
import { Notice, Overline, PrimaryButton, Touch } from '../../components/ui';
import { missingHands, useGame } from '../../game/GameContext';
import { C, F } from '../../theme';
import HandEntry from './HandEntry';

export default function EntryScreen() {
  const { state, setWinner, validate, cancelEntry } = useGame();
  const { players, winner, entryCards, activeIdx, editIdx } = state;

  const loserIdx = players.map((_, i) => i).filter((i) => i !== winner);
  const boundedActive = loserIdx.length ? Math.min(activeIdx, loserIdx.length - 1) : 0;
  const activePlayer = loserIdx.length ? loserIdx[boundedActive] : 0;
  const roundTotal = loserIdx.reduce((a, i) => a + sumCards(entryCards[i]), 0);

  // Un perdant garde au moins une carte, donc au moins 2 points.
  const missing = missingHands(players, entryCards, winner);

  return (
    <View style={{ flex: 1, paddingHorizontal: 14, paddingTop: 12 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 8 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Qui a fini ? */}
        <Overline style={{ marginBottom: 8 }}>Qui a fini ?</Overline>
        <View style={s.chips}>
          {players.map((p, i) => {
            const on = winner === i;
            return (
              <Touch
                key={i}
                onPress={() => setWinner(i)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[
                  s.chip,
                  {
                    borderColor: on ? C.accent : C.line,
                    backgroundColor: on ? C.accent900 : 'transparent',
                  },
                ] as any}
              >
                <Text style={[s.chipText, { color: on ? C.accent300 : C.text }]}>{p}</Text>
              </Touch>
            );
          })}
        </View>

        {winner == null ? (
          <View style={s.placeholder}>
            <Text style={s.placeholderText}>
              Sélectionnez le joueur qui a posé toutes ses cartes pour saisir les
              cartes restantes des autres.
            </Text>
          </View>
        ) : (
          <HandEntry
            loserIdx={loserIdx}
            activeIdx={boundedActive}
            activePlayer={activePlayer}
          />
        )}
      </ScrollView>

      {winner != null ? (
        <View style={s.footer}>
          {missing.length ? (
            <Notice>
              Chaque perdant garde au moins une carte, soit 2 points minimum. Il
              manque : {missing.map((i) => players[i]).join(' · ')}.
            </Notice>
          ) : null}

          <View style={s.footerLine}>
            <Text style={s.footerText}>{players[winner]} a fini</Text>
            <Text style={s.footerText}>Total manche {roundTotal}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Touch onPress={cancelEntry} accessibilityRole="button" style={s.cancel}>
              <Text style={s.cancelText}>Annuler</Text>
            </Touch>
            <PrimaryButton
              label={editIdx != null ? 'Enregistrer la correction' : 'Valider la manche'}
              onPress={validate}
              disabled={missing.length > 0}
              filled
              style={{ flex: 1 }}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 999,
  },
  chipText: { fontFamily: F.medium, fontSize: 12.5 },

  placeholder: { paddingVertical: 40, paddingHorizontal: 20 },
  placeholderText: {
    textAlign: 'center',
    fontFamily: F.regular,
    fontSize: 12.5,
    color: C.faint,
    lineHeight: 19,
  },

  footer: { paddingTop: 14, paddingBottom: 12, gap: 8 },
  footerLine: { flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontFamily: F.regular, fontSize: 11.5, color: C.dim },
  cancel: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontFamily: F.medium, fontSize: 14, color: C.muted },
});
