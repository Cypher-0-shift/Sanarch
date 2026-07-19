/**
 * MultiSelectToolbar — Phase 5
 *
 * Floating bottom toolbar that appears when multi-select mode is active.
 * Provides actions to Share or Delete the selected documents.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SPACING, ELEVATION_RN } from '../../constants/theme';

interface MultiSelectToolbarProps {
  selectedCount: number;
  onClear: () => void;
  onShare: () => void;
  onDelete: () => void;
}

export default function MultiSelectToolbar({
  selectedCount,
  onClear,
  onShare,
  onDelete,
}: MultiSelectToolbarProps) {
  const insets = useSafeAreaInsets();
  
  if (selectedCount === 0) return null;

  return (
    <Animated.View 
      entering={FadeInDown.springify().damping(24).stiffness(200)}
      exiting={FadeOutDown}
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, SPACING[4]) }]}
    >
      <View style={styles.toolbar}>
        {/* Left: Count & Clear */}
        <View style={styles.leftCol}>
          <Pressable onPress={onClear} style={styles.closeBtn} hitSlop={8}>
            <MaterialCommunityIcons name="close" size={20} color={COLORS.surface} />
          </Pressable>
          <Text style={styles.countText}>{selectedCount} selected</Text>
        </View>

        {/* Right: Actions */}
        <View style={styles.actionsRow}>
          <Pressable onPress={onShare} style={styles.actionBtn}>
            <MaterialCommunityIcons name="share-variant" size={20} color={COLORS.surface} />
            <Text style={styles.actionText}>Share</Text>
          </Pressable>
          
          <View style={styles.divider} />

          <Pressable onPress={onDelete} style={styles.actionBtn}>
            <MaterialCommunityIcons name="delete-outline" size={20} color={COLORS.resultHighBg} />
            <Text style={[styles.actionText, { color: COLORS.resultHighBg }]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[4],
    zIndex: 100,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.dark950,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    ...ELEVATION_RN[3],
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 14,
    color: COLORS.surface,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    paddingVertical: SPACING[1],
    paddingHorizontal: SPACING[2],
  },
  actionText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 13,
    color: COLORS.surface,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
