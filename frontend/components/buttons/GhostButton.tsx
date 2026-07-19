/**
 * GhostButton — DESIGN.md Phase 1
 *
 * Transparent bg at rest, brand-primary text.
 * Press-in: bg → brand-tint (#EEF2FF), scale(.98), spring back.
 * Destructive variant: text → result-high, press bg → result-high-bg.
 */

import React from 'react';
import { Text, StyleSheet, Pressable, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { COLORS, RADIUS, FONTS } from '../../constants/theme';
import { DURATION, PRESS_SCALE, SPRING, safeDuration } from '../../constants/motion';
import { useTheme } from '../foundation/ThemeProvider';

type GhostVariant = 'brand' | 'destructive' | 'neutral';

interface GhostButtonProps {
  label:               string;
  onPress?:            () => void;
  variant?:            GhostVariant;
  disabled?:           boolean;
  leftIcon?:           React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?:  string;
  testID?:             string;
}

export default function GhostButton({
  label,
  onPress,
  variant  = 'brand',
  disabled = false,
  leftIcon,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: GhostButtonProps) {
  const { isReducedMotion } = useTheme();
  const scale   = useSharedValue(1);
  const bgOpacity = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform:        [{ scale: scale.value }],
    backgroundColor:  variant === 'destructive'
      ? `rgba(220,38,38,${bgOpacity.value * 0.08})`
      : `rgba(67,97,238,${bgOpacity.value * 0.06})`,
  }));

  function handlePressIn() {
    if (disabled || isReducedMotion) return;
    scale.value     = withTiming(PRESS_SCALE.secondary, { duration: safeDuration(DURATION.micro, isReducedMotion) });
    bgOpacity.value = withTiming(1, { duration: safeDuration(DURATION.fast, isReducedMotion) });
  }

  function handlePressOut() {
    if (disabled || isReducedMotion) return;
    scale.value     = withSpring(1, SPRING.buttonReturn);
    bgOpacity.value = withTiming(0, { duration: safeDuration(DURATION.fast, isReducedMotion) });
  }

  const labelColor =
    disabled      ? COLORS.ink400 :
    variant === 'destructive' ? COLORS.resultHigh :
    variant === 'neutral'     ? COLORS.ink600 :
    COLORS.brandPrimary;

  return (
    <Animated.View style={[animStyle, styles.container]}>
      <Pressable
        onPress={disabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        testID={testID}
        style={styles.pressable}
      >
        <View style={styles.row}>
          {leftIcon && <View style={styles.iconWrap}>{leftIcon}</View>}
          <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.lg,
    alignSelf:    'flex-start',
  },
  pressable: {
    height:           44,            // minimum tap target
    paddingHorizontal: 16,
    borderRadius:     RADIUS.lg,
    alignItems:       'center',
    justifyContent:   'center',
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  iconWrap: {
    width:  18,
    height: 18,
    alignItems:     'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily:    FONTS.jakartaSemiBold,
    fontSize:      14,
    letterSpacing: 0,
  },
});
