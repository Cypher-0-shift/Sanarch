// app/(tabs)/records/index.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Animated,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useDocumentsStore, type DocumentRecord } from '../../../store/documentsStore';
import DocumentCard from '../../../components/DocumentCard';
import { CATEGORIES } from '../upload';
import { formatDate } from '../../../utils/date';
import taxonomyData from '../../../constants/condition_taxonomy.json';

// -- Types -------------------------------------------------------------------
type SortOption = 'newest' | 'oldest' | 'hospital' | 'type';

/**
 * RecordsView: extensible segmented-control type.
 *   'list'      = ungrouped flat list (Phase 1)
 *   'facility'  = grouped by provider/facility (Phase 2)
 *   'condition' = reserved for Phase 4 — add to VIEW_TABS + render branch
 */
type RecordsView = 'list' | 'facility' | 'condition';

interface FilterCategoryItem {
  id: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  bg: string;
  count: number;
}

// -- Group data shape -----------------------------------------------
interface GroupData {
  key: string;          // normalised key, unique per group
  displayName: string;  // original casing (first occurrence wins)
  type: 'facility' | 'doctor' | 'condition' | 'uncategorized';
  count: number;
  latestDate: string;   // ISO date of most-recent doc
  documents: DocumentRecord[];
}

// -- Normalisation -----------------------------------------------------------
const HONORIFIC_RE = /^(dr\.?|prof\.?|mr\.?|mrs\.?|ms\.?|mt\.?)\s+/i;

