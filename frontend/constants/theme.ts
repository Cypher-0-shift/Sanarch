export const COLORS = {
  primary: '#004D36',
  primaryLight: '#006B4D',
  accent: '#E8F5E9',
  background: '#F5F3F0',
  backgroundDark: '#2D3A2F',
  surface: '#FFFFFF',
  white: '#FFFFFF',
  border: '#E5E2DE',
  textDark: '#2D3A2F',
  textMuted: '#5C6E60',
  textLight: '#819685',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate900: '#0F172A',
  danger: '#DC2626',
  success: '#166534',
  successLight: '#81C784',
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
  xxl: 32,
  full: 9999,
} as const;

export type Colors = typeof COLORS;
export type Spacing = typeof SPACING;
export type Radius = typeof RADIUS;
