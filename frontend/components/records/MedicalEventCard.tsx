import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
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
  onPress: () => void;
}

const LABEL_CONFIG: Record<
  MedicalEventLabel,
  {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    color: string;
    bg: string;
    text: string;
  }
> = {
  lab_report: {
    icon: 'water',
    color: '#2563EB',
    bg: '#DBEAFE',
    text: 'Lab Report',
  },
  prescription: {
    icon: 'pill',
    color: '#7C3AED',
    bg: '#EDE9FE',
    text: 'Prescription',
  },
  hospital_summary: {
    icon: 'hospital-building',
    color: '#166534',
    bg: '#DCFCE7',
    text: 'Hospital Summary',
  },
  scan: {
    icon: 'radiology-box',
    color: '#475569',
    bg: '#F1F5F9',
    text: 'Scan',
  },
};

const formatDateRange = (start: string, end?: string): string => {
  const fmt = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };
  if (end) return `${fmt(start)} — ${fmt(end)}`;
  return fmt(start);
};

const MedicalEventCard: React.FC<MedicalEventCardProps> = ({
  condition,
  date_start,
  date_end,
  hospital,
  doctor,
  document_count,
  label,
  onPress,
}) => {
  const config = LABEL_CONFIG[label];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Row 1: Icon + Condition + Chevron */}
      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
          <MaterialCommunityIcons
            name={config.icon}
            size={20}
            color={config.color}
          />
        </View>
        <Text style={styles.condition} numberOfLines={1}>
          {condition}
        </Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={COLORS.slate400}
        />
      </View>

      {/* Row 2: Date range */}
      <View style={styles.metaRow}>
        <MaterialCommunityIcons
          name="calendar-outline"
          size={14}
          color={COLORS.slate500}
        />
        <Text style={styles.metaText}>
          {formatDateRange(date_start, date_end)}
        </Text>
      </View>

      {/* Row 3: Hospital */}
      <View style={styles.metaRow}>
        <MaterialCommunityIcons
          name="map-marker-outline"
          size={14}
          color={COLORS.slate500}
        />
        <Text style={styles.metaText} numberOfLines={1}>
          {hospital}
          {doctor ? ` · ${doctor}` : ''}
        </Text>
      </View>

      {/* Row 4: Badge pills */}
      <View style={styles.badgeRow}>
        <View style={[styles.badge, { backgroundColor: config.bg }]}>
          <Text style={[styles.badgeText, { color: config.color }]}>
            {config.text}
          </Text>
        </View>
        <View style={styles.badge}>
          <MaterialCommunityIcons
            name="file-document-outline"
            size={12}
            color={COLORS.slate600}
          />
          <Text style={styles.badgeText}>
            {document_count} {document_count === 1 ? 'doc' : 'docs'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: `${COLORS.primary}0D`, // primary/5
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  condition: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: COLORS.slate900,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingLeft: 52, // align with text after icon box
  },
  metaText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: COLORS.slate500,
    marginLeft: 6,
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 52,
    marginTop: 6,
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: COLORS.slate600,
  },
});

export default MedicalEventCard;
