import Feather from '@expo/vector-icons/Feather';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, GhostButton, IconButton, PrimaryButton } from '../components/ui';
import {
  LIMIT_MAX,
  LIMIT_MIN,
  LIMIT_STEP,
  MIN_PLAYERS,
  useGame,
} from '../game/GameContext';
import { C, F } from '../theme';

/** Ligne « libellé + stepper − / valeur / + ». */
function StepperRow({
  title,
  hint,
  value,
  onMinus,
  onPlus,
}: {
  title: string;
  hint: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <Card style={s.stepperCard}>
      <View style={{ flexShrink: 1 }}>
        <Text style={s.stepperTitle}>{title}</Text>
        <Text style={s.stepperHint}>{hint}</Text>
      </View>
      <View style={s.stepperControls}>
        <IconButton icon="minus" onPress={onMinus} size={38} iconSize={15} label={`Diminuer ${title}`} />
        <Text style={s.stepperValue}>{value}</Text>
        <IconButton icon="plus" onPress={onPlus} size={38} iconSize={15} label={`Augmenter ${title}`} />
      </View>
    </Card>
  );
}

export default function SetupScreen() {
  const {
    state: { names, scoreLimit },
    setName,
    addSlot,
    removeSlot,
    removeSlotAt,
    setScoreLimit,
    start,
    loadDemo,
  } = useGame();

  const filled = names.map((n) => n.trim()).filter(Boolean);
  const ready = filled.length === names.length && filled.length >= MIN_PLAYERS;
  const errorText =
    filled.length < MIN_PLAYERS
      ? `Il faut au moins ${MIN_PLAYERS} joueurs pour démarrer.`
      : 'Complétez tous les noms.';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <StepperRow
          title="Nombre de joueurs"
          hint={`${MIN_PLAYERS} minimum pour démarrer`}
          value={String(names.length)}
          onMinus={removeSlot}
          onPlus={addSlot}
        />

        <View style={s.rows}>
          {names.map((name, i) => (
            <View key={i} style={s.row}>
              <View style={s.num}>
                <Text style={s.numText}>{i + 1}</Text>
              </View>
              <TextInput
                value={name}
                onChangeText={(v) => setName(i, v)}
                placeholder={`Joueur ${i + 1}`}
                placeholderTextColor={C.faint}
                style={s.input}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
              />
              <IconButton
                icon="x"
                onPress={() => removeSlotAt(i)}
                size={34}
                iconSize={14}
                color={C.faint}
                borderColor="transparent"
                label={`Retirer le joueur ${i + 1}`}
              />
            </View>
          ))}
        </View>

        <StepperRow
          title="Limite de points"
          hint="Le premier qui l'atteint termine la partie"
          value={`${scoreLimit}`}
          onMinus={() => setScoreLimit(Math.max(LIMIT_MIN, scoreLimit - LIMIT_STEP))}
          onPlus={() => setScoreLimit(Math.min(LIMIT_MAX, scoreLimit + LIMIT_STEP))}
        />

        {!ready ? (
          <View style={s.notice}>
            <Feather name="info" size={15} color={C.accent300} />
            <Text style={s.noticeText}>{errorText}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={s.footer}>
        <PrimaryButton label="Commencer la partie" onPress={start} disabled={!ready} />
        <GhostButton label="Charger une partie d'exemple" onPress={loadDemo} />
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 8, gap: 14 },

  stepperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  stepperTitle: { fontFamily: F.medium, fontSize: 14, color: C.text },
  stepperHint: { fontFamily: F.regular, fontSize: 11, color: C.dim, marginTop: 2 },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepperValue: {
    minWidth: 46,
    textAlign: 'center',
    fontFamily: F.medium,
    fontSize: 20,
    color: C.text,
  },

  rows: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  num: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.accent900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { fontFamily: F.mono, fontSize: 12, color: C.accent300 },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 11,
    paddingHorizontal: 12,
    backgroundColor: C.surface,
    color: C.text,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
    fontSize: 14,
    fontFamily: F.regular,
  },

  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: C.accent800,
    borderRadius: 8,
    backgroundColor: C.accent900,
  },
  noticeText: { flex: 1, fontFamily: F.regular, fontSize: 12.5, color: C.accent300 },

  footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 10 },
});
