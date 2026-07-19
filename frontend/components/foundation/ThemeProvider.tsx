/**
 * ThemeProvider — DESIGN.md Phase 0
 *
 * Light-mode only in v1, but structured for a future dark-mode swap:
 * - All semantic tokens live in the `theme` object.
 * - A future dark-mode context swap only needs to replace `lightTheme` with `darkTheme`
 *   at the Provider level — no individual component changes required.
 *
 * Usage:
 *   Wrap your root layout with <ThemeProvider>. Components access tokens via useTheme().
 */

import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { COLORS, ELEVATION_RN, RADIUS, SPACING, FONTS } from '../../constants/theme';
import { getReduceMotionPreference } from '../../constants/motion';

// ─────────────────────────────────────────────
// Theme shape — extend for dark mode later
// ─────────────────────────────────────────────

export interface SanarchTheme {
  // Mode
  isDark: boolean;

  // Color references (direct from COLORS tokens)
  colors: typeof COLORS;

  // Elevation helpers (RN StyleSheet-ready)
  elevation: typeof ELEVATION_RN;

  // Spacing helpers
  spacing: typeof SPACING;

  // Radius helpers
  radius: typeof RADIUS;

  // Font family names
  fonts: typeof FONTS;

  // Accessibility
  isReducedMotion: boolean;
}

// ─────────────────────────────────────────────
// Light theme (v1 only — dark mode structure ready)
// ─────────────────────────────────────────────

function buildLightTheme(isReducedMotion: boolean): SanarchTheme {
  return {
    isDark:          false,
    colors:          COLORS,
    elevation:       ELEVATION_RN,
    spacing:         SPACING,
    radius:          RADIUS,
    fonts:           FONTS,
    isReducedMotion,
  };
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

const ThemeContext = createContext<SanarchTheme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Check prefers-reduced-motion on mount (DESIGN.md §9 requirement)
  useEffect(() => {
    getReduceMotionPreference().then(setIsReducedMotion);
  }, []);

  const theme = useMemo(
    () => buildLightTheme(isReducedMotion),
    [isReducedMotion],
  );

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useTheme(): SanarchTheme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return ctx;
}
