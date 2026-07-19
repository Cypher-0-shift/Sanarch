/**
 * EditDocumentSheet — Phase 5
 *
 * Bottom sheet to edit document title and category.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import BottomSheet from '../navigation/BottomSheet';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';
import FormField from '../inputs/FormField';
import PrimaryButton from '../buttons/PrimaryButton';
import { CATEGORIES } from '../../components/upload/UploadStepConfirm';
// Wait, the prompt says "change the category". Let's use the known standard categories.

const STANDARD_CATEGORIES = [
  { id: 'lab_report', label: 'Lab Report' },
  { id: 'prescription', label: 'Prescription' },
  { id: 'scan', label: 'Scan / Imaging' },
  { id: 'hospital_summary', label: 'Discharge Summary' },
  { id: 'other', label: 'Other' },
];

interface EditDocumentSheetProps {
  visible: boolean;
  onClose: () => void;
  initialTitle: string;
  initialCategory: string;
  onSave: (title: string, category: string) => void;
  isSaving?: boolean;
}

export default function EditDocumentSheet({
  visible,
  onClose,
  initialTitle,
  initialCategory,
  onSave,
  isSaving = false,
}: EditDocumentSheetProps) {
  const [title, setTitle] = useState(initialTitle);
  const [category, setCategory] = useState(initialCategory);

  useEffect(() => {
    if (visible) {
      setTitle(initialTitle);
      setCategory(initialCategory);
    }
  }, [visible, initialTitle, initialCategory]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave(title.trim(), category);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Edit Document" variant="scrollable">
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.fieldWrapper}>
          <Text style={styles.label}>Document Title</Text>
          <FormField
            label="Document Title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Blood Test Results"
          />
        </View>

        <View style={styles.fieldWrapper}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {STANDARD_CATEGORIES.map((cat) => {
              const isActive = category === cat.id;
              return (
                <View 
                  key={cat.id} 
                  style={[styles.catPill, isActive && styles.catPillActive]}
                  onTouchEnd={() => !isSaving && setCategory(cat.id)}
                >
                  <Text style={[styles.catText, isActive && styles.catTextActive]}>
                    {cat.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            label="Save Changes"
            onPress={handleSave}
            variant={isSaving ? 'loading' : (!title.trim() ? 'disabled' : 'default')}
          />
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING[4],
    gap: SPACING[6],
  },
  fieldWrapper: {
    gap: SPACING[2],
  },
  label: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 14,
    color: COLORS.ink900,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[3],
  },
  catPill: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.ink100,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  catPillActive: {
    backgroundColor: COLORS.brandTint,
    borderColor: 'rgba(67,97,238,0.2)',
  },
  catText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 13,
    color: COLORS.ink600,
  },
  catTextActive: {
    color: COLORS.brandPrimary,
    fontFamily: FONTS.jakartaBold,
  },
  footer: {
    paddingTop: SPACING[4],
  },
});
