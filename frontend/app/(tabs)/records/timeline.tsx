import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  Animated, RefreshControl, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getTimeline, TimelineEvent } from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';
import { useProfileStore } from '../../../store/profileStore';
import { useDocumentsStore, DocumentRecord } from '../../../store/documentsStore';
import { formatDate } from '../../../utils/date';

// ─── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonPulse = ({ style }: { style: any }) => {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);
  return <Animated.View style={[style, { opacity: anim, backgroundColor: '#DDD9D4' }]} />;
};

const CardSkeleton = () => (
  <View style={styles.cardRow}>
    <SkeletonPulse style={{ width: 36, height: 36, borderRadius: 18 }} />
    <View style={[styles.cardBody, { gap: 8, paddingTop: 2 }]}>
      <SkeletonPulse style={{ width: '60%', height: 14, borderRadius: 6 }} />
      <SkeletonPulse style={{ width: '40%', height: 11, borderRadius: 4 }} />
      <SkeletonPulse style={{ width: '50%', height: 11, borderRadius: 4 }} />
    </View>
  </View>
);

// ─── Category config ───────────────────────────────────────────────────────────
const CATEGORY_MAP: Record<string, { icon: any; color: string; bg: string; name: string; badgeBg: string; badgeText: string }> = {
  prescription:    { icon: 'pill',                  color: '#D97706', bg: '#FEF3C7', name: 'Prescription',      badgeBg: '#FEF3C7', badgeText: '#B45309' },
  scan:            { icon: 'radiology-box',          color: '#7C3AED', bg: '#EDE9FE', name: 'Scan / Imaging',    badgeBg: '#EDE9FE', badgeText: '#6D28D9' },
  lab_report:      { icon: 'test-tube',              color: '#059669', bg: '#D1FAE5', name: 'Lab Report',        badgeBg: '#D1FAE5', badgeText: '#065F46' },
  hospital_summary:{ icon: 'hospital-building',      color: '#1D4ED8', bg: '#DBEAFE', name: 'Discharge Summary', badgeBg: '#DBEAFE', badgeText: '#1E40AF' },
  default:         { icon: 'file-document-outline',  color: '#4A5E50', bg: '#F0F4F1', name: 'Medical Record',    badgeBg: '#F0F4F1', badgeText: '#4A5E50' },
};

function getCat(label?: string, title?: string) {
  const t = `${label || ''} ${title || ''}`.toLowerCase();
  if (t.includes('prescription') || t.includes('medication') || t.includes('tablet') || t.includes('pill')) return CATEGORY_MAP.prescription;
  if (t.includes('scan') || t.includes('mri') || t.includes('xray') || t.includes('x-ray') || t.includes('ct') || t.includes('radiology')) return CATEGORY_MAP.scan;
  if (t.includes('lab') || t.includes('blood') || t.includes('urine') || t.includes('test') || t.includes('report')) return CATEGORY_MAP.lab_report;
  if (t.includes('discharge') || t.includes('summary') || t.includes('admission') || t.includes('hospital')) return CATEGORY_MAP.hospital_summary;
  if (label && CATEGORY_MAP[label]) return CATEGORY_MAP[label];
  return CATEGORY_MAP.default;
}

const PALETTES = [
  { bg: '#E8F5E9', color: '#2E7D32' }, { bg: '#E3F2FD', color: '#1565C0' },
  { bg: '#FFF3E0', color: '#E65100' }, { bg: '#F3E5F5', color: '#6A1B9A' },
  { bg: '#E0F2F1', color: '#00695C' }, { bg: '#FBE9E7', color: '#BF360C' },
];

