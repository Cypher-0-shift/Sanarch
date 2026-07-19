/**
 * SanarchIDModal — Phase 4
 *
 * Full-screen modal that displays the user's Sanarch ID card (QR code).
 * Tapping "My ID" zooms into this modal.
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';
import QRCode from 'react-native-qrcode-svg';

interface SanarchIDModalProps {
  visible: boolean;
  onClose: () => void;
  sanarchId: string;
  patientName: string;
}

export default function SanarchIDModal({
  visible,
  onClose,
  sanarchId,
  patientName,
}: SanarchIDModalProps) {
  // If no ID, fallback to something safe
  const qrValue = sanarchId ? `sanarch://patient/${sanarchId}` : 'sanarch://empty';

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={24} color={COLORS.surface} />
          </Pressable>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Your Sanarch ID</Text>
          <Text style={styles.subtitle}>
            Show this QR code to your doctor or hospital desk to instantly share your health records safely.
          </Text>

          {/* ID Card */}
          <View style={styles.card}>
            <View style={styles.qrWrapper}>
              <QRCode
                value={qrValue}
                size={220}
                color={COLORS.dark950}
                backgroundColor={COLORS.surface}
              />
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.nameLabel}>Patient Name</Text>
              <Text style={styles.nameValue}>{patientName}</Text>
              
              <Text style={styles.idLabel}>Sanarch ID</Text>
              <Text style={styles.idValue}>{sanarchId || 'Pending...'}</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark950, // Dark background for the modal
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[2],
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING[6],
    paddingTop: SPACING[10],
  },
  title: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 28,
    color: COLORS.surface,
    marginBottom: SPACING[2],
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING[10],
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS['3xl'],
    padding: SPACING[6],
    alignItems: 'center',
    // Elevation
    shadowColor: COLORS.brandPrimary,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 20,
  },
  qrWrapper: {
    padding: SPACING[4],
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.ink100,
    marginBottom: SPACING[6],
  },
  cardFooter: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
  nameLabel: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 12,
    color: COLORS.ink400,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nameValue: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 20,
    color: COLORS.ink900,
    marginBottom: SPACING[3],
  },
  idLabel: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 12,
    color: COLORS.ink400,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  idValue: {
    fontFamily: FONTS.monoMedium,
    fontSize: 16,
    color: COLORS.brandPrimary,
    letterSpacing: 2,
  },
});
