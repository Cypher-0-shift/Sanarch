/**
 * FilterSortSheet — Phase 5
 *
 * Unified bottom sheet combining both Filter and Sort controls.
 * Shows active selections and allows applying them together.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet from '../navigation/BottomSheet';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';
import PrimaryButton from '../buttons/PrimaryButton';

export type SortOption = 'newest' | 'oldest' | 'hospital' | 'type';
export type FilterOption = 'all' | 'lab_report' | 'prescription' | 'scan' | 'hospital_summary' | 'other';

interface FilterSortSheetProps {
  visible: boolean;
  onClose: () => void;
  activeSort: SortOption;
  activeFilter: FilterOption;
  onApply: (sort: SortOption, filter: FilterOption) => void;
}

const SORT_OPTIONS: { id: SortOption; label: string; icon: any }[] = [
  { id: 'newest', label: 'Newest First', icon: 'sort-calendar-descending' },
  { id: 'oldest', label: 'Oldest First', icon: 'sort-calendar-ascending' },
  { id: 'hospital', label: 'By Hospital', icon: 'hospital-building' },
  { id: 'type', label: 'By Type', icon: 'file-document-outline' },
];

const FILTER_OPTIONS: { id: FilterOption; label: string }[] = [
  { id: 'all', label: 'All Documents' },
  { id: 'lab_report', label: 'Lab Reports' },
  { id: 'prescription', label: 'Prescriptions' },
  { id: 'scan', label: 'Scans' },
  { id: 'hospital_summary', label: 'Discharge Summaries' },
  { id: 'other', label: 'Other' },
];

export default function FilterSortSheet({
  visible,
  onClose,
  activeSort,
  activeFilter,
  onApply,
}: FilterSortSheetProps) {
  // Local state for pending selections before applying
  const [localSort, setLocalSort] = useState<SortOption>(activeSort);
  const [localFilter, setLocalFilter] = useState<FilterOption>(activeFilter);

  // Sync local state when opened
  useEffect(() => {
    if (visible) {
      setLocalSort(activeSort);
      setLocalFilter(activeFilter);
    }
  }, [visible, activeSort, activeFilter]);

  const handleApply = () => {
    onApply(localSort, localFilter);
    onClose();
  };

  const handleReset = () => {
    setLocalSort('newest');
    setLocalFilter('all');
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Filter & Sort" variant="scrollable">
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* ── Sort Section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sort By</Text>
          <View style={styles.optionsGrid}>
            {SORT_OPTIONS.map((opt) => {
              const isActive = localSort === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  style={[styles.optionCard, isActive && styles.optionCardActive]}
                  onPress={() => setLocalSort(opt.id)}
                >
                  <MaterialCommunityIcons 
                    name={opt.icon} 
                    size={20} 
                    color={isActive ? COLORS.brandPrimary : COLORS.ink600} 
                  />
                  <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Filter Section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filter By Category</Text>
          <View style={styles.chipRow}>
            {FILTER_OPTIONS.map((opt) => {
              const isActive = localFilter === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setLocalFilter(opt.id)}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <Pressable onPress={handleReset} style={styles.resetBtn}>
          <Text style={styles.resetText}>Reset</Text>
        </Pressable>
        <PrimaryButton 
          label="Apply" 
          onPress={handleApply} 
          fullWidth={false}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING[4],
    gap: SPACING[8],
  },
  section: {
    gap: SPACING[4],
  },
  sectionTitle: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 16,
    color: COLORS.ink900,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[3],
  },
  optionCard: {
    width: '48%', // roughly two columns
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    padding: SPACING[3],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.ink200,
  },
  optionCardActive: {
    backgroundColor: COLORS.brandTint,
    borderColor: COLORS.brandPrimary,
  },
  optionText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 13,
    color: COLORS.ink600,
  },
  optionTextActive: {
    color: COLORS.brandPrimary,
    fontFamily: FONTS.jakartaBold,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[2],
  },
  chip: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.ink100,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: COLORS.brandTint,
    borderColor: 'rgba(67,97,238,0.2)',
  },
  chipText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 13,
    color: COLORS.ink600,
  },
  chipTextActive: {
    color: COLORS.brandPrimary,
    fontFamily: FONTS.jakartaBold,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[4],
    paddingBottom: SPACING[8],
    borderTopWidth: 1,
    borderTopColor: COLORS.ink100,
    backgroundColor: COLORS.surface,
    gap: SPACING[4],
  },
  resetBtn: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
  },
  resetText: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 15,
    color: COLORS.ink400,
  },
  applyBtn: {
    flex: 1,
  },
});
