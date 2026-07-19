/**
 * Records List — Phase 5
 *
 * The primary view for browsing health records.
 * Features:
 * - Segmented control for View Mode (By Treatment vs All Documents)
 * - Real-time Inline Search
 * - Filter & Sort Bottom Sheet
 * - Multi-select mode with long-press
 * - Grouped nested rendering via SectionList (avoiding VirtualizedList warnings)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, FlatList, Pressable, ScrollView, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Stores & State
import { useDocumentsStore, type DocumentRecord } from '../../../store/documentsStore';
import { useProfileStore } from '../../../store/profileStore';
import { useRecordsUIStore } from '../../../store/recordsUIStore';

// Components
import SearchBar from '../../../components/inputs/SearchBar';
import ViewToggle from '../../../components/records/ViewToggle';
import TreatmentGroupHeader, { type TreatmentGroupData } from '../../../components/records/TreatmentGroupHeader';
import FilterSortSheet, { type FilterOption } from '../../../components/records/FilterSortSheet';
import MultiSelectToolbar from '../../../components/records/MultiSelectToolbar';
import DocumentCard from '../../../components/documents/DocumentCard';
import EmptyStateCard from '../../../components/empty-states/EmptyStateCard';
import { COLORS, FONTS, SPACING, RADIUS } from '../../../constants/theme';
import { normaliseCategory } from '../../../components/documents/CategoryBadge';

// ── Helpers ────────────────────────────────────────────────────────
const FILTER_CHIPS: { id: FilterOption; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'lab_report', label: 'Lab Reports' },
  { id: 'prescription', label: 'Prescriptions' },
  { id: 'scan', label: 'Scans' },
  { id: 'hospital_summary', label: 'Discharge' },
  { id: 'other', label: 'Other' },
];

function groupByTreatment(documents: DocumentRecord[]): { title: TreatmentGroupData; data: DocumentRecord[] }[] {
  const groups: { title: TreatmentGroupData; data: DocumentRecord[] }[] = [];
  const assigned = new Set<string>();

  const sorted = [...documents].sort((a, b) => {
    const dateA = a.extracted_data?.document_date || a.created_at || '';
    const dateB = b.extracted_data?.document_date || b.created_at || '';
    return dateB.localeCompare(dateA);
  });

  for (const doc of sorted) {
    if (assigned.has(doc.document_id)) continue;

    const hospital = doc.extracted_data?.hospital_name || '';
    const diagnoses: string[] = doc.extracted_data?.diagnosis || [];
    const docDate = doc.extracted_data?.document_date || doc.created_at || '';

    // Find related
    const related = sorted.filter((other) => {
      if (other.document_id === doc.document_id || assigned.has(other.document_id)) return false;
      const otherHospital = other.extracted_data?.hospital_name || '';
      const otherDiagnoses: string[] = other.extracted_data?.diagnosis || [];
      const otherDate = other.extracted_data?.document_date || other.created_at || '';

      if (!hospital || !otherHospital || hospital.toLowerCase() !== otherHospital.toLowerCase()) return false;

      const d1 = new Date(docDate).getTime();
      const d2 = new Date(otherDate).getTime();
      if (isNaN(d1) || isNaN(d2) || Math.abs(d1 - d2) > 30 * 24 * 60 * 60 * 1000) return false;

      if (diagnoses.length === 0 && otherDiagnoses.length === 0) return true;
      return diagnoses.some((d) => otherDiagnoses.includes(d));
    });

    const groupDocs = [doc, ...related];
    groupDocs.forEach((d) => assigned.add(d.document_id));

    // Calculate dates
    const dates = groupDocs
      .map(d => new Date(d.extracted_data?.document_date || d.created_at).getTime())
      .filter(d => !isNaN(d))
      .sort((a, b) => a - b);
      
    const startDate = dates.length > 0 ? new Date(dates[0]).toISOString() : docDate;
    const endDate = dates.length > 1 ? new Date(dates[dates.length - 1]).toISOString() : null;

    // Collect all unique diagnoses
    const allDiagnoses = Array.from(new Set(groupDocs.flatMap(d => d.extracted_data?.diagnosis || [])));

    groups.push({
      title: {
        id: doc.document_id,
        hospital,
        startDate,
        endDate,
        diagnoses: allDiagnoses,
      },
      data: groupDocs.sort((a, b) => {
        // within group, sort descending
        const da = a.extracted_data?.document_date || a.created_at || '';
        const db = b.extracted_data?.document_date || b.created_at || '';
        return db.localeCompare(da);
      }),
    });
  }

  // Sort groups by start date descending
  return groups.sort((a, b) => {
    return new Date(b.title.startDate).getTime() - new Date(a.title.startDate).getTime();
  });
}

// ── Component ──────────────────────────────────────────────────────
export default function RecordsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // State
  const documents = useDocumentsStore((s) => s.documents);
  const activeProfile = useProfileStore((s) => s.activeProfile);
  
  const { viewMode, activeSort, activeFilter, setViewMode, setSortAndFilter, reset } = useRecordsUIStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Reset UI state when profile changes
  useEffect(() => {
    reset();
    setSearchQuery('');
    setSelectedIds(new Set());
  }, [activeProfile?.id]);

  // Derived Data (Filtering & Sorting)
  const processedDocs = useMemo(() => {
    let result = [...documents];

    // 1. Search (Inline real-time)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(doc => {
        const title = (doc.document_title || '').toLowerCase();
        const hospital = (doc.extracted_data?.hospital_name || '').toLowerCase();
        const doctor = (doc.extracted_data?.doctor_name || '').toLowerCase();
        const diagnoses = (doc.extracted_data?.diagnosis || []).join(' ').toLowerCase();
        return title.includes(q) || hospital.includes(q) || doctor.includes(q) || diagnoses.includes(q);
      });
    }

    // 2. Filter Category
    if (activeFilter !== 'all') {
      result = result.filter(doc => normaliseCategory(doc.document_label) === activeFilter);
    }

    // 3. Sort (Only applies to Flat view, grouped view handles its own sorting logically)
    if (viewMode === 'flat') {
      if (activeSort === 'newest') {
        result.sort((a, b) => (b.extracted_data?.document_date || b.created_at).localeCompare(a.extracted_data?.document_date || a.created_at));
      } else if (activeSort === 'oldest') {
        result.sort((a, b) => (a.extracted_data?.document_date || a.created_at).localeCompare(b.extracted_data?.document_date || b.created_at));
      } else if (activeSort === 'hospital') {
        result.sort((a, b) => (a.extracted_data?.hospital_name || '').localeCompare(b.extracted_data?.hospital_name || ''));
      } else if (activeSort === 'type') {
        result.sort((a, b) => (a.document_label || '').localeCompare(b.document_label || ''));
      }
    }

    return result;
  }, [documents, searchQuery, activeFilter, activeSort, viewMode]);

  const groupedDocs = useMemo(() => {
    if (viewMode !== 'grouped') return [];
    return groupByTreatment(processedDocs);
  }, [processedDocs, viewMode]);

  // Handlers
  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleLongPress = (id: string) => {
    if (selectedIds.size === 0) {
      handleToggleSelect(id);
    }
  };

  const handlePressCard = (id: string) => {
    if (selectedIds.size > 0) {
      handleToggleSelect(id);
    } else {
      router.push(`/(tabs)/records/${id}`);
    }
  };

  // Renderers
  const renderEmptyState = () => {
    if (documents.length === 0) {
      return (
        <EmptyStateCard
          headline="No records found"
          subtext="Upload your first medical document to get started."
          cta={{ label: 'Upload Document', onPress: () => router.push('/(tabs)/upload') }}
        />
      );
    }
    if (searchQuery.trim()) {
      return (
        <EmptyStateCard
          headline="No results found"
          subtext={`No documents match "${searchQuery}".`}
          cta={{ label: 'Clear Search', onPress: () => setSearchQuery('') }}
        />
      );
    }
    return (
      <EmptyStateCard
        headline="No matches"
        subtext="No documents match the current filters."
        cta={{ label: 'Clear Filters', onPress: () => setSortAndFilter('newest', 'all') }}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header Area ── */}
      <View style={styles.header}>
        <SearchBar
          placeholder="Search documents, doctors, diagnosis..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <View style={styles.controlsRow}>
          <View style={styles.toggleWrapper}>
            <ViewToggle mode={viewMode} onChange={setViewMode} />
          </View>
          <Pressable 
            style={[styles.filterBtn, (activeFilter !== 'all' || activeSort !== 'newest') && styles.filterBtnActive]}
            onPress={() => setIsFilterSheetVisible(true)}
            accessibilityLabel="Filter and Sort"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialCommunityIcons 
              name="tune-variant" 
              size={20} 
              color={(activeFilter !== 'all' || activeSort !== 'newest') ? COLORS.brandPrimary : COLORS.ink800} 
            />
            {/* Active Dot */}
            {(activeFilter !== 'all' || activeSort !== 'newest') && (
              <View style={styles.filterDot} />
            )}
          </Pressable>
        </View>

        {/* Filter Chips (Visible only in All Documents mode) */}
        {viewMode === 'flat' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {FILTER_CHIPS.map(chip => {
              const isActive = activeFilter === chip.id;
              return (
                <Pressable
                  key={chip.id}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setSortAndFilter(activeSort, chip.id)}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* ── Lists ── */}
      <View style={styles.listContainer}>
        {processedDocs.length === 0 ? (
          <View style={styles.emptyContainer}>
            {renderEmptyState()}
          </View>
        ) : viewMode === 'grouped' ? (
          <SectionList
            sections={groupedDocs}
            keyExtractor={(item) => item.document_id}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
            renderSectionHeader={({ section }) => (
              <TreatmentGroupHeader group={section.title} />
            )}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <DocumentCard
                  document={item}
                  variant={selectedIds.size > 0 ? 'selectable' : 'default'}
                  selected={selectedIds.has(item.document_id)}
                  onSelect={handleToggleSelect}
                  onPress={handlePressCard}
                  onLongPress={handleLongPress}
                />
              </View>
            )}
            stickySectionHeadersEnabled={false}
          />
        ) : (
          <FlatList
            data={processedDocs}
            keyExtractor={(item) => item.document_id}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <DocumentCard
                  document={item}
                  variant={selectedIds.size > 0 ? 'selectable' : 'default'}
                  selected={selectedIds.has(item.document_id)}
                  onSelect={handleToggleSelect}
                  onPress={handlePressCard}
                  onLongPress={handleLongPress}
                />
              </View>
            )}
          />
        )}
      </View>

      {/* ── Multi-select Toolbar ── */}
      <MultiSelectToolbar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onShare={() => {
          // Pass selected IDs to share tab
          router.push(`/(tabs)/doctors?docs=${Array.from(selectedIds).join(',')}`);
          setSelectedIds(new Set());
        }}
        onDelete={() => {
          // Implement delete logic here or open confirmation
        }}
      />

      {/* ── Filter & Sort Sheet ── */}
      <FilterSortSheet
        visible={isFilterSheetVisible}
        onClose={() => setIsFilterSheetVisible(false)}
        activeSort={activeSort}
        activeFilter={activeFilter}
        onApply={setSortAndFilter}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  header: {
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[2],
    paddingBottom: SPACING[2],
    gap: SPACING[4],
    backgroundColor: COLORS.surface,
    zIndex: 10,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
  },
  toggleWrapper: {
    flex: 1,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.ink100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterBtnActive: {
    backgroundColor: COLORS.brandTint,
    borderColor: 'rgba(67,97,238,0.2)',
  },
  filterDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.brandPrimary,
  },
  chipsScroll: {
    gap: SPACING[2],
    paddingBottom: SPACING[2],
  },
  chip: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.ink100,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: COLORS.brandTint,
    borderColor: 'rgba(67,97,238,0.2)',
  },
  chipText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 13,
    color: COLORS.ink800,
  },
  chipTextActive: {
    color: COLORS.brandPrimary,
    fontFamily: FONTS.jakartaBold,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[2],
  },
  cardWrapper: {
    marginBottom: SPACING[3],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING[4],
  },
});
