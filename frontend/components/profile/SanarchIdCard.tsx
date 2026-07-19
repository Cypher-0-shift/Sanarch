import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useAlertStore } from '../../store/alertStore';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

interface FamilyMember {
  sanarchId: string;
  patientName: string;
  profileType: 'P' | 'D';
  memberIndex: number;
  qrBase64: string;
}

interface SanarchIdCardProps {
  sanarchId: string;
  patientName: string;
  profileType: 'P' | 'D';
  memberIndex: number;
  qrBase64: string; // the string payload for QR, not base64 image here since we use QRCode SVG
  familyMembers?: FamilyMember[];
  onMemberSelect?: (sanarchId: string) => void;
}

export default function SanarchIdCard({
  sanarchId,
  patientName,
  profileType,
  memberIndex,
  qrBase64,
}: SanarchIdCardProps) {
  const [copied, setCopied] = useState(false);

  // Copy ID to clipboard
  const handleCopyId = useCallback(async () => {
    try {
      const Clipboard = await import('expo-clipboard');
      await Clipboard.setStringAsync(sanarchId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      useAlertStore.getState().showAlert('SANARCH ID', sanarchId);
    }
  }, [sanarchId]);

  return (
    <View style={styles.cardContainer}>
      {/* Base Dark Card */}
      <View style={styles.cardBase}>
        {/* Decorative elements - Stripe style circles & Radial mesh effect */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        
        {/* Gloss Gradient Overlay */}
        <LinearGradient
          colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.brandLabel} allowFontScaling={false}>SANARCH</Text>
              <Text style={styles.patientName} allowFontScaling={false}>{patientName}</Text>
            </View>
            <View style={styles.qrTile}>
              <QRCode 
                value={qrBase64 || sanarchId} 
                size={48} 
                color={COLORS.dark950}
                backgroundColor="transparent"
              />
            </View>
          </View>

          <View style={styles.footerRow}>
            <View>
              <Text style={styles.idLabel} allowFontScaling={false}>ID NUMBER</Text>
              <View style={styles.idRow}>
                <Text style={styles.idValue} allowFontScaling={false}>{sanarchId}</Text>
                <TouchableOpacity onPress={handleCopyId} activeOpacity={0.7} style={styles.copyBtn}>
                  <MaterialCommunityIcons 
                    name={copied ? "check" : "content-copy"} 
                    size={16} 
                    color="rgba(255,255,255,0.7)" 
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {profileType === 'P' ? 'PRIMARY' : 'DEPENDENT'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: SPACING[6],
    shadowColor: COLORS.brandPrimary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  cardBase: {
    backgroundColor: COLORS.dark950,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minHeight: 180,
  },
  // Stripe-style circles for premium feel
  decorativeCircle1: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(67, 97, 238, 0.15)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -80,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(123, 155, 255, 0.1)',
  },
  content: {
    flex: 1,
    padding: SPACING[5],
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: FONTS.jakartaBold,
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  patientName: {
    color: '#FFF',
    fontFamily: FONTS.jakartaBold,
    fontSize: 20,
    maxWidth: 200,
  },
  qrTile: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 6,
    borderRadius: RADIUS.md,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 32,
  },
  idLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: FONTS.jakartaMedium,
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  idValue: {
    color: '#FFF',
    fontFamily: FONTS.monoMedium,
    fontSize: 18,
    letterSpacing: 1,
  },
  copyBtn: {
    padding: 4,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  badgeText: {
    color: '#FFF',
    fontFamily: FONTS.jakartaBold,
    fontSize: 10,
    letterSpacing: 1,
  }
});
