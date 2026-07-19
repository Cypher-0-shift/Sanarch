/**
 * BaseCard — DESIGN.md §5, Phase 0
 *
 * Foundation card component. Every card in the app either IS a BaseCard or
 * composes one. No cards should be built outside this component.
 *
 * Variants (DESIGN.md §5):
 *   'default'  — white bg, 1px rgba(17,24,39,0.06) border, elevation-1 two-layer shadow.
 *   'subtle'   — surface-sub (#F4F5F7) fill, no border, no shadow. Recessed / secondary.
 *   'outlined' — white bg, 1.5px ink-200 border, no shadow. Selection rest state.
 *   'active'   — white bg, 1.5px rgba(67,97,238,0.25) border, brand two-layer shadow.
 *   'ai'       — 135deg gradient brand-tint→white (70%), brand border, soft indigo shadow.
 *   'dark'     — dark-900 bg, rgba(255,255,255,0.06) border, inset top highlight.
 *
 * DESIGN.md §10 rules enforced here:
 *   ✗ Never nest a BaseCard inside another BaseCard.
 *   ✗ Never apply glassmorphism (reserved for 3 specific components only).
 *   ✗ Never use the brand indigo gradient on 'default' or 'subtle' variants.
 *   ✓ Always two-layer shadows — elevation-1 is already two-layer.
 *   ✓ 'active': border tints to brand AND shadow gains brand color together.
 *
 * Press animation (DESIGN.md §9):
 *   scale(0.99) on press-in, spring return on press-out (Reanimated, 60fps).
 *   Disabled entirely when isReducedMotion = true.
 */

import React from 'react';
import {
  StyleSheet,
  ViewStyle,
  Pressable,
  GestureResponderEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, ELEVATION_RN, RADIUS } from '../../constants/theme';
import { DURATION, PRESS_SCALE, SPRING, safeDuration } from '../../constants/motion';
import { useTheme } from './ThemeProvider';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type CardVariant = 'default' | 'subtle' | 'outlined' | 'active' | 'ai' | 'dark';

export interface BaseCardProps {
  variant?:            CardVariant;
  /** Layout overrides only (margin, flex, width). Do NOT override color or shadow here. */
  style?:              ViewStyle;
  children?:           React.ReactNode;
  /** Enables scale press-feedback and onPress/onLongPress. */
  pressable?:          boolean;
  onPress?:            (event: GestureResponderEvent) => void;
  onLongPress?:        (event: GestureResponderEvent) => void;
  accessibilityLabel?: string;
  accessibilityHint?:  string;
  testID?:             string;
}

// ─────────────────────────────────────────────
// Variant style factory
// ─────────────────────────────────────────────

function variantStyles(variant: CardVariant): ViewStyle {
  switch (variant) {
    case 'default':
      return {
        backgroundColor: COLORS.surface,           // #FFFFFF
        borderWidth:     1,
        borderColor:     'rgba(17,24,39,0.06)',     // barely-there border
        borderRadius:    RADIUS.xl,                 // 20
        ...ELEVATION_RN[1],                         // two-layer shadow
      };

    case 'subtle':
      return {
        backgroundColor: COLORS.surfaceSub,         // #F4F5F7 — recessed
        borderRadius:    RADIUS.xl,
        // No border, no shadow
      };

    case 'outlined':
      return {
        backgroundColor: COLORS.surface,
        borderWidth:     1.5,
        borderColor:     COLORS.ink200,             // #E5E7EB
        borderRadius:    RADIUS.xl,
        // No shadow — flat selection rest state
      };

    case 'active':
      // DESIGN.md: "Never change border color alone — pair it with a shadow shift."
      return {
        backgroundColor: COLORS.surface,
        borderWidth:     1.5,
        borderColor:     'rgba(67,97,238,0.25)',    // brand tinted border
        borderRadius:    RADIUS.xl,
        ...ELEVATION_RN.brand,                      // indigo two-layer shadow
      };

    case 'ai':
      // The LinearGradient is the actual background — see render below.
      // These styles are applied ON the LinearGradient component.
      return {
        borderWidth:   1,
        borderColor:   'rgba(67,97,238,0.15)',
        borderRadius:  RADIUS.xl,
        overflow:      'hidden',                    // clips gradient to border radius
        // Soft indigo shadow (lighter than elevation-brand)
        shadowColor:   '#4361EE',
        shadowOffset:  { width: 0, height: 4 },
        shadowOpacity: 0.10,
        shadowRadius:  12,
        elevation:     4,
      };

    case 'dark':
      // DESIGN.md §5: dark-900 bg, rgba white border, inset top highlight
      return {
        backgroundColor: COLORS.dark900,            // #161B22
        borderWidth:     1,
        borderColor:     'rgba(255,255,255,0.06)',
        borderRadius:    RADIUS.xl,
      };

    default:
      return {};
  }
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function BaseCard({
  variant   = 'default',
  style,
  children,
  pressable = false,
  onPress,
  onLongPress,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: BaseCardProps) {
  const { isReducedMotion } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function onPressIn() {
    if (!pressable || isReducedMotion) return;
    scale.value = withTiming(PRESS_SCALE.card, {
      duration: safeDuration(DURATION.micro, isReducedMotion),
    });
  }

  function onPressOut() {
    if (!pressable || isReducedMotion) return;
    scale.value = withSpring(1, SPRING.buttonReturn);
  }

  const vs = variantStyles(variant);

  // ── AI variant: LinearGradient is the surface ──────────────────────
  if (variant === 'ai') {
    const content = (
      <LinearGradient
        // DESIGN.md §5: gradient 135deg #EEF2FF→#FFF (70%)
        colors={[COLORS.brandTint, COLORS.surface]}
        locations={[0, 0.7]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[vs, style]}
      >
        {children}
      </LinearGradient>
    );

    if (!pressable) return <Animated.View style={animStyle}>{content}</Animated.View>;

    return (
      <Animated.View style={animStyle}>
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          testID={testID}
        >
          {content}
        </Pressable>
      </Animated.View>
    );
  }

  // ── Dark variant: inset top highlight overlay ──────────────────────
  if (variant === 'dark') {
    const content = (
      <>
        {/* Inset top highlight — DESIGN.md §5 "inset top rgba(255,255,255,0.08)" */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius:   RADIUS.xl,
              borderTopWidth: 1,
              borderTopColor: 'rgba(255,255,255,0.08)',
            },
          ]}
        />
        {children}
      </>
    );

    if (!pressable) {
      return (
        <Animated.View style={[animStyle, vs, style]}>
          {content}
        </Animated.View>
      );
    }

    return (
      <Animated.View style={[animStyle, vs, style]}>
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          testID={testID}
          style={{ flex: 1 }}
        >
          {content}
        </Pressable>
      </Animated.View>
    );
  }

  // ── All other variants: default / subtle / outlined / active ───────
  if (!pressable) {
    return (
      <Animated.View style={[animStyle, vs, style]}>
        {children}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[animStyle, vs, style]}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        testID={testID}
        style={{ flex: 1 }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
