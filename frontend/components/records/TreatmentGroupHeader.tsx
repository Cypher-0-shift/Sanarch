/**
 * TreatmentGroupHeader — Phase 5
 *
 * Section header for the "By Treatment" grouped view.
 * Displays hospital name, date range, and related DiagnosisPills.
 * Handles edge cases gracefully (missing hospital, missing diagnoses).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';
import DiagnosisPill from '../documents/DiagnosisPill';

export interface TreatmentGroupData {
  id: string;
  hospital: string | null;
  startDate: string;
  endDate: string | null;
  diagnoses: string[];
}

interface TreatmentGroupHeaderProps {
  group: TreatmentGroupData;
  style?: object;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function TreatmentGroupHeader({ group, style }: TreatmentGroupHeaderProps) {
  const start = formatDate(group.startDate);
  const end = group.endDate ? formatDate(group.endDate) : null;
  const dateRange = end && end !== start ? `${start} – ${end}` : start;

  return (
    <View style={[styles.container, style]}>
      {/* Top Row: Hospital & Date */}
      <View style={styles.headerRow}>
        <View style={styles.hospitalRow}>
          <View style={styles.iconBox}>
            <MaterialCommunityIcons name="hospital-building" size={18} color={COLORS.brandPrimary} />
          </View>
          <Text style={styles.hospitalText} numberOfLines={1}>
            {group.hospital || 'Medical Event'}
          </Text>
        </View>
        <Text style={styles.dateText}>{dateRange}</Text>
      </View>

      {/* Bottom Row: Diagnoses (if any) */}
      {group.diagnoses && group.diagnoses.length > 0 && (
        <View style={styles.pillRow}>
          {group.diagnoses.map((diag, idx) => (
            <DiagnosisPill key={`${diag}-${idx}`} label={diag} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING[4],
    backgroundColor: COLORS.canvas, // Matches screen background
    gap: SPACING[3],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING[4],
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING[2],
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.icon,
    backgroundColor: COLORS.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hospitalText: {
    flex: 1,
    fontFamily: FONTS.jakartaBold,
    fontSize: 16,
    color: COLORS.ink900,
  },
  dateText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 13,
    color: COLORS.ink400,
    flexShrink: 0,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[2],
    paddingLeft: 40, // align with text, passing the icon box
  },
});
