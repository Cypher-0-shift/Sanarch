import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useProfileStore } from '../../../store/profileStore';

export default function DependentDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const familyMembers = useProfileStore((state) => state.familyMembers);
  const setActiveProfile = useProfileStore((state) => state.setActiveProfile);
  const activeProfile = useProfileStore((state) => state.activeProfile);
  
  const profile = familyMembers.find(m => m.id === id);

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 bg-[#F5F3F0] justify-center items-center">
        <Text className="text-[#2D3A2F] font-display-bold text-lg">Profile not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 px-6 py-2 bg-[#004D36] rounded-xl">
          <Text className="text-white font-display-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isCurrentActive = activeProfile?.id === profile.id;

  return (
    <SafeAreaView className="flex-1 bg-[#F5F3F0]" edges={['top']}>
      {/* Header */}
      <View className="shrink-0 pt-4 pb-4 px-6 bg-[#F5F3F0] flex-row items-center justify-between">
        <TouchableOpacity 
          onPress={() => router.back()}
          activeOpacity={0.75}
          className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#2D3A2F" />
        </TouchableOpacity>
        <Text className="text-[#2D3A2F] text-lg font-display-bold tracking-tight">Profile Details</Text>
        <View className="w-10 h-10" />
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Avatar & Header */}
        <View className="items-center mt-6 mb-8">
          <View className="w-24 h-24 rounded-full bg-[#E8F5E9] items-center justify-center border-4 border-white shadow-sm">
            <Text className="text-[#004D36] text-4xl font-display-bold">
              {profile.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          
          <Text className="text-[#2D3A2F] text-2xl font-display-bold text-center mt-4">
            {profile.name}
          </Text>
          <View className="flex-row items-center gap-2 mt-1">
            <View className="bg-[#E8F5E9] px-3 py-1 rounded-full">
              <Text className="text-[10px] font-display-bold text-[#004D36] uppercase tracking-wider">{profile.relation}</Text>
            </View>
            <Text className="text-[#5C6E60] text-sm font-display-medium">ID: {profile.sanarchId}</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          activeOpacity={0.75}
          onPress={() => {
            setActiveProfile(profile);
            router.back();
          }}
          className={`w-full h-[54px] rounded-[18px] flex-row items-center justify-center gap-2 mb-8 ${isCurrentActive ? 'bg-[#E8F5E9]' : 'bg-[#004D36]'}`}
        >
          <MaterialCommunityIcons name={isCurrentActive ? "account-check" : "account-switch"} size={20} color={isCurrentActive ? "#004D36" : "white"} />
          <Text className={`font-display-bold text-base ${isCurrentActive ? 'text-[#004D36]' : 'text-white'}`}>
            {isCurrentActive ? "Active Profile" : "Switch to Profile"}
          </Text>
        </TouchableOpacity>

        {/* Health Details */}
        <Text className="text-base font-display-bold text-[#2D3A2F] mb-3">Health Details</Text>
        <View className="bg-white rounded-[24px] border border-[#E5E2DE] p-2 shadow-sm mb-6">
          <DetailRow icon="cake-variant-outline" label="Date of Birth" value={profile.dob || '—'} />
          <DetailRow icon="gender-male-female" label="Gender" value={profile.gender || '—'} />
          <DetailRow icon="water" label="Blood Group" value={profile.bloodGroup || '—'} />
          <DetailRow icon="human-male-height" label="Height" value={profile.heightCm ? `${profile.heightCm} cm` : '—'} />
          <DetailRow icon="scale-bathroom" label="Weight" value={profile.weightKg ? `${profile.weightKg} kg` : '—'} isLast />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value, isLast = false }: { icon: string; label: string; value: string; isLast?: boolean }) {
  return (
    <View className={`flex-row items-center justify-between p-3 mx-2 ${!isLast ? 'border-b border-[#F5F3F0]' : ''}`}>
      <View className="flex-row items-center gap-3">
        <View className="w-9 h-9 rounded-xl bg-[#F5F3F0] items-center justify-center">
          <MaterialCommunityIcons name={icon as any} size={18} color="#004D36" />
        </View>
        <Text className="text-sm text-[#5C6E60] font-display-medium">{label}</Text>
      </View>
      <Text className="text-sm font-display-bold text-[#2D3A2F]">{value}</Text>
    </View>
  );
}
