import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface RecordCardCompactProps {
  id: string;
  title: string;
  subtitle: string;
}

export default function RecordCardCompact({ id, title, subtitle }: RecordCardCompactProps) {
  const router = useRouter();

  return (
    <TouchableOpacity activeOpacity={0.75} 
      className="bg-white rounded-xl shadow-sm border border-[#E5E2DE] p-4 flex-row items-center gap-4 mb-3"
      onPress={() => router.push(`/(tabs)/records/${id}`)}
    >
      <View className="h-10 w-10 rounded-lg bg-[#004D36] items-center justify-center">
        <MaterialCommunityIcons name="file-document-outline" size={24} color="white" />
      </View>
      
      <View className="flex-1">
        <Text className="font-display-bold text-[#2D3A2F] text-base" numberOfLines={1}>{title}</Text>
        <Text className="text-xs text-[#5C6E60] font-display mt-0.5">{subtitle}</Text>
      </View>
      
      <MaterialCommunityIcons name="chevron-right" size={24} color="#94A3B8" />
    </TouchableOpacity>
  );
}
