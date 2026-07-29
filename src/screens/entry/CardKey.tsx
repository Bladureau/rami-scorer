import { StyleSheet, Text, View } from 'react-native';

import { Touch } from '../../components/ui';
import { C, F } from '../../theme';

export type KeyState = {
  ci: number;
  label: string;
  pts: number;
  n: number;
  hasCount: boolean;
};

/** Touche de valeur de carte, avec pastille du nombre d'exemplaires saisis. */
export default function CardKey({ k, onPress }: { k: KeyState; onPress: () => void }) {
  const active = k.hasCount;

  return (
    <Touch
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${k.label}, ${k.pts} points`}
      style={[
        s.key,
        {
          borderColor: active ? C.accent : C.line,
          backgroundColor: active ? C.accent900 : 'transparent',
        },
      ] as any}
    >
      <Text style={[s.label, { color: active ? C.accent300 : C.text }]}>{k.label}</Text>
      <Text style={s.pts}>{k.pts}</Text>

      {active ? (
        <View style={s.badge}>
          <Text style={s.badgeText}>{k.n}</Text>
        </View>
      ) : null}
    </Touch>
  );
}

const s = StyleSheet.create({
  key: {
    borderWidth: 1,
    borderRadius: 8,
    paddingTop: 9,
    paddingBottom: 7,
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  label: { fontFamily: F.medium, fontSize: 17, lineHeight: 19 },
  pts: { fontFamily: F.regular, fontSize: 9.5, color: C.dim },

  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: F.semibold, fontSize: 10.5, color: C.bg },
});
