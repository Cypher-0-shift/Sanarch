import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { MedicalEventLabel } from '../../constants/mock';

interface MedicalEventCardProps {
  id: string;
  condition: string;
  date_start: string;
  date_end?: string;
  hospital: string;
  doctor?: string;
  document_count: number;
  label: MedicalEventLabel;
  hasAbnormalities?: boolean;
  onPress: () => void;
}

const LABEL_CONFIG: Record<
  MedicalEventLabel,
  { icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string; bg: string; text: string }
> = {
  lab_report: {
    icon: 'file-document-outline',
    color: '#004D36',
    bg: '#E8F5E9',
    text: 'REPORT',
  },
  prescription: {
    icon: 'pill',
    color: '#E65100',
    bg: '#FFF3E0',
    text: 'MEDS',
  },
  hospital_summary: {
    icon: 'hospital-building',
    color: '#0277BD',
    bg: '#E3F2FD',
    text: 'SUMMARY',
  },
  scan: {
    icon: 'radiology-box',
    color: '#7B1FA2',
    bg: '#F3E5F5',
    text: 'IMAGING',
  },
};

import { formatDate } from '../../utils/date';

const MedicalEventCard: React.FC<MedicalEventCardProps> = ({
  condition,
  date_start,
  hospital,
  doctor,
  label,
  hasAbnormalities,
  onPress,
}) => {
  const config = LABEL_CONFIG[label] || LABEL_CONFIG.lab_report;

  return (
    <Pressable
      className="bg-white rounded-[24px] p-5 mb-4 shadow-sm border border-[#E5E2DE]"
      style={({ pressed }) => pressed ? { transform: [{ scale: 0.98 }], opacity: 0.95 } : {}}
      onPress={onPress}
    >
      <View className="flex-row gap-4">
        {/* Left Icon Block */}
        <View 
          className="w-12 h-12 rounded-xl items-center justify-center shrink-0"
          style={{ backgroundColor: config.bg }}
        >
          <MaterialCommunityIcons name={config.icon} size={24} color={config.color} />
        </View>

        {/* Right Content Block */}
        <View className="flex-1 min-w-0">
          <View className="flex-row justify-between items-start">
            <Text className="text-base font-display-bold text-[#2D3A2F] flex-1 mr-2" numberOfLines={2} ellipsizeMode="tail">
              {condition}
            </Text>
            <View className="flex-row items-center gap-2">
              {hasAbnormalities && (
                <View className="px-2 py-0.5 rounded-md bg-[#FFF8E1] border border-[#FFECB3]">
                  <Text className="text-[10px] font-display-bold uppercase text-[#F57C00] tracking-wider">
                    ⚠ Abnormal
                  </Text>
                </View>
              )}
              <View 
                className="px-2 py-0.5 rounded-md"
                style={{ backgroundColor: config.bg }}
              >
                <Text className="text-[11px] font-display-bold uppercase" style={{ color: config.color }}>
                  {config.text}
                </Text>
              </View>
            </View>
          </View>
          
          <Text className="text-sm text-[#5C6E60] font-display mt-1 truncate" numberOfLines={1}>
            {hospital}
          </Text>
          
          <View className="flex-row items-center gap-2 mt-3 flex-wrap">
            <MaterialCommunityIcons name="calendar-blank" size={14} color="#819685" />
            <Text className="text-[11px] text-[#819685] font-display-medium uppercase tracking-wide">
              {formatDate(date_start)}
            </Text>
            {doctor && (
              <>
                <Text className="text-[#E5E2DE]">•</Text>
                <Text className="text-[11px] text-[#819685] font-display-medium uppercase tracking-wide">
                  {doctor}
                </Text>
              </>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default MedicalEventCard;
