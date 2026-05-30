import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, InteractionManager, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { useProfileStore, type Profile } from '../../../store/profileStore';
import { EMPTY_USER } from '../../../constants/placeholders';
import SanarchIdCard from '../../../components/profile/SanarchIdCard';
import SkeletonLoader from '../../../components/ui/SkeletonLoader';
import { useGetProfile, useFamilyProfiles, type ProfileResponse } from '../../../hooks/useProfile';

function calculateAge(dob?: string): string {
  if (!dob) return '---';
  const parts = dob.split('/');
  if (parts.length !== 3) return '---';
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return '---';
  const birth = new Date(year, month, day);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  if (age < 0) return '---';
  return `${age} yrs`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user) ?? EMPTY_USER;
  const { activeProfile, familyMembers, setActiveProfile } = useProfileStore();
  const [isReady, setIsReady] = useState(false);

  // TODO: Replace localStorage/store-based sanarch_id with auth-injected ID in Sprint 9
  const sanarchId = user.sanarch_id ?? null;

  // Fetch structured profile data from the new profiles API
  const {
    data: profileData,
    isLoading: profileLoading,
    isError: profileError,
  } = useGetProfile(sanarchId);

  const {
    data: familyData,
    isLoading: familyLoading,
  } = useFamilyProfiles(sanarchId);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
    return () => task.cancel();
  }, []);

  const handleMemberSelect = useCallback((selectedId: string) => {
    // Find the family member and switch active profile
    const member = familyMembers.find((m) => m.sanarchId === selectedId);
    if (member) {
      setActiveProfile(member);
    }
  }, [familyMembers, setActiveProfile]);

  if (!isReady) return <View className="flex-1 bg-[#F5F3F0]" />;

  // Dependents = family members that are not the main account
  const dependents = familyMembers.filter((m) => !m.isMainAccount);
  const hasDependents = dependents.length > 0;

  // Build family members array for the card from API data
  const cardFamilyMembers = familyData?.map((p: ProfileResponse) => ({
    sanarchId: p.sanarch_id,
    patientName:
      familyMembers.find((fm) => fm.sanarchId === p.sanarch_id)?.name ??
      `Member ${p.member_index}`,
    profileType: p.profile_type as 'P' | 'D',
    memberIndex: p.member_index,
    qrBase64: p.qr_base64,
  })) ?? [];

  return (
    <SafeAreaView className="flex-1 bg-[#F5F3F0]" edges={['top']}>
      {/* Header */}
      <View className="shrink-0 pt-4 pb-4 px-6 bg-[#F8FAF9] flex-row items-center justify-between border-b border-[#E5E2DE]">
        <View className="w-10 h-10" />
        <Text className="text-[#2D3A2F] text-lg font-display-bold tracking-tight">My Profile</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile/settings')}
          activeOpacity={0.75}
          className="w-10 h-10 rounded-full bg-white items-center justify-center"
          style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
        >
          <MaterialCommunityIcons name="cog-outline" size={24} color="#2D3A2F" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* ─── Avatar ─── */}
        <View className="items-center mt-4">
          <View className="w-20 h-20 rounded-full bg-[#004D36] items-center justify-center">
            <Text className="text-white text-3xl font-display-bold">
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>

          {/* ─── Name and ID ─── */}
          <Text className="text-[#2D3A2F] text-2xl font-display-bold text-center mt-3">
            {user.full_name ?? 'Your Name'}
          </Text>

          {/* ─── Edit Profile Button ─── */}
          <TouchableOpacity
            className="mt-4 px-5 py-2 bg-white border border-[#E5E2DE] rounded-full flex-row items-center gap-2"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
            activeOpacity={0.75}
            onPress={() => router.push('/(tabs)/profile/edit-profile')}
          >
            <MaterialCommunityIcons name="pencil-outline" size={16} color="#004D36" />
            <Text className="text-sm font-display-bold text-[#2D3A2F]">Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* ─── SANARCH ID Card ─── */}
        <View className="mt-8">
          {profileLoading ? (
            <View className="bg-white rounded-[24px] p-5 border border-[#E5E2DE]">
              <SkeletonLoader width="60%" height={20} borderRadius={8} />
              <SkeletonLoader width="100%" height={14} borderRadius={6} style={{ marginTop: 12 }} />
              <View className="items-center mt-4">
                <SkeletonLoader width={140} height={140} borderRadius={12} />
              </View>
              <SkeletonLoader width="80%" height={14} borderRadius={6} style={{ marginTop: 16 }} />
            </View>
          ) : profileError || !profileData ? (
            /* Show the existing card style as fallback when profile API is unavailable */
            <View className="bg-[#004D36] rounded-[24px]" style={{ overflow: 'hidden' }}>
              {/* Decorative circles */}
              <View style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.06)' }} pointerEvents="none" />
              <View style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.04)' }} pointerEvents="none" />

              <View className="p-5">
                {/* Row 1: Logo + Brand */}
                <View className="flex-row items-center">
                  <View className="w-7 h-7 bg-white/20 rounded-lg items-center justify-center">
                    <Text className="text-white font-bold text-sm">S</Text>
                  </View>
                  <Text className="text-white font-bold text-sm ml-2">SANARCH</Text>
                </View>

                {/* Row 2: Account Holder */}
                <View className="mt-4">
                  <Text className="text-white opacity-50 text-[10px] uppercase tracking-widest">Account Holder</Text>
                  <Text className="text-white text-lg font-display-bold mt-0.5">
                    {(user.full_name ?? 'Your Name').split(' ')[0]}
                  </Text>
                </View>

                {/* Row 3: Sanarch ID + QR */}
                <View className="flex-row justify-between items-end mt-4">
                  <View>
                    <Text className="text-white opacity-50 text-[10px] uppercase tracking-widest">Sanarch ID</Text>
                    {user.sanarch_id ? (
                      <Text className="text-white font-mono text-base font-bold tracking-widest mt-0.5">{user.sanarch_id}</Text>
                    ) : (
                      <View className="w-32 h-5 bg-white/20 rounded-md mt-0.5" />
                    )}
                  </View>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/doctors')} activeOpacity={0.75}>
                    <MaterialCommunityIcons name="qrcode" size={32} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <SanarchIdCard
              sanarchId={profileData.sanarch_id}
              patientName={user.full_name ?? 'Patient'}
              profileType={profileData.profile_type as 'P' | 'D'}
              memberIndex={profileData.member_index}
              qrBase64={profileData.qr_base64}
              familyMembers={cardFamilyMembers}
              onMemberSelect={handleMemberSelect}
            />
          )}
        </View>

        {/* ─── Health Details ─── */}
        <Text className="text-base font-display-bold text-[#2D3A2F] mt-8 mb-3">Health Details</Text>
        <View
          className="bg-white rounded-[20px] border border-[#E5E2DE] p-4"
          style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
        >
          <HealthRow icon="cake-variant-outline" label="Date of Birth" value={activeProfile?.dob ?? '---'} />
          <HealthRow icon="account-clock-outline" label="Age" value={calculateAge(activeProfile?.dob)} />
          <HealthRow icon="water" label="Blood Group" value={activeProfile?.bloodGroup ?? '---'} />
          <HealthRow icon="human-male-height" label="Height" value={activeProfile?.heightCm ? `${activeProfile.heightCm} cm` : '---'} />
          <HealthRow icon="scale-bathroom" label="Weight" value={activeProfile?.weightKg ? `${activeProfile.weightKg} kg` : '---'} isLast />
        </View>

        {/* ─── Account Details ─── */}
        <Text className="text-base font-display-bold text-[#2D3A2F] mt-8 mb-3">Account Details</Text>
        <View
          className="bg-white rounded-[20px] border border-[#E5E2DE] p-4"
          style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
        >
          <AccountRow icon="phone-outline" label="Phone" value={activeProfile?.phone ?? '\u2014'} truncate />
          <AccountRow icon="email-outline" label="Email" value={activeProfile?.email ?? '\u2014'} truncate />
          <AccountRow
            icon="map-marker-outline"
            label="Address"
            value={
              activeProfile?.address
                ? `${activeProfile.address}, ${activeProfile.city ?? ''}`.trim().replace(/,$/, '')
                : '\u2014'
            }
          />
          <AccountRow icon="calendar-outline" label="Member Since" value="May 2026" isLast />
        </View>

        {/* ─── Family Profiles ─── */}
        <Text className="text-base font-display-bold text-[#2D3A2F] mt-8 mb-3">Family Profiles</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile/family')}
          activeOpacity={0.75}
          className="bg-white rounded-[20px] border border-[#E5E2DE] p-4 flex-row items-center gap-3 mb-6"
          style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
        >
          <View className="w-10 h-10 rounded-full bg-[#E8F5E9] items-center justify-center">
            <MaterialCommunityIcons name="account-group-outline" size={22} color="#004D36" />
          </View>
          <Text className="flex-1 text-sm font-display-bold text-[#2D3A2F]">
            {familyMembers.length > 1 ? `Manage ${familyMembers.length} Profiles` : 'Manage Family Profiles'}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#819685" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Health Detail Row ─── */
