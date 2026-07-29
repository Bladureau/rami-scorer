import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import LimitControls from '../components/LimitControls';
import {
  GhostButton,
  IconButton,
  Notice,
  PrimaryButton,
  StepperRow,
} from '../components/ui';
import { MIN_PLAYERS, useGame } from '../game/GameContext';
import { C, F } from '../theme';

export default function SetupScreen() {
  const {
    state: { names },
    setName,
    addSlot,
    removeSlot,
    removeSlotAt,
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

        <LimitControls playerCount={filled.length} />

        {!ready ? <Notice>{errorText}</Notice> : null}
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

  footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 10 },
});
