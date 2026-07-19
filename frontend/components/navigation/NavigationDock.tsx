/**
 * NavigationDock — Phase 4
 *
 * Floating dark pill navigation bar.
 * Replaces the legacy SVG wave tab bar.
 *
 * Specs from DESIGN.md §7:
 * - Background: rgba(13,17,23,.94) + blur(24) saturate(1.3)
 * - Shape: radius 30, height 64, float 24 from bottom, width = screen - 40
 * - Layout: Home | Records | [FAB] | Share | Profile
 * - Active State: Soft circular glow (rgba(67,97,238,.20), radius 12), icon shifts to brand-glow
 * - FAB: 52x52, offset -10 top. Opens Upload wizard directly.
 */

import React from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';

const TAB_ICONS: Record<string, string> = {
  home: 'home-variant-outline',
  records: 'folder-outline',
  doctors: 'share-variant-outline', // doctors route is the Share tab
  profile: 'account-outline',
};

const TAB_LABELS: Record<string, string> = {
  home: 'Home',
  records: 'Records',
  doctors: 'Share',
  profile: 'Profile',
};

// The FAB opens the Upload wizard directly
function CenterFAB({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.fabContainer} accessibilityLabel="Upload Document" hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
      <View style={styles.fabInner}>
        <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

function TabItem({
  routeName,
  isFocused,
  onPress,
}: {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
}) {
  const iconName = TAB_ICONS[routeName];
  
  // Animate the background glow opacity
  const glowStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isFocused ? 1 : 0, { duration: 200 }),
  }));

  // Icon color transitions cleanly
  const iconColor = isFocused ? COLORS.brandGlow : '#819685'; // inactive tint

  return (
    <Pressable 
      onPress={onPress} 
      style={styles.tabItem} 
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityLabel={TAB_LABELS[routeName]}
    >
      <View style={styles.iconWrapper}>
        <Animated.View style={[styles.activeGlow, glowStyle]} />
        <MaterialCommunityIcons name={iconName as any} size={24} color={iconColor} />
      </View>
    </Pressable>
  );
}

export default function NavigationDock({ state, descriptors, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Handle FAB press - opens Upload directly
  const handleFabPress = () => {
    router.push('/(tabs)/upload');
  };

  // We have 4 actual routes (upload is hidden from standard tabs via layout config)
  // We'll manually insert the FAB in the middle
  const routes = state.routes;
  const leftTabs = routes.slice(0, 2);
  const rightTabs = routes.slice(2, 4);

  return (
    <View style={[styles.dockContainer, { bottom: 24 + insets.bottom, width }]}>
      <View style={[styles.dockShape, { width: width - 40 }]}>
        <BlurView
          intensity={40}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.dockInner}>
          {leftTabs.map((route, index) => {
            const isFocused = state.index === state.routes.findIndex(r => r.key === route.key);
            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };
            return (
              <TabItem
                key={route.key}
                routeName={route.name}
                isFocused={isFocused}
                onPress={onPress}
              />
            );
          })}

          <CenterFAB onPress={handleFabPress} />

          {rightTabs.map((route, index) => {
            const isFocused = state.index === state.routes.findIndex(r => r.key === route.key);
            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };
            return (
              <TabItem
                key={route.key}
                routeName={route.name}
                isFocused={isFocused}
                onPress={onPress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dockContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    // Elevation for the dock itself
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  dockShape: {
    height: 64,
    borderRadius: 30, // all corners
    overflow: 'hidden',
    backgroundColor: 'rgba(13,17,23,0.85)', // close to rgba(13,17,23,.94) with blur
  },
  dockInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeGlow: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(67,97,238,0.20)', // brand-primary at 20%
  },
  fabContainer: {
    width: 52,
    height: 52,
    marginTop: -20, // offset -10 top from dock means it pushes up. The dock is 64h, centered is 32. We want it breaking the top edge.
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  fabInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    // brand gradient background
    backgroundColor: COLORS.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    // 2-layer shadow for brand elevation
    shadowColor: COLORS.brandPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
});
