// components/profile/SanarchIdCard.tsx
/**
 * SANARCH ID Card — displays the patient's structured health ID
 * with QR code, copy/share actions, and a collapsible ID breakdown.
 *
 * Adapted for React Native (Expo) with NativeWind styling.
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAlertStore } from '../../store/alertStore';
import * as Clipboard from 'expo-clipboard';
import { formatSanarchId } from '../../utils/sanarchId';
import ProfileAvatar from './ProfileAvatar';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Types ────────────────────────────────────────────────────────────────────

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
  qrBase64: string;
  familyMembers?: FamilyMember[];
  onMemberSelect?: (sanarchId: string) => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

const TEAL = '#1D9E75';
const TEAL_BG = '#E6F7F0';
const TEAL_DARK = '#004D36';
const AMBER = '#BA7517';
const AMBER_BG = '#FFF3E0';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return (name[0] ?? '?').toUpperCase();
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SanarchIdCard({
  sanarchId,
  patientName,
  profileType,
  memberIndex,
  qrBase64,
  familyMembers = [],
  onMemberSelect,
}: SanarchIdCardProps) {
  const [copied, setCopied] = useState(false);

  const isPrimary = profileType === 'P';

  // ── Copy ID to clipboard ────────────────────────────────────────────────
  const handleCopyId = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(sanarchId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: show alert with the ID
      useAlertStore.getState().showAlert('SANARCH ID', sanarchId);
    }
  }, [sanarchId]);

  return (
    <View>
      {/* ── Main Card ── */}
      <View
        className="rounded-[24px] overflow-hidden"
        style={{
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}
      >
        {/* Header bar */}
        <View className="flex-row items-center justify-between px-5 py-3.5 bg-[#004D36]">
          <View className="flex-row items-center gap-2">
            <View className="w-7 h-7 bg-white/20 rounded-lg items-center justify-center">
              <Text className="text-white font-bold text-sm">S</Text>
            </View>
            <View>
              <Text className="text-white font-bold text-sm tracking-wide">
                SANARCH
              </Text>
              <Text className="text-white/60 text-[10px]">Health ID</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity 
              onPress={handleCopyId} 
              activeOpacity={0.7} 
              className="w-7 h-7 rounded-full bg-white/10 items-center justify-center"
            >
              <MaterialCommunityIcons 
                name={copied ? 'check' : 'content-copy'} 
                size={14} 
                color={copied ? '#4ade80' : 'white'} 
              />
            </TouchableOpacity>
            <View
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor: isPrimary ? TEAL_BG : AMBER_BG,
              }}
            >
              <Text
                className="text-[11px] font-bold"
                style={{ color: isPrimary ? TEAL : AMBER }}
              >
                {isPrimary ? 'Primary holder' : 'Family Member'}
              </Text>
            </View>
          </View>
        </View>

        {/* Card body */}
        <View className="bg-white px-5 py-5">
          {/* Avatar + Name + ID */}
          <View className="items-center">
            <ProfileAvatar
              size={64}
              name={patientName}
              borderWidth={3}
              borderColor="#D2E7D6"
            />
            <Text className="text-[#2D3A2F] text-lg font-bold mt-2.5 text-center">
              {patientName}
            </Text>
            <Text
              className="text-[#5C6E60] text-[13px] mt-1 tracking-[2px]"
              style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
            >
              {formatSanarchId(sanarchId)}
            </Text>
          </View>


        </View>
      </View>

      {/* ── Family members strip ── */}
      {familyMembers.length > 0 && (
        <View className="mt-4">
          <Text className="text-[13px] font-semibold text-[#5C6E60] mb-2 px-1">
            Family Members
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingHorizontal: 2 }}
          >
            {familyMembers.map((member) => {
              const isActive = member.sanarchId === sanarchId;
              return (
                <TouchableOpacity
                  key={member.sanarchId}
                  onPress={() => onMemberSelect?.(member.sanarchId)}
                  activeOpacity={0.75}
                  className="items-center"
                  style={{ width: 64 }}
                >
                  <ProfileAvatar
                    size={44}
                    name={member.patientName}
                    borderWidth={isActive ? 2.5 : 1}
                    borderColor={isActive ? TEAL : '#D2E7D6'}
                  />
                  <Text
                    className="text-[10px] mt-1 text-center"
                    style={{
                      color: isActive ? TEAL_DARK : '#819685',
                      fontWeight: isActive ? '700' : '500',
                    }}
                    numberOfLines={1}
                  >
                    {member.patientName.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
