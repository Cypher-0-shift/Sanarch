/**
 * Tabs Layout — Phase 4
 *
 * Uses the new NavigationDock floating pill component instead of the legacy SVG wave.
 * Hides the `upload` route from the standard tabs (accessed via FAB).
 */

import React from 'react';
import { Tabs } from 'expo-router';
import NavigationDock from '../../components/navigation/NavigationDock';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

export default function TabsLayout() {
  return (
    <View style={styles.container}>
      <Tabs
        tabBar={(props) => <NavigationDock {...props} />}
        screenOptions={{
          headerShown: false,
          // Hide standard tab bar background to let NavigationDock float
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{ title: 'Home' }}
        />
        <Tabs.Screen
          name="records"
          options={{ title: 'Records' }}
        />
        <Tabs.Screen
          name="upload"
          options={{
            title: 'Upload',
            // Hide from the NavigationDock routes list via options if needed,
            // but NavigationDock.tsx explicitly filters using TAB_ICONS mapping.
          }}
        />
        <Tabs.Screen
          name="doctors"
          options={{ title: 'Share' }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: 'Profile' }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
});
