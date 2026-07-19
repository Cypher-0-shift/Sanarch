/**
 * DESIGN.md §2–4 — Sanarch Design Tokens
 * Source of truth for all color, spacing, radius, and shadow values.
 * Import this in components instead of hardcoding values.
 *
 * Dark-mode ready: the TOKEN object is structured for a future swap
 * (replace light-mode values with dark-mode counterparts at the ThemeProvider level).
 */

// ─────────────────────────────────────────────
// §2  COLOR TOKENS
// ─────────────────────────────────────────────

export const COLORS = {
  // Brand — Electric Indigo
  brandPrimary: '#4361EE',
  brandDeep:    '#3A0CA3',
  brandGlow:    '#7B9BFF',
  brandTint:    '#EEF2FF',

  // Canvas & Surfaces (warm-tinted — never pure gray)
  canvas:      '#F9FAFB',
  surface:     '#FFFFFF',
  surfaceSub:  '#F4F5F7',

  // Ink (text + borders)
  ink900: '#111827',
  ink800: '#1F2937',
  ink600: '#4B5563',
  ink400: '#9CA3AF',
  ink300: '#D1D5DB',
  ink200: '#E5E7EB',
  ink100: '#F3F4F6',

  // Dark surfaces — NAV DOCK, SPLASH, AI MODAL, SANARCH ID CARD ONLY
  dark950: '#0D1117',
  dark900: '#161B22',
  dark800: '#21262D',
  dark700: '#30363D',
  // darkGlow is an rgba string — use directly in StyleSheet, not Tailwind
  darkGlow: 'rgba(67,97,238,0.25)',

  // Lab result semantics — ONLY non-neutral non-brand hues allowed
  resultNormal:   '#059669',
  resultNormalBg: '#ECFDF5',
  resultHigh:     '#DC2626',
  resultHighBg:   '#FEF2F2',
  resultLow:      '#D97706',
  resultLowBg:    '#FFFBEB',
  resultCritical:   '#7C3AED',   // intentionally distinct from brand-primary
  resultCriticalBg: '#F5F3FF',

  // Document category accents (ink + bg pairs)
  catLabPrimary:       '#4361EE',
  catLabBg:            '#EEF2FF',
  catRxPrimary:        '#7C3AED',
  catRxBg:             '#F5F3FF',
  catScanPrimary:      '#0891B2',
  catScanBg:           '#ECFEFF',
  catDischargePrimary: '#0D9488',
  catDischargeBg:      '#F0FDFA',
  catOtherPrimary:     '#6B7280',
  catOtherBg:          '#F9FAFB',
} as const;

// ─────────────────────────────────────────────
// §3  TYPOGRAPHY
// ─────────────────────────────────────────────

/**
 * Font families — referenced in tailwind.config.js fontFamily extension.
 * Actual font objects are imported in app/_layout.tsx useFonts().
 */
export const FONTS = {
  jakartaRegular:   'PlusJakartaSans_400Regular',
  jakartaMedium:    'PlusJakartaSans_500Medium',
  jakartaSemiBold:  'PlusJakartaSans_600SemiBold',
  jakartaBold:      'PlusJakartaSans_700Bold',
  jakartaExtraBold: 'PlusJakartaSans_800ExtraBold',
  monoRegular:      'JetBrainsMono_400Regular',
  monoMedium:       'JetBrainsMono_500Medium',
} as const;

/**
 * Typography scale — from DESIGN.md §3.
 * fontSize in dp, lineHeight multipliers, and letterSpacing in em (converted to dp at runtime).
 * Hard rule: any fontSize ≥ 20 MUST use a negative letterSpacing.
 */
