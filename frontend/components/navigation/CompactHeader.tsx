/**
 * CompactHeader — DESIGN.md Phase 1
 *
 * 56dp height. Variants: with-back / with-actions / title-only.
 * Bottom border: rgba(17,24,39,.05) — subtle, not a divider.
 * Elevation: gains elevation-2 ONLY after scroll (not at rest).
 *
 * Scroll-driven shadow: consumer passes `scrollY` (Reanimated shared value).
 * Shadow fades in as scrollY goes 0→20dp.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, ELEVATION_RN, FONTS, SPACING, RADIUS } from '../../constants/theme';

type HeaderVariant = 'title-only' | 'with-back' | 'with-actions';

interface CompactHeaderProps {
  variant?:     HeaderVariant;
  title?:       string;
  /** Reanimated shared value from parent ScrollView — drives shadow elevation */
  scrollY?:     SharedValue<number>;
  onBack?:      () => void;
  /** Slot for 1–3 icon actions on the right */
  actions?:     React.ReactNode;
  /** Background color override (default: surface #FFF) */
  backgroundColor?: string;
  testID?:      string;
}

export default function CompactHeader({
  variant    = 'title-only',
  title,
  scrollY,
  onBack,
  actions,
  backgroundColor = COLORS.surface,
  testID,
}: CompactHeaderProps) {
  const insets = useSafeAreaInsets();

  // Shadow interpolates from 0 → elevation-2 as scrollY goes 0 → 20
  const shadowStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};
    const progress = interpolate(scrollY.value, [0, 20], [0, 1], 'clamp');
    return {
      shadowColor:   ELEVATION_RN[2].shadowColor,
      shadowOffset:  ELEVATION_RN[2].shadowOffset,
      shadowOpacity: ELEVATION_RN[2].shadowOpacity * progress,
      shadowRadius:  ELEVATION_RN[2].shadowRadius * progress,
      elevation:     ELEVATION_RN[2].elevation * progress,
    };
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor, paddingTop: insets.top },
        shadowStyle,
      ]}
      testID={testID}
    >
      <View style={styles.inner}>
        {/* Left: back button or spacer */}
        <View style={styles.side}>
          {variant === 'with-back' && onBack ? (
            <Pressable
              onPress={onBack}
              hitSlop={8}
              style={styles.backBtn}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={styles.backIcon}>←</Text>
            </Pressable>
          ) : (
            <View style={styles.backBtnPlaceholder} />
          )}
        </View>

        {/* Centre: title */}
        <View style={styles.titleWrap}>
          {title ? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
        </View>

        {/* Right: actions or spacer */}
        <View style={[styles.side, styles.actionsWrap]}>
          {variant === 'with-actions' && actions
            ? actions
            : <View style={styles.backBtnPlaceholder} />
          }
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(17,24,39,0.05)',
    zIndex:            50,
  },
  inner: {
    height:           56,
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal: SPACING[4],  // 16
  },
  side: {
    width: 44,
    alignItems: 'flex-start',
  },
  actionsWrap: {
    alignItems:    'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap:           SPACING[1],
    width:         'auto',
    flex:          0,
    minWidth:      44,
  },
  titleWrap: {
    flex:        1,
    alignItems:  'center',
    paddingHorizontal: SPACING[2],
  },
  title: {
    fontFamily:    FONTS.jakartaBold,
    fontSize:      16,
    lineHeight:    24,
    color:         COLORS.ink800,
    letterSpacing: 0,
  },
  backBtn: {
    width:           44,
    height:          44,
    alignItems:      'center',
    justifyContent:  'center',
    borderRadius:    RADIUS.md,
  },
  backBtnPlaceholder: {
    width:  44,
    height: 44,
  },
  backIcon: {
    fontSize:   20,
    color:      COLORS.ink800,
    fontFamily: FONTS.jakartaMedium,
  },
});
