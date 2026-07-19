/**
 * NotificationsSheet — Phase 4
 *
 * Bottom sheet to show recent notifications.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet from '../navigation/BottomSheet';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';
import EmptyStateCard from '../empty-states/EmptyStateCard';

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
}

interface NotificationsSheetProps {
  visible: boolean;
  onClose: () => void;
  notifications: Notification[];
}

export default function NotificationsSheet({
  visible,
  onClose,
  notifications,
}: NotificationsSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Notifications">
      <ScrollView contentContainerStyle={styles.list}>
        {notifications.length === 0 ? (
          <EmptyStateCard
            headline="All caught up"
            subtext="You have no new notifications right now."
            cta={{ label: 'Close', onPress: onClose }}
          />
        ) : (
          notifications.map((notif) => (
            <View key={notif.id} style={[styles.card, !notif.isRead && styles.cardUnread]}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons 
                  name="bell-outline" 
                  size={20} 
                  color={!notif.isRead ? COLORS.brandPrimary : COLORS.ink400} 
                />
              </View>
              <View style={styles.content}>
                <View style={styles.headerRow}>
                  <Text style={[styles.title, !notif.isRead && styles.titleUnread]} numberOfLines={1}>
                    {notif.title}
                  </Text>
                  <Text style={styles.date}>{notif.date}</Text>
                </View>
                <Text style={styles.message} numberOfLines={2}>
                  {notif.message}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: SPACING[4],
    gap: SPACING[3],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    padding: SPACING[3],
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.ink100,
    gap: SPACING[3],
  },
  cardUnread: {
    backgroundColor: COLORS.brandTint,
    borderColor: 'rgba(67,97,238,0.15)',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.icon,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 14,
    color: COLORS.ink900,
    flex: 1,
  },
  titleUnread: {
    color: COLORS.brandPrimary,
  },
  date: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 11,
    color: COLORS.ink400,
    marginLeft: SPACING[2],
  },
  message: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 13,
    color: COLORS.ink600,
    lineHeight: 18,
  },
});
