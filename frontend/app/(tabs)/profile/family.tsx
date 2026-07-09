import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { EMPTY_USER } from '../../../constants/placeholders';
import { useProfileStore } from '../../../store/profileStore';

export default function FamilyProfilesScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user) ?? EMPTY_USER;
  const familyMembers = useProfileStore((state) => state.familyMembers);
  const addFamilyMember = useProfileStore((state) => state.addFamilyMember);
  
  const [activeTab, setActiveTab] = useState<'self' | 'dependents'>('self');

  const dependents = familyMembers.filter(m => !m.isMainAccount);

  return (
    <SafeAreaView className="flex-1 bg-[#F5F3F0]" edges={['top']}>
      {/* Header */}
      <View className="shrink-0 pt-4 pb-0 px-6 bg-white border-b border-[#E5E2DE] z-10">
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            activeOpacity={0.75}
            hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
            className="w-10 h-10 rounded-full bg-[#F5F3F0] items-center justify-center"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#2D3A2F" />
          </TouchableOpacity>
          <Text className="text-lg font-display-bold tracking-tight text-[#2D3A2F]">Family Profiles</Text>
          <View className="w-10 h-10" />
        </View>

        <View className="flex-row gap-8 px-2">
          <TouchableOpacity onPress={() => setActiveTab('self')} activeOpacity={0.75} className={`pb-3 border-b-4 ${activeTab === 'self' ? 'border-[#004D36]' : 'border-transparent'}`}>
            <Text className={`text-sm font-display-bold uppercase tracking-wider ${activeTab === 'self' ? 'text-[#004D36]' : 'text-[#819685]'}`}>Self</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('dependents')} activeOpacity={0.75} className={`pb-3 border-b-4 ${activeTab === 'dependents' ? 'border-[#004D36]' : 'border-transparent'}`}>
            <Text className={`text-sm font-display-bold uppercase tracking-wider ${activeTab === 'dependents' ? 'text-[#004D36]' : 'text-[#819685]'}`}>Dependents</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        className="flex-1 px-6 pt-8" 
        contentContainerStyle={{ paddingBottom: 120 }} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {activeTab === 'self' ? (
          <View className="space-y-6">
            <View className="bg-white rounded-[28px] p-6 shadow-sm border border-[#E5E2DE] relative overflow-hidden flex-col">
              <View className="absolute top-0 right-0 p-4 opacity-5">
                <MaterialCommunityIcons name="shield-check" size={96} color="#004D36" />
              </View>
              <View className="flex-col items-center mb-6">
                <View className="relative">
                  <View className="w-24 h-24 rounded-full border-4 border-[#F5F3F0] overflow-hidden bg-gray-200 shadow-md">
                    <Image source={{ uri: 'https://api.dicebear.com/7.x/avataaars/png?seed=Felix' }} className="w-full h-full" resizeMode="cover" />
                  </View>
                  <View className="absolute bottom-0 right-0 w-8 h-8 bg-[#004D36] rounded-full items-center justify-center border-2 border-white">
                    <MaterialCommunityIcons name="check" size={14} color="white" />
                  </View>
                </View>
                <Text className="text-xl font-display-bold mt-4 text-[#2D3A2F]">{user.full_name ?? 'Your Name'}</Text>
                <Text className="text-[#5C6E60] text-sm font-display-medium">Main Account Owner</Text>
              </View>
              
              <View className="flex-row gap-4 mb-6">
                <View className="flex-1 bg-[#F8FAF9] rounded-xl p-4 flex-col">
                  <Text className="text-[10px] uppercase font-display-bold text-[#819685] tracking-widest">Age</Text>
                  <Text className="text-lg font-display-bold text-[#2D3A2F]">32 Years</Text>
                </View>
                <View className="flex-1 bg-[#F8FAF9] rounded-xl p-4 flex-col">
                  <Text className="text-[10px] uppercase font-display-bold text-[#819685] tracking-widest">ID</Text>
                  <Text className="text-lg font-display-bold text-[#2D3A2F]">{user.sanarch_id ? user.sanarch_id.slice(3, 5) + 'X' : '—'}</Text>
                </View>
              </View>
              
              <TouchableOpacity activeOpacity={0.75} className="w-full h-[54px] bg-[#004D36] rounded-[18px] flex-row items-center justify-center gap-2">
                <MaterialCommunityIcons name="account-check" size={20} color="white" />
                <Text className="text-white font-display-bold">Active Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="flex-col gap-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-display-bold text-[#819685] uppercase tracking-widest">Managed Profiles ({dependents.length})</Text>
            </View>

            {dependents.map((dep) => (
              <TouchableOpacity 
                key={dep.id} 
                activeOpacity={0.75} 
                onPress={() => router.push(`/(tabs)/profile/dependent-details?id=${dep.id}`)}
                className="bg-white rounded-[24px] p-5 shadow-sm border border-[#E5E2DE] flex-row items-center gap-4"
              >
                <View className="w-14 h-14 rounded-full bg-[#E8F5E9] overflow-hidden shrink-0 items-center justify-center">
                  <Text className="text-[#004D36] font-display-bold text-xl">{dep.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="font-display-bold text-base text-[#2D3A2F]">{dep.name}</Text>
                    <View className="bg-[#E8F5E9] px-2 py-0.5 rounded-md">
                      <Text className="text-[10px] font-display-bold text-[#004D36] uppercase">{dep.relation}</Text>
                    </View>
                  </View>
                  <Text className="text-sm text-[#5C6E60] font-display mt-0.5">ID: {dep.sanarchId}</Text>
                </View>
                <View className="w-10 h-10 rounded-xl bg-[#F5F3F0] items-center justify-center">
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#5C6E60" />
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/profile/add-dependent')}
              activeOpacity={0.75}
              className="w-full h-20 rounded-[24px] border border-[#E5E2DE] bg-white flex-row items-center justify-center gap-2 mt-2 shadow-sm"
            >
              <MaterialCommunityIcons name="account-plus" size={20} color="#004D36" />
              <Text className="text-sm font-display-bold uppercase tracking-widest text-[#004D36]">Add Family Member</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