function normalizeProviderName(raw: string): string {
  return raw
    .trim()
    .replace(HONORIFIC_RE, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Grouping key for one document.
 *
 * PRIMARY = hospital_name (facility).
 * FALLBACK = doctor_name when facility is absent.
 *
 * Rationale: facility is a stable shared identity across multiple doctors and
 * visits, producing fewer, larger, more useful groups. Doctor name is the
 * fallback so solo-doctor records still cluster across visits.
 */
function getGroupKey(doc: DocumentRecord): {
  key: string;
  displayName: string;
  isFacility: boolean;
} {
  const facilityRaw = (doc.extracted_data?.hospital_name || '').trim();
  if (facilityRaw) {
    return { key: normalizeProviderName(facilityRaw), displayName: facilityRaw, isFacility: true };
  }
  const doctorRaw = (doc.extracted_data?.doctor_name || '').trim();
  if (doctorRaw) {
    return { key: normalizeProviderName(doctorRaw), displayName: doctorRaw, isFacility: false };
  }
  return { key: '__unknown__', displayName: 'Unknown Provider', isFacility: false };
}

function groupByFacility(docs: DocumentRecord[]): GroupData[] {
  const map = new Map<string, GroupData>();
  for (const doc of docs) {
    const { key, displayName, isFacility } = getGroupKey(doc);
    if (!map.has(key)) {
      map.set(key, { key, displayName, type: isFacility ? 'facility' : 'doctor', count: 0, latestDate: '', documents: [] });
    }
    const g = map.get(key)!;
    g.documents.push(doc);
    g.count += 1;
    const d = doc.extracted_data?.document_date || doc.created_at || '';
    if (!g.latestDate || d > g.latestDate) g.latestDate = d;
  }
  return Array.from(map.values()).sort((a, b) => b.latestDate.localeCompare(a.latestDate));
}

function groupByCondition(docs: DocumentRecord[]): GroupData[] {
  const map = new Map<string, GroupData>();
  
  const taxonomyMap = new Map<string, string>();
  taxonomyData.conditions.forEach((c: any) => taxonomyMap.set(c.id, c.label));

  for (const doc of docs) {
    const groups = doc.condition_groups && doc.condition_groups.length > 0 ? doc.condition_groups : ['uncategorized'];
    const uniqueGroups = Array.from(new Set(groups));
    
    let hasValidGroup = false;
    for (let groupId of uniqueGroups) {
      if (groupId === 'uncategorized') continue;
      
      const label = taxonomyMap.get(groupId);
      if (label) {
        hasValidGroup = true;
        if (!map.has(groupId)) {
          map.set(groupId, { key: groupId, displayName: label, type: 'condition', count: 0, latestDate: '', documents: [] });
        }
        const g = map.get(groupId)!;
        g.documents.push(doc);
        g.count += 1;
        const d = doc.extracted_data?.document_date || doc.created_at || '';
        if (!g.latestDate || d > g.latestDate) g.latestDate = d;
      }
    }
    
    if (!hasValidGroup) {
      if (!map.has('uncategorized')) {
        map.set('uncategorized', { key: 'uncategorized', displayName: 'Uncategorized', type: 'uncategorized', count: 0, latestDate: '', documents: [] });
      }
      const g = map.get('uncategorized')!;
      g.documents.push(doc);
      g.count += 1;
      const d = doc.extracted_data?.document_date || doc.created_at || '';
      if (!g.latestDate || d > g.latestDate) g.latestDate = d;
    }
  }
  
  const allGroups = Array.from(map.values());
  const namedGroups = allGroups.filter(g => g.key !== 'uncategorized').sort((a, b) => b.latestDate.localeCompare(a.latestDate));
  const uncategorized = allGroups.find(g => g.key === 'uncategorized');
  
  if (uncategorized) {
    namedGroups.push(uncategorized);
  }
  
  return namedGroups;
}

// -- Static data -------------------------------------------------------------
const CATEGORY_PLURAL_LABELS: Record<string, string> = {
  lab_report: 'Lab Reports',
  prescription: 'Prescriptions',
  scan: 'Imaging / Scans',
  hospital_summary: 'Discharge Summaries',
  other: 'Other Records',
};

const SORT_OPTIONS: { id: SortOption; label: string; icon: string }[] = [
  { id: 'newest',   label: 'Newest First',       icon: 'sort-calendar-descending' },
  { id: 'oldest',   label: 'Oldest First',        icon: 'sort-calendar-ascending' },
  { id: 'hospital', label: 'By Hospital',         icon: 'hospital-building' },
  { id: 'type',     label: 'By Document Type',    icon: 'file-document-multiple-outline' },
];

/**
 * Phase 4 instruction: append { id: 'condition', label: 'By condition', icon: 'tag-outline' }
 * and add a render branch — no structural change needed.
 */
const VIEW_TABS: { id: RecordsView; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { id: 'list',     label: 'List',        icon: 'format-list-bulleted' },
  { id: 'facility', label: 'By facility', icon: 'hospital-building' },
  { id: 'condition', label: 'By condition', icon: 'tag-outline' },
];

// -- Background --------------------------------------------------------------
function MeshBackground() {
  return (
    <LinearGradient
      colors={['#f8faf9', '#e6f0e9', '#f2f5f3']}
      style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: -1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    />
  );
}

// -- Skeleton ----------------------------------------------------------------
function SkeletonCard() {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  return (
    <Animated.View style={{ opacity }} className="bg-white rounded-xl mb-3 p-4 flex-row">
      <View className="w-14 h-14 rounded-xl bg-[#E8E8E8] mr-3" />
      <View className="flex-1">
        <View className="h-4 bg-[#E8E8E8] rounded-full w-3/4 mb-2" />
        <View className="h-3 bg-[#E8E8E8] rounded-full w-1/2 mb-3" />
        <View className="h-1 bg-[#E8E8E8] rounded-full w-full" />
      </View>
    </Animated.View>
  );
}

// -- Empty state (no documents at all) ---------------------------------------
function EmptyState() {
  const pressScale = useRef(new Animated.Value(1)).current;
  return (
    <View className="flex-1 items-center justify-center px-8 pt-20">
      <Text className="text-6xl mb-5">📄</Text>
      <Text className="text-xl font-bold text-[#2D3A2F] text-center">No records yet</Text>
      <Text className="text-[15px] text-[#7A8A7C] text-center mt-2 leading-5">
        Upload your first medical document to get started.
      </Text>
      <Animated.View style={{ transform: [{ scale: pressScale }] }} className="mt-6">
        <Pressable
          onPressIn={() => Animated.spring(pressScale, { toValue: 0.97, friction: 8, tension: 200, useNativeDriver: true }).start()}
          onPressOut={() => Animated.spring(pressScale, { toValue: 1, friction: 8, tension: 200, useNativeDriver: true }).start()}
          onPress={() => router.push('/(tabs)/upload')}
          className="bg-[#004D36] rounded-xl px-8 py-3.5"
        >
          <Text className="text-white font-semibold text-[15px]">Upload Document</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// -- Compact doc row (inside expanded group) ---------------------------------
function CompactDocRow({ doc }: { doc: DocumentRecord }) {
  const category = CATEGORIES.find((c) => c.id === doc.document_label) || CATEGORIES.find((c) => c.id === 'other')!;
  const docDate = doc.extracted_data?.document_date || doc.created_at;
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => router.push(`/(tabs)/records/${doc.document_id}`)}
      className="flex-row items-center gap-3 py-2.5"
    >
      <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: category.bg }}>
        <MaterialCommunityIcons name={category.icon as any} size={16} color={category.color} />
      </View>
      <Text className="flex-1 text-[13px] font-display-medium text-[#404944]" numberOfLines={1}>
        {doc.document_title || category.name}
      </Text>
      {docDate && (
        <Text className="text-[11px] font-display text-[#819685]">
          {formatDate(docDate, { month: 'short', day: 'numeric' }, '')}
        </Text>
      )}
      <MaterialCommunityIcons name="chevron-right" size={16} color="#bfc9c2" />
    </TouchableOpacity>
  );
}

