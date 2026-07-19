/**
 * HealthSummaryCard — Phase 4
 *
 * Shows the user's document count and last activity.
 * Displayed on Home for returning users only (hidden if 0 docs).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING, ELEVATION_RN } from '../../constants/theme';

interface HealthSummaryCardProps {
  documentCount: number;
  lastActivityDate?: string | null;
  style?: object;
}

export default function HealthSummaryCard({
  documentCount,
  lastActivityDate,
  style,
}: HealthSummaryCardProps) {
  return (
    <View style={[styles.card, style]}>
      {/* Icon Graphic */}
      <View style={styles.graphicContainer}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="folder-text-outline" size={24} color={COLORS.brandPrimary} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Health Records</Text>
        <View style={styles.statsRow}>
          <Text style={styles.countText}>
            {documentCount} {documentCount === 1 ? 'Document' : 'Documents'}
          </Text>
          {lastActivityDate ? (
            <>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.dateText}>Active {lastActivityDate}</Text>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING[4],
    borderRadius: RADIUS['2xl'],
    gap: SPACING[4],
    ...ELEVATION_RN[1], // clean, subtle card shadow
  },
  graphicContainer: {
    // Keep it tight
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 16,
    color: COLORS.ink900,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  countText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 13,
    color: COLORS.brandPrimary, // Highlighting the count
  },
  dot: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 10,
    color: COLORS.ink300,
  },
  dateText: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 12,
    color: COLORS.ink400,
  },
});
