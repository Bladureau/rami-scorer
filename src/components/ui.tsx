import Feather from '@expo/vector-icons/Feather';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';

import { C, F, overline } from '../theme';

/* ─────────── Texte ─────────── */

export function Overline({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[overline, style]}>{children}</Text>;
}

/* ─────────── Surfaces ─────────── */

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}) {
  return <View style={[s.card, style]}>{children}</View>;
}

/* ─────────── Boutons ─────────── */

type PressProps = Omit<PressableProps, 'style'> & { style?: ViewStyle | ViewStyle[] };

/** Base tactile : opacité au press, remplace les `:hover` du design web. */
function Touch({ style, disabled, children, ...rest }: PressProps & { children: React.ReactNode }) {
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [style, pressed && !disabled && { opacity: 0.6 }]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

/** Bouton principal : contour accent sur fond transparent. */
export function PrimaryButton({
  label,
  onPress,
  disabled,
  filled,
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Léger fond accent, utilisé pour « Valider la manche ». */
  filled?: boolean;
  icon?: React.ComponentProps<typeof Feather>['name'];
  style?: ViewStyle;
}) {
  return (
    <Touch
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={[
        s.btn,
        { borderColor: C.accent },
        filled ? { backgroundColor: C.accentWashSoft } : null,
        disabled ? { opacity: 0.45 } : null,
        style,
      ] as ViewStyle[]}
    >
      <View style={s.btnRow}>
        {icon ? <Feather name={icon} size={15} color={C.accent} /> : null}
        <Text style={[s.btnLabel, { color: C.accent }]}>{label}</Text>
      </View>
    </Touch>
  );
}

/** Bouton secondaire : contour neutre. */
export function OutlineButton({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}) {
  return (
    <Touch onPress={onPress} accessibilityRole="button" style={[s.btn, { borderColor: C.line }, style] as ViewStyle[]}>
      <Text style={[s.btnLabel, { color: C.muted, fontSize: 14 }]}>{label}</Text>
    </Touch>
  );
}

/** Lien discret sans contour. */
export function GhostButton({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}) {
  return (
    <Touch onPress={onPress} accessibilityRole="button" style={[s.ghost, style] as ViewStyle[]}>
      <Text style={s.ghostLabel}>{label}</Text>
    </Touch>
  );
}

/** Carré tactile 32–38px avec une icône Feather. */
export function IconButton({
  icon,
  onPress,
  size = 32,
  color = C.text,
  borderColor = C.line,
  iconSize = 16,
  disabled,
  label,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  onPress: () => void;
  size?: number;
  color?: string;
  borderColor?: string;
  iconSize?: number;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <Touch
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        s.iconBtn,
        { width: size, height: size, borderColor },
        disabled ? { opacity: 0.4 } : null,
      ] as ViewStyle[]}
    >
      <Feather name={icon} size={iconSize} color={color} />
    </Touch>
  );
}

export { Touch };

/* ─────────── Mise en page ─────────── */

/**
 * Grille à N colonnes de largeur égale. La largeur du conteneur est mesurée
 * puis divisée, faute d'équivalent `calc()` en React Native.
 */
export function Grid({
  cols,
  gap,
  children,
  style,
}: {
  cols: number;
  gap: number;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const [w, setW] = useState(0);
  const items = React.Children.toArray(children);
  const itemW = w > 0 ? (w - gap * (cols - 1)) / cols : 0;

  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={[{ flexDirection: 'row', flexWrap: 'wrap', gap }, style]}
    >
      {itemW > 0
        ? items.map((child, i) => (
            <View key={i} style={{ width: itemW }}>
              {child}
            </View>
          ))
        : null}
    </View>
  );
}

/** Séparateur horizontal 1px. */
export function Divider({ soft }: { soft?: boolean }) {
  return <View style={{ height: 1, backgroundColor: soft ? C.hairlineSoft : C.hairline }} />;
}

export function Spacer() {
  return <View style={{ flex: 1 }} />;
}

/* ─────────── Animation ─────────── */

/** Équivalent du keyframe `rise` du design : fondu + translation de 6px. */
export function Rise({
  children,
  duration = 160,
  style,
}: {
  children: React.ReactNode;
  duration?: number;
  style?: ViewStyle;
}) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration, useNativeDriver: true }).start();
  }, [duration, v]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/* ─────────── Contrôles ─────────── */

/** Ligne « libellé + stepper − / valeur / + ». */
export function StepperRow({
  title,
  hint,
  value,
  onMinus,
  onPlus,
  style,
}: {
  title: string;
  hint: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
  style?: ViewStyle;
}) {
  return (
    <Card style={[s.stepperCard, style] as ViewStyle[]}>
      <View style={{ flexShrink: 1 }}>
        <Text style={s.stepperTitle}>{title}</Text>
        <Text style={s.stepperHint}>{hint}</Text>
      </View>
      <View style={s.stepperControls}>
        <IconButton icon="minus" onPress={onMinus} size={38} iconSize={15} label={`Diminuer : ${title}`} />
        <Text style={s.stepperValue}>{value}</Text>
        <IconButton icon="plus" onPress={onPlus} size={38} iconSize={15} label={`Augmenter : ${title}`} />
      </View>
    </Card>
  );
}

/** Sélecteur exclusif à onglets, dans un rail encadré. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
  style?: ViewStyle;
}) {
  return (
    <View style={[s.segment, style]}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Touch
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[
              s.segmentBtn,
              {
                borderColor: on ? C.accent : 'transparent',
                backgroundColor: on ? C.accent900 : 'transparent',
              },
            ] as ViewStyle[]}
          >
            <Text style={[s.segmentLabel, { color: on ? C.accent300 : C.muted }]}>
              {o.label}
            </Text>
          </Touch>
        );
      })}
    </View>
  );
}

/* ─────────── Messages ─────────── */

/** Encart d'information à la teinte accent, pour les règles bloquantes. */
export function Notice({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[s.notice, style]}>
      <Feather name="info" size={15} color={C.accent300} />
      <Text style={s.noticeText}>{children}</Text>
    </View>
  );
}

/* ─────────── États vides ─────────── */

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ paddingVertical: 34, paddingHorizontal: 12 }}>
      <Text style={s.empty}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
  },
  btn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnLabel: { fontFamily: F.medium, fontSize: 15 },
  ghost: { paddingVertical: 11, alignItems: 'center', justifyContent: 'center' },
  ghostLabel: { fontFamily: F.medium, fontSize: 12.5, color: C.dim },
  iconBtn: {
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    textAlign: 'center',
    color: C.faint,
    fontSize: 12.5,
    fontFamily: F.regular,
  },
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

  segment: {
    flexDirection: 'row',
    gap: 4,
    padding: 3,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
  },
  segmentLabel: { fontFamily: F.medium, fontSize: 11.5 },

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
  noticeText: {
    flex: 1,
    fontFamily: F.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: C.accent300,
  },
});
