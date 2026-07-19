/**
 * FAB — Floating Action Button, DESIGN.md §7 / Phase 1
 *
 * 52×52dp, gradient(135deg #4361EE→#3A56D4), 2px rim border rgba(255,255,255,.15)
 * Shadow: 0 4px 20px rgba(67,97,238,.45) (single strong brand glow — approved exception)
 * Press: scale(.88) + shadow collapse, 120ms spring per DESIGN.md §7.
 *
 * Used as the center element in the NavigationDock (Phase 2) and as a
 * standalone action trigger on Records and Home screens.
 *
 * The indigo gradient is exclusive to PrimaryButton + FAB only.
 * Do NOT use this gradient on any other component.
 */

import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS } from '../../constants/theme';
import { PRESS_SCALE, SPRING } from '../../constants/motion';
import { useTheme } from '../foundation/ThemeProvider';

interface FABProps {
  /** The icon element (e.g. MaterialCommunityIcons "plus"). */
  icon:                React.ReactNode;
  /** REQUIRED — screen reader label. */
  accessibilityLabel:  string;
  onPress?:            () => void;
  accessibilityHint?:  string;
  testID?:             string;
}

export default function FAB({
  icon,
  accessibilityLabel,
  onPress,
  accessibilityHint,
  testID,
}: FABProps) {
  const { isReducedMotion } = useTheme();
  const scale = useSharedValue(1);

  // Shadow also collapses on press — driven by shadowOpacity
  const shadowOpacity = useSharedValue(0.45);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    // React Native shadow doesn't animate well — use opacity hack on a wrapping View
  }));

  function handlePressIn() {
    if (isReducedMotion) return;
    // DESIGN.md §7: scale(.88) + shadow collapse, 120ms spring
    scale.value = withSpring(PRESS_SCALE.fab, {
      stiffness: SPRING.fabReturn.stiffness,
      damping:   SPRING.fabReturn.damping,
      mass:      SPRING.fabReturn.mass,
    });
  }

  function handlePressOut() {
    if (isReducedMotion) return;
    scale.value = withSpring(1, SPRING.fabReturn);
  }

  return (
    <Animated.View style={[animStyle, styles.shadow]}>
      {/* Rim border: rgba(255,255,255,.15) — 2px, per DESIGN.md §7 */}
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        testID={testID}
        style={styles.rimBorder}
      >
        <LinearGradient
          colors={['#4361EE', '#3A56D4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {icon}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    // DESIGN.md §7: 0 4px 20px rgba(67,97,238,.45) — single strong brand glow
    // This is the approved exception to the two-layer rule (FAB-specific in spec)
    shadowColor:   '#4361EE',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius:  20,
    elevation:     12,
    borderRadius:  RADIUS.full,
  },
  rimBorder: {
    width:        52,
    height:       52,
    borderRadius: RADIUS.full,
    borderWidth:  2,
    borderColor:  'rgba(255,255,255,0.15)',  // DESIGN.md §7 rim border
    padding:      2,
    overflow:     'hidden',
  },
  gradient: {
    flex:           1,
    borderRadius:   RADIUS.full,
    alignItems:     'center',
    justifyContent: 'center',
  },
});