function providerBadge(name: string) {
  const words = name.trim().split(/\s+/);
  const initial = words.length >= 2
    ? `${words[0][0]}${words[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return { initial, ...PALETTES[Math.abs(hash) % PALETTES.length] };
}

// ─── Month separator ───────────────────────────────────────────────────────────
const MonthSeparator = ({ label }: { label: string }) => (
  <View style={styles.monthSep}>
    <Text style={styles.monthLabel}>{label}</Text>
    <View style={styles.monthLine} />
  </View>
);

function isKnown(val?: string | null): boolean {
  if (!val) return false;
  const cleaned = val.trim().toLowerCase();
  return (
    cleaned.length > 0 &&
    cleaned !== 'unknown' &&
    cleaned !== 'null' &&
    cleaned !== 'undefined' &&
    cleaned !== 'none' &&
    cleaned !== 'n/a' &&
    cleaned !== 'na' &&
    cleaned !== 'nil' &&
    cleaned !== 'not available'
  );
}

// ─── Single card ───────────────────────────────────────────────────────────────
const TimelineCard = ({
  event, doc, onPress, isLast,
}: {
  event: TimelineEvent;
  doc?: DocumentRecord;
  onPress: () => void;
  isLast: boolean;
}) => {
  const title = doc?.document_title || event.condition || 'Untitled Document';
  const labelStr = doc?.document_label || event.label;
  const cat = getCat(labelStr, title);

  const rawDate =
    doc?.extracted_data?.document_date ||
    doc?.extracted_data?.date ||
    event.event_date ||
    event.date_start ||
    null;
  const dateLabel = rawDate
    ? formatDate(rawDate, { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Date not available';
  const dateUnavailable = !rawDate;

  const rawDoctor =
    doc?.extracted_data?.doctor_name || event.doctor || event.doctor_name || null;
  const doctorName = isKnown(rawDoctor) ? rawDoctor!.trim().replace(/^Dr\.\s*/i, '') : null;

  const rawLab =
    doc?.extracted_data?.hospital_name ||
    doc?.extracted_data?.lab_name ||
    event.hospital ||
    event.hospital_name ||
    null;
  const labName = isKnown(rawLab) ? rawLab!.trim() : null;
  const badge = labName ? providerBadge(labName) : null;

  return (
    <View style={styles.cardRow}>
      <View style={styles.nodeCol}>
        <View style={[styles.node, { backgroundColor: cat.bg }]}>
          <MaterialCommunityIcons name={cat.icon} size={18} color={cat.color} />
        </View>
        {!isLast && <View style={styles.connector} />}
      </View>

      <TouchableOpacity activeOpacity={0.75} style={styles.card} onPress={onPress}>
        {/* 1. Title */}
        <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>

        {/* 2. Date */}
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="calendar-outline" size={12} color={dateUnavailable ? '#B0A99F' : '#5C6E60'} />
          <Text style={[styles.metaText, dateUnavailable && styles.metaUnavail]}>{dateLabel}</Text>
        </View>

        {/* 3. Doctor */}
        {doctorName ? (
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="stethoscope" size={12} color="#5C6E60" />
            <Text style={styles.metaText} numberOfLines={1}>Dr. {doctorName.replace(/^Dr\.\s*/i, '')}</Text>
          </View>
        ) : null}

        {/* 4. Lab / Hospital */}
        {labName ? (
          <View style={styles.metaRow}>
            {badge && (
              <View style={[styles.providerChip, { backgroundColor: badge.bg }]}>
                <Text style={[styles.providerInitial, { color: badge.color }]}>{badge.initial}</Text>
              </View>
            )}
            <Text style={styles.metaText} numberOfLines={1}>{labName}</Text>
          </View>
        ) : null}

        {/* 5. Label + View Record */}
        <View style={styles.cardFooter}>
          {labelStr ? (
            <View style={[styles.labelPill, { backgroundColor: cat.badgeBg }]}>
              <Text style={[styles.labelText, { color: cat.badgeText }]}>{cat.name}</Text>
            </View>
          ) : <View />}
          <View style={styles.viewRow}>
            <Text style={styles.viewText}>View Record</Text>
            <MaterialCommunityIcons name="chevron-right" size={14} color="#004D36" />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// ─── Screen ────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

type ListItem =
  | { kind: 'separator'; label: string; key: string }
  | { kind: 'event'; event: TimelineEvent; isLast: boolean };

export default function FullTimelineScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const documents = useDocumentsStore((s) => s.documents);

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const patientId = activeProfile?.id ?? user?.id;

  const fetchPage = useCallback(async (offset: number, replace: boolean) => {
    if (!patientId) return;
    const data = await getTimeline(patientId, PAGE_SIZE, offset);
    setTotal(data.total);
    setEvents((prev) => replace ? data.events : [...prev, ...data.events]);
  }, [patientId]);

  useEffect(() => {
    setLoading(true);
    fetchPage(0, true).finally(() => setLoading(false));
  }, [fetchPage]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPage(0, true).catch(() => {});
    setRefreshing(false);
  };

  const onLoadMore = async () => {
    if (loadingMore || events.length >= total) return;
    setLoadingMore(true);
    await fetchPage(events.length, false).catch(() => {});
    setLoadingMore(false);
  };

  // Group by month-year (document date)
  const listData = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [];
    const monthMap = new Map<string, TimelineEvent[]>();

    events.forEach((ev) => {
      const doc = (documents || []).find(
        (d) => d?.document_id === ev.document_id || d?.document_id === ev.id
      );
      const rawDate =
        doc?.extracted_data?.document_date ||
        doc?.extracted_data?.date ||
        ev.event_date ||
        ev.date_start ||
        ev.created_at ||
        null;
      const key = rawDate
        ? formatDate(rawDate, { month: 'long', year: 'numeric' })
        : 'Date Unknown';
      if (!monthMap.has(key)) monthMap.set(key, []);
      monthMap.get(key)!.push(ev);
    });

    monthMap.forEach((evs, label) => {
      items.push({ kind: 'separator', label, key: `sep-${label}` });
      evs.forEach((ev, i) => {
        items.push({ kind: 'event', event: ev, isLast: i === evs.length - 1 });
      });
    });

    return items;
  }, [events, documents]);

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.kind === 'separator') return <MonthSeparator label={item.label} />;
    const ev = item.event;
    const doc = (documents || []).find(
      (d) => d?.document_id === ev.document_id || d?.document_id === ev.id
    );
    return (
      <TimelineCard
        event={ev}
        doc={doc}
        isLast={item.isLast}
        onPress={() => router.push(`/(tabs)/records/${ev.document_id || ev.id}` as any)}
      />
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.75} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#004D36" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Full Timeline</Text>
          {!loading && (
            <Text style={styles.headerSub}>{total} record{total !== 1 ? 's' : ''} in your history</Text>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.skeletonWrap}>
          {[1, 2, 3, 4, 5].map((i) => <CardSkeleton key={i} />)}
        </View>
      ) : events.length === 0 ? (
        <View style={styles.emptyWrap}>
          <MaterialCommunityIcons name="timeline-outline" size={52} color="#C8E6C9" />
          <Text style={styles.emptyTitle}>No timeline yet</Text>
          <Text style={styles.emptySub}>Upload a document to start building your health history.</Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) =>
            item.kind === 'separator'
              ? item.key
              : (item.event.id || item.event.document_id || String(Math.random()))
          }
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#004D36"
              colors={['#004D36']}
            />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color="#004D36" style={{ marginVertical: 20 }} />
            ) : events.length >= total && events.length > 0 ? (
              <Text style={styles.endText}>You've reached the beginning of your timeline ·  {total} records</Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F3F0' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: '#F8FAF9', borderBottomWidth: 1, borderBottomColor: '#E5E2DE',
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#D2E7D6',
  },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#1A2E1F', lineHeight: 22 },
  headerSub:   { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#5C6E60', lineHeight: 16 },

  listContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 },

  monthSep: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 12 },
  monthLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#4A5E50', letterSpacing: 0.8, textTransform: 'uppercase', marginRight: 8 },
  monthLine: { flex: 1, height: 1, backgroundColor: '#E5E2DE' },

  cardRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  cardBody: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E5E2DE' },
  nodeCol: { alignItems: 'center', marginRight: 12, width: 36 },
  node: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  connector: { width: 2, flex: 1, minHeight: 12, backgroundColor: '#E5E2DE', marginTop: 4 },

  card: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16,
    padding: 14, borderWidth: 1, borderColor: '#E5E2DE',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#1A2E1F', lineHeight: 18, marginBottom: 6 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  metaText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#5C6E60', flex: 1 },
  metaUnavail: { color: '#B0A99F', fontStyle: 'italic' },

  providerChip: { width: 18, height: 18, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  providerInitial: { fontSize: 8, fontFamily: 'Inter_700Bold' },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F5F3F0' },
  labelPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  labelText: { fontSize: 10, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.6 },
  viewRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#004D36' },

  skeletonWrap: { padding: 20, gap: 14 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#2D3A2F', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#819685', textAlign: 'center', lineHeight: 20 },
  endText: { textAlign: 'center', fontSize: 12, fontFamily: 'Inter_500Medium', color: '#B0A99F', marginVertical: 20 },
});
