/**
 * ExplainThisFAB — Phase 5
 *
 * Fixed bottom-right FAB on the Record Detail screen.
 * Triggers the AISummaryModal.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { COLORS, FONTS, RADIUS, SPACING, ELEVATION_RN } from '../../constants/theme';
import { SPRING, DURATION } from '../../constants/motion';

interface ExplainThisFABProps {
  onPress: () => void;
}

export default function ExplainThisFAB({ onPress }: ExplainThisFABProps) {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: DURATION.micro });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING.buttonReturn);
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.container, { bottom: Math.max(insets.bottom + 16, 24) }]}>
      <Animated.View style={animStyle}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          style={styles.fab}
        >
          <View style={styles.iconBox}>
            <MaterialCommunityIcons name="auto-fix" size={20} color={COLORS.surface} />
          </View>
          <Text style={styles.text}>Explain this</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 24,
    zIndex: 100,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brandPrimary, // Indigo
    borderRadius: RADIUS.full,
    paddingLeft: SPACING[2],
    paddingRight: SPACING[4],
    paddingVertical: SPACING[2],
    gap: SPACING[2],
    // 2-layer shadow
    shadowColor: COLORS.brandPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 14,
    color: COLORS.surface,
  },
});
