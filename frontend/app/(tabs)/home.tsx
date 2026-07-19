/**
 * Home Screen — Phase 4
 *
 * Primary dashboard. Displays greeting, profile switcher, health summary, and timeline.
 * Handles zero-document state natively (hiding stats).
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// Stores & API
import { useAuthStore } from '../../store/authStore';
import { useProfileStore } from '../../store/profileStore';
import { useDocumentsStore } from '../../store/documentsStore';
import { getTimeline, type TimelineEvent } from '../../services/api';

// Components
import HomeHeader from '../../components/home/HomeHeader';
import SearchBar from '../../components/inputs/SearchBar';
import HealthSummaryCard from '../../components/home/HealthSummaryCard';
import TimelinePreview from '../../components/home/TimelinePreview';
import FirstTimeEmptyState from '../../components/empty-states/FirstTimeEmptyState';
import ProfileSwitcherSheet from '../../components/home/ProfileSwitcherSheet';
import NotificationsSheet from '../../components/home/NotificationsSheet';
import SanarchIDModal from '../../components/home/SanarchIDModal';
import { COLORS, SPACING } from '../../constants/theme';
import { logger } from '../../utils/logger';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ── Stores ───────────────────────────────────────────────────────
  const user = useAuthStore((s) => s.user);
  const { activeProfile, familyMembers, setActiveProfile } = useProfileStore();
  const { documents } = useDocumentsStore();

  // ── Local State ──────────────────────────────────────────────────
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [isTimelineLoading, setIsTimelineLoading] = useState(true);
  const [isTimelineError, setIsTimelineError] = useState(false);
  const [isIDModalVisible, setIsIDModalVisible] = useState(false);
  const [isProfileSheetVisible, setIsProfileSheetVisible] = useState(false);
  const [isNotifSheetVisible, setIsNotifSheetVisible] = useState(false);

  // ── Derived Data ─────────────────────────────────────────────────
  const docCount = documents.length;
  const isFirstTime = docCount === 0;

  // Combine active profile and family members for the switcher
  const allProfiles = useMemo(() => {
    const list = [];
    if (activeProfile) list.push(activeProfile);
    familyMembers.forEach(m => {
      if (m.id !== activeProfile?.id) list.push(m);
    });
    return list;
  }, [activeProfile, familyMembers]);

  // Last activity from documents (simplistic approach: most recent document date)
  const lastActivityDate = useMemo(() => {
    if (docCount === 0) return null;
    try {
      const latest = documents[0]; // Assuming pre-sorted by created_at desc
      return new Date(latest.created_at).toLocaleDateString('en-IN', {
        month: 'short', day: 'numeric'
      });
    } catch {
      return null;
    }
  }, [documents, docCount]);

  // ── Data Fetching ────────────────────────────────────────────────
  const fetchTimeline = async () => {
    if (!activeProfile?.id) return;
    setIsTimelineLoading(true);
    setIsTimelineError(false);
    try {
      const res = await getTimeline(activeProfile.id, 5, 0);
      setTimelineEvents(res.events || []);
    } catch (error) {
      logger.error('[Home] Failed to load timeline:', error);
      setIsTimelineError(true);
    } finally {
      setIsTimelineLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [activeProfile?.id]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleSearchFocus = () => {
    // For Phase 4, the spec says "expands into a bottom-sheet results panel. Do NOT navigate to a separate search screen."
    // We will handle this inline later or via a dedicated search sheet.
    // For now, it stays as a functional input that we can build upon.
  };

  return (
    <View style={styles.container}>
      {/* ── Sticky Header ── */}
      <HomeHeader
        profileFirstName={activeProfile?.name?.split(' ')[0] || 'User'}
        onOpenProfileSwitcher={() => setIsProfileSheetVisible(true)}
        onOpenSanarchID={() => setIsIDModalVisible(true)}
        onOpenNotifications={() => setIsNotifSheetVisible(true)}
        hasUnreadNotifications={false} // Mock for now
      />

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          // Extra padding at bottom to clear the floating NavigationDock
          { paddingBottom: insets.bottom + 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Search Bar ── */}
        <View style={styles.searchWrapper}>
          <SearchBar
            placeholder="Search documents, doctors..."
          />
        </View>

        {/* ── Main Content Area ── */}
        {isFirstTime ? (
          <FirstTimeEmptyState style={styles.emptyState} />
        ) : (
          <View style={styles.contentArea}>
            <HealthSummaryCard
              documentCount={docCount}
              lastActivityDate={lastActivityDate}
            />

            <TimelinePreview
              events={timelineEvents}
              isLoading={isTimelineLoading}
              isError={isTimelineError}
              onRetry={fetchTimeline}
              onViewAll={() => router.push('/(tabs)/records')}
              onEventPress={(event) => {
                // Navigate to specific event grouping in Records (or record detail)
                router.push(`/(tabs)/records?eventId=${event.id}` as any);
              }}
            />
          </View>
        )}
      </ScrollView>

      {/* ── Modals & Sheets ── */}
      <ProfileSwitcherSheet
        visible={isProfileSheetVisible}
        onClose={() => setIsProfileSheetVisible(false)}
        profiles={allProfiles}
        activeProfileId={activeProfile?.id || ''}
        onSelectProfile={(id) => {
          const profile = allProfiles.find(p => p.id === id) || null;
          setActiveProfile(profile);
        }}
      />

      <NotificationsSheet
        visible={isNotifSheetVisible}
        onClose={() => setIsNotifSheetVisible(false)}
        notifications={[]} // Empty for now, shows EmptyStateCard
      />

      <SanarchIDModal
        visible={isIDModalVisible}
        onClose={() => setIsIDModalVisible(false)}
        sanarchId={user?.sanarch_id || activeProfile?.sanarchId || ''}
        patientName={activeProfile?.name || ''}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  scrollContent: {
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[2],
    gap: SPACING[6],
  },
  searchWrapper: {
    // Add margin if needed
  },
  emptyState: {
    marginTop: SPACING[4],
  },
  contentArea: {
    gap: SPACING[6],
  },
});
