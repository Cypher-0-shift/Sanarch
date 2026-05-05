export const COLORS = {
  primary: '#143832',
  accent: '#DAF1DE',
  background: '#F6F8F7',
  backgroundDark: '#141E1C',
  white: '#FFFFFF',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate900: '#0F172A',
  danger: '#DC2626',
  success: '#166534',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export type Colors = typeof COLORS;
export type Spacing = typeof SPACING;
export type Radius = typeof RADIUS;
