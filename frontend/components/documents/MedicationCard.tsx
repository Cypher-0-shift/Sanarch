/**
 * MedicationCard — DESIGN.md Phase 3
 *
 * Displays medication details: name, dose, frequency, and duration.
 * Composition:
 *   Left: icon container with pill emoji
 *   Right: Name + Dose (top), Frequency + Duration (bottom)
 *
 * Uses a subtle border (no heavy shadow) to fit cleanly in lists.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

interface MedicationCardProps {
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  style?: object;
}

export default function MedicationCard({
  name,
  dose,
  frequency,
  duration,
  style,
}: MedicationCardProps) {
  return (
    <View style={[styles.card, style]} accessibilityRole="text">
      {/* Icon */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>💊</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.dose} numberOfLines={1}>
            {dose}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText} numberOfLines={1}>
            {frequency}
          </Text>
          <View style={styles.dot} />
          <Text style={styles.metaText} numberOfLines={1}>
            {duration}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[3],
    gap: SPACING[3],
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.ink200,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.icon,
    backgroundColor: COLORS.catRxBg, // #F5F3FF
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    color: COLORS.catRxPrimary, // #7C3AED
  },
  content: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: SPACING[2],
  },
  name: {
    flex: 1,
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 14,
    color: COLORS.ink900,
  },
  dose: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 13,
    color: COLORS.ink600,
    flexShrink: 0,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  metaText: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 12,
    color: COLORS.ink400,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.ink300,
  },
});
