/**
 * ViewToggle — Phase 5
 *
 * Prominent segmented control at the top of the Records list.
 * Switches between "By Treatment" (default) and "All Documents".
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';
import { SPRING } from '../../constants/motion';

export type ViewMode = 'grouped' | 'flat';

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export default function ViewToggle({ mode, onChange }: ViewToggleProps) {
  // 0 = grouped (left), 1 = flat (right)
  const pos = useSharedValue(mode === 'grouped' ? 0 : 1);

  useEffect(() => {
    pos.value = withSpring(mode === 'grouped' ? 0 : 1, SPRING.buttonReturn);
  }, [mode]);

  const sliderStyle = useAnimatedStyle(() => {
    return {
      left: `${pos.value * 50}%`,
    };
  });

  const getTextStyle = (isActive: boolean) => ({
    color: isActive ? COLORS.brandPrimary : COLORS.ink400,
    fontFamily: isActive ? FONTS.jakartaBold : FONTS.jakartaMedium,
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.slider, sliderStyle]} />
      
      <Pressable
        style={styles.btn}
        onPress={() => onChange('grouped')}
        accessibilityRole="button"
      >
        <Text style={[styles.text, getTextStyle(mode === 'grouped')]}>By Treatment</Text>
      </Pressable>

      <Pressable
        style={styles.btn}
        onPress={() => onChange('flat')}
        accessibilityRole="button"
      >
        <Text style={[styles.text, getTextStyle(mode === 'flat')]}>All Documents</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 44,
    backgroundColor: COLORS.ink100,
    borderRadius: RADIUS.full,
    padding: 4,
    position: 'relative',
  },
  slider: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: '50%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    // subtle shadow for the slider
    shadowColor: COLORS.ink900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1, // keep text above the slider
  },
  text: {
    fontSize: 14,
  },
});
