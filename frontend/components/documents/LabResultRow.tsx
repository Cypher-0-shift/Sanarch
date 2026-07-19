/**
 * LabResultRow — DESIGN.md Phase 3
 *
 * A single row in a lab results table.
 * Composition: name | value + unit | LabFlagBadge
 *
 * Layout rules:
 *   - Name takes remaining flex space (always shows)
 *   - Value + unit are right-aligned in JetBrains Mono (data values = mono per DESIGN.md §3)
 *   - LabFlagBadge is optionally shown — absent for tests with no reference range
 *   - Reference range is shown as subtle subscript below value (optional)
 *   - Separator line between rows: 1px, ink100 (#F3F4F6)
 *
 * Used in: Record Detail lab section, AI extraction preview
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';
import LabFlagBadge, { type LabFlag } from './LabFlagBadge';

interface LabResultRowProps {
  name:       string;
  value:      string | number;
  unit?:      string;
  flag?:      LabFlag;
  /** e.g. "70–100 mg/dL" */
  refRange?:  string;
  /** Show bottom separator (omit on last row) */
  separator?: boolean;
  style?:     object;
}

export default function LabResultRow({
  name,
  value,
  unit,
  flag,
  refRange,
  separator = true,
  style,
}: LabResultRowProps) {
  return (
    <View
      style={[
        styles.row,
        separator && styles.rowSeparator,
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${name}: ${value}${unit ? ' ' + unit : ''}${flag ? ', ' + flag : ''}`}
    >
      {/* Left: name */}
      <View style={styles.nameCol}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
      </View>

      {/* Right: value + unit + flag */}
      <View style={styles.valueCol}>
        <View style={styles.valueRow}>
          <Text style={[styles.value, flag === 'high' || flag === 'critical' ? styles.valueHigh : flag === 'low' ? styles.valueLow : undefined]}>
            {String(value)}
          </Text>
          {unit ? (
            <Text style={styles.unit}>{unit}</Text>
          ) : null}
        </View>

        {refRange ? (
          <Text style={styles.refRange}>{refRange}</Text>
        ) : null}

        {flag && flag !== 'normal' ? (
          <LabFlagBadge flag={flag} style={styles.flag} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    paddingVertical: SPACING[3],   // 12
    gap:             SPACING[3],
  },
  rowSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ink100,  // #F3F4F6 — very subtle
  },

  // Name column
  nameCol: {
    flex:    1,
    flexShrink: 1,
  },
  name: {
    fontFamily: FONTS.jakartaRegular,
    fontSize:   13,
    lineHeight: 20,
    color:      COLORS.ink800,
  },

  // Value column
  valueCol: {
    alignItems:  'flex-end',
    gap:         3,
    flexShrink:  0,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           3,
  },
  value: {
    fontFamily: FONTS.monoMedium,   // JetBrains Mono — data values per DESIGN.md §3
    fontSize:   14,
    lineHeight: 20,
    color:      COLORS.ink800,
  },
  valueHigh: {
    color: COLORS.resultHigh,
  },
  valueLow: {
    color: COLORS.resultLow,
  },
  unit: {
    fontFamily: FONTS.jakartaRegular,
    fontSize:   11,
    color:      COLORS.ink400,
    lineHeight: 20,
  },
  refRange: {
    fontFamily: FONTS.jakartaRegular,
    fontSize:   10,
    color:      COLORS.ink300,
  },
  flag: {
    marginTop: 2,
  },
});
