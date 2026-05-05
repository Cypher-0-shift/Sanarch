import { View, Text, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { MOCK_USER } from '../../../constants/mock';
import { clearToken } from '../../../services/storage';
import BottomSheet from '../../../components/ui/BottomSheet';

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="text-sm font-display-semibold uppercase tracking-wider text-primary/60 mb-3 ml-2">
        {title}
      </Text>
      <View className="bg-white rounded-xl shadow-sm border border-primary/5 p-1 pt-0 pb-0">
        {children}
      </View>
    </View>
  );
}

interface ProfileRowProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value?: string | React.ReactNode;
  isLast?: boolean;
  onPress?: () => void;
  danger?: boolean;
}

function ProfileRow({ icon, label, value, isLast = false, onPress, danger = false }: ProfileRowProps) {
  const content = (
    <View className={`flex-row items-center px-3 py-4 ${!isLast ? 'border-b border-primary/5' : ''}`}>
      <View className="h-9 w-9 rounded-lg bg-primary/10 items-center justify-center mr-3">
        <MaterialCommunityIcons name={icon} size={20} color={danger ? '#DC2626' : '#143832'} />
      </View>
      <Text className={`text-sm font-display-medium flex-1 ${danger ? 'text-red-600' : 'text-slate-500'}`}>
        {label}
      </Text>
      {typeof value === 'string' ? (
        <Text className="text-sm font-display-semibold text-slate-900">{value}</Text>
      ) : (
        value
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [familySheetVisible, setFamilySheetVisible] = useState(false);

  const user = useAuthStore((state) => state.user) ?? MOCK_USER;

  const handleLogout = async () => {
    useAuthStore.getState().logout();
    await clearToken();
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
      {/* Header */}
      <View className="bg-background-light/90 backdrop-blur-md border-b border-primary/10 px-4 py-4 flex-row items-center justify-between z-10 sticky top-0">
        <View className="h-10 w-10" />
        <Text className="text-xl font-display-bold text-slate-900">Profile</Text>
        <TouchableOpacity className="h-10 w-10 items-center justify-center" onPress={() => Alert.alert('Options', 'Account options coming soon.')}>
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#143832" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View className="items-center py-6">
          <View className="relative h-32 w-32 mb-4">
            <View className="h-32 w-32 rounded-full border-4 border-primary/20 bg-primary/10 items-center justify-center overflow-hidden">
              <MaterialCommunityIcons name="account" size={64} color="#143832" style={{ opacity: 0.5 }} />
            </View>
            <View className="absolute bottom-1 right-1 bg-primary rounded-full border-2 border-background-light p-1">
              <MaterialCommunityIcons name="check-decagram" size={16} color="white" />
            </View>
          </View>
          <Text className="text-2xl font-display-bold tracking-tight text-slate-900">
            {user.full_name}
          </Text>
          <Text className="text-primary/70 font-display-medium mt-1">{user.sanarch_id}</Text>
        </View>

        {/* Section 1 - IDENTITY */}
        <ProfileSection title="Identity">
          <ProfileRow
            icon="identifier"
            label="Sanarch ID"
            value={
              <Text className="text-sm font-display-bold text-primary">{user.sanarch_id}</Text>
            }
          />
          <ProfileRow icon="phone" label="Phone Number" value={user.phone} isLast />
        </ProfileSection>

        {/* Section 2 - CONTACT INFORMATION */}
        <ProfileSection title="Contact Information">
          <ProfileRow icon="email-outline" label="Email Address" value={user.email} />
          <ProfileRow icon="map-marker-outline" label="Address" value={user.address} isLast />
        </ProfileSection>

        {/* Section 3 - PRIVACY AND SECURITY */}
        <ProfileSection title="Privacy & Security">
          <ProfileRow 
            icon="bell-outline" 
            label="Notifications" 
            value={<Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: '#E2E8F0', true: '#143832' }} thumbColor="white" />}
          />
          <ProfileRow icon="web" label="Language" value="English" />
          <ProfileRow 
            icon="weather-night" 
            label="Dark Mode" 
            isLast
            value={<Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ false: '#E2E8F0', true: '#143832' }} thumbColor="white" />}
          />
        </ProfileSection>

        {/* Section 4 - SETTINGS */}
        <ProfileSection title="Settings">
          <ProfileRow icon="account-group-outline" label="Family Profiles"
            value={<MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8"/>}
            onPress={() => setFamilySheetVisible(true)}
          />
          <ProfileRow icon="database-export-outline" label="Export All Data"
            value={<MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8"/>}
            onPress={() => Alert.alert('Export Data', 
              `Your data export will be emailed to ${user.email ?? 'your email'} within 24 hours.`)}
          />
          <ProfileRow icon="delete-outline" label="Delete All Data" danger
            value={<MaterialCommunityIcons name="chevron-right" size={20} color="#DC2626"/>}
            onPress={() => Alert.alert('Delete All Data', 
              'This will permanently delete all your health records. This cannot be undone.',
              [{ text: 'Cancel', style: 'cancel' }, 
               { text: 'Delete', style: 'destructive', 
                 onPress: () => Alert.alert('Not implemented', 'Data deletion coming soon.') }])}
          />
          <ProfileRow icon="account-remove-outline" label="Delete Account" danger isLast
            value={<MaterialCommunityIcons name="chevron-right" size={20} color="#DC2626"/>}
            onPress={() => Alert.alert('Delete Account',
              'Permanently close your Sanarch account and erase all data.',
              [{ text: 'Cancel', style: 'cancel'},
               { text: 'Delete Account', style: 'destructive',
                 onPress: () => Alert.alert('Not implemented') }])}
          />
        </ProfileSection>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity
          className="mx-4 mb-6 h-14 rounded-full border-2 border-primary/20 items-center justify-center flex-row"
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#143832" style={{ marginRight: 8 }} />
          <Text className="text-primary font-display-bold text-base">Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Family Profiles BottomSheet */}
      <BottomSheet visible={familySheetVisible} onClose={() => setFamilySheetVisible(false)} title="Family Profiles" snapHeight={340}>
        <View className="flex-row items-center py-3 border-b border-primary/5 mb-4">
          <View className="h-8 w-8 rounded-full bg-primary/10 items-center justify-center mr-3">
            <MaterialCommunityIcons name="account-circle" size={20} color="#143832" />
          </View>
          <Text className="flex-1 font-display-semibold text-slate-900 text-sm">
            {user.full_name} (You)
          </Text>
          <View className="bg-primary/10 px-2 py-0.5 rounded-full">
            <Text className="text-xs text-primary font-display-bold">Primary</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          className="flex-row items-center justify-center border-2 border-dashed border-primary/20 rounded-xl py-4"
          onPress={() => Alert.alert('Coming Soon', 'Family member management will be available in the next update.')}
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={22} color="#143832" style={{ marginRight: 8 }} />
          <Text className="text-primary font-display-semibold text-sm">Add Family Member</Text>
        </TouchableOpacity>
      </BottomSheet>
    </SafeAreaView>
  );
}
