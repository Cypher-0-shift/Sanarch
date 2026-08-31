import { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { useAuthStore } from '../../../store/authStore';
import { EMPTY_USER } from '../../../constants/placeholders';
import { useProfileStore } from '../../../store/profileStore';
import { useAlertStore } from '../../../store/alertStore';
import { getMe, getPatients } from '../../../services/api';
import { formatSanarchId } from '../../../utils/sanarchId';
import { parseDate } from '../../../utils/date';
import ProfileAvatar from '../../../components/profile/ProfileAvatar';

function getInitials(name: string): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2 && words[0] && words[words.length - 1]) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return (name.trim()[0] ?? '?').toUpperCase();
}

function calculateAge(dob?: string | null): string {
  if (!dob) return '---';
  const birth = parseDate(dob);
  if (!birth) return '---';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age < 0 ? '---' : `${age} Years`;
}

export default function FamilyProfilesScreen() {
  const router = useRouter();
  const authUser = useAuthStore((state) => state.user) ?? EMPTY_USER;
  const familyMembers = useProfileStore((state) => state.familyMembers);
  const showAlert = useAlertStore((state) => state.showAlert);

  const [activeTab, setActiveTab] = useState<'self' | 'family'>('self');
  const [copied, setCopied] = useState(false);

  const { data: meData } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getMe,
    staleTime: 30000,
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients'],
    queryFn: getPatients,
    staleTime: 30000,
  });

  const currentUser = meData ?? authUser;
  const displaySanarchId = formatSanarchId(currentUser.sanarch_id);

  const handleCopyId = useCallback(async () => {
    if (!displaySanarchId || displaySanarchId === '---') return;
    try {
      await Clipboard.setStringAsync(displaySanarchId);
      setCopied(true);
      showAlert('Copied to Clipboard', displaySanarchId);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showAlert('Copied to Clipboard', displaySanarchId);
    }
  }, [displaySanarchId, showAlert]);

  const rawPatients = Array.isArray(patientsData)
    ? patientsData
    : ((patientsData as any)?.patients ?? (patientsData as any)?.items ?? []);

  const dependents = useMemo(() => {
    const fromApi = rawPatients
      .filter((p: any) => p.sanarch_id !== currentUser.sanarch_id && p.relationship_to_owner !== 'self' && p.relation !== 'self')
      .map((p: any) => ({
        id: p.id,
        sanarchId: p.sanarch_id,
        name: p.full_name || p.name || 'Family Member',
        relation: (p.relationship_to_owner ?? p.relation ?? 'other') as any,
        isMainAccount: false,
        dob: p.date_of_birth ?? undefined,
        heightCm: p.height_cm ?? undefined,
        weightKg: p.weight_kg ?? undefined,
      }));

    const fromStore = familyMembers.filter(m => !m.isMainAccount && !fromApi.some((a: any) => a.id === m.id || a.sanarchId === m.sanarchId));
    return [...fromApi, ...fromStore];
  }, [rawPatients, currentUser.sanarch_id, familyMembers]);

  return (
    <SafeAreaView className="flex-1 bg-[#F5F3F0]" edges={['top']}>
      {/* Header */}
      <View
        className="shrink-0 pt-3 pb-0 px-6 bg-white border-b border-[#E5E2DE] z-10"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-10 h-10 rounded-full bg-[#E8F5E9] border border-[#D2E7D6] items-center justify-center"
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#004D36" />
          </TouchableOpacity>
          <Text className="text-xl font-display-bold tracking-tight text-[#004D36]">Family Profiles</Text>
          <View className="w-10 h-10" />
        </View>

        {/* Tab Selection */}
        <View className="flex-row gap-6 px-1">
          <TouchableOpacity
            onPress={() => setActiveTab('self')}
            activeOpacity={0.75}
            className={`pb-3 border-b-[3px] -mb-[1px] ${
              activeTab === 'self' ? 'border-[#004D36]' : 'border-transparent'
            }`}
          >
            <Text
              className={`text-sm font-display-bold uppercase tracking-wider ${
                activeTab === 'self' ? 'text-[#004D36]' : 'text-[#819685]'
              }`}
            >
              Self
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('family')}
            activeOpacity={0.75}
            className={`pb-3 flex-row items-center gap-1.5 border-b-[3px] -mb-[1px] ${
              activeTab === 'family' ? 'border-[#004D36]' : 'border-transparent'
            }`}
          >
            <Text
              className={`text-sm font-display-bold uppercase tracking-wider ${
                activeTab === 'family' ? 'text-[#004D36]' : 'text-[#819685]'
              }`}
            >
              Family Members
            </Text>
            <View
              className={`px-2 py-0.5 rounded-full ${
                activeTab === 'family' ? 'bg-[#004D36]' : 'bg-[#E8F5E9]'
              }`}
            >
              <Text
                className={`text-[11px] font-bold ${
                  activeTab === 'family' ? 'text-white' : 'text-[#004D36]'
                }`}
              >
                {dependents.length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        className="flex-1 px-5 pt-6" 
        contentContainerStyle={{ paddingBottom: 120 }} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {activeTab === 'self' ? (
          <View className="space-y-6">
            <View
              className="bg-white rounded-[28px] p-6 border border-[#E5E2DE] flex-col"
              style={{
                shadowColor: '#004D36',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
                elevation: 3,
              }}
            >
              {/* Profile Avatar & Title */}
              <View className="flex-col items-center mb-6">
                <ProfileAvatar
                  size={96}
                  gender={(currentUser as any)?.gender}
                  dob={currentUser.date_of_birth}
                  relation="self"
                  name={currentUser.full_name}
                  borderWidth={4}
                  borderColor="#D2E7D6"
                />
                <Text className="text-2xl font-display-bold mt-3.5 text-[#2D3A2F] text-center" numberOfLines={1}>
                  {currentUser.full_name || 'Your Name'}
                </Text>
                <Text className="text-[#5C6E60] text-sm font-display-medium mt-0.5">
                  Main Account Owner
                </Text>
              </View>

              {/* Sanarch ID Display Block */}
              <View className="bg-[#F8FAF9] rounded-2xl p-4 mb-4 border border-[#E5E2DE]">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-[10px] uppercase font-display-bold text-[#819685] tracking-widest">
                    Health ID
                  </Text>
                  <TouchableOpacity
                    onPress={handleCopyId}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="flex-row items-center gap-1 bg-[#E8F5E9] px-2.5 py-1 rounded-lg border border-[#D2E7D6]"
                  >
                    <MaterialCommunityIcons name={copied ? 'check' : 'content-copy'} size={13} color="#004D36" />
                    <Text className="text-[11px] font-bold text-[#004D36]">{copied ? 'Copied' : 'Copy'}</Text>
                  </TouchableOpacity>
                </View>
                <Text
                  className="text-[14px] font-bold text-[#004D36]"
                  style={{
                    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                    letterSpacing: 0.2,
                  }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                  selectable
                >
                  {displaySanarchId}
                </Text>
              </View>
              
              {/* Quick Details Row */}
              <View className="flex-row gap-3 mb-5">
                <View className="flex-1 bg-[#F8FAF9] rounded-2xl p-4 border border-[#E5E2DE] justify-center">
                  <Text className="text-[10px] uppercase font-display-bold text-[#819685] tracking-widest mb-1">
                    Age
                  </Text>
                  <Text className="text-base font-display-bold text-[#2D3A2F]" numberOfLines={1}>
                    {calculateAge(currentUser.date_of_birth)}
                  </Text>
                </View>
                <View className="flex-1 bg-[#F8FAF9] rounded-2xl p-4 border border-[#E5E2DE] justify-center">
                  <Text className="text-[10px] uppercase font-display-bold text-[#819685] tracking-widest mb-1">
                    Relation
                  </Text>
                  <Text className="text-base font-display-bold text-[#2D3A2F]" numberOfLines={1}>
                    Self
                  </Text>
                </View>
              </View>
              
              {/* Active Profile Status Pill */}
              <View className="w-full h-[52px] bg-[#004D36] rounded-[18px] flex-row items-center justify-center gap-2">
                <MaterialCommunityIcons name="account-check" size={20} color="white" />
                <Text className="text-white font-display-bold text-base">Active Profile</Text>
              </View>
            </View>
          </View>
        ) : (
          <View className="flex-col gap-4">
            {dependents.length === 0 ? (
              <View
                className="bg-white rounded-[28px] p-8 border border-[#E5E2DE] items-center"
                style={{
                  shadowColor: '#004D36',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.05,
                  shadowRadius: 10,
                  elevation: 2,
                }}
              >
                <View className="w-20 h-20 rounded-full bg-[#E8F5E9] items-center justify-center mb-4 border border-[#D2E7D6]">
                  <MaterialCommunityIcons name="account-group-outline" size={40} color="#004D36" />
                </View>
                <Text className="text-xl font-display-bold text-[#2D3A2F] text-center mb-2">
                  No Family Members Added
                </Text>
                <Text className="text-[#5C6E60] text-sm text-center font-display-medium leading-5 mb-6 px-2">
                  Add family members such as children, parents, or spouse to manage their health records from your account.
                </Text>
                <TouchableOpacity 
                  onPress={() => router.push('/(tabs)/profile/add-dependent')}
                  activeOpacity={0.75}
                  className="w-full h-[52px] rounded-[18px] bg-[#004D36] flex-row items-center justify-center gap-2 shadow-sm"
                >
                  <MaterialCommunityIcons name="account-plus" size={20} color="white" />
                  <Text className="text-sm font-display-bold text-white uppercase tracking-wider">
                    Add Family Member
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-xs font-display-bold text-[#819685] uppercase tracking-widest">
                    Family Profiles ({dependents.length})
                  </Text>
                </View>

                {dependents.map((dep) => (
                  <TouchableOpacity 
                    key={dep.id} 
                    activeOpacity={0.75} 
                    onPress={() => router.push(`/(tabs)/profile/dependent-details?id=${dep.id}`)}
                    className="bg-white rounded-[24px] p-4 shadow-sm border border-[#E5E2DE] flex-row items-center gap-3.5"
                  >
                    <ProfileAvatar
                      size={52}
                      gender={(dep as any)?.gender}
                      dob={dep.dob}
                      relation={dep.relation}
                      name={dep.name}
                      borderWidth={2}
                      borderColor="#D2E7D6"
                    />
                    <View className="flex-1 min-w-0">
                      <View className="flex-row items-center gap-2">
                        <Text className="font-display-bold text-base text-[#2D3A2F] shrink-1" numberOfLines={1}>
                          {dep.name}
                        </Text>
                        <View className="bg-[#E8F5E9] px-2 py-0.5 rounded-md">
                          <Text className="text-[10px] font-display-bold text-[#004D36] uppercase">{dep.relation}</Text>
                        </View>
                      </View>
                      <Text 
                        className="text-[12px] text-[#004D36] font-bold mt-1"
                        style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', letterSpacing: 0.2 }}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                      >
                        {formatSanarchId(dep.sanarchId)}
                      </Text>
                    </View>
                    <View className="w-9 h-9 rounded-xl bg-[#F5F3F0] items-center justify-center">
                      <MaterialCommunityIcons name="chevron-right" size={22} color="#5C6E60" />
                    </View>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity 
                  onPress={() => router.push('/(tabs)/profile/add-dependent')}
                  activeOpacity={0.75}
                  className="w-full h-14 rounded-[20px] border border-[#004D36] bg-[#E8F5E9] flex-row items-center justify-center gap-2 mt-2 shadow-sm"
                >
                  <MaterialCommunityIcons name="account-plus" size={20} color="#004D36" />
                  <Text className="text-sm font-display-bold uppercase tracking-wider text-[#004D36]">
                    Add Family Member
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
