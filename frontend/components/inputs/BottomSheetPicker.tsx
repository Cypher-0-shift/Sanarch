/**
 * BottomSheetPicker — DESIGN.md Phase 1
 *
 * Generic searchable / non-searchable option list built on BottomSheet.
 * Used by: DocumentCategoryPicker, PatientSelector, SortFilter, etc.
 *
 * Features:
 *  - Optional SearchBar at top (when searchable=true)
 *  - Single or multi-select modes
 *  - Selected item shows checkmark + brand-tint bg
 *  - Empty state when search yields no results
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
} from 'react-native';
import { COLORS, RADIUS, SPACING, FONTS, ELEVATION_RN } from '../../constants/theme';
import { useTheme } from '../foundation/ThemeProvider';
import BottomSheet from '../navigation/BottomSheet';
import SearchBar from '../inputs/SearchBar';

export interface PickerOption {
  value:    string;
  label:    string;
  subtitle?: string;
  /** Optional left element (icon, avatar, category dot) */
  leftElement?: React.ReactNode;
}

interface BottomSheetPickerProps {
  visible:         boolean;
  onClose:         () => void;
  title:           string;
  options:         PickerOption[];
  selectedValues:  string[];
  onSelect:        (values: string[]) => void;
  searchable?:     boolean;
  multiSelect?:    boolean;
  /** Label for the confirm button (multiSelect only) */
  confirmLabel?:   string;
  testID?:         string;
}

export default function BottomSheetPicker({
  visible,
  onClose,
  title,
  options,
  selectedValues,
  onSelect,
  searchable   = false,
  multiSelect  = false,
  confirmLabel = 'Apply',
  testID,
}: BottomSheetPickerProps) {
  const [query, setQuery]             = useState('');
  const [localSelected, setLocal]     = useState<string[]>(selectedValues);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter(o =>
      o.label.toLowerCase().includes(q) ||
      o.subtitle?.toLowerCase().includes(q),
    );
  }, [query, options]);

  function handleSelect(value: string) {
    if (multiSelect) {
      const next = localSelected.includes(value)
        ? localSelected.filter(v => v !== value)
        : [...localSelected, value];
      setLocal(next);
    } else {
      onSelect([value]);
      onClose();
    }
  }

  function handleConfirm() {
    onSelect(localSelected);
    onClose();
  }

  const renderItem = ({ item }: { item: PickerOption }) => {
    const isSelected = (multiSelect ? localSelected : selectedValues).includes(item.value);

    return (
      <Pressable
        onPress={() => handleSelect(item.value)}
        style={[styles.option, isSelected && styles.optionSelected]}
        accessibilityRole="menuitem"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: isSelected }}
      >
        {item.leftElement && (
          <View style={styles.optionLeft}>{item.leftElement}</View>
        )}
        <View style={styles.optionText}>
          <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
            {item.label}
          </Text>
          {item.subtitle && (
            <Text style={styles.optionSub}>{item.subtitle}</Text>
          )}
        </View>
        {isSelected && (
          <View style={styles.check}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      variant="scrollable"
      title={title}
      testID={testID}
    >
      {searchable && (
        <View style={styles.searchWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search options…"
            defaultExpanded
          />
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={item => item.value}
        renderItem={renderItem}
        scrollEnabled={false}     // BottomSheet's ScrollView handles scroll
        style={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No results for "{query}"</Text>
        }
      />

      {multiSelect && (
        <Pressable
          onPress={handleConfirm}
          style={styles.confirmBtn}
          accessibilityRole="button"
          accessibilityLabel={confirmLabel}
        >
          <Text style={styles.confirmLabel}>{confirmLabel}</Text>
        </Pressable>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    marginBottom: SPACING[3],
  },
  list: {
    marginHorizontal: -SPACING[5], // bleed to sheet edges
  },
  option: {
    flexDirection:    'row',
    alignItems:       'center',
    height:           52,
    paddingHorizontal: SPACING[5],
    gap:              SPACING[3],
    borderRadius:     0,
  },
  optionSelected: {
    backgroundColor: COLORS.brandTint,  // #EEF2FF
  },
  optionLeft: {
    width:  32,
    height: 32,
    alignItems:     'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    gap:  2,
  },
  optionLabel: {
    fontFamily: FONTS.jakartaMedium,
    fontSize:   14,
    color:      COLORS.ink800,
  },
  optionLabelSelected: {
    fontFamily: FONTS.jakartaSemiBold,
    color:      COLORS.brandPrimary,
  },
  optionSub: {
    fontFamily: FONTS.jakartaRegular,
    fontSize:   11,
    color:      COLORS.ink400,
  },
  check: {
    width:           22,
    height:          22,
    borderRadius:    RADIUS.full,
    backgroundColor: COLORS.brandPrimary,
    alignItems:      'center',
    justifyContent:  'center',
  },
  checkMark: {
    fontSize: 11,
    color:    COLORS.surface,
    fontFamily: FONTS.jakartaBold,
  },
  empty: {
    fontFamily:  FONTS.jakartaRegular,
    fontSize:    13,
    color:       COLORS.ink400,
    textAlign:   'center',
    paddingVertical: SPACING[6],
  },
  confirmBtn: {
    height:          48,
    borderRadius:    RADIUS.lg,
    backgroundColor: COLORS.brandPrimary,
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       SPACING[4],
    ...ELEVATION_RN.brand,
  },
  confirmLabel: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize:   15,
    color:      COLORS.surface,
  },
});
