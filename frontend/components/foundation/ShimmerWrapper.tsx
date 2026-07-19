/**
 * ShimmerWrapper — DESIGN.md Phase 0
 *
 * Reusable skeleton/shimmer animation utility.
 * Wraps any child view and applies a sliding gradient shimmer effect.
 *
 * Usage:
 *   <ShimmerWrapper width={200} height={16} borderRadius={6} />
 *   <ShimmerWrapper width="100%" height={88} borderRadius={20} style={styles.card} />
 *
 * The shimmer slides left → right over a base + highlight color pair from DESIGN.md §9.
 * Loop is infinite while the component is mounted; no prefers-reduced-motion check
 * needed here because skeleton shimmers signal "loading in progress" (functional,
 * not decorative) — but we respect it anyway by showing a static fill.
 *
 * Implementation note: uses react-native-reanimated for 60fps performance
 * instead of the JS-driven Animated API.
 */

import React, { useEffect } from 'react';
import { StyleSheet, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SHIMMER, DURATION } from '../../constants/motion';
import { useTheme } from './ThemeProvider';

interface ShimmerWrapperProps {
  /** Width of the shimmer element. Use a number (dp) or a string (e.g. '100%'). */
  width:        DimensionValue;
  /** Height of the shimmer element in dp. */
  height:       number;
  /** Border radius to match the skeleton's shape. Default: 6 (radius-sm). */
  borderRadius?: number;
  /** Additional styles applied to the container */
  style?:       object;
}

export default function ShimmerWrapper({
  width,
  height,
  borderRadius = 6,
  style,
}: ShimmerWrapperProps) {
  const { isReducedMotion } = useTheme();

  // Shared value drives the gradient position: 0 (left) → 1 (right off screen)
  const translateX = useSharedValue(-1);

  useEffect(() => {
    if (isReducedMotion) {
      // Static fill for reduce-motion — show base color, no animation
      translateX.value = -1;
      return;
    }

    translateX.value = withRepeat(
      withTiming(1, {
        duration: SHIMMER.duration,
        easing:   Easing.linear,  // shimmer must be perfectly linear — no ease
      }),
      -1,   // repeat infinitely
      false, // do not reverse (always left → right)
    );
  }, [isReducedMotion]);

  // The animated style moves the gradient overlay across the base surface
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * (typeof width === 'number' ? width : 200) }],
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: SHIMMER.base,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {/* Shimmer gradient overlay */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          animatedStyle,
          { width: typeof width === 'number' ? width * 2 : '200%' },
        ]}
      >
        <LinearGradient
          colors={[
            'transparent',
            SHIMMER.highlight,
            SHIMMER.highlight,
            'transparent',
          ]}
          locations={[0, 0.3, 0.6, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// Preset skeleton shapes — convenience wrappers
// ─────────────────────────────────────────────

/**
 * SkeletonText — mimics a single line of text.
 * widthPercent: how wide relative to container (0–100).
 */
export function SkeletonText({
  widthPercent = 80,
  height = 14,
}: {
  widthPercent?: number;
  height?: number;
}) {
  return (
    <ShimmerWrapper
      width={`${widthPercent}%`}
      height={height}
      borderRadius={4}
    />
  );
}

/**
 * SkeletonCard — mimics a full document/timeline card.
 * Matches standard card height (88dp) and radius-xl (20dp).
 */
export function SkeletonCard({ height = 88 }: { height?: number }) {
  return (
    <ShimmerWrapper
      width="100%"
      height={height}
      borderRadius={20}
    />
  );
}

/**
 * SkeletonAvatar — mimics a circular/square avatar.
 * shape: 'circle' applies radius-full | 'square' applies radius-icon (10).
 */
export function SkeletonAvatar({
  size = 40,
  shape = 'square',
}: {
  size?: number;
  shape?: 'circle' | 'square';
}) {
  return (
    <ShimmerWrapper
      width={size}
      height={size}
      borderRadius={shape === 'circle' ? 9999 : 10}
    />
  );
}
