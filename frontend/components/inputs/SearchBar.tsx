/**
 * SearchBar — DESIGN.md Phase 1
 *
 * Inline search — expands in place. Does NOT navigate to a new screen.
 * Both Home and Records use inline search per the UX spec.
 *
 * Variants:
 *   'compact'  — pill-shaped, ink-100 bg, shows placeholder. Tapping it enters expanded state.
 *   'expanded' — full text input, always focused, shows clear button.
 *
 * The bar manages its own expanded/collapsed state internally,
 * but exposes onExpandedChange so the parent can react (e.g. hide other header elements).
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  TextInput,
  View,
  Text,
  Pressable,
  StyleSheet,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, RADIUS, FONTS, SPACING } from '../../constants/theme';
import { DURATION, safeDuration } from '../../constants/motion';
import { useTheme } from '../foundation/ThemeProvider';

interface SearchBarProps {
  placeholder?:       string;
  value?:             string;
  onChangeText?:      (text: string) => void;
  onExpandedChange?:  (expanded: boolean) => void;
  /** Start in expanded mode (e.g. Records screen always shows search) */
  defaultExpanded?:   boolean;
  testID?:            string;
}

export default function SearchBar({
  placeholder      = 'Search…',
  value,
  onChangeText,
  onExpandedChange,
  defaultExpanded  = false,
  testID,
}: SearchBarProps) {
  const { isReducedMotion } = useTheme();
  const [isExpanded, setIsExpanded]   = useState(defaultExpanded);
  const [localValue, setLocalValue]   = useState(value ?? '');
  const inputRef = useRef<TextInput>(null);

  // Width animation: compact → expanded
  const widthProgress = useSharedValue(defaultExpanded ? 1 : 0);
  const focusOpacity  = useSharedValue(defaultExpanded ? 1 : 0);

  const containerStyle = useAnimatedStyle(() => ({
    flex:          widthProgress.value,
    borderColor:   `rgba(67,97,238,${focusOpacity.value * 0.5})`,
    backgroundColor: isExpanded
      ? COLORS.surface
      : COLORS.ink100,
  }));

  useEffect(() => {
    if (value !== undefined) setLocalValue(value);
  }, [value]);

  function expand() {
    setIsExpanded(true);
    onExpandedChange?.(true);
    widthProgress.value = withTiming(1, { duration: safeDuration(DURATION.enter, isReducedMotion) });
    focusOpacity.value  = withTiming(1, { duration: safeDuration(DURATION.fast, isReducedMotion) });
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function collapse() {
    Keyboard.dismiss();
    setIsExpanded(false);
    setLocalValue('');
    onChangeText?.('');
    onExpandedChange?.(false);
    widthProgress.value = withTiming(0, { duration: safeDuration(DURATION.exit, isReducedMotion) });
    focusOpacity.value  = withTiming(0, { duration: safeDuration(DURATION.fast, isReducedMotion) });
  }

  function handleChange(text: string) {
    setLocalValue(text);
    onChangeText?.(text);
  }

  const currentValue = value !== undefined ? value : localValue;

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Search icon */}
        <Text style={styles.searchIcon} accessibilityElementsHidden>🔍</Text>

        {isExpanded ? (
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={currentValue}
            onChangeText={handleChange}
            placeholder={placeholder}
            placeholderTextColor={COLORS.ink400}
            returnKeyType="search"
            autoCorrect={false}
            testID={testID}
            accessibilityLabel="Search"
          />
        ) : (
          <Pressable
            style={styles.placeholderPress}
            onPress={expand}
            accessibilityRole="search"
            accessibilityLabel="Search"
            hitSlop={8}
          >
            <Text style={styles.placeholder}>{placeholder}</Text>
          </Pressable>
        )}

        {/* Clear button — only visible when expanded + has text */}
        {isExpanded && currentValue.length > 0 && (
          <Pressable
            onPress={() => handleChange('')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            style={styles.clearBtn}
          >
            <Text style={styles.clearIcon}>✕</Text>
          </Pressable>
        )}
      </Animated.View>

      {/* Cancel button — appears when expanded */}
      {isExpanded && (
        <Pressable
          onPress={collapse}
          style={styles.cancelBtn}
          accessibilityRole="button"
          accessibilityLabel="Cancel search"
          hitSlop={8}
        >
          <Text style={styles.cancelLabel}>Cancel</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING[2],
  },
  container: {
    flexDirection:    'row',
    alignItems:       'center',
    height:           40,
    borderRadius:     RADIUS.full,     // pill shape per UX spec
    paddingHorizontal: SPACING[3],    // 12
    borderWidth:      1.5,
    gap:              SPACING[2],
  },
  searchIcon: {
    fontSize: 14,
    width:    18,
  },
  placeholderPress: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  placeholder: {
    fontFamily: FONTS.jakartaRegular,
    fontSize:   14,
    color:      COLORS.ink400,
  },
  input: {
    flex:       1,
    fontFamily: FONTS.jakartaRegular,
    fontSize:   14,
    color:      COLORS.ink800,
    padding:    0,
    margin:     0,
  },
  clearBtn: {
    width:          24,
    height:         24,
    borderRadius:   RADIUS.full,
    backgroundColor: COLORS.ink200,
    alignItems:     'center',
    justifyContent: 'center',
  },
  clearIcon: {
    fontSize: 10,
    color:    COLORS.ink600,
  },
  cancelBtn: {
    paddingHorizontal: SPACING[1],
    height:            44,   // tap target
    justifyContent:    'center',
  },
  cancelLabel: {
    fontFamily: FONTS.jakartaMedium,
    fontSize:   14,
    color:      COLORS.brandPrimary,
  },
});
