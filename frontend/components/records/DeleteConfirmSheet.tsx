/**
 * DeleteConfirmSheet — Phase 5
 *
 * Hard confirmation sheet for deleting a document.
 * Follows the "no silent undo" spec.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet from '../navigation/BottomSheet';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';
import PrimaryButton from '../buttons/PrimaryButton';
import SecondaryButton from '../buttons/SecondaryButton';

interface DeleteConfirmSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export default function DeleteConfirmSheet({
  visible,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} hideCloseButton>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="alert-circle-outline" size={32} color={COLORS.resultHigh} />
        </View>

        <Text style={styles.title}>Delete Document?</Text>
        
        <Text style={styles.subtitle}>
          This document will be permanently deleted and cannot be recovered.
        </Text>

        <View style={styles.actionRow}>
          <View style={styles.btnWrapper}>
            <SecondaryButton 
              label="Cancel" 
              onPress={onClose} 
              variant={isDeleting ? 'disabled' : 'default'}
            />
          </View>
          <View style={styles.btnWrapper}>
            <PrimaryButton 
              label="Delete" 
              onPress={onConfirm}
              variant={isDeleting ? 'loading' : 'destructive'}
            />
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING[6],
    alignItems: 'center',
    gap: SPACING[4],
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.resultHighBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[2],
  },
  title: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 20,
    color: COLORS.ink900,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 14,
    color: COLORS.ink600,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING[2],
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING[3],
    marginTop: SPACING[4],
    width: '100%',
  },
  btnWrapper: {
    flex: 1,
  },
});