// -- Group Card (expandable inline) ---------------------------------
/**
 * Design decision: single-record groups use the same expandable card code path
 * as multi-record groups. No special-casing required, keeping render logic simple.
 */
function GroupCard({ group }: { group: GroupData }) {
  const [expanded, setExpanded] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const toggle = useCallback(() => {
    const toValue = expanded ? 0 : 1;
    setExpanded((v) => !v);
    Animated.spring(anim, { toValue, friction: 10, tension: 120, useNativeDriver: true }).start();
  }, [expanded, anim]);

  const chevronRotation = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  
  let groupIcon: keyof typeof MaterialCommunityIcons.glyphMap = 'folder-outline';
  let iconColor = '#004D36';
  let iconBg = '#E8F5E9';
  let labelStyle = 'text-[#2D3A2F] font-display-bold';
  
  if (group.type === 'facility') {
    groupIcon = 'hospital-building';
    iconColor = '#0277BD';
    iconBg = '#E3F2FD';
  } else if (group.type === 'doctor') {
    groupIcon = 'stethoscope';
    iconColor = '#004D36';
    iconBg = '#E8F5E9';
  } else if (group.type === 'condition') {
    groupIcon = 'tag-outline';
    iconColor = '#E65100';
    iconBg = '#FFF3E0';
  } else if (group.type === 'uncategorized') {
    groupIcon = 'tag-off-outline';
    iconColor = '#7A8A7C';
    iconBg = '#F5F3F0';
    labelStyle = 'text-[#7A8A7C] font-display-medium'; // Muted
  }

  return (
    <View
      className="rounded-[24px] overflow-hidden mb-3 shadow-sm"
      style={{ backgroundColor: 'rgba(255,255,255,0.5)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)' }}
    >
      <BlurView intensity={40} tint="light">
        {/* Header row */}
        <TouchableOpacity activeOpacity={0.8} onPress={toggle} className="flex-row items-center gap-3 p-4">
          <View className="w-12 h-12 rounded-2xl items-center justify-center flex-shrink-0" style={{ backgroundColor: iconBg }}>
            <MaterialCommunityIcons name={groupIcon} size={24} color={iconColor} />
          </View>
          <View className="flex-1 min-w-0">
            <Text className={`text-[15px] ${labelStyle}`} numberOfLines={1}>
              {group.displayName}
            </Text>
            <View className="flex-row items-center gap-1.5 mt-0.5">
              <Text className="text-[11px] font-display text-[#819685]">
                {group.count} record{group.count !== 1 ? 's' : ''}
              </Text>
              {group.latestDate ? (
                <>
                  <View className="w-1 h-1 rounded-full bg-[#bfc9c2]" />
                  <Text className="text-[11px] font-display text-[#819685]">
                    Last: {formatDate(group.latestDate, { month: 'short', day: 'numeric', year: 'numeric' }, '')}
                  </Text>
                </>
              ) : null}
            </View>
          </View>
          <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#819685" />
          </Animated.View>
        </TouchableOpacity>
        {/* Expanded doc list */}
        {expanded && (
          <View className="px-4 pb-3 border-t border-black/5 pt-1">
            {group.documents.map((doc, idx) => (
              <View key={doc.document_id}>
                <CompactDocRow doc={doc} />
                {idx < group.documents.length - 1 && <View className="h-[1px] bg-black/5 ml-11" />}
              </View>
            ))}
          </View>
        )}
      </BlurView>
    </View>
  );
}

