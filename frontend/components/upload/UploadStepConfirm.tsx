import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';
import FormField from '../inputs/FormField';
import PrimaryButton from '../buttons/PrimaryButton';
import { useDocumentsStore } from '../../store/documentsStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CATEGORIES = [
  { id: 'lab_report',       name: 'Lab Report',        icon: 'test-tube', color: '', bg: '' },
  { id: 'prescription',     name: 'Prescription',      icon: 'pill', color: '', bg: '' },
  { id: 'scan',             name: 'Imaging / Scan',    icon: 'radiology-box', color: '', bg: '' },
  { id: 'hospital_summary', name: 'Discharge Summary', icon: 'hospital-building', color: '', bg: '' },
  { id: 'other',            name: 'Other',             icon: 'file-outline', color: '', bg: '' },
];

const LAST_CATEGORY_KEY = '@sanarch_last_upload_category';

interface UploadStepConfirmProps {
  onConfirm: (category: string, title: string, notes: string) => void;
  onBack: () => void;
  suggestedTitle?: string;
  isRetrying?: boolean;
}

export default function UploadStepConfirm({ onConfirm, onBack, suggestedTitle = '', isRetrying = false }: UploadStepConfirmProps) {
  const [category, setCategory] = useState<string>('other');
  const [title, setTitle] = useState(suggestedTitle);
  const [notes, setNotes] = useState('');
  
  useEffect(() => {
    // Load last used category on mount
    const loadLastCategory = async () => {
      try {
        const last = await AsyncStorage.getItem(LAST_CATEGORY_KEY);
        if (last && CATEGORIES.some(c => c.id === last)) {
          setCategory(last);
        }
      } catch (e) {
        // ignore
      }
    };
    loadLastCategory();
  }, []);

  const handleConfirm = async () => {
    try {
      await AsyncStorage.setItem(LAST_CATEGORY_KEY, category);
    } catch (e) {
      // ignore
    }
    onConfirm(category, title, notes);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.ink900} />
          </Pressable>
          <Text style={styles.headerTitle}>Details</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Document Type</Text>
          <View style={styles.grid}>
            {CATEGORIES.map((cat) => {
              const isActive = category === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  style={[styles.pillCard, isActive && styles.pillCardActive]}
                  onPress={() => setCategory(cat.id)}
                >
                  <MaterialCommunityIcons 
                    name={cat.icon as any} 
                    size={20} 
                    color={isActive ? COLORS.brandPrimary : COLORS.ink600} 
                  />
                  <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Document Details</Text>
          
          <FormField
            label="Document Title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Blood Test Results"
          />

          <View style={{ marginTop: SPACING[4] }}>
            <FormField
              label="Notes (Optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any additional context..."
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={isRetrying ? "Retry Upload" : "Analyze Document"}
          onPress={handleConfirm}
          variant="default" // Loading state is handled by moving to Step 4
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  scrollContent: {
    padding: SPACING[6],
    paddingTop: SPACING[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING[6],
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 18,
    color: COLORS.ink900,
  },
  formSection: {
    marginBottom: SPACING[8],
  },
  sectionTitle: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 16,
    color: COLORS.ink900,
    marginBottom: SPACING[4],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[3],
  },
  pillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.ink100,
    gap: SPACING[2],
  },
  pillCardActive: {
    backgroundColor: COLORS.brandTint,
    borderColor: 'rgba(67,97,238,0.2)',
  },
  pillText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 14,
    color: COLORS.ink800,
  },
  pillTextActive: {
    fontFamily: FONTS.jakartaBold,
    color: COLORS.brandPrimary,
  },
  footer: {
    padding: SPACING[6],
    paddingTop: SPACING[4],
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.ink100,
  }
});
