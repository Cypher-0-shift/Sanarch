/**
 * FormField — DESIGN.md §9 / Phase 1
 *
 * Labeled text input with full state coverage.
 *
 * Focus state per DESIGN.md §9:
 *   - Border color: ink-300 → brand-primary, 200ms
 *   - Glow ring: fades in 200ms (0 0 0 3px rgba(67,97,238,.12))
 *   - NO scale change on focus — prevents layout shift
 *
 * Variants: text | email | numeric | disabled | error
 *
 * Pair with InlineError for error messages.
 * The glow ring is simulated in RN via an outer View with a matching border-radius,
 * animated from transparent → brand-tinted, behind the input container.
 */

import React, { useRef, useState } from 'react';
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, RADIUS, FONTS, SPACING } from '../../constants/theme';
import { DURATION, safeDuration } from '../../constants/motion';
import { useTheme } from '../foundation/ThemeProvider';
import InlineError from '../feedback/InlineError';

type FieldVariant = 'text' | 'email' | 'numeric' | 'disabled' | 'error';

interface FormFieldProps extends Omit<TextInputProps, 'editable'> {
  label:          string;
  variant?:       FieldVariant;
  errorMessage?:  string;
  helperText?:    string;
  /** Shown inside the field on the right */
  rightElement?:  React.ReactNode;
  /** Shown inside the field on the left */
  leftElement?:   React.ReactNode;
  containerStyle?: object;
  testID?:        string;
}

export default function FormField({
  label,
  variant       = 'text',
  errorMessage,
  helperText,
  rightElement,
  leftElement,
  containerStyle,
  testID,
  onFocus,
  onBlur,
  ...rest
}: FormFieldProps) {
  const { isReducedMotion } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const isDisabled = variant === 'disabled';
  const hasError   = variant === 'error' || !!errorMessage;

  // ── Animated focus states ──────────────────────────────────────────
  // 1. Border color: 0 = ink-300, 1 = brand-primary (or red on error)
  const borderProgress = useSharedValue(0);
  // 2. Glow ring opacity: 0 → 1
  const glowOpacity    = useSharedValue(0);

  const animBorder = useAnimatedStyle(() => {
    // Interpolate between ink-300 and brand-primary (or error red)
    // RN can't animate color strings natively — use opacity on a colored overlay
    return {};
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  function handleFocus(e: any) {
    setIsFocused(true);
    if (!isReducedMotion) {
      glowOpacity.value = withTiming(1, { duration: safeDuration(DURATION.fast, isReducedMotion) });
    }
    onFocus?.(e);
  }

  function handleBlur(e: any) {
    setIsFocused(false);
    if (!isReducedMotion) {
      glowOpacity.value = withTiming(0, { duration: safeDuration(DURATION.fast, isReducedMotion) });
    }
    onBlur?.(e);
  }

  // Border color resolves statically (no color animation in RN)
  const borderColor =
    hasError    ? COLORS.resultHigh :
    isFocused   ? COLORS.brandPrimary :
    COLORS.ink300;

  const borderWidth = isFocused || hasError ? 1.5 : 1;

  // Glow ring color (outer box)
  const glowColor = hasError
    ? 'rgba(220,38,38,0.12)'
    : 'rgba(67,97,238,0.12)';

  const keyboardType: TextInputProps['keyboardType'] =
    variant === 'email'   ? 'email-address' :
    variant === 'numeric' ? 'numeric' :
    'default';

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {/* Label */}
      <Text style={styles.label}>{label}</Text>

      {/* Glow ring — fades in on focus, behind the input */}
      <View style={styles.glowWrap}>
        <Animated.View
          style={[
            styles.glowRing,
            glowStyle,
            { borderColor: glowColor },
          ]}
          pointerEvents="none"
        />

        {/* Input container */}
        <View
          style={[
            styles.inputContainer,
            {
              borderColor,
              borderWidth,
              backgroundColor: isDisabled ? COLORS.surfaceSub : COLORS.surface,
            },
          ]}
        >
          {leftElement && (
            <View style={styles.sideElement}>{leftElement}</View>
          )}

          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              isDisabled && styles.disabledText,
              leftElement  ? styles.inputWithLeft  : undefined,
              rightElement ? styles.inputWithRight : undefined,
            ]}
            placeholderTextColor={COLORS.ink400}
            editable={!isDisabled}
            keyboardType={keyboardType}
            autoCapitalize={variant === 'email' ? 'none' : 'sentences'}
            onFocus={handleFocus}
            onBlur={handleBlur}
            testID={testID}
            {...rest}
          />

          {rightElement && (
            <View style={styles.sideElement}>{rightElement}</View>
          )}
        </View>
      </View>

      {/* Error or helper text */}
      {hasError && errorMessage ? (
        <InlineError message={errorMessage} />
      ) : helperText ? (
        <Text style={styles.helper}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontFamily:    FONTS.jakartaSemiBold,
    fontSize:      12,
    lineHeight:    16,
    color:         COLORS.ink600,
    letterSpacing: 0,
  },
  glowWrap: {
    position: 'relative',
  },
  glowRing: {
    // The glow ring sits outside the input, fades in/out on focus
    position:     'absolute',
    top:          -3,
    left:         -3,
    right:        -3,
    bottom:       -3,
    borderRadius: RADIUS.md + 3,  // matches input radius + offset
    borderWidth:  3,
    zIndex:       0,
  },
  inputContainer: {
    flexDirection:  'row',
    alignItems:     'center',
    height:         48,
    borderRadius:   RADIUS.md,    // 10 per DESIGN.md inputs
    paddingHorizontal: SPACING[4], // 16
    zIndex:         1,
  },
  input: {
    flex:        1,
    fontFamily:  FONTS.jakartaRegular,
    fontSize:    14,
    lineHeight:  22,
    color:       COLORS.ink800,
    padding:     0,       // remove default TextInput padding
    margin:      0,
    // NO scale on focus — DESIGN.md §9: prevents layout shift
  },
  disabledText: {
    color: COLORS.ink400,
  },
  inputWithLeft: {
    paddingLeft: 8,
  },
  inputWithRight: {
    paddingRight: 8,
  },
  sideElement: {
    alignItems:     'center',
    justifyContent: 'center',
    height:         24,
    width:          24,
  },
  helper: {
    fontFamily: FONTS.jakartaRegular,
    fontSize:   11,
    lineHeight: 16,
    color:      COLORS.ink400,
    marginTop:  2,
  },
});
