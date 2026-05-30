import { View, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface RecordCardFullProps {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  previewImageStr?: string; // e.g. "https://..."
}

export default function RecordCardFull({ id, title, subtitle, icon, previewImageStr }: RecordCardFullProps) {
  const router = useRouter();

  return (
    <View className="bg-white rounded-xl shadow-sm border border-primary/5 p-4 mb-3 gap-4">
      {/* Header Row */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-4">
          <Text className="font-display-bold text-slate-900 text-base" numberOfLines={1}>{title}</Text>
          <Text className="text-xs text-primary font-display mt-0.5">{subtitle}</Text>
        </View>
        <View className="bg-primary rounded-lg h-10 w-10 items-center justify-center">
          <MaterialCommunityIcons name={icon} size={24} color="white" />
        </View>
      </View>

      {/* Document Preview */}
      <View className="w-full aspect-[21/9] rounded-lg bg-slate-100 items-center justify-center overflow-hidden border border-slate-200">
        {previewImageStr ? (
           <Image source={{ uri: previewImageStr }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <MaterialCommunityIcons name="image-off-outline" size={32} color="#CBD5E1" />
        )}
      </View>

      {/* Actions Row */}
      <View className="flex-row items-center gap-3">
        <TouchableOpacity 
          className="flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-primary/5 py-2 h-9"
          onPress={() => router.push(`/(tabs)/records/${id}`)}
          activeOpacity={0.75}
        >
          <MaterialCommunityIcons name="eye-outline" size={16} color="#143832" />
          <Text className="text-sm font-display-semibold text-primary">View</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="h-9 w-9 rounded-lg bg-primary/5 items-center justify-center" activeOpacity={0.75}>
          <MaterialCommunityIcons name="download" size={18} color="#143832" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
