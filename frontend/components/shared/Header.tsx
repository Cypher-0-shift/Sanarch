import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SanarchLogo from './SanarchLogo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import BottomSheet from '../ui/BottomSheet';

const RECENT_ACTIVITIES = [
  { text: 'Lab_Report_021.pdf uploaded', time: '2 hours ago' },
  { text: 'Blood Test - Jan 2026 accessed', time: 'Yesterday' },
  { text: 'MRI Scan shared with Dr. Patel', time: '3 days ago' },
];

export default function Header() {
  const router = useRouter();
  const [showActivity, setShowActivity] = useState(false);

  return (
    <>
      <View className="bg-background-light/80 px-6 py-4 flex-row justify-between items-center z-50">
        <View className="flex-row items-center">
          <View className="bg-primary p-1.5 rounded-lg mr-2">
            <SanarchLogo size={22} color="#FFFFFF" />
          </View>
          <Text className="text-xl font-display-bold tracking-tight text-primary">Sanarch</Text>
        </View>
        
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => setShowActivity(true)} activeOpacity={0.75} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialCommunityIcons name="history" size={24} color="#143832" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="h-10 w-10 rounded-full bg-primary/20 items-center justify-center"
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.75}
            hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
          >
            <MaterialCommunityIcons name="account" size={24} color="#143832" />
          </TouchableOpacity>
        </View>
      </View>

      <BottomSheet visible={showActivity} onClose={() => setShowActivity(false)} title="Recent Activity">
        <ScrollView>
          {RECENT_ACTIVITIES.map((activity, index) => (
            <View key={index} className="flex-row items-center py-3 border-b border-primary/5">
              <MaterialCommunityIcons name="clock-outline" size={16} color="#94A3B8" style={{ marginRight: 12 }} />
              <Text className="flex-1 font-display text-sm text-slate-700">{activity.text}</Text>
              <Text className="text-xs text-slate-400 font-display">{activity.time}</Text>
            </View>
          ))}
        </ScrollView>
      </BottomSheet>
    </>
  );
}
