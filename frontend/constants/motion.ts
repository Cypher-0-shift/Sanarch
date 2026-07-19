/**
 * Sanarch Motion Constants — DESIGN.md §9
 * Single source of truth for every animation duration, easing, and spring config.
 * Import from here; never hardcode values in component files.
 *
 * All durations are in milliseconds.
 * Spring configs are for react-native-reanimated withSpring().
 */

import { useState, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

// ─────────────────────────────────────────────
// DURATIONS
// ─────────────────────────────────────────────

export const DURATION = {
  /** Instant — no visible animation (toggles, discrete state flips) */
  instant: 0,
  /** Micro-interactions: button press scale down */
  micro:   100,
  /** State changes: focus rings, hover bg, card border */
  fast:    200,
  /** Elements entering the view */
  enter:   300,
  /** Elements leaving (faster than enter) */
  exit:    280,
  /** Accordion open, bottom sheet slide */
  complex: 380,
  /** Intentional emphasis: success reveal, onboarding celebrate */
  slow:    600,
  /** Skeleton shimmer loop */
  shimmer: 1200,
} as const;

// ─────────────────────────────────────────────
// EASING STRINGS (for Animated / withTiming)
// ─────────────────────────────────────────────

export const EASING = {
  /** Standard state changes */
  standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  /** Elements entering */
  enter:    'cubic-bezier(0.0, 0.0, 0.2, 1)',
  /** Elements leaving */
  exit:     'cubic-bezier(0.4, 0.0, 1.0, 1)',
  /** Ease out — used for accordion, card select */
  easeOut:  'ease-out',
  /** Ease in — bottom sheet exit */
  easeIn:   'ease-in',
} as const;

// ─────────────────────────────────────────────
// SPRING CONFIGS — for react-native-reanimated withSpring()
// ─────────────────────────────────────────────

export const SPRING = {
  /**
   * Button return spring — snaps back with energy after press.
   * DESIGN.md: spring(stiffness 400, damping 28)
   */
  buttonReturn: {
    stiffness: 400,
    damping:   28,
    mass:      1,
  },

  /**
   * Bottom sheet entry — 380ms feel per DESIGN.md.
   * DESIGN.md: spring(280, 28)
   */
  sheetEnter: {
    stiffness: 280,
    damping:   28,
    mass:      1,
  },

  /**
   * FAB press return — most aggressive snap.
   * DESIGN.md: scale(0.88) + shadow collapse, 120ms spring
   */
  fabReturn: {
    stiffness: 500,
    damping:   30,
    mass:      0.8,
  },

  /**
   * Success / celebration moments (onboarding, SanarchID reveal).
   * Slight overshoot for premium feel.
   */
  celebrate: {
    stiffness: 300,
    damping:   18,
    mass:      0.9,
  },
} as const;

// ─────────────────────────────────────────────
// BUTTON PRESS SCALES — DESIGN.md §9
// ─────────────────────────────────────────────

export const PRESS_SCALE = {
  primary:   0.97,
  secondary: 0.98,
  icon:      0.90,
  fab:       0.88,
  card:      0.99,
} as const;

// ─────────────────────────────────────────────
// SKELETON SHIMMER
// ─────────────────────────────────────────────

export const SHIMMER = {
  /** Colors for the shimmer gradient stops */
  base:      '#E5E7EB',  // ink-200
  highlight: '#F3F4F6',  // ink-100
  /** Shimmer animation duration (linear, no easing, loops forever) */
  duration:  DURATION.shimmer,
} as const;

// ─────────────────────────────────────────────
// STAGGER — list item entry animations
// ─────────────────────────────────────────────

export const STAGGER = {
  /** Delay between each list item (max 4 items before instant) */
  itemDelay:  50,
  /** Items beyond this index appear instantly (no stagger) */
  maxStagger: 4,
} as const;

// ─────────────────────────────────────────────
// ACCORDION — DESIGN.md §9
// ─────────────────────────────────────────────

export const ACCORDION = {
  /** Height expand/collapse */
  duration:   DURATION.complex,
  /** Content opacity starts fading in 80ms after height begins expanding */
  opacityDelay: 80,
} as const;

// ─────────────────────────────────────────────
// SKELETON → CONTENT TRANSITION — DESIGN.md §9
// ─────────────────────────────────────────────

export const SKELETON_TRANSITION = {
  /** Skeleton fades out over this duration */
  fadeDuration: DURATION.fast,
  /** Content starts fading in halfway through skeleton fade (at 100ms) */
  contentStartDelay: DURATION.fast / 2,
} as const;

// ─────────────────────────────────────────────
// prefers-reduced-motion helper
// ─────────────────────────────────────────────

/**
 * Call once at app init (e.g., in ThemeProvider) and store the result.
 * When true, pass duration = 0 to all animations instead of the DURATION values.
 *
 * Usage:
 *   const reducedMotion = await getReduceMotionPreference();
 *   const d = reducedMotion ? 0 : DURATION.enter;
 */
export async function getReduceMotionPreference(): Promise<boolean> {
  try {
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch {
    return false;
  }
}

/**
 * Returns the correct duration for a given motion constant,
 * respecting the prefers-reduced-motion preference.
 */
export function safeDuration(
  duration: number,
  isReducedMotion: boolean = false,
): number {
  return isReducedMotion ? 0 : duration;
}

export function useReducedMotion() {
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotionEnabled);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotionEnabled
    );
    return () => {
      subscription.remove();
    };
  }, []);

  return reduceMotionEnabled;
}
