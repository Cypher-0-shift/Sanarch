import sys

content = """import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, InteractionManager, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useAuthStore } from '../../../store/authStore';
import { useProfileStore } from '../../../store/profileStore';
import { useAlertStore } from '../../../store/alertStore';
import { EMPTY_USER } from '../../../constants/placeholders';
import SkeletonLoader from '../../../components/ui/SkeletonLoader';
import { useGetProfile, useFamilyProfiles, type ProfileResponse } from '../../../hooks/useProfile';

function calculateAge(dob?: string): string {
  if (!dob) return '---';
  const parts = dob.split('/');
  if (parts.length !== 3) return '---';
  const day = parseInt(parts[0], 10), month = parseInt(parts[1], 10) - 1, year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return '---';
  const birth = new Date(year, month, day), today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age < 0 ? '---' : age + ' yrs';
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return (name[0] ?? '?').toUpperCase();
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user) ?? EMPTY_USER;
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const familyMembers = useProfileStore((s) => s.familyMembers);
  const setActiveProfile = useProfileStore((s) => s.setActiveProfile);
  const [isReady, setIsReady] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const sanarchId = user.sanarch_id ?? null;
  const { data: profileData, isLoading: profileLoading, isError: profileError } = useGetProfile(sanarchId);
  const { data: familyData } = useFamilyProfiles(sanarchId);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setIsReady(true));
    return () => task.cancel();
  }, []);

  const handleMemberSelect = useCallback((selectedId: string) => {
    const member = familyMembers.find((m) => m.sanarchId === selectedId);
    if (member) setActiveProfile(member);
  }, [familyMembers, setActiveProfile]);

  const handleCopyId = useCallback(async () => {
    if (!sanarchId) return;
    try {
      await Clipboard.setStringAsync(sanarchId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      useAlertStore.getState().showAlert('SANARCH ID', sanarchId);
    }
  }, [sanarchId]);

  if (!isReady) return <View className="flex-1 bg-[#F0F2F1]" />;

  const cardFamilyMembers = familyData?.map((p: ProfileResponse) => ({
    sanarchId: p.sanarch_id,
    patientName: familyMembers.find((fm) => fm.sanarchId === p.sanarch_id)?.name ?? 'Member ' + p.member_index,
    profileType: p.profile_type as 'P' | 'D',
    memberIndex: p.member_index,
  })) ?? [];

  const displayId = sanarchId ?? '---';

  return (
    <SafeAreaView className="flex-1 bg-[#F0F2F1]" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <Text className="text-[#111A14] text-xl font-bold tracking-tight">My Profile</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile/settings')}
          activeOpacity={0.75}
          className="w-9 h-9 rounded-full bg-white items-center justify-center"
          style={{ shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 }}
        >
          <MaterialCommunityIcons name="cog-outline" size={20} color="#2D3A2F" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Unified Hero + ID Card */}
        <LinearGradient
          colors={['#004D36', '#005E42', '#003428']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-3xl mt-2 mb-5 overflow-hidden"
          style={{ shadowColor: '#004D36', shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 }}
        >
          <View style={{ position: 'absolute', top: -28, right: -28, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.06)' }} pointerEvents="none" />
          <View style={{ position: 'absolute', bottom: -14, left: 24, width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.04)' }} pointerEvents="none" />
          
          <View className="px-5 pt-5 pb-5">
            {/* Top Row: Brand & Profile Type */}
            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-row items-center gap-2">
                <View className="w-6 h-6 rounded-md bg-white/15 items-center justify-center">
                  <Text className="text-white font-bold text-[11px]">S</Text>
                </View>
                <Text className="text-white/80 font-bold text-[11px] tracking-widest">SANARCH</Text>
              </View>
              <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: profileData?.profile_type === 'P' ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)' }}>
                <Text className="text-[10px] font-bold" style={{ color: profileData?.profile_type === 'P' ? '#34d399' : '#fbbf24' }}>
                  {profileData?.profile_type === 'P' ? 'Primary' : (profileData?.profile_type === 'D' ? 'Dependent' : 'Account')}
                </Text>
              </View>
            </View>

            {/* Avatar & Name Row */}
            <View className="flex-row items-center gap-4">
              <View className="w-[60px] h-[60px] rounded-2xl items-center justify-center border border-white/20" style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}>
                <Text className="text-white text-[24px] font-bold">{activeProfile?.name ? getInitials(activeProfile.name) : '?'}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white text-[19px] font-bold leading-snug" numberOfLines={1}>{activeProfile?.name ?? 'Your Name'}</Text>
                <Text className="text-white/55 text-[12px] mt-0.5" numberOfLines={1}>{activeProfile?.phone ?? user.email ?? 'No contact set'}</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/profile/edit-profile')}
                activeOpacity={0.7}
                className="w-9 h-9 rounded-xl items-center justify-center border border-white/20"
                style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
              >
                <MaterialCommunityIcons name="pencil-outline" size={17} color="rgba(255,255,255,0.9)" />
              </TouchableOpacity>
            </View>

            {/* ID & Copy Row */}
            <View className="border-t border-white/10 mt-5 pt-4 flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-white/40 text-[10px] uppercase tracking-[1.5px] font-semibold mb-0.5">Health ID</Text>
                <Text className="text-white text-[14px] font-bold tracking-widest" numberOfLines={1} style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                  {displayId}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCopyId}
                activeOpacity={0.7}
                className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
                style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
              >
                <MaterialCommunityIcons name={copied ? 'check' : 'content-copy'} size={14} color={copied ? '#34d399' : 'rgba(255,255,255,0.85)'} />
                <Text className="text-white/85 text-[12px] font-semibold">{copied ? 'Copied' : 'Copy'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Family Members Strip (Only show if multiple members exist) */}
        {familyMembers.length > 0 && (
          <View className="mb-5">
            <View className="flex-row items-center justify-between mb-2.5 ml-1 mr-2">
              <Text className="text-[11px] font-bold text-[#8A9E8F] uppercase tracking-[1.8px]">Family Members</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/profile/family')} activeOpacity={0.7}>
                <Text className="text-[11px] font-bold text-[#1D9E75] uppercase tracking-wider">Manage</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 2 }}>
              {cardFamilyMembers.map((member) => {
                const isActive = member.sanarchId === activeProfile?.sanarchId;
                return (
                  <TouchableOpacity
                    key={member.sanarchId}
                    onPress={() => handleMemberSelect(member.sanarchId)}
                    activeOpacity={0.75}
                    className="items-center"
                    style={{ width: 64 }}
                  >
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center"
                      style={{
                        backgroundColor: isActive ? '#004D36' : '#E6F5EE',
                        borderWidth: isActive ? 2 : 0,
                        borderColor: '#1D9E75',
                      }}
                    >
                      <Text className="font-bold text-[14px]" style={{ color: isActive ? '#FFFFFF' : '#004D36' }}>
                        {getInitials(member.patientName)}
                      </Text>
                      <View
                        className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full items-center justify-center"
                        style={{ backgroundColor: member.profileType === 'P' ? '#1D9E75' : '#BA7517', borderWidth: 1.5, borderColor: '#F0F2F1' }}
                      >
                        <Text className="text-white text-[8px] font-bold">{member.memberIndex}</Text>
                      </View>
                    </View>
                    <Text className="text-[11px] mt-1.5 text-center" style={{ color: isActive ? '#111A14' : '#6B7A6E', fontWeight: isActive ? '700' : '500' }} numberOfLines={1}>
                      {member.patientName.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Health Details */}
        <SectionLabel title="Health Details" />
        <View className="flex-row gap-3 mb-3">
          <StatChip icon="cake-variant-outline" label="DOB" value={activeProfile?.dob ?? '---'} />
          <StatChip icon="account-clock-outline" label="Age" value={calculateAge(activeProfile?.dob)} />
          <StatChip icon="water" label="Blood" value={activeProfile?.bloodGroup ?? '---'} />
        </View>
        <View className="bg-white rounded-[18px] border border-[#EAEAE8] mb-5 overflow-hidden" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
          <DetailRow icon="human-male-height" label="Height" value={activeProfile?.heightCm ? activeProfile.heightCm + ' cm' : '---'} />
          <DetailRow icon="scale-bathroom" label="Weight" value={activeProfile?.weightKg ? activeProfile.weightKg + ' kg' : '---'} isLast />
        </View>

        {/* Account */}
        <SectionLabel title="Account" />
        <View className="bg-white rounded-[18px] border border-[#EAEAE8] mb-5 overflow-hidden" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
          <DetailRow icon="phone-outline" label="Phone" value={activeProfile?.phone ?? '\u2014'} truncate />
          <DetailRow icon="email-outline" label="Email" value={activeProfile?.email ?? '\u2014'} truncate />
          <DetailRow icon="map-marker-outline" label="Address" value={activeProfile?.address ? activeProfile.address + (activeProfile.city ? ', ' + activeProfile.city : '') : '\u2014'} truncate isLast />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ title }: { title: string }) {
  return <Text className="text-[11px] font-bold text-[#8A9E8F] uppercase tracking-[1.8px] mb-2.5 ml-1">{title}</Text>;
}

function StatChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-1 bg-white rounded-[16px] border border-[#EAEAE8] p-3 items-center" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
      <View className="w-9 h-9 rounded-xl bg-[#E6F5EE] items-center justify-center mb-1.5">
        <MaterialCommunityIcons name={icon as any} size={18} color="#004D36" />
      </View>
      <Text className="text-[9px] text-[#8A9E8F] font-bold uppercase tracking-wider">{label}</Text>
      <Text className="text-[13px] font-bold text-[#111A14] mt-0.5 text-center" numberOfLines={1}>{value}</Text>
    </View>
  );
}

function DetailRow({ icon, label, value, isLast = false, truncate = false }: {
  icon: string; label: string; value: string; isLast?: boolean; truncate?: boolean;
}) {
  return (
    <View className={'flex-row items-center px-4 py-3 ' + (!isLast ? 'border-b border-[#F2F3F1]' : '')}>
      <View className="w-8 h-8 rounded-[10px] bg-[#E6F5EE] items-center justify-center mr-3">
        <MaterialCommunityIcons name={icon as any} size={16} color="#004D36" />
      </View>
      <Text className="text-[13px] text-[#6B7A6E] font-medium flex-1">{label}</Text>
      <Text className="text-[13px] font-semibold text-[#111A14] text-right ml-2" style={{ maxWidth: '55%' }} {...(truncate ? { numberOfLines: 1, ellipsizeMode: 'tail' as const } : {})}>{value}</Text>
    </View>
  );
}
"""

with open(r"app\(tabs)\profile\index.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Unified Profile Screen Saved successfully.")
