/**
 * SecondaryButton — DESIGN.md §9 / Phase 1
 *
 * White bg, 1px border rgba(17,24,39,.12), elevation-1 two-layer shadow.
 * Press: scale(.98) 100ms ease-out, spring(400,28) back.
 */

import React from 'react';
import {
  Text,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { COLORS, ELEVATION_RN, RADIUS, FONTS } from '../../constants/theme';
import { DURATION, PRESS_SCALE, SPRING, safeDuration } from '../../constants/motion';
import { useTheme } from '../foundation/ThemeProvider';

type SecondaryVariant = 'default' | 'loading' | 'disabled';

interface SecondaryButtonProps {
  label:               string;
  onPress?:            () => void;
  variant?:            SecondaryVariant;
  fullWidth?:          boolean;
  leftIcon?:           React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?:  string;
  testID?:             string;
}

export default function SecondaryButton({
  label,
  onPress,
  variant   = 'default',
  fullWidth = false,
  leftIcon,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: SecondaryButtonProps) {
  const { isReducedMotion } = useTheme();
  const scale = useSharedValue(1);
  const isDisabled = variant === 'disabled' || variant === 'loading';

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    if (isDisabled || isReducedMotion) return;
    scale.value = withTiming(PRESS_SCALE.secondary, {
      duration: safeDuration(DURATION.micro, isReducedMotion),
    });
  }

  function handlePressOut() {
    if (isDisabled || isReducedMotion) return;
    scale.value = withSpring(1, SPRING.buttonReturn);
  }

  return (
    <Animated.View
      style={[
        animStyle,
        ELEVATION_RN[1],                          // two-layer shadow
        styles.shadow,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabledContainer,
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
        style={[styles.button, fullWidth && styles.fullWidth]}
      >
        {variant === 'loading' ? (
          <ActivityIndicator size="small" color={COLORS.ink600} />
        ) : (
          <View style={styles.row}>
            {leftIcon && <View style={styles.iconWrap}>{leftIcon}</View>}
            <Text style={[styles.label, isDisabled && styles.disabledLabel]}>
              {label}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: RADIUS.lg,
  },
  button: {
    height:           48,
    paddingHorizontal: 20,
    borderRadius:     RADIUS.lg,
    alignItems:       'center',
    justifyContent:   'center',
    backgroundColor:  COLORS.surface,
    borderWidth:      1,
    borderColor:      'rgba(17,24,39,0.12)',
    minWidth:         100,
  },
  fullWidth: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  iconWrap: {
    width:  20,
    height: 20,
    alignItems:     'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily:    FONTS.jakartaSemiBold,
    fontSize:      15,
    color:         COLORS.ink800,
    letterSpacing: 0,
  },
  disabledLabel: {
    color: COLORS.ink400,
  },
  disabledContainer: {
    opacity: 0.6,
  },
});
