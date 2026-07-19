/**
 * BackdropOverlay — DESIGN.md Phase 1
 *
 * Dark dimmed backdrop behind bottom sheets, modals, and dialogs.
 * Fades in/out independently at 250ms per DESIGN.md §9.
 *
 * Tapping the backdrop triggers onDismiss.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { DURATION, safeDuration } from '../../constants/motion';
import { useTheme } from '../foundation/ThemeProvider';

interface BackdropOverlayProps {
  visible:             boolean;
  onDismiss:           () => void;
  /** Override opacity at peak visibility. Default: 0.5 */
  maxOpacity?:         number;
  testID?:             string;
}

export default function BackdropOverlay({
  visible,
  onDismiss,
  maxOpacity = 0.5,
  testID,
}: BackdropOverlayProps) {
  const { isReducedMotion } = useTheme();
  const opacity  = useSharedValue(0);
  const isVisible = useSharedValue(false);

  const animStyle = useAnimatedStyle(() => ({
    opacity:  opacity.value,
    display:  isVisible.value ? 'flex' : 'none',
  }));

  useEffect(() => {
    if (visible) {
      isVisible.value = true;
      opacity.value = withTiming(maxOpacity, {
        duration: safeDuration(250, isReducedMotion),
      });
    } else {
      opacity.value = withTiming(0, {
        duration: safeDuration(250, isReducedMotion),
      }, (finished) => {
        if (finished) runOnJS(() => { isVisible.value = false; })();
      });
    }
  }, [visible, isReducedMotion, maxOpacity]);

  return (
    <Animated.View style={[styles.backdrop, animStyle]}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Close"
        testID={testID}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0D1117',   // dark-950 — authoritative, not generic black
    zIndex:          100,
  },
});