function HealthRow({
  icon,
  label,
  value,
  isLast = false,
}: {
  icon: string;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View className={`flex-row items-center justify-between py-3 ${!isLast ? 'border-b border-[#F5F3F0]' : ''}`}>
      <View className="flex-row items-center gap-3">
        <View className="w-9 h-9 rounded-xl bg-[#E8F5E9] items-center justify-center">
          <MaterialCommunityIcons name={icon as any} size={18} color="#004D36" />
        </View>
        <Text className="text-sm text-[#5C6E60]">{label}</Text>
      </View>
      <Text className="text-sm font-display-bold text-[#2D3A2F]">{value}</Text>
    </View>
  );
}

/* ─── Account Detail Row ─── */
function AccountRow({
  icon,
  label,
  value,
  isLast = false,
  truncate = false,
}: {
  icon: string;
  label: string;
  value: string;
  isLast?: boolean;
  truncate?: boolean;
}) {
  return (
    <View className={`flex-row items-center justify-between py-3 ${!isLast ? 'border-b border-[#F5F3F0]' : ''}`}>
      <View className="flex-row items-center">
        <View className="w-9 h-9 rounded-xl bg-[#E8F5E9] items-center justify-center">
          <MaterialCommunityIcons name={icon as any} size={18} color="#004D36" />
        </View>
        <Text className="text-sm text-[#5C6E60] font-display-medium ml-3">{label}</Text>
      </View>
      <Text
        className="text-sm font-display-bold text-[#2D3A2F] text-right"
        style={{ maxWidth: '55%' }}
        {...(truncate ? { numberOfLines: 1, ellipsizeMode: 'tail' as const } : {})}
      >
        {value}
      </Text>
    </View>
  );
}