export const TYPE = {
  displayHero: { fontSize: 48, fontWeight: '800' as const, lineHeight: 53,  letterSpacing: -1.44 }, // -0.03em
  displayLg:   { fontSize: 36, fontWeight: '700' as const, lineHeight: 41,  letterSpacing: -0.90 }, // -0.025em
  displayMd:   { fontSize: 28, fontWeight: '700' as const, lineHeight: 34,  letterSpacing: -0.56 }, // -0.02em  (screen titles)
  headingXl:   { fontSize: 20, fontWeight: '600' as const, lineHeight: 28,  letterSpacing: -0.20 }, // -0.01em  (section headers)
  headingMd:   { fontSize: 16, fontWeight: '600' as const, lineHeight: 24,  letterSpacing:  0    }, // card titles
  bodyLg:      { fontSize: 15, fontWeight: '400' as const, lineHeight: 24,  letterSpacing:  0    },
  body:        { fontSize: 14, fontWeight: '400' as const, lineHeight: 22,  letterSpacing:  0    },
  labelMd:     { fontSize: 12, fontWeight: '500' as const, lineHeight: 16,  letterSpacing:  0    }, // metadata
  labelSmCaps: { fontSize: 11, fontWeight: '600' as const, lineHeight: 14,  letterSpacing:  0.88, // +0.08em
                 textTransform: 'uppercase' as const },
} as const;

// ─────────────────────────────────────────────
// §4  SPACING
// ─────────────────────────────────────────────

export const SPACING = {
  0:  0,
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  7:  28,
  8:  32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

// ─────────────────────────────────────────────
// §4  BORDER RADIUS
// ─────────────────────────────────────────────

export const RADIUS = {
  none:    0,
  sm:      6,
  md:      10,    // inputs
  lg:      14,    // buttons, chips
  xl:      20,    // standard cards
  '2xl':   24,    // large cards, sheets
  '3xl':   32,    // hero cards, modals
  full:    9999,  // pills, avatars
  // Icon containers — rounded square, NEVER circle (DESIGN.md §5)
  icon:          10,  // alias used by Phase 1+ components
  iconContainer: 10,  // legacy alias — prefer `icon`
} as const;

// ─────────────────────────────────────────────
// §4  ELEVATION — always two-layer, verbatim from DESIGN.md
// ─────────────────────────────────────────────
// Note: these are CSS box-shadow strings for Tailwind's boxShadow config.
// For React Native StyleSheet.shadow* usage, see ELEVATION_RN below.

export const ELEVATION_CSS = {
  1:     '0 1px 2px rgba(17,24,39,0.04), 0 4px 8px rgba(17,24,39,0.04)',
  2:     '0 2px 4px rgba(17,24,39,0.04), 0 8px 16px rgba(17,24,39,0.06)',
  3:     '0 4px 8px rgba(17,24,39,0.04), 0 16px 32px rgba(17,24,39,0.08)',
  4:     '0 8px 16px rgba(17,24,39,0.06), 0 24px 48px rgba(17,24,39,0.12)',
  5:     '0 16px 32px rgba(17,24,39,0.08), 0 40px 80px rgba(17,24,39,0.16)',
  brand: '0 4px 12px rgba(67,97,238,0.25), 0 1px 4px rgba(67,97,238,0.15)', // primary btn + FAB only
} as const;

/**
 * React Native doesn't support CSS box-shadow strings.
 * Use these StyleSheet-compatible shadow props for RN components.
 * The "two-layer" feel is approximated with shadowRadius + elevation pairs.
 */
export const ELEVATION_RN = {
  1: {
    shadowColor: 'rgba(17,24,39,1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  2: {
    shadowColor: 'rgba(17,24,39,1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  3: {
    shadowColor: 'rgba(17,24,39,1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  4: {
    shadowColor: 'rgba(17,24,39,1)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.09,
    shadowRadius: 32,
    elevation: 10,
  },
  5: {
    shadowColor: 'rgba(17,24,39,1)',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.12,
    shadowRadius: 50,
    elevation: 16,
  },
  brand: {
    shadowColor: '#4361EE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export type ColorKey    = keyof typeof COLORS;
export type FontKey     = keyof typeof FONTS;
export type SpacingKey  = keyof typeof SPACING;
export type RadiusKey   = keyof typeof RADIUS;
