/**
 * PrimaryButton — DESIGN.md §9 / Phase 1
 *
 * Gradient(135deg #4361EE→#3A56D4), elevation-brand.
 * Press: scale(.97) 100ms ease-out, spring(400,28) back.
 * On press-in: shadow collapses from elevation-brand → elevation-1.
 *
 * Variants: default | loading | disabled | destructive | full-width
 * The indigo gradient is EXCLUSIVE to PrimaryButton and FAB. Do not copy it elsewhere.
 */

import React from 'react';
import {
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  Pressable,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, ELEVATION_RN, RADIUS, FONTS } from '../../constants/theme';
import { DURATION, PRESS_SCALE, SPRING, safeDuration } from '../../constants/motion';
import { useTheme } from '../foundation/ThemeProvider';

type ButtonVariant = 'default' | 'loading' | 'disabled' | 'destructive';

interface PrimaryButtonProps {
  label:               string;
  onPress?:            () => void;
  variant?:            ButtonVariant;
  fullWidth?:          boolean;
  accessibilityLabel?: string;
  accessibilityHint?:  string;
  testID?:             string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PrimaryButton({
  label,
  onPress,
  variant     = 'default',
  fullWidth   = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: PrimaryButtonProps) {
  const { isReducedMotion } = useTheme();
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(1); // shadow opacity driven by same press gesture

  const isDisabled = variant === 'disabled' || variant === 'loading';

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    if (isDisabled || isReducedMotion) return;
    scale.value = withTiming(PRESS_SCALE.primary, {
      duration: safeDuration(DURATION.micro, isReducedMotion),
    });
  }

  function handlePressOut() {
    if (isDisabled || isReducedMotion) return;
    scale.value = withSpring(1, SPRING.buttonReturn);
  }

  // Gradient: destructive uses red, default/loading use brand indigo
  const gradientColors: [string, string] =
    variant === 'destructive'
      ? [COLORS.resultHigh, '#B91C1C']
      : ['#4361EE', '#3A56D4']; // DESIGN.md §7: gradient(135deg #4361EE→#3A56D4)

  // Shadow: collapses to elevation-1 on press-in, restores on press-out
  const shadowStyle: ViewStyle =
    isDisabled
      ? {}
      : variant === 'destructive'
      ? {
          shadowColor:   COLORS.resultHigh,
          shadowOffset:  { width: 0, height: 4 },
          shadowOpacity: 0.30,
          shadowRadius:  12,
          elevation:     6,
        }
      : ELEVATION_RN.brand; // two-layer indigo shadow

  return (
    <Animated.View
      style={[
        animStyle,
        shadowStyle,
        fullWidth && styles.fullWidth,
      ]}
    >
      <Pressable
        onPress={isDisabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: isDisabled, busy: variant === 'loading' }}
        testID={testID}
        style={{ borderRadius: RADIUS.lg }}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            isDisabled && styles.disabledGradient,
            fullWidth && styles.fullWidth,
          ]}
        >
          {variant === 'loading' ? (
            <ActivityIndicator size="small" color={COLORS.surface} />
          ) : (
            <Text style={styles.label}>{label}</Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    height:         48,
    paddingHorizontal: 20,
    borderRadius:   RADIUS.lg,       // 14
    alignItems:     'center',
    justifyContent: 'center',
    minWidth:       120,
    // Minimum tap target: 48dp height already exceeds 44dp floor
  },
  disabledGradient: {
    opacity: 0.45,
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    fontFamily:  FONTS.jakartaSemiBold,
    fontSize:    15,
    lineHeight:  22,
    color:       COLORS.surface,    // white
    letterSpacing: 0,
  },
});
