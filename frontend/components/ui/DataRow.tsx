import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SkeletonLoader from './SkeletonLoader';

interface DataRowProps {
  label: string;
  value: string | null;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

export default function DataRow({ label, value, icon }: DataRowProps) {
  return (
    <View className="flex-row items-center py-3 border-b border-[#F5F3F0]">
      {icon && (
        <MaterialCommunityIcons name={icon} size={18} color="#819685" style={{ marginRight: 12 }} />
      )}
      <Text style={{ width: 120 }} className="text-xs uppercase tracking-wider text-[#819685] font-display-bold text-left">
        {label}
      </Text>
      <View style={{ flex: 1 }}>
        {value === null ? (
          <SkeletonLoader width="60%" height={14} />
        ) : (
          <Text className="text-sm font-display-medium text-[#2D3A2F] text-left">
            {value}
          </Text>
        )}
      </View>
    </View>
  );
}
