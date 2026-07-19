/**
 * CategoryBadge — DESIGN.md §2 / Phase 3
 *
 * 5 variants matching DESIGN.md document-category color tokens exactly.
 * Used in DocumentCard, Record Detail header, filter chips, and timeline.
 *
 * Color pairs — DESIGN.md §2:
 *   lab_report        #4361EE / bg #EEF2FF
 *   prescription      #7C3AED / bg #F5F3FF
 *   imaging_scan      #0891B2 / bg #ECFEFF
 *   discharge_summary #0D9488 / bg #F0FDFA
 *   other             #6B7280 / bg #F9FAFB
 *
 * Sizes: sm (label only) | md (default, icon + label) | lg (icon + label, larger)
 * The icon container uses radius 10 (rounded square, NEVER circle — DESIGN.md §5).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

// ─────────────────────────────────────────────
// Category config — verbatim from DESIGN.md §2
// ─────────────────────────────────────────────

export type DocumentCategory =
  | 'lab_report'
  | 'prescription'
  | 'imaging_scan'
  | 'discharge_summary'
  | 'other';

export interface CategoryConfig {
  label:    string;
  color:    string;   // foreground — icon + text
  bg:       string;   // background chip fill
  icon:     string;   // emoji / symbol for the icon slot
}

export const CATEGORY_CONFIG: Record<DocumentCategory, CategoryConfig> = {
  lab_report: {
    label: 'Lab Report',
    color: COLORS.catLabPrimary,          // #4361EE
    bg:    COLORS.catLabBg,               // #EEF2FF
    icon:  '🔬',
  },
  prescription: {
    label: 'Prescription',
    color: COLORS.catRxPrimary,           // #7C3AED
    bg:    COLORS.catRxBg,               // #F5F3FF
    icon:  '💊',
  },
  imaging_scan: {
    label: 'Imaging / Scan',
    color: COLORS.catScanPrimary,         // #0891B2
    bg:    COLORS.catScanBg,             // #ECFEFF
    icon:  '🩻',
  },
  discharge_summary: {
    label: 'Discharge Summary',
    color: COLORS.catDischargePrimary,    // #0D9488
    bg:    COLORS.catDischargeBg,        // #F0FDFA
    icon:  '🏥',
  },
  other: {
    label: 'Other',
    color: COLORS.catOtherPrimary,       // #6B7280
    bg:    COLORS.catOtherBg,           // #F9FAFB
    icon:  '📄',
  },
};

// Normalises raw API labels to our DocumentCategory union
export function normaliseCategory(raw: string | undefined | null): DocumentCategory {
  const map: Record<string, DocumentCategory> = {
    lab_report:        'lab_report',
    lab:               'lab_report',
    prescription:      'prescription',
    rx:                'prescription',
    imaging_scan:      'imaging_scan',
    scan:              'imaging_scan',
    imaging:           'imaging_scan',
    discharge_summary: 'discharge_summary',
    discharge:         'discharge_summary',
    hospital_summary:  'discharge_summary',
    other:             'other',
  };
  return map[raw?.toLowerCase() ?? ''] ?? 'other';
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

type BadgeSize = 'sm' | 'md' | 'lg';

interface CategoryBadgeProps {
  category:  DocumentCategory | string;
  size?:     BadgeSize;
  /** Override the label text (e.g. for multi-word truncation) */
  labelOverride?: string;
  style?:    object;
}

export default function CategoryBadge({
  category,
  size     = 'md',
  labelOverride,
  style,
}: CategoryBadgeProps) {
  const cat    = normaliseCategory(category);
  const config = CATEGORY_CONFIG[cat];
  const isSm   = size === 'sm';
  const isLg   = size === 'lg';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg },
        isSm && styles.badgeSm,
        isLg && styles.badgeLg,
        style,
      ]}
      accessibilityLabel={`Category: ${config.label}`}
    >
      {/* Icon — hidden in sm size to keep chips compact */}
      {!isSm && (
        <Text style={[styles.icon, isLg && styles.iconLg]} accessibilityElementsHidden>
          {config.icon}
        </Text>
      )}
      <Text
        style={[
          styles.label,
          { color: config.color },
          isSm && styles.labelSm,
          isLg && styles.labelLg,
        ]}
        numberOfLines={1}
      >
        {labelOverride ?? config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection:    'row',
    alignItems:       'center',
    alignSelf:        'flex-start',
    gap:              4,
    paddingHorizontal: SPACING[2],   // 8
    paddingVertical:   3,
    borderRadius:     RADIUS.lg,     // 14 — matches chip radius
  },
  badgeSm: {
    paddingHorizontal: SPACING[2],
    paddingVertical:   2,
    borderRadius:      RADIUS.md,   // 10
  },
  badgeLg: {
    paddingHorizontal: SPACING[3],  // 12
    paddingVertical:   SPACING[1],  // 4
    gap:               6,
  },
  icon: {
    fontSize: 11,
    lineHeight: 16,
  },
  iconLg: {
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontFamily:    FONTS.jakartaSemiBold,
    fontSize:      11,
    lineHeight:    16,
    // No uppercase — category names are title-case, not all-caps
  },
  labelSm: {
    fontSize:  10,
    lineHeight: 14,
  },
  labelLg: {
    fontSize:   13,
    lineHeight: 18,
  },
});
