/**
 * ProfileSwitcherSheet — Phase 4
 *
 * Bottom sheet to switch between family members.
 * Displays a list of profiles with an active badge for the currently selected one.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet from '../navigation/BottomSheet';
import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';

import { type Profile } from '../../store/profileStore';

interface ProfileSwitcherSheetProps {
  visible: boolean;
  onClose: () => void;
  profiles: Profile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
}

export default function ProfileSwitcherSheet({
  visible,
  onClose,
  profiles,
  activeProfileId,
  onSelectProfile,
}: ProfileSwitcherSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Switch Profile">
      <ScrollView contentContainerStyle={styles.list}>
        {profiles.map((profile) => {
          const isActive = profile.id === activeProfileId;
          const initials = profile.name ? profile.name.slice(0, 2).toUpperCase() : 'U';

          return (
            <Pressable
              key={profile.id}
              style={[styles.row, isActive && styles.rowActive]}
              onPress={() => {
                onSelectProfile(profile.id);
                onClose();
              }}
            >
              <View style={[styles.avatar, isActive && styles.avatarActive]}>
                <Text style={[styles.avatarText, isActive && styles.avatarTextActive]}>
                  {initials}
                </Text>
              </View>

              <View style={styles.info}>
                <Text style={styles.name}>
                  {profile.name}
                </Text>
                <Text style={styles.relation}>
                  {profile.isMainAccount ? 'Primary Account' : profile.relation}
                </Text>
              </View>

              {isActive && (
                <View style={styles.activeBadge}>
                  <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.brandPrimary} />
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: SPACING[4],
    gap: SPACING[2],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[3],
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowActive: {
    backgroundColor: COLORS.brandTint,
    borderColor: 'rgba(67,97,238,0.15)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.ink100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING[3],
  },
  avatarActive: {
    backgroundColor: COLORS.brandPrimary,
  },
  avatarText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 16,
    color: COLORS.ink600,
  },
  avatarTextActive: {
    color: COLORS.surface,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 15,
    color: COLORS.ink900,
  },
  relation: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 13,
    color: COLORS.ink400,
  },
  activeBadge: {
    marginLeft: SPACING[3],
  },
});
