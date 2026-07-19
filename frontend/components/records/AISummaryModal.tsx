/**
 * AISummaryModal — Phase 5
 *
 * Glassmorphic modal displaying the AI-generated summary of a document.
 * Per DESIGN.md §6: dark950 base + darkGlow ambient + heavy blur.
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AISummaryModalProps {
  visible: boolean;
  onClose: () => void;
  summaryText: string;
}

export default function AISummaryModal({ visible, onClose, summaryText }: AISummaryModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Heavy Blur Backdrop */}
        <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
        
        {/* Ambient Brand Glow */}
        <View style={styles.ambientGlow} />

        {/* Dismiss Layer */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Modal Card */}
        <View style={[styles.card, { marginTop: insets.top + 60, marginBottom: insets.bottom + 40 }]}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons name="auto-fix" size={20} color={COLORS.brandPrimary} />
              <Text style={styles.title}>AI Summary</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.ink300} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            {summaryText ? (
              <Text style={styles.bodyText}>{summaryText}</Text>
            ) : (
              <Text style={styles.emptyText}>No summary available for this document.</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    right: '10%',
    height: 300,
    backgroundColor: COLORS.brandGlow, // using glow color
    opacity: 0.15,
    borderRadius: 150,
  },
  card: {
    width: '85%',
    maxHeight: '80%',
    backgroundColor: 'rgba(22,27,34,0.85)', // dark900 with transparency
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(67,97,238,0.2)', // brand-primary border
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  title: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 16,
    color: COLORS.surface,
  },
  closeBtn: {
    padding: 4,
  },
  scrollArea: {
    flexShrink: 1,
  },
  scrollContent: {
    padding: SPACING[5],
  },
  bodyText: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 24,
  },
  emptyText: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
  },
});
