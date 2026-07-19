/**
 * tailwind.config.js — Sanarch Design Tokens
 * DESIGN.md §2–4: all color, font, radius, spacing, and elevation tokens.
 *
 * NOTE: tokens are inlined here (not imported from constants/theme.ts) because
 * tailwind.config.js is executed by Node.js at build time, which cannot parse
 * TypeScript. The theme.ts file remains the runtime source of truth for RN components.
 */

module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // ─── §2 Color Tokens ──────────────────────────────────────────
      colors: {
        // Brand — Electric Indigo
        'brand-primary': '#4361EE',
        'brand-deep':    '#3A0CA3',
        'brand-glow':    '#7B9BFF',
        'brand-tint':    '#EEF2FF',

        // Surfaces (warm-tinted — never pure gray)
        canvas:        '#F9FAFB',
        surface:       '#FFFFFF',
        'surface-sub': '#F4F5F7',

        // Ink scale (text + borders)
        'ink-900': '#111827',
        'ink-800': '#1F2937',
        'ink-600': '#4B5563',
        'ink-400': '#9CA3AF',
        'ink-300': '#D1D5DB',
        'ink-200': '#E5E7EB',
        'ink-100': '#F3F4F6',

        // Dark surfaces — NAV DOCK / SPLASH / AI MODAL / SANARCH ID CARD only
        'dark-950': '#0D1117',
        'dark-900': '#161B22',
        'dark-800': '#21262D',
        'dark-700': '#30363D',

        // Lab result semantics — ONLY non-neutral non-brand hues allowed
        'result-normal':      '#059669',
        'result-normal-bg':   '#ECFDF5',
        'result-high':        '#DC2626',
        'result-high-bg':     '#FEF2F2',
        'result-low':         '#D97706',
        'result-low-bg':      '#FFFBEB',
        'result-critical':    '#7C3AED',  // intentionally distinct from brand
        'result-critical-bg': '#F5F3FF',

        // Document category pairs — primary color + background
        'cat-lab':          '#4361EE',
        'cat-lab-bg':       '#EEF2FF',
        'cat-rx':           '#7C3AED',
        'cat-rx-bg':        '#F5F3FF',
        'cat-scan':         '#0891B2',
        'cat-scan-bg':      '#ECFEFF',
        'cat-discharge':    '#0D9488',
        'cat-discharge-bg': '#F0FDFA',
        'cat-other':        '#6B7280',
        'cat-other-bg':     '#F9FAFB',
      },

      // ─── §3 Typography ────────────────────────────────────────────
      // Plus Jakarta Sans (display) + JetBrains Mono (data/IDs)
      // NativeWind v4: values are font postscript names loaded by useFonts()
      fontFamily: {
        'jakarta':           ['PlusJakartaSans_400Regular'],
        'jakarta-medium':    ['PlusJakartaSans_500Medium'],
        'jakarta-semibold':  ['PlusJakartaSans_600SemiBold'],
        'jakarta-bold':      ['PlusJakartaSans_700Bold'],
        'jakarta-extrabold': ['PlusJakartaSans_800ExtraBold'],
        // JetBrains Mono — Sanarch ID, lab values, all numeric/data display
        'mono':              ['JetBrainsMono_400Regular'],
        'mono-medium':       ['JetBrainsMono_500Medium'],
      },

      // Typography scale — §3.
      // Hard rule: any text ≥20px MUST use negative letter-spacing (see letterSpacing values).
      fontSize: {
        'display-hero': ['48px', { lineHeight: '53px', letterSpacing: '-1.44px', fontWeight: '800' }],
        'display-lg':   ['36px', { lineHeight: '41px', letterSpacing: '-0.90px', fontWeight: '700' }],
        'display-md':   ['28px', { lineHeight: '34px', letterSpacing: '-0.56px', fontWeight: '700' }],
        'heading-xl':   ['20px', { lineHeight: '28px', letterSpacing: '-0.20px', fontWeight: '600' }],
        'heading-md':   ['16px', { lineHeight: '24px', letterSpacing:     '0px', fontWeight: '600' }],
        'body-lg':      ['15px', { lineHeight: '24px', letterSpacing:     '0px', fontWeight: '400' }],
        'body':         ['14px', { lineHeight: '22px', letterSpacing:     '0px', fontWeight: '400' }],
        'label-md':     ['12px', { lineHeight: '16px', letterSpacing:     '0px', fontWeight: '500' }],
        // label-caps: uppercase, tracking +0.08em (0.88px at 11px)
        'label-caps':   ['11px', { lineHeight: '14px', letterSpacing:  '0.88px', fontWeight: '600' }],
      },

      // ─── §4 Border Radius ─────────────────────────────────────────
      borderRadius: {
        none:  '0px',
        sm:    '6px',
        md:    '10px',   // inputs
        lg:    '14px',   // buttons, chips
        xl:    '20px',   // standard cards
        '2xl': '24px',   // large cards, sheets
        '3xl': '32px',   // hero cards, modals
        full:  '9999px', // pills, avatars
        icon:  '10px',   // icon containers — rounded square, NEVER circle
      },

      // ─── §4 Elevation — verbatim two-layer shadow strings ─────────
      // DESIGN.md: "never a single flat shadow"
      boxShadow: {
        'elevation-1':     '0 1px 2px rgba(17,24,39,0.04), 0 4px 8px rgba(17,24,39,0.04)',
        'elevation-2':     '0 2px 4px rgba(17,24,39,0.04), 0 8px 16px rgba(17,24,39,0.06)',
        'elevation-3':     '0 4px 8px rgba(17,24,39,0.04), 0 16px 32px rgba(17,24,39,0.08)',
        'elevation-4':     '0 8px 16px rgba(17,24,39,0.06), 0 24px 48px rgba(17,24,39,0.12)',
        'elevation-5':     '0 16px 32px rgba(17,24,39,0.08), 0 40px 80px rgba(17,24,39,0.16)',
        // elevation-brand: primary buttons + FAB only — NEVER on backgrounds or generic cards
        'elevation-brand': '0 4px 12px rgba(67,97,238,0.25), 0 1px 4px rgba(67,97,238,0.15)',
        // Navigation dock shadow — §7
        'dock':            '0 8px 32px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)',
        'none':            'none',
      },

      // ─── Spacing (4dp base unit) ───────────────────────────────────
      spacing: {
        '0':  '0px',
        '1':  '4px',
        '2':  '8px',
        '3':  '12px',
        '4':  '16px',
        '5':  '20px',
        '6':  '24px',
        '7':  '28px',
        '8':  '32px',
        '10': '40px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
      },
    },
  },
  plugins: [],
};
