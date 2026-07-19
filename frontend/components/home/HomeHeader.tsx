/**
 * HomeHeader — Phase 4
 *
 * Sticky header for the Home screen.
 * Contains:
 * - Greeting & Profile Name (with switcher icon)
 * - "My ID" pill (opens Sanarch ID Modal)
 * - Notifications Bell (opens Notifications Sheet)
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { SPRING, DURATION } from '../../constants/motion';

interface HomeHeaderProps {
  profileFirstName: string;
  onOpenProfileSwitcher: () => void;
  onOpenSanarchID: () => void;
  onOpenNotifications: () => void;
  hasUnreadNotifications?: boolean;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function AnimatedPressable({ onPress, children, style, accessibilityLabel }: { onPress: () => void; children: React.ReactNode; style?: any; accessibilityLabel?: string }) {
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
    <Animated.View style={[animStyle, style]}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress} accessibilityLabel={accessibilityLabel} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

export default function HomeHeader({
  profileFirstName,
  onOpenProfileSwitcher,
  onOpenSanarchID,
  onOpenNotifications,
  hasUnreadNotifications = false,
}: HomeHeaderProps) {
  const insets = useSafeAreaInsets();
  const greeting = getGreeting();

  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* Left: Greeting & Switcher */}
      <View style={styles.leftCol}>
        <Text style={styles.greeting}>{greeting},</Text>
        <AnimatedPressable onPress={onOpenProfileSwitcher} accessibilityLabel="Switch Profile">
          <View style={styles.switcherRow}>
            <Text style={styles.name} numberOfLines={1}>{profileFirstName || 'User'}</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.ink600} />
          </View>
        </AnimatedPressable>
      </View>

      {/* Right: Actions */}
      <View style={styles.actionsRow}>
        {/* My ID Pill */}
        <AnimatedPressable onPress={onOpenSanarchID} accessibilityLabel="Open Sanarch ID">
          <View style={styles.idPill}>
            <MaterialCommunityIcons name="qrcode-scan" size={14} color={COLORS.brandPrimary} />
            <Text style={styles.idText}>My ID</Text>
          </View>
        </AnimatedPressable>

        {/* Notifications Bell */}
        <AnimatedPressable onPress={onOpenNotifications} style={styles.bellBtn} accessibilityLabel="Notifications">
          <MaterialCommunityIcons name="bell-outline" size={22} color={COLORS.ink800} />
          {hasUnreadNotifications && <View style={styles.unreadDot} />}
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[2],
    backgroundColor: COLORS.surface, // Solid background so it can be sticky
    zIndex: 100,
  },
  leftCol: {
    flex: 1,
  },
  greeting: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 13,
    color: COLORS.ink400,
    marginBottom: 2,
  },
  switcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  name: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 22,
    color: COLORS.ink900,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
  },
  idPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.brandTint,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(67,97,238,0.15)',
  },
  idText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 13,
    color: COLORS.brandPrimary,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.ink100,
  },
  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.resultHigh,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
});
