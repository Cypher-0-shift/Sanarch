import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, InteractionManager, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { useProfileStore, type Profile } from '../../../store/profileStore';
import { EMPTY_USER } from '../../../constants/placeholders';
import SanarchIdCard from '../../../components/profile/SanarchIdCard';
import SkeletonLoader from '../../../components/ui/SkeletonLoader';
import { useGetProfile, useFamilyProfiles, type ProfileResponse } from '../../../hooks/useProfile';
import { COLORS, FONTS, RADIUS, SPACING } from '../../../constants/theme';
import { logout as firebaseLogout } from '../../../services/auth';

function calculateAge(dob?: string): string {
  if (!dob) return '—';
  const parts = dob.split('/');
  if (parts.length !== 3) return '—';
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return '—';
  const birth = new Date(year, month, day);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  if (age < 0) return '—';
  return `${age} yrs`;
}

let sessionNudgeDismissed = false;

function InfoRow({ label, value, isLast = false }: { label: string, value: string, isLast?: boolean }) {
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user) ?? EMPTY_USER;
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const familyMembers = useProfileStore((s) => s.familyMembers);
  const setActiveProfile = useProfileStore((s) => s.setActiveProfile);
  
  const [isReady, setIsReady] = useState(false);
  const [showNudge, setShowNudge] = useState(false);

  const sanarchId = user.sanarch_id ?? null;

  const {
    data: profileData,
    isLoading: profileLoading,
    isError: profileError,
  } = useGetProfile(sanarchId);

  const {
    data: familyData,
    isLoading: familyLoading,
  } = useFamilyProfiles(sanarchId);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
    return () => task.cancel();
  }, []);

  // Determine Nudge Visibility
  useFocusEffect(
    useCallback(() => {
      if (activeProfile && !sessionNudgeDismissed) {
        const needsNudge = !activeProfile.dob || !activeProfile.bloodGroup || !activeProfile.heightCm || !activeProfile.weightKg;
        setShowNudge(needsNudge);
      }
    }, [activeProfile])
  );

  const handleDismissNudge = () => {
    sessionNudgeDismissed = true;
    setShowNudge(false);
  };

  const handleSignOut = async () => {
    await firebaseLogout();
  };

  if (!isReady) return <View style={styles.container} />;

  // Prepare card data
  const cardProfile = profileData || activeProfile;
  const isProfileLoading = profileLoading && !profileData && !activeProfile;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* AvatarBlock */}
        <View style={styles.avatarBlock}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(activeProfile?.name ?? user.full_name ?? 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.avatarName}>{activeProfile?.name ?? user.full_name}</Text>
          
          <TouchableOpacity 
            style={styles.editProfileBtn}
            onPress={() => router.push('/(tabs)/profile/edit-profile')}
            activeOpacity={0.7}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Completion Nudge */}
        {showNudge && (
          <View style={styles.nudgeCard}>
            <View style={styles.nudgeIcon}>
              <MaterialCommunityIcons name="alert-circle-outline" size={20} color={COLORS.resultLow} />
            </View>
            <View style={styles.nudgeContent}>
              <Text style={styles.nudgeTitle}>Complete your profile</Text>
              <Text style={styles.nudgeSub}>Adding your health details helps generate better AI insights.</Text>
            </View>
            <TouchableOpacity onPress={handleDismissNudge} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialCommunityIcons name="close" size={20} color={COLORS.ink400} />
            </TouchableOpacity>
          </View>
        )}

        {/* SanarchIDCard */}
        <View style={styles.section}>
          {isProfileLoading ? (
            <SkeletonLoader width="100%" height={200} borderRadius={RADIUS.xl} />
          ) : (
            <View>
              {profileError && (
                <View style={styles.fallbackWarning}>
                  <MaterialCommunityIcons name="cloud-off-outline" size={14} color={COLORS.ink600} />
                  <Text style={styles.fallbackWarningText}>Showing cached ID</Text>
                </View>
              )}
              <SanarchIdCard
                sanarchId={(cardProfile as any)?.sanarchId ?? (cardProfile as any)?.sanarch_id ?? user.sanarch_id ?? ''}
                patientName={(cardProfile as any)?.name ?? (cardProfile as any)?.full_name ?? user.full_name ?? ''}
                profileType={(cardProfile as any)?.profileType ?? (cardProfile as any)?.profile_type ?? 'P'}
                memberIndex={(cardProfile as any)?.memberIndex ?? (cardProfile as any)?.member_index ?? 0}
                qrBase64={(cardProfile as any)?.qrBase64 ?? (cardProfile as any)?.qr_base64 ?? ''}
              />
            </View>
          )}
        </View>

        {/* HealthDetailsCard */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Health Details</Text>
          <InfoRow label="Date of Birth" value={activeProfile?.dob ?? ''} />
          <InfoRow label="Age" value={calculateAge(activeProfile?.dob)} />
          <InfoRow label="Blood Group" value={activeProfile?.bloodGroup ?? ''} />
          <InfoRow label="Height" value={activeProfile?.heightCm ? `${activeProfile.heightCm} cm` : ''} />
          <InfoRow label="Weight" value={activeProfile?.weightKg ? `${activeProfile.weightKg} kg` : ''} isLast />
        </View>

        {/* AccountDetailsCard */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <InfoRow label="Email" value={activeProfile?.email ?? user.email ?? ''} />
          <InfoRow label="Phone" value={user.phone_number ?? ''} />
          <InfoRow label="City" value={activeProfile?.city ?? ''} isLast />
        </View>

        {/* FamilyMembersSection */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Family Members</Text>
          {familyMembers.length > 1 ? (
            familyMembers.map((member, index) => {
              if (member.isMainAccount) return null;
              const isActive = activeProfile?.id === member.id;
              
              return (
                <View key={member.id} style={[styles.familyRow, index !== familyMembers.length - 1 && styles.infoRowBorder]}>
                  <View style={styles.familyAvatar}>
                    <Text style={styles.familyAvatarText}>{member.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.familyInfo}>
                    <Text style={styles.familyName}>{member.name}</Text>
                    <Text style={styles.familyRelation}>{member.relation ?? 'Dependent'}</Text>
                  </View>
                  {isActive && (
                    <View style={styles.activeTag}>
                      <Text style={styles.activeTagText}>Active</Text>
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyFamilyText}>No dependents added yet.</Text>
          )}
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/profile/family')}
            style={styles.manageFamilyBtn}
          >
            <Text style={styles.manageFamilyText}>Manage Family Profiles</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.brandPrimary} />
          </TouchableOpacity>
        </View>

        {/* Settings Link */}
        <TouchableOpacity 
          style={styles.settingsLink}
          onPress={() => router.push('/(tabs)/profile/settings')}
          activeOpacity={0.7}
        >
          <View style={styles.settingsLinkLeft}>
            <View style={styles.settingsIcon}>
              <MaterialCommunityIcons name="cog-outline" size={22} color={COLORS.ink800} />
            </View>
            <Text style={styles.settingsText}>Settings & Preferences</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.ink400} />
        </TouchableOpacity>

        {/* SignOutButton */}
        <TouchableOpacity 
          style={styles.signOutBtn}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="logout" size={20} color={COLORS.resultHigh} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  header: {
    paddingHorizontal: SPACING[6],
    paddingVertical: SPACING[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.canvas,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.jakartaBold,
    color: COLORS.ink900,
  },
  scrollContent: {
    paddingHorizontal: SPACING[6],
    paddingBottom: 100,
  },
  avatarBlock: {
    alignItems: 'center',
    marginBottom: SPACING[6],
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[3],
  },
  avatarText: {
    fontSize: 32,
    fontFamily: FONTS.jakartaBold,
    color: COLORS.brandPrimary,
  },
  avatarName: {
    fontSize: 22,
    fontFamily: FONTS.jakartaBold,
    color: COLORS.ink900,
    marginBottom: SPACING[2],
  },
  editProfileBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.ink200,
    backgroundColor: COLORS.surface,
  },
  editProfileText: {
    fontSize: 13,
    fontFamily: FONTS.jakartaBold,
    color: COLORS.ink800,
  },
  nudgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.resultLowBg,
    padding: SPACING[4],
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.2)',
    marginBottom: SPACING[5],
  },
  nudgeIcon: {
    marginRight: SPACING[3],
  },
  nudgeContent: {
    flex: 1,
  },
  nudgeTitle: {
    fontSize: 14,
    fontFamily: FONTS.jakartaBold,
    color: COLORS.resultLow,
    marginBottom: 2,
  },
  nudgeSub: {
    fontSize: 12,
    fontFamily: FONTS.jakartaMedium,
    color: COLORS.ink800,
  },
  section: {
    marginBottom: SPACING[6],
  },
  fallbackWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  fallbackWarningText: {
    fontSize: 12,
    fontFamily: FONTS.jakartaMedium,
    color: COLORS.ink600,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING[5],
    marginBottom: SPACING[6],
    borderWidth: 1,
    borderColor: COLORS.ink200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: FONTS.jakartaBold,
    color: COLORS.ink900,
    marginBottom: SPACING[4],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ink100,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: FONTS.jakartaMedium,
    color: COLORS.ink600,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: FONTS.jakartaBold,
    color: COLORS.ink900,
  },
  familyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  familyAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.catOtherBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  familyAvatarText: {
    fontSize: 16,
    fontFamily: FONTS.jakartaBold,
    color: COLORS.ink600,
  },
  familyInfo: {
    flex: 1,
  },
  familyName: {
    fontSize: 14,
    fontFamily: FONTS.jakartaBold,
    color: COLORS.ink900,
  },
  familyRelation: {
    fontSize: 12,
    fontFamily: FONTS.jakartaMedium,
    color: COLORS.ink600,
  },
  activeTag: {
    backgroundColor: COLORS.brandTint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  activeTagText: {
    fontSize: 10,
    fontFamily: FONTS.jakartaBold,
    color: COLORS.brandPrimary,
    textTransform: 'uppercase',
  },
  emptyFamilyText: {
    fontSize: 14,
    fontFamily: FONTS.jakartaRegular,
    color: COLORS.ink600,
    marginBottom: 12,
  },
  manageFamilyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.ink100,
  },
  manageFamilyText: {
    fontSize: 14,
    fontFamily: FONTS.jakartaBold,
    color: COLORS.brandPrimary,
  },
  settingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING[5],
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.ink200,
    marginBottom: SPACING[6],
  },
  settingsLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.ink100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsText: {
    fontSize: 15,
    fontFamily: FONTS.jakartaBold,
    color: COLORS.ink900,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: COLORS.resultHighBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.1)',
  },
  signOutText: {
    fontSize: 15,
    fontFamily: FONTS.jakartaBold,
    color: COLORS.resultHigh,
  }
});
