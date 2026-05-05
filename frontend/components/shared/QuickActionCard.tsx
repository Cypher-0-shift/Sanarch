import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  variant?: 'default' | 'emergency';
  onPress: () => void;
}

export default function QuickActionCard({ title, description, icon, variant = 'default', onPress }: QuickActionCardProps) {
  const isEmergency = variant === 'emergency';
  
  return (
    <TouchableOpacity 
      className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3 flex-1"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className={`h-12 w-12 rounded-lg items-center justify-center ${isEmergency ? 'bg-red-50' : 'bg-primary/10'}`}>
        <MaterialCommunityIcons 
          name={icon} 
          size={24} 
          color={isEmergency ? '#DC2626' : '#143832'} 
        />
      </View>
      <View>
        <Text className="font-display-bold text-slate-900 text-base">{title}</Text>
        <Text className="text-xs text-slate-500 mt-1 leading-relaxed font-display">{description}</Text>
      </View>
    </TouchableOpacity>
  );
}
