/**
 * TextareaField — DESIGN.md Phase 1
 *
 * Multiline text input. Variants: with-count / without-count.
 * Same focus state as FormField (glow ring, border color shift, NO scale).
 * Min height 96dp. Vertically resizable via scrollable.
 */

import React, { useState } from 'react';
import { Text, TextInput, View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { COLORS, RADIUS, FONTS, SPACING } from '../../constants/theme';
import { DURATION, safeDuration } from '../../constants/motion';
import { useTheme } from '../foundation/ThemeProvider';
import InlineError from '../feedback/InlineError';

interface TextareaFieldProps {
  label:          string;
  value?:         string;
  onChangeText?:  (text: string) => void;
  maxLength?:     number;
  showCount?:     boolean;
  placeholder?:   string;
  errorMessage?:  string;
  disabled?:      boolean;
  minHeight?:     number;
  testID?:        string;
  onFocus?:       (e: any) => void;
  onBlur?:        (e: any) => void;
}

export default function TextareaField({
  label,
  value = '',
  onChangeText,
  maxLength,
  showCount  = false,
  placeholder,
  errorMessage,
  disabled   = false,
  minHeight  = 96,
  testID,
  onFocus,
  onBlur,
}: TextareaFieldProps) {
  const { isReducedMotion } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const glowOpacity = useSharedValue(0);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

  const hasError    = !!errorMessage;
  const borderColor = hasError ? COLORS.resultHigh : isFocused ? COLORS.brandPrimary : COLORS.ink300;
  const glowColor   = hasError ? 'rgba(220,38,38,0.12)' : 'rgba(67,97,238,0.12)';

  function handleFocus(e: any) {
    setIsFocused(true);
    if (!isReducedMotion) glowOpacity.value = withTiming(1, { duration: safeDuration(DURATION.fast, isReducedMotion) });
    onFocus?.(e);
  }

  function handleBlur(e: any) {
    setIsFocused(false);
    if (!isReducedMotion) glowOpacity.value = withTiming(0, { duration: safeDuration(DURATION.fast, isReducedMotion) });
    onBlur?.(e);
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.glowWrap}>
        <Animated.View
          style={[styles.glowRing, glowStyle, { borderColor: glowColor }]}
          pointerEvents="none"
        />
        <TextInput
          style={[
            styles.textarea,
            { borderColor, borderWidth: isFocused || hasError ? 1.5 : 1, minHeight },
            disabled && styles.disabled,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.ink400}
          multiline
          maxLength={maxLength}
          editable={!disabled}
          textAlignVertical="top"
          onFocus={handleFocus}
          onBlur={handleBlur}
          testID={testID}
        />
      </View>

      <View style={styles.footer}>
        {hasError && errorMessage
          ? <InlineError message={errorMessage} />
          : <View />
        }
        {showCount && maxLength && (
          <Text style={styles.count}>
            {value.length}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:  { gap: 6 },
  label: {
    fontFamily:    FONTS.jakartaSemiBold,
    fontSize:      12,
    color:         COLORS.ink600,
    letterSpacing: 0,
  },
  glowWrap: { position: 'relative' },
  glowRing: {
    position:     'absolute',
    top: -3, left: -3, right: -3, bottom: -3,
    borderRadius: RADIUS.md + 3,
    borderWidth:  3,
  },
  textarea: {
    fontFamily:      FONTS.jakartaRegular,
    fontSize:        14,
    lineHeight:      22,
    color:           COLORS.ink800,
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.md,
    padding:         SPACING[4],
    zIndex:          1,
  },
  disabled: {
    backgroundColor: COLORS.surfaceSub,
    color:           COLORS.ink400,
  },
  footer: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
  },
  count: {
    fontFamily: FONTS.jakartaRegular,
    fontSize:   11,
    color:      COLORS.ink400,
  },
});
