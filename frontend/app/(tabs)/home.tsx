import { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/shared/Header';
import QuickActionCard from '../../components/shared/QuickActionCard';
import HealthTipCard from '../../components/shared/HealthTipCard';
import FAB from '../../components/shared/FAB';
import BottomSheet from '../../components/ui/BottomSheet';
import GlassmorphismCard from '../../components/ui/GlassmorphismCard';
import MedicalEventCard from '../../components/records/MedicalEventCard';
import { MOCK_MEDICAL_EVENTS } from '../../constants/mock';

const RECENT_ACTIVITIES = [
  { text: 'Lab_Report_021.pdf uploaded', time: '2 hours ago' },
  { text: 'Blood Test - Jan 2026 accessed', time: 'Yesterday' },
  { text: 'MRI Scan shared with Dr. Patel', time: '3 days ago' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [showActivity, setShowActivity] = useState(false);
  const [showUploadCard, setShowUploadCard] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-background-light" edges={['top']}>
      {/* Sticky Header */}
      <Header />

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting Section */}
        <View className="py-6 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-3xl font-display-bold tracking-tight text-primary">
              Hello Alex
            </Text>
            <Text className="text-slate-600 mt-1 font-display">
              Your health records are safe with Sanarch.
            </Text>
          </View>


        </View>

        {/* Search Bar */}
        <View className="bg-white rounded-xl shadow-sm mb-8 flex-row items-center">
          <MaterialCommunityIcons name="magnify" size={24} color="#94A3B8" className="ml-4" />
          <TextInput 
            className="flex-1 h-14 px-3 font-display text-slate-800"
            placeholder="Search records, doctors, or tips..."
            placeholderTextColor="#94A3B8"
            onFocus={() => router.push('/(tabs)/profile/search')}
          />
        </View>

        {/* 2x2 Quick Action Grid */}
        <View className="mb-8 flex-col gap-4">
          <View className="flex-row gap-4">
            <QuickActionCard 
              title="Upload New"
              description="Add lab reports or prescriptions securely."
              icon="file-upload-outline"
              onPress={() => router.navigate('/(tabs)/upload')}
            />
            <QuickActionCard 
              title="View Records"
              description="Access your clinical history anytime."
              icon="folder-account-outline"
              onPress={() => router.navigate('/(tabs)/records')}
            />
          </View>
          <View className="flex-row gap-4">
            <QuickActionCard 
              title="My Timeline"
              description="View your complete medical history."
              icon="timeline-clock-outline"
              onPress={() => router.navigate('/(tabs)/records')}
            />
            <QuickActionCard 
              title="Doctor's View"
              description="Share records via timed QR code."
              icon="qrcode-scan"
              onPress={() => router.navigate('/(tabs)/doctors')}
            />
          </View>
        </View>

        {/* Recent Records Section */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-display-bold text-slate-900">Recent Records</Text>
            <TouchableOpacity onPress={() => router.navigate('/(tabs)/records')}>
              <Text className="text-primary font-display-bold text-sm">View all</Text>
            </TouchableOpacity>
          </View>
          {MOCK_MEDICAL_EVENTS.slice(0, 2).map((event) => (
            <MedicalEventCard
              key={event.id}
              id={event.id}
              condition={event.condition}
              date_start={event.date_start}
              date_end={event.date_end ?? undefined}
              hospital={event.hospital}
              doctor={event.doctor}
              document_count={event.document_count}
              label={event.label}
              onPress={() => router.push(`/(tabs)/records/${event.id}`)}
            />
          ))}
        </View>

        {/* Health Tip Card */}
        <HealthTipCard />

      </ScrollView>

      {/* Floating Action Button — opens upload card */}
      <FAB icon="plus" onPress={() => setShowUploadCard(true)} />

      {/* Upload Action Card */}
      <GlassmorphismCard
        visible={showUploadCard}
        onClose={() => setShowUploadCard(false)}
        onTakePhoto={() => {
          setShowUploadCard(false);
          router.push('/(tabs)/upload');
        }}
        onUploadFile={() => {
          setShowUploadCard(false);
          router.push('/(tabs)/upload');
        }}
      />

      {/* Recent Activity Bottom Sheet */}
      <BottomSheet
        visible={showActivity}
        onClose={() => setShowActivity(false)}
        title="Recent Activity"
        snapHeight={300}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {RECENT_ACTIVITIES.map((item, index) => (
            <View
              key={index}
              className="flex-row items-center py-3 border-b border-slate-100"
            >
              <MaterialCommunityIcons
                name="clock-outline"
                size={16}
                color="#94A3B8"
                style={{ marginRight: 12 }}
              />
              <Text className="flex-1 font-display text-sm text-slate-700">
                {item.text}
              </Text>
              <Text className="text-xs text-slate-400 font-display">{item.time}</Text>
            </View>
          ))}
        </ScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}
