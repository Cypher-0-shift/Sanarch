import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from '../ui/SkeletonLoader';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

const SkeletonCard: React.FC = () => {
  return (
    <View style={styles.card}>
      {/* Title bar */}
      <SkeletonLoader width="70%" height={16} style={{ marginBottom: 8 }} />

      {/* Subtitle bar */}
      <SkeletonLoader width="45%" height={12} style={{ marginBottom: 16 }} />

      {/* Tag bar */}
      <SkeletonLoader width="30%" height={20} borderRadius={20} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING[4],
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
});

export default SkeletonCard;