// -- Segmented View Toggle ---------------------------------------------------
function ViewToggle({ active, onChange }: { active: RecordsView; onChange: (v: RecordsView) => void }) {
  return (
    <View
      className="flex-row bg-[#E8F0EB] rounded-2xl p-1 gap-1"
      style={{ borderWidth: 1, borderColor: 'rgba(0,77,54,0.08)' }}
    >
      {VIEW_TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.8}
            onPress={() => onChange(tab.id)}
            className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl ${isActive ? 'bg-[#004D36] shadow-sm' : ''}`}
          >
            <MaterialCommunityIcons name={tab.icon} size={15} color={isActive ? '#ffffff' : '#5C6E60'} />
            <Text className={`text-[12px] ${isActive ? 'font-display-bold text-white' : 'font-display-medium text-[#5C6E60]'}`}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// -- Sort Bottom Sheet -------------------------------------------------------
function SortSheet({ visible, onClose, sortBy, setSortBy }: {
  visible: boolean; onClose: () => void;
  sortBy: SortOption; setSortBy: (s: SortOption) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/30 justify-end">
        <TouchableOpacity style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} activeOpacity={1} onPress={onClose} />
        <View className="w-full rounded-t-[32px] overflow-hidden border-t border-white/50 shadow-lg" style={{ backgroundColor: 'rgba(255,255,255,0.92)' }}>
          <BlurView intensity={80} tint="light" className="pb-8">
            <View className="w-12 h-1.5 bg-[#bfc9c2] rounded-full mx-auto mt-3 mb-5" />
            <View className="px-6">
              <Text className="text-[12px] font-display-bold text-[#819685] uppercase tracking-wider mb-3">Sort By</Text>
              {SORT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  activeOpacity={0.75}
                  onPress={() => { setSortBy(opt.id); onClose(); }}
                  className={`flex-row items-center gap-3 py-3 px-3 rounded-xl mb-1 ${sortBy === opt.id ? 'bg-[#d7e7d7]/50' : ''}`}
                >
                  <MaterialCommunityIcons name={opt.icon as any} size={20} color={sortBy === opt.id ? '#004D36' : '#819685'} />
                  <Text className={`text-[14px] flex-1 ${sortBy === opt.id ? 'font-display-bold text-[#004D36]' : 'font-display-medium text-[#404944]'}`}>
                    {opt.label}
                  </Text>
                  {sortBy === opt.id && <MaterialCommunityIcons name="check" size={18} color="#004D36" />}
                </TouchableOpacity>
              ))}
            </View>
          </BlurView>
        </View>
      </View>
    </Modal>
  );
}

// -- Filter Bottom Sheet -----------------------------------------------------
function FilterSheet({ visible, onClose, activeFilter, onSelectFilter, categories }: {
  visible: boolean; onClose: () => void;
  activeFilter: string; onSelectFilter: (id: string) => void;
  categories: FilterCategoryItem[];
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/30 justify-end">
        <TouchableOpacity style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} activeOpacity={1} onPress={onClose} />
        <View className="w-full rounded-t-[32px] overflow-hidden border-t border-white/50 shadow-lg" style={{ backgroundColor: 'rgba(255,255,255,0.92)' }}>
          <BlurView intensity={80} tint="light" className="pb-8">
            <View className="w-12 h-1.5 bg-[#bfc9c2] rounded-full mx-auto mt-3 mb-4" />
            <View className="px-6 mb-3 flex-row items-center justify-between">
              <Text className="text-[12px] font-display-bold text-[#819685] uppercase tracking-wider">Filter by Document Type</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} className="w-7 h-7 rounded-full bg-[#E5E2DE]/60 items-center justify-center">
                <MaterialCommunityIcons name="close" size={16} color="#5C6E60" />
              </TouchableOpacity>
            </View>
            <ScrollView className="px-6 max-h-[380px]" showsVerticalScrollIndicator={false}>
              {categories.map((cat) => {
                const isActive = activeFilter === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    activeOpacity={0.75}
                    onPress={() => { onSelectFilter(cat.id); onClose(); }}
                    className={`flex-row items-center gap-3 py-3 px-3.5 rounded-2xl mb-2 border ${isActive ? 'bg-[#E8F5E9] border-[#C8E6C9]' : 'bg-white/70 border-[#EFECE6]'}`}
                  >
                    <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: cat.bg }}>
                      <MaterialCommunityIcons name={cat.icon} size={20} color={cat.color} />
                    </View>
                    <View className="flex-1 flex-row items-center justify-between mr-2">
                      <Text className={`text-[14px] ${isActive ? 'font-display-bold text-[#004D36]' : 'font-display-medium text-[#2D3A2F]'}`} numberOfLines={1}>
                        {cat.label}
                      </Text>
                      <View className={`px-2 py-0.5 rounded-full ${isActive ? 'bg-[#004D36]' : 'bg-[#E5E2DE]/70'}`}>
                        <Text className={`text-[11px] font-display-bold ${isActive ? 'text-white' : 'text-[#707973]'}`}>
                          {cat.count}
                        </Text>
                      </View>
                    </View>
                    {isActive && <MaterialCommunityIcons name="check" size={20} color="#004D36" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </BlurView>
        </View>
      </View>
    </Modal>
  );
}

// -- Main Records Screen -----------------------------------------------------
export default function RecordsScreen() {
  const documents    = useDocumentsStore((s) => s.documents);
  const isLoading    = useDocumentsStore((s) => s.isLoading);
  const fetchDocuments = useDocumentsStore((s) => s.fetchDocuments);

  const [refreshing,      setRefreshing]      = useState(false);
  const [activeFilter,    setActiveFilter]    = useState<string>('all');
  const [sortBy,          setSortBy]          = useState<SortOption>('newest');
  const [activeView,      setActiveView]      = useState<RecordsView>('list');
  const [showSortSheet,   setShowSortSheet]   = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const [searchQuery,    setSearchQuery]    = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDocuments();
    setRefreshing(false);
  }, [fetchDocuments]);

  // Category filter options with counts
  const categoryFilterOptions = useMemo((): FilterCategoryItem[] => {
    const allItem: FilterCategoryItem = {
      id: 'all', label: 'All records',
      icon: 'file-document-multiple-outline', color: '#004D36', bg: '#E8F5E9',
      count: documents.length,
    };
    const catItems: FilterCategoryItem[] = CATEGORIES.map((cat) => ({
      id: cat.id,
      label: CATEGORY_PLURAL_LABELS[cat.id] || cat.name,
      icon: cat.icon as keyof typeof MaterialCommunityIcons.glyphMap,
      color: cat.color, bg: cat.bg,
      count: documents.filter((d) => d.document_label === cat.id).length,
    }));
    return [allItem, ...catItems];
  }, [documents]);

  const currentFilterInfo = useMemo(() => (
    categoryFilterOptions.find((c) => c.id === activeFilter) ||
    categoryFilterOptions[0] || {
      id: 'all', label: 'All records',
      icon: 'file-document-multiple-outline' as const,
      color: '#004D36', bg: '#E8F5E9', count: documents.length,
    }
  ), [categoryFilterOptions, activeFilter, documents.length]);

  // Filter + Search + Sort (shared across all views)
  const processedDocuments = useMemo(() => {
    let filtered = activeFilter === 'all'
      ? documents
      : documents.filter((d) => d.document_label === activeFilter);

    const q = debouncedSearch.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((d) => {
        const title   = (d.document_title || '').toLowerCase();
        const doctor  = (d.extracted_data?.doctor_name || '').toLowerCase();
        const hospital = (d.extracted_data?.hospital_name || '').toLowerCase();
        return title.includes(q) || doctor.includes(q) || hospital.includes(q);
      });
    }

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':   return (b.created_at || '').localeCompare(a.created_at || '');
        case 'oldest':   return (a.created_at || '').localeCompare(b.created_at || '');
        case 'hospital': {
          const hA = (a.extracted_data?.hospital_name || 'zzz').toLowerCase();
          const hB = (b.extracted_data?.hospital_name || 'zzz').toLowerCase();
          return hA.localeCompare(hB);
        }
        case 'type': return (a.document_label || '').localeCompare(b.document_label || '');
        default:     return 0;
      }
    });
  }, [documents, activeFilter, debouncedSearch, sortBy]);

  // Groups (only when facility or condition view active)
  const groupedData = useMemo(() => {
    if (activeView === 'facility') return groupByFacility(processedDocuments);
    if (activeView === 'condition') return groupByCondition(processedDocuments);
    return [];
  }, [processedDocuments, activeView]);

  const renderCard          = useCallback(({ item }: { item: DocumentRecord })  => <DocumentCard document={item} />,  []);
  const keyExtractDoc       = useCallback((item: DocumentRecord)  => item.document_id, []);
  const keyExtractGroup     = useCallback((item: GroupData)   => item.key,         []);
  const renderGroup = useCallback(({ item }: { item: GroupData }) => <GroupCard group={item} />, []);

  // Shared header
  const HeaderBar = useCallback(() => (
    <BlurView intensity={40} tint="light" className="px-5 pt-4 pb-3 border-b border-[#E5E2DE] z-10">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-[28px] font-display-bold text-[#004D36]">Health Records</Text>
        <TouchableOpacity onPress={() => setShowSortSheet(true)} activeOpacity={0.75} className="w-10 h-10 rounded-full items-center justify-center bg-white/70 border border-[#E5E2DE] shadow-sm">
          <MaterialCommunityIcons name="filter-variant" size={22} color="#004D36" />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View className="flex-row items-center bg-white rounded-xl px-3.5 h-11 border border-[#E5E2DE] shadow-sm mb-2.5">
        <MaterialCommunityIcons name="magnify" size={20} color="#819685" />
        <TextInput
          placeholder="Search by title, doctor, hospital..."
          placeholderTextColor="#819685"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          className="flex-1 text-[13px] font-display-medium text-[#2D3A2F] ml-2 h-full"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="close-circle" size={18} color="#819685" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter dropdown */}
      <TouchableOpacity onPress={() => setShowFilterSheet(true)} activeOpacity={0.75} className="flex-row items-center justify-between bg-white rounded-xl px-3.5 py-2.5 border border-[#E5E2DE] shadow-sm mb-3">
        <View className="flex-row items-center gap-2.5 flex-1 mr-2">
          <View className="w-7 h-7 rounded-lg items-center justify-center" style={{ backgroundColor: currentFilterInfo.bg }}>
            <MaterialCommunityIcons name={currentFilterInfo.icon} size={16} color={currentFilterInfo.color} />
          </View>
          <Text className="text-[13px] font-display-semibold text-[#2D3A2F]" numberOfLines={1}>{currentFilterInfo.label}</Text>
          <View className="bg-[#E8F5E9] px-2 py-0.5 rounded-full">
            <Text className="text-[10px] font-display-bold text-[#004D36]">{currentFilterInfo.count}</Text>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-down" size={20} color="#004D36" />
      </TouchableOpacity>

      {/* Segmented view toggle */}
      <ViewToggle active={activeView} onChange={setActiveView} />
    </BlurView>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [searchQuery, currentFilterInfo, activeView]);

  // Shared modals
  const Modals = (
    <>
      <SortSheet visible={showSortSheet} onClose={() => setShowSortSheet(false)} sortBy={sortBy} setSortBy={setSortBy} />
      <FilterSheet visible={showFilterSheet} onClose={() => setShowFilterSheet(false)} activeFilter={activeFilter} onSelectFilter={setActiveFilter} categories={categoryFilterOptions} />
    </>
  );

  // Loading
  if (isLoading && documents.length === 0) {
    return (
      <SafeAreaView className="flex-1" edges={['top']}>
        <MeshBackground />
        <HeaderBar />
        <View className="px-5 pt-6"><SkeletonCard /><SkeletonCard /><SkeletonCard /></View>
        {Modals}
      </SafeAreaView>
    );
  }

  // Empty (no docs at all)
  if (!isLoading && documents.length === 0) {
    return (
      <SafeAreaView className="flex-1" edges={['top']}>
        <MeshBackground />
        <HeaderBar />
        <EmptyState />
        {Modals}
      </SafeAreaView>
    );
  }

  // Zero results (filter/search)
  if (processedDocuments.length === 0) {
    const isSearchActive = debouncedSearch.trim().length > 0;
    return (
      <SafeAreaView className="flex-1" edges={['top']}>
        <MeshBackground />
        <HeaderBar />
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 rounded-full bg-[#E8F5E9] items-center justify-center mb-4">
            <MaterialCommunityIcons name={isSearchActive ? 'file-search-outline' : 'filter-off-outline'} size={32} color="#004D36" />
          </View>
          <Text className="text-lg font-display-bold text-[#2D3A2F] text-center">
            {isSearchActive ? 'No matching records' : 'No records under this filter'}
          </Text>
          <Text className="text-[14px] text-[#7A8A7C] font-display-medium text-center mt-2 leading-5">
            {isSearchActive
              ? `No documents found matching "${debouncedSearch}". Try a different title, doctor, or hospital.`
              : 'There are no documents in the selected category.'}
          </Text>
          {isSearchActive ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.75} className="mt-5 px-6 py-2.5 bg-[#004D36] rounded-full">
              <Text className="text-white font-display-semibold text-[13px]">Clear Search</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setActiveFilter('all')} activeOpacity={0.75} className="mt-5 px-6 py-2.5 bg-[#004D36] rounded-full">
              <Text className="text-white font-display-semibold text-[13px]">Show All Records</Text>
            </TouchableOpacity>
          )}
        </View>
        {Modals}
      </SafeAreaView>
    );
  }

  // Main content
  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      <MeshBackground />
      <HeaderBar />

      {activeView === 'list' ? (
        <FlatList
          data={processedDocuments}
          renderItem={renderCard}
          keyExtractor={keyExtractDoc}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#004D36" colors={['#004D36']} />}
        />
      ) : (
        <FlatList
          data={groupedData}
          renderItem={renderGroup}
          keyExtractor={keyExtractGroup}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#004D36" colors={['#004D36']} />}
          ListEmptyComponent={null}
        />
      )}

      {Modals}
    </SafeAreaView>
  );
}
