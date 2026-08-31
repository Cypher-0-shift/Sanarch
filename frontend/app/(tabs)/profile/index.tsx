import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, InteractionManager, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { useProfileStore, Profile } from '../../../store/profileStore';
import { useAlertStore } from '../../../store/alertStore';
import { EMPTY_USER } from '../../../constants/placeholders';
import { useGetProfile, useFamilyProfiles } from '../../../hooks/useProfile';
import { getMe, getPatients } from '../../../services/api';
import { formatSanarchId } from '../../../utils/sanarchId';
import ProfileAvatar from '../../../components/profile/ProfileAvatar';

function calculateAge(dob?: string): string {
  if (!dob) return '---';
  let day: number, month: number, year: number;
  if (dob.includes('-')) {
    const parts = dob.split('-');
    if (parts.length !== 3) return '---';
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    day = parseInt(parts[2], 10);
  } else if (dob.includes('/')) {
    const parts = dob.split('/');
    if (parts.length !== 3) return '---';
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    year = parseInt(parts[2], 10);
  } else {
    return '---';
  }
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
  const activeProfileFromStore = useProfileStore((s) => s.activeProfile);
  const setActiveProfile = useProfileStore((s) => s.setActiveProfile);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // 1. Fetch live authenticated user profile from /users/me
  const { data: liveUserData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getMe,
    staleTime: 60000,
  });

  // 2. Fetch live patients / dependents from /patients
  const { data: patientsData } = useQuery({
    queryKey: ['patients'],
    queryFn: getPatients,
    staleTime: 60000,
  });

  const currentUserObj = liveUserData ?? user;
  const sanarchId = currentUserObj.sanarch_id ?? null;
  const { data: profileData } = useGetProfile(sanarchId);
  const { data: familyData } = useFamilyProfiles(sanarchId);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setIsReady(true));
    return () => task.cancel();
  }, []);

  // Compute combined family members dynamically (no store infinite loops)
  const familyMembers = useMemo(() => {
    if (!currentUserObj || !currentUserObj.id) return [];

    const primarySanarchId = currentUserObj.sanarch_id ?? '';

    const primaryMember: Profile = {
      id: currentUserObj.id,
      sanarchId: primarySanarchId,
      name: currentUserObj.full_name || 'Primary Account',
      relation: 'self',
      isMainAccount: true,
      phone: currentUserObj.phone_number || undefined,
      email: currentUserObj.email || undefined,
      dob: currentUserObj.date_of_birth || undefined,
      gender: (currentUserObj as any).gender || undefined,
      heightCm: currentUserObj.height_cm || undefined,
      weightKg: currentUserObj.weight_kg || undefined,
    };

    // 1. Dependent patients from /patients
    const rawPatients = Array.isArray(patientsData)
      ? patientsData
      : ((patientsData as any)?.patients ?? (patientsData as any)?.items ?? []);

    const dependentMembers: Profile[] = rawPatients
      .filter((p: any) => p.sanarch_id !== primarySanarchId && p.relationship_to_owner !== 'self' && p.relation !== 'self')
      .map((p: any) => {
        const rawName = p.full_name || p.name;
        const rel = p.relationship_to_owner ?? p.relation ?? 'Family Member';
        const formattedRel = rel.charAt(0).toUpperCase() + rel.slice(1);
        return {
          id: p.id,
          sanarchId: p.sanarch_id,
          name: rawName || formattedRel,
          relation: rel as any,
          isMainAccount: false,
          dob: p.date_of_birth ?? undefined,
          heightCm: p.height_cm ?? undefined,
          weightKg: p.weight_kg ?? undefined,
        };
      });

    // 2. Profiles from /profiles/{id}/family
    const rawFamily: any[] = Array.isArray(familyData) ? familyData : [];
    const storeMembers = useProfileStore.getState().familyMembers || [];

    const extraFamily: Profile[] = rawFamily
      .filter(f => {
        // Exclude primary profile
        if (f.profile_type === 'P' || f.member_index === 0) return false;
        if (f.sanarch_id === primarySanarchId) return false;
        // Exclude if already in dependentMembers
        if (dependentMembers.some(d => d.sanarchId === f.sanarch_id || d.id === f.sanarch_id)) return false;
        return true;
      })
      .map(f => {
        const known = storeMembers.find(sm => sm.sanarchId === f.sanarch_id || sm.id === f.sanarch_id);
        const name = (known?.name && !known.name.startsWith('Member'))
          ? known.name
          : (known?.relation ? known.relation.charAt(0).toUpperCase() + known.relation.slice(1) : 'Family Member');
        return {
          id: f.sanarch_id,
          sanarchId: f.sanarch_id,
          name,
          relation: known?.relation ?? 'other',
          isMainAccount: false,
        };
      });

    // 3. Include any existing profiles stored locally not already present
    const extraFromStore = storeMembers.filter(sm =>
      !sm.isMainAccount &&
      sm.sanarchId !== primarySanarchId &&
      !dependentMembers.some(d => d.sanarchId === sm.sanarchId || d.id === sm.id) &&
      !extraFamily.some(e => e.sanarchId === sm.sanarchId || e.id === sm.id)
    );

    return [primaryMember, ...dependentMembers, ...extraFamily, ...extraFromStore];
  }, [currentUserObj, patientsData, familyData]);

  // Determine currently active profile
  const activeProfile = useMemo(() => {
    if (selectedMemberId) {
      return familyMembers.find((m) => m.sanarchId === selectedMemberId) ?? familyMembers[0];
    }
    if (activeProfileFromStore && familyMembers.some(m => m.sanarchId === activeProfileFromStore.sanarchId)) {
      return familyMembers.find(m => m.sanarchId === activeProfileFromStore.sanarchId)!;
    }
    return familyMembers[0] ?? {
      id: currentUserObj.id || '---',
      sanarchId: currentUserObj.sanarch_id || '---',
      name: currentUserObj.full_name || 'User',
      relation: 'self' as const,
      isMainAccount: true,
      phone: currentUserObj.phone_number,
      email: currentUserObj.email ?? undefined,
      dob: currentUserObj.date_of_birth ?? undefined,
      heightCm: currentUserObj.height_cm ?? undefined,
      weightKg: currentUserObj.weight_kg ?? undefined,
    };
  }, [selectedMemberId, activeProfileFromStore, familyMembers, currentUserObj]);

  const handleMemberSelect = useCallback((selectedId: string) => {
    setSelectedMemberId(selectedId);
    const member = familyMembers.find((m) => m.sanarchId === selectedId);
    if (member) {
      setActiveProfile(member);
    }
  }, [familyMembers, setActiveProfile]);

  const displaySanarchId = formatSanarchId(activeProfile?.sanarchId || sanarchId);

  const handleCopyId = useCallback(async () => {
    if (!displaySanarchId || displaySanarchId === '---') return;
    try {
      await Clipboard.setStringAsync(displaySanarchId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      useAlertStore.getState().showAlert('SANARCH ID', displaySanarchId);
    }
  }, [displaySanarchId]);

  if (!isReady) return <View className="flex-1 bg-[#F0F2F1]" />;

  return (
    <SafeAreaView className="flex-1 bg-[#F0F2F1]" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-3.5 pb-4 bg-white border-b border-[#E5E2DE] z-10" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 }}>
        <Text
          className="text-[28px] font-display-bold text-[#004D36] tracking-[-0.5px]"
          maxFontSizeMultiplier={1.3}
        >
          My Profile
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile/settings')}
          activeOpacity={0.75}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          className="w-12 h-12 rounded-full bg-white items-center justify-center border border-[#E5E2DE]"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
        >
          <MaterialCommunityIcons name="cog-outline" size={22} color="#2D3A2F" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Unified Hero + ID Card */}
        <LinearGradient
          colors={['#004D36', '#2D3A2F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-3xl mb-5 overflow-hidden border border-white/15"
          style={{ shadowColor: '#004D36', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 5 }}
        >
          <View className="px-5 pt-5 pb-5">
            {/* Top Row: Brand & Edit Action */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white/80 font-bold text-[11px] tracking-widest">SANARCH</Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/profile/edit-profile')}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Edit Profile"
                className="w-8 h-8 rounded-full items-center justify-center border border-white/20"
                style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
              >
                <MaterialCommunityIcons name="pencil-outline" size={16} color="rgba(255,255,255,0.9)" />
              </TouchableOpacity>
            </View>

            {/* Avatar & Name Row */}
            <View className="flex-row items-center gap-4">
              <ProfileAvatar
                size={60}
                gender={activeProfile?.gender}
                dob={activeProfile?.dob}
                relation={activeProfile?.relation}
                name={activeProfile?.name}
                borderRadius={18}
                borderWidth={2}
                borderColor="rgba(255,255,255,0.3)"
                backgroundColor="rgba(255,255,255,0.15)"
              />
              <View className="flex-1">
                <Text className="text-white text-[19px] font-bold leading-snug" numberOfLines={1}>{activeProfile?.name || 'Your Name'}</Text>
                <Text className="text-white/55 text-[12px] mt-0.5" numberOfLines={1}>{activeProfile?.phone || activeProfile?.email || 'No contact set'}</Text>
              </View>
            </View>

            {/* ID & Copy Row */}
            <View className="border-t border-white/10 mt-5 pt-4 flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-white/40 text-[10px] uppercase tracking-[1.5px] font-semibold mb-0.5">Health ID</Text>
                <Text
                  className="text-white text-[13.5px] font-bold"
                  style={{
                    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                    letterSpacing: 0.5,
                  }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {displaySanarchId}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCopyId}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Copy Health ID"
                className="w-9 h-9 rounded-xl items-center justify-center border border-white/15"
                style={{ backgroundColor: copied ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.12)' }}
              >
                <MaterialCommunityIcons name={copied ? 'check' : 'content-copy'} size={16} color={copied ? '#34d399' : 'rgba(255,255,255,0.9)'} />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Family Members Strip (Always show for profile switching) */}
        {familyMembers.length > 0 && (
          <View className="mb-5">
            <View className="flex-row items-center justify-between mb-2.5 ml-1 mr-2">
              <Text className="text-[11px] font-bold text-[#8A9E8F] uppercase tracking-[1.8px]">Family Members</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/profile/family')} activeOpacity={0.7}>
                <Text className="text-[11px] font-bold text-[#1D9E75] uppercase tracking-wider">Manage</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 2 }}>
              {familyMembers.map((member, idx) => {
                const isActive = activeProfile ? member.sanarchId === activeProfile.sanarchId : member.isMainAccount;
                return (
                  <TouchableOpacity
                    key={member.sanarchId || member.id || idx}
                    onPress={() => handleMemberSelect(member.sanarchId)}
                    activeOpacity={0.75}
                    className="items-center"
                    style={{ width: 64 }}
                  >
                    <ProfileAvatar
                      size={48}
                      gender={member.gender}
                      dob={member.dob}
                      relation={member.relation}
                      name={member.name}
                      borderWidth={isActive ? 2.5 : 1}
                      borderColor={isActive ? '#1D9E75' : '#D2E7D6'}
                    />
                    <Text className="text-[11px] mt-1.5 text-center" style={{ color: isActive ? '#111A14' : '#6B7A6E', fontWeight: isActive ? '700' : '500' }} numberOfLines={1}>
                      {member.name ? member.name.split(' ')[0] : `Member`}
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
          <StatChip icon="cake-variant-outline" label="DOB" value={activeProfile?.dob || '---'} />
          <StatChip icon="account-clock-outline" label="Age" value={calculateAge(activeProfile?.dob)} />
          <StatChip icon="water" label="Blood" value={activeProfile?.bloodGroup || '---'} />
        </View>
        <View className="bg-white rounded-[18px] border border-[#EAEAE8] mb-5 overflow-hidden" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
          <DetailRow icon="human-male-height" label="Height" value={activeProfile?.heightCm ? activeProfile.heightCm + ' cm' : '---'} />
          <DetailRow icon="scale-bathroom" label="Weight" value={activeProfile?.weightKg ? activeProfile.weightKg + ' kg' : '---'} isLast />
        </View>

        {/* Account */}
        <SectionLabel title="Account" />
        <View className="bg-white rounded-[18px] border border-[#EAEAE8] mb-5 overflow-hidden" style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
          <DetailRow icon="phone-outline" label="Phone" value={activeProfile?.phone || '—'} truncate />
          <DetailRow icon="email-outline" label="Email" value={activeProfile?.email || '—'} truncate />
          <DetailRow icon="map-marker-outline" label="Address" value={activeProfile?.address ? activeProfile.address + (activeProfile.city ? ', ' + activeProfile.city : '') : '—'} truncate isLast />
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
