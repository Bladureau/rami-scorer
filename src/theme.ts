import { Platform } from 'react-native';

/**
 * Jetons de couleur repris tels quels du design Claude Design
 * (`Rami Score.dc.html`).
 */
export const C = {
  bg: '#161826',
  surface: '#1c1e2b',
  surface2: '#232532',
  border: '#292b31',
  line: '#3f424d',

  text: '#e9e9ed',
  muted: '#9397ab',
  dim: '#75798c',
  faint: '#595d6c',

  accent: '#9184d9',
  accent300: '#fdcece',
  accent800: '#423a6a',
  accent900: '#2b2741',

  pointlead: '#ff0000',

  hairline: 'rgba(233,233,237,0.09)',
  hairlineSoft: 'rgba(233,233,237,0.06)',
  accentWash: 'rgba(145,132,217,0.12)',
  accentWashSoft: 'rgba(145,132,217,0.10)',
} as const;

export const F = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  mono: Platform.select({ ios: 'Menlo', default: 'monospace' }) as string,
} as const;

/** Libellé de section : 10px, majuscules, très espacé. */
export const overline = {
  fontFamily: F.regular,
  fontSize: 10,
  letterSpacing: 0.8,
  textTransform: 'uppercase',
  color: C.dim,
} as const;
