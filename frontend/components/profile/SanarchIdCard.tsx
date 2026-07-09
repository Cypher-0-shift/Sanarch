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
      // Dynamic import to avoid crash if expo-clipboard is not installed
      const Clipboard = await import('expo-clipboard');
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
              {isPrimary ? 'Primary holder' : 'Dependent'}
            </Text>
          </View>
        </View>

        {/* Card body */}
        <View className="bg-white px-5 py-5">
          {/* Avatar + Name + ID */}
          <View className="items-center">
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: TEAL_DARK }}
            >
              <Text className="text-white text-xl font-bold">
                {getInitials(patientName)}
              </Text>
            </View>
            <Text className="text-[#2D3A2F] text-lg font-bold mt-2.5 text-center">
              {patientName}
            </Text>
            <Text
              className="text-[#5C6E60] text-[13px] mt-1 tracking-[2px]"
              style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
            >
              {sanarchId}
            </Text>
          </View>

          {/* Action buttons */}
          <View className="flex-row gap-3 mt-5">
            <TouchableOpacity
              onPress={handleCopyId}
              activeOpacity={0.75}
              className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl border border-[#E5E2DE]"
              style={{
                backgroundColor: copied ? TEAL_BG : '#FAFAF9',
              }}
            >
              <MaterialCommunityIcons
                name={copied ? 'check-circle' : 'content-copy'}
                size={16}
                color={copied ? TEAL : '#5C6E60'}
              />
              <Text
                className="text-[13px] font-semibold ml-1.5"
                style={{ color: copied ? TEAL : '#2D3A2F' }}
              >
                {copied ? 'Copied!' : 'Copy ID'}
              </Text>
            </TouchableOpacity>
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
                  <View
                    className="w-11 h-11 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: isActive ? TEAL_DARK : '#E8F5E9',
                      borderWidth: isActive ? 2 : 0,
                      borderColor: TEAL,
                    }}
                  >
                    <Text
                      className="font-bold text-[13px]"
                      style={{ color: isActive ? '#FFFFFF' : TEAL_DARK }}
                    >
                      {getInitials(member.patientName)}
                    </Text>
                    {/* Index badge */}
                    <View
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full items-center justify-center"
                      style={{
                        backgroundColor:
                          member.profileType === 'P' ? TEAL : AMBER,
                      }}
                    >
                      <Text className="text-white text-[8px] font-bold">
                        {member.memberIndex}
                      </Text>
                    </View>
                  </View>
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
