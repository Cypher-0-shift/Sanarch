/**
 * FirstTimeEmptyState — Phase 4
 *
 * Shown on the Home screen when a user has 0 documents.
 * Replaces the entire stats+timeline area.
 *
 * Per DESIGN.md and spec constraints:
 * - Do NOT render "Documents: 0" or stats.
 * - Do NOT render a secondary "Upload Now" button (the FAB is the ONLY entry point).
 * - Instead, provide a clear visual cue directing the user to the FAB below.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

export default function FirstTimeEmptyState({ style }: { style?: object }) {
  return (
    <View style={[styles.container, style]} accessibilityRole="text">
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name="text-box-plus-outline" size={32} color={COLORS.brandPrimary} />
      </View>
      
      <Text style={styles.title}>Welcome to Sanarch</Text>
      
      <Text style={styles.subtitle}>
        Your complete medical history in one secure place.
      </Text>

      {/* Visual cue pointing to the FAB */}
      <View style={styles.cueContainer}>
        <Text style={styles.cueText}>
          Tap the <Text style={styles.plusIcon}>+</Text> button below to add your first document
        </Text>
        <MaterialCommunityIcons 
          name="arrow-down" 
          size={20} 
          color={COLORS.ink300} 
          style={styles.arrow} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.brandTint, // #EEF2FF
    borderRadius: RADIUS['2xl'],
    padding: SPACING[6],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(67,97,238,0.1)',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[4],
    // Subtle shadow for the icon circle
    shadowColor: COLORS.brandPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 20,
    color: COLORS.ink900,
    textAlign: 'center',
    marginBottom: SPACING[2],
  },
  subtitle: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 14,
    color: COLORS.ink600,
    textAlign: 'center',
    marginBottom: SPACING[8],
    lineHeight: 22,
    paddingHorizontal: SPACING[4],
  },
  cueContainer: {
    alignItems: 'center',
    gap: SPACING[2],
  },
  cueText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 13,
    color: COLORS.ink400,
    textAlign: 'center',
  },
  plusIcon: {
    fontFamily: FONTS.jakartaBold,
    color: COLORS.brandPrimary,
  },
  arrow: {
    marginTop: SPACING[1],
  },
});
