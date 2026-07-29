import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, Text, View } from 'react-native';

import { useGame } from '../game/GameContext';
import { C, F } from '../theme';
import { IconButton, Touch } from './ui';

/** Barre supérieure : retour contextuel, titre/sous-titre par écran, historique. */
export default function Header() {
  const { state, canEditPlayers, goBack, openHistory } = useGame();
  const { screen, rounds, editIdx, scoreLimit } = state;

  let title = 'Historique';
  let sub = 'Parties terminées';

  if (screen === 'setup') {
    title = 'Nouvelle partie';
    sub = 'Joueurs et noms';
  } else if (screen === 'game') {
    title = 'Partie en cours';
    sub = `${rounds.length} manche${rounds.length > 1 ? 's' : ''} · limite ${scoreLimit} pts`;
  } else if (screen === 'entry') {
    title = editIdx != null ? `Corriger la manche ${editIdx + 1}` : `Manche ${rounds.length + 1}`;
    sub = 'Cartes restantes des perdants';
  } else if (screen === 'end') {
    title = 'Fin de partie';
    sub = 'Le plus petit score gagne';
  }

  // Depuis le tableau, le retour ne mène quelque part que tant qu'aucune
  // manche n'a été jouée : il ramène à la configuration des joueurs.
  const canGoBack =
    screen === 'entry' || screen === 'history' || (screen === 'game' && canEditPlayers);

  return (
    <View style={s.bar}>
      <View style={s.left}>
        {canGoBack ? (
          <IconButton
            icon="arrow-left"
            onPress={goBack}
            label={screen === 'game' ? 'Modifier les joueurs' : 'Retour'}
          />
        ) : null}
        <View style={{ flexShrink: 1, minWidth: 0 }}>
          <Text style={s.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={s.sub} numberOfLines={1}>
            {sub}
          </Text>
        </View>
      </View>

      <Touch onPress={openHistory} accessibilityRole="button" style={s.histBtn}>
        <Feather name="rotate-ccw" size={14} color={C.muted} />
        <Text style={s.histLabel}>Historique</Text>
      </Touch>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.hairline,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1, minWidth: 0 },
  title: {
    fontFamily: F.medium,
    fontSize: 17,
    lineHeight: 20,
    letterSpacing: -0.25,
    color: C.text,
  },
  sub: { fontFamily: F.regular, fontSize: 11, color: C.dim, marginTop: 1 },
  histBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 8,
  },
  histLabel: { fontFamily: F.medium, fontSize: 12, color: C.muted },
});
