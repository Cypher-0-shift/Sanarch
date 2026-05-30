import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export default function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-20 px-6">
      <View className="w-16 h-16 rounded-full bg-[#E8F5E9] items-center justify-center mb-4">
        <MaterialCommunityIcons name={icon} size={32} color="#004D36" />
      </View>
      <Text className="text-lg font-display-bold text-[#2D3A2F] text-center">{title}</Text>
      {subtitle && (
        <Text className="text-sm font-display text-[#5C6E60] mt-2 text-center">
          {subtitle}
        </Text>
      )}
      {action && (
        <TouchableOpacity
          className="mt-6 h-12 px-6 bg-[#004D36] rounded-full items-center justify-center"
          onPress={action.onPress}
          activeOpacity={0.75}
        >
          <Text className="text-white font-display-bold text-sm">{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
