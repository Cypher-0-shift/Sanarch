/**
 * IconButton — DESIGN.md Phase 1
 *
 * Icon-only button. Minimum 44×44dp tap target is non-negotiable.
 * The visual icon area may be smaller (e.g. 22px icon in 40px container)
 * but the Pressable hitSlop always reaches 44×44.
 *
 * Variants:
 *   'default' — ink-100 bg, ink-600 icon. Standard action.
 *   'brand'   — brand-tint bg, brand-primary icon. Emphasized action.
 *   'ghost'   — transparent bg, ink-600 icon. Subtle action (header buttons).
 *   'circle'  — same as default but radius-full (circular shape).
 *
 * Press: scale(.90) 100ms ease-out, spring(400,28) back.
 *
 * CRITICAL: accessibilityLabel is REQUIRED. Enforced at runtime via a warning.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { COLORS, RADIUS } from '../../constants/theme';
import { DURATION, PRESS_SCALE, SPRING, safeDuration } from '../../constants/motion';
import { useTheme } from '../foundation/ThemeProvider';

type IconButtonVariant = 'default' | 'brand' | 'ghost' | 'circle';
type IconButtonSize    = 'sm' | 'md' | 'lg'; // 32 / 40 / 48 visual; tap always ≥44

interface IconButtonProps {
  /** The icon element to render (e.g. from MaterialCommunityIcons). */
  icon:                React.ReactNode;
  /** REQUIRED — screen reader label for this button. No default. */
  accessibilityLabel:  string;
  onPress?:            () => void;
  onLongPress?:        () => void;
  variant?:            IconButtonVariant;
  size?:               IconButtonSize;
  disabled?:           boolean;
  accessibilityHint?:  string;
  testID?:             string;
}

const VISUAL_SIZE: Record<IconButtonSize, number> = { sm: 32, md: 40, lg: 48 };
const MIN_TAP = 44; // accessibility floor

export default function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  onLongPress,
  variant  = 'default',
  size     = 'md',
  disabled = false,
  accessibilityHint,
  testID,
}: IconButtonProps) {
  const { isReducedMotion } = useTheme();
  const scale = useSharedValue(1);

  // Enforce accessibilityLabel at dev time
  if (__DEV__ && !accessibilityLabel) {
    console.warn('[IconButton] accessibilityLabel is required for every icon-only button.');
  }

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    if (disabled || isReducedMotion) return;
    scale.value = withTiming(PRESS_SCALE.icon, {
      duration: safeDuration(DURATION.micro, isReducedMotion),
    });
  }

  function handlePressOut() {
    if (disabled || isReducedMotion) return;
    scale.value = withSpring(1, SPRING.buttonReturn);
  }

  const visualSize = VISUAL_SIZE[size];
  const tapSize    = Math.max(visualSize, MIN_TAP);
  const hitSlop    = (tapSize - visualSize) / 2;

  const bgColor =
    variant === 'brand'  ? COLORS.brandTint :
    variant === 'ghost'  ? 'transparent' :
    COLORS.ink100;

  const radius =
    variant === 'circle' ? RADIUS.full : RADIUS.icon; // 10 = rounded square per DESIGN.md §5

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={disabled ? undefined : onPress}
        onLongPress={disabled ? undefined : onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        hitSlop={hitSlop}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        testID={testID}
        style={[
          styles.container,
          {
            width:           visualSize,
            height:          visualSize,
            borderRadius:    radius,
            backgroundColor: bgColor,
            opacity:         disabled ? 0.4 : 1,
          },
        ]}
      >
        {icon}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems:     'center',
    justifyContent: 'center',
  },
});
