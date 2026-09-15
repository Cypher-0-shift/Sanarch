import { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Animated, Modal, Alert, Switch } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { getDocument, deleteDocument, summarizeDocument } from '../../../services/api';
import { useAlertStore } from '../../../store/alertStore';
import { useAuthStore } from '../../../store/authStore';
import { useDocumentsStore, type DocumentRecord, PRESIGNED_URL_TTL_MS } from '../../../store/documentsStore';
import { CATEGORIES } from '../upload';
import AnimatedPressable from '../../../components/ui/Pressable';
import { parseDate, formatDate } from '../../../utils/date';

/**
 * Module-level cache for PDF converted JPEGs.
 * Keyed by `${document_id}:${updated_at}` so an updated document always busts the cache.
 * Survives navigation within a session without persisting to disk.
 */
const pdfCache = new Map<string, { uri: string; expiresAt: number }>();

function ExpandableSection({ title, icon, children, defaultOpen = false }: { title: string, icon: string, children: React.ReactNode, defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View className="rounded-[24px] overflow-hidden mb-4 shadow-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.4)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.5)' }}>
      <BlurView intensity={40} tint="light">
        <TouchableOpacity 
          className="w-full flex-row items-center justify-between p-5 bg-white/20"
          onPress={() => setOpen(!open)}
          activeOpacity={0.75}
        >
          <View className="flex-row items-center gap-3">
            <MaterialCommunityIcons name={icon as any} size={20} color="#004D36" />
            <Text className="font-display-bold text-[#004D36] text-base">{title}</Text>
          </View>
          <MaterialCommunityIcons 
            name={open ? "chevron-up" : "chevron-down"} 
            size={24} 
            color="#5C6E60" 
          />
        </TouchableOpacity>
        {open && (
          <View className="px-5 pb-5 pt-2">
            <View className="h-[1px] w-full bg-black/5 mb-4" />
            {children}
          </View>
        )}
      </BlurView>
    </View>
  );
}

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

function cleanDocumentTitle(title: string): string {
  if (!title) return 'Document';
  return (
    title
      .replace(/[\s\-_–—]*[\(\[]?\d{4}[-/.]\d{1,2}[-/.]\d{1,2}[\)\]]?[\s\-_–—]*$/i, '')
      .replace(/[\(\[]\d{4}[-/.]\d{1,2}[-/.]\d{1,2}[\)\]]/g, '')
      .trim() || title
  );
}

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

function isReferenceRangeValid(range: string | null | undefined): boolean {
  if (!range) return false;
  const cleaned = range.trim().toLowerCase();
  return (
    cleaned.length > 0 &&
    cleaned !== 'null' &&
    cleaned !== 'undefined' &&
    cleaned !== 'none' &&
    cleaned !== 'unknown' &&
    cleaned !== 'n/a' &&
    cleaned !== 'na' &&
    cleaned !== 'nil' &&
    cleaned !== 'not available' &&
    cleaned !== '-' &&
    cleaned !== '—'
  );
}

function condenseReferenceRange(range: string | null | undefined): string {
  if (!isReferenceRangeValid(range)) return '';
  return range!.replace(/[,;]\s*/g, ' · ').trim();
}

type LabStatus = 'HIGH' | 'LOW' | 'NORMAL';

function getLabStatus(item: { flag?: string | null; value?: string | null; reference_range?: string | null }): LabStatus {
  const rawFlag = (item.flag || '').toLowerCase().trim();
  if (rawFlag === 'high') return 'HIGH';
  if (rawFlag === 'low') return 'LOW';
  if (rawFlag === 'normal') return 'NORMAL';

  if (!item.value || !item.reference_range) return 'NORMAL';

  const valMatch = item.value.match(/-?\d+(?:\.\d+)?/);
  if (!valMatch) return 'NORMAL';
  const numVal = parseFloat(valMatch[0]);
  if (isNaN(numVal)) return 'NORMAL';

  const ref = item.reference_range;

  const rangeMatch = ref.match(/(-?\d+(?:\.\d+)?)\s*(?:-|to)\s*(-?\d+(?:\.\d+)?)/i);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    if (!isNaN(min) && numVal < min) return 'LOW';
    if (!isNaN(max) && numVal > max) return 'HIGH';
    return 'NORMAL';
  }

  const upperMatch = ref.match(/(?:<|<=|less\s+than)\s*(-?\d+(?:\.\d+)?)/i);
  if (upperMatch) {
    const max = parseFloat(upperMatch[1]);
    if (!isNaN(max) && numVal > max) return 'HIGH';
    return 'NORMAL';
  }

  const lowerMatch = ref.match(/(?:>|>=|greater\s+than)\s*(-?\d+(?:\.\d+)?)/i);
  if (lowerMatch) {
    const min = parseFloat(lowerMatch[1]);
    if (!isNaN(min) && numVal < min) return 'LOW';
    return 'NORMAL';
  }

  return 'NORMAL';
}

interface ParsedPhase {
  label?: string;
  value: string;
}

function parseReferenceRangePhases(range: string | null | undefined): ParsedPhase[] {
  if (!isReferenceRangeValid(range)) return [];

  const rawCleaned = range!.trim();
  const primarySplits = rawCleaned.split(/[\n;·|]+/);
  const segments: string[] = [];

  for (const part of primarySplits) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes(',')) {
      const commaParts = trimmed.split(/,\s*/);
      let currentAcc = '';
      for (let i = 0; i < commaParts.length; i++) {
        const cp = commaParts[i];
        if (currentAcc && /^\d+$/.test(cp) && /\d+$/.test(currentAcc)) {
          currentAcc += ',' + cp;
        } else {
          if (currentAcc) segments.push(currentAcc);
          currentAcc = cp;
        }
      }
      if (currentAcc) segments.push(currentAcc);
    } else {
      segments.push(trimmed);
    }
  }

  return segments
    .map((seg) => {
      const s = seg.trim();
      if (!s) return null;

      if (s.includes(':')) {
        const colonIdx = s.indexOf(':');
        const label = s.slice(0, colonIdx).trim();
        const value = s.slice(colonIdx + 1).trim();
        if (label && value) {
          return { label, value };
        }
      }

      const dashMatch = s.match(/^([A-Za-z\s()]+)\s*[—–]\s*(.+)$/);
      if (dashMatch) {
        return { label: dashMatch[1].trim(), value: dashMatch[2].trim() };
      }

      return { value: s };
    })
    .filter((p): p is ParsedPhase => p !== null);
}

interface LabResultRowProps {
  lv: {
    test_name?: string;
    value?: string | null;
    unit?: string | null;
    reference_range?: string | null;
    flag?: string | null;
  };
  isLast: boolean;
}

function LabResultRow({ lv, isLast }: LabResultRowProps) {
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const status = getLabStatus(lv);
  const isHigh = status === 'HIGH';
  const isLow = status === 'LOW';

  const phases = useMemo(() => parseReferenceRangePhases(lv.reference_range), [lv.reference_range]);

  const toggleExpand = () => {
    const toValue = expanded ? 0 : 1;
    Animated.timing(rotateAnim, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setExpanded(!expanded);
  };

  const chevronRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View className={`py-3.5 ${!isLast ? 'border-b border-black/5' : ''}`}>
      {/* Line 1: Title on top (wrap to 2 lines if needed) + Status Chip on top-right */}
      <View className="flex-row items-start justify-between gap-3 mb-1.5">
        <Text
          className="text-[14px] font-display-bold text-[#1F2937] flex-1 leading-5"
          numberOfLines={2}
        >
          {lv.test_name}
        </Text>
        {isHigh && (
          <View className="bg-[#FFFBEB] border border-[#FDE68A] rounded-full px-2.5 py-0.5 self-start">
            <Text className="text-[10px] font-display-bold text-[#D97706] tracking-wider uppercase">
              HIGH
            </Text>
          </View>
        )}
        {isLow && (
          <View className="bg-[#ECFEFF] border border-[#A5F3FC] rounded-full px-2.5 py-0.5 self-start">
            <Text className="text-[10px] font-display-bold text-[#0891B2] tracking-wider uppercase">
              LOW
            </Text>
          </View>
        )}
      </View>

      {/* Line 2: Value + unit on their own line directly below in large bold type */}
      <View className="flex-row items-baseline gap-1.5 mb-1">
        <Text
          className={`text-[22px] font-display-bold ${
            isHigh ? 'text-[#D97706]' : isLow ? 'text-[#0891B2]' : 'text-[#004D36]'
          }`}
          style={{ letterSpacing: -0.5 }}
        >
          {lv.value || '—'}
        </Text>
        {lv.unit ? (
          <Text className="text-[13px] font-display-medium text-[#819685]">
            {lv.unit}
          </Text>
        ) : null}
      </View>

      {/* Line 3: Tappable Reference range line with small rotating chevron at the end */}
      {isReferenceRangeValid(lv.reference_range) ? (
        <View className="mt-0.5">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleExpand}
            className="flex-row items-center justify-between py-1"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text
              className="text-[12px] font-display text-[#819685] flex-1 mr-2"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Ref: {condenseReferenceRange(lv.reference_range)}
            </Text>
            <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
              <MaterialCommunityIcons name="chevron-down" size={16} color="#819685" />
            </Animated.View>
          </TouchableOpacity>

          {/* Expanded inset panel */}
          {expanded && phases.length > 0 && (
            <View className="bg-black/[0.03] border border-[#E5E2DE] rounded-xl px-3.5 py-2.5 mt-2">
              <View className="flex-col gap-1.5">
                {phases.map((phase, pIdx) => (
                  <View
                    key={pIdx}
                    className={`flex-row items-start justify-between py-1 ${
                      pIdx !== phases.length - 1 ? 'border-b border-black/[0.04]' : ''
                    }`}
                  >
                    {phase.label ? (
                      <View className="flex-row items-baseline flex-1 flex-wrap">
                        <Text className="text-[12px] font-display-semibold text-[#1F2937]">
                          {phase.label}
                        </Text>
                        <Text className="text-[12px] font-display text-[#819685]"> — </Text>
                        <Text className="text-[12px] font-display-medium text-[#004D36]">
                          {phase.value}
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-[12px] font-display-semibold text-[#004D36]">
                        {phase.value}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

export default function RecordDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [pdfImageUrl, setPdfImageUrl] = useState<string | null>(null);
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);
  // Animation ref for "Explain This" button text reveal
  const explainAnim = useRef(new Animated.Value(0)).current;

  const token = useAuthStore((s) => s.token);
  const allDocuments = useDocumentsStore((s) => s.documents);
  const fetchDocuments = useDocumentsStore((s) => s.fetchDocuments);
  const cacheB2Url = useDocumentsStore((s) => s.cacheB2Url);
  const getValidB2Url = useDocumentsStore((s) => s.getValidB2Url);

  // Explain This button hint animation — runs independently of preview
  useEffect(() => {
    if (loading) return;

    let interval: ReturnType<typeof setInterval> | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const runHint = () => {
      explainAnim.setValue(0);
      Animated.sequence([
        // expand open
        Animated.spring(explainAnim, {
          toValue: 1,
          useNativeDriver: false,
          speed: 12,
          bounciness: 4,
        }),
        // hold open for 4 seconds
        Animated.delay(4000),
        // collapse back
        Animated.timing(explainAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: false,
        }),
      ]).start();
    };

    // First run after 3 seconds
    timeout = setTimeout(() => {
      runHint();
      // Then repeat every 15 seconds
      interval = setInterval(runHint, 15000);
    }, 3000);

    return () => {
      if (timeout) clearTimeout(timeout);
      if (interval) clearInterval(interval);
      explainAnim.stopAnimation();
    };
  }, [loading]);

  // Handle preview fade in separately
  useEffect(() => {
    if (previewLoaded) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [previewLoaded, fadeAnim]);

  const openSummary = () => {
    router.push(`/(tabs)/records/explain?id=${id}`);
  };

  const handleDelete = () => {
    setShowMenu(false);
    Alert.alert(
      "Delete Document",
      "Are you sure you want to delete this document? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDocument(id as string);
              await fetchDocuments();
              router.back();
            } catch (error: any) {
              useAlertStore.getState().showAlert('Delete Failed', error.message || 'Failed to delete document.');
            }
          }
        }
      ]
    );
  };

  const handleShare = () => {
    useAlertStore.getState().showAlert('Coming Soon', 'Document sharing feature will be activated shortly.');
  };

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        // Phase A: check whether a still-valid cached URL exists for this document.
        // If so, use the store record directly and skip the API round-trip.
        const cachedUrl = getValidB2Url(id);
        if (cachedUrl) {
          const stored = useDocumentsStore.getState().documents.find(
            (d) => d.document_id === id
          );
          if (stored) {
            setRecord({ ...stored, b2_file_url: cachedUrl });
            setLoading(false);
            return;
          }
        }
        // Slow path — fetch a fresh presigned URL from the backend.
        const data = await getDocument(id);
        if (data.b2_file_url) {
          cacheB2Url(id, data.b2_file_url, Date.now() + PRESIGNED_URL_TTL_MS);
        }
        setRecord(data);
      } catch (e) {
        console.error('[RecordDetail] Failed:', e);
        setRecord(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const b2Url = record?.b2_file_url;
  const thumbnailUrl = record?.thumbnail_url || null;
  // Hero preview uses thumbnail when available (Phase C); falls back to full-res
  // for documents uploaded before thumbnail generation was introduced.
  const previewUrl = thumbnailUrl || b2Url;
  const isPdf = record?.file_type === 'application/pdf' || record?.file_name?.toLowerCase().endsWith('.pdf');

  useEffect(() => {
    // PDF preview: if a server-generated thumbnail exists, use it directly
    // and skip the expensive blob-fetch + /convert cycle entirely.
    if (!isPdf) return;
    if (thumbnailUrl) {
      setPdfImageUrl(thumbnailUrl);
      return;
    }
    if (!b2Url) return;

    const fetchPdfImage = async () => {
      // Phase A+B: check module-level PDF cache before re-fetching/re-converting.
      // Key includes updated_at so an edited/replaced document still busts correctly.
      const cacheKey = `${id}:${record?.updated_at ?? ''}`;
      const cached = pdfCache.get(cacheKey);
      if (cached && Date.now() < cached.expiresAt - 2 * 60 * 1000) {
        setPdfImageUrl(cached.uri);
        return;
      }

      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL;
        if (!apiUrl) return;

        const response = await fetch(b2Url);
        const blob = await response.blob();
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const convertRes = await fetch(`${apiUrl}/documents/pdf/convert`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ pdf_uri: base64Data }),
        });
        const convertData = await convertRes.json();
        if (convertData.success && convertData.images?.length > 0) {
          const uri = convertData.images[0];
          // Cache the converted JPEG for the session duration.
          pdfCache.set(cacheKey, { uri, expiresAt: Date.now() + PRESIGNED_URL_TTL_MS });
          setPdfImageUrl(uri);
        } else {
          setPreviewLoaded(true);
        }
      } catch (err) {
        console.log('Failed to fetch/convert PDF preview:', err);
        setPreviewLoaded(true);
      }
    };
    fetchPdfImage();
  }, [isPdf, b2Url, token]);

  const relatedDocuments = useMemo(() => {
    if (!record) return [];
    
    const hospital = record.extracted_data?.hospital_name || '';
    const diagnoses: string[] = record.extracted_data?.diagnosis || [];
    const docDate = record.extracted_data?.document_date || record.created_at || '';

    return allDocuments.filter(other => {
      if (other.document_id === record.document_id) return false;

      const otherHospital = other.extracted_data?.hospital_name || '';
      const otherDiagnoses: string[] = other.extracted_data?.diagnosis || [];
      const otherDate = other.extracted_data?.document_date || other.created_at || '';

      if (!hospital || !otherHospital || hospital.toLowerCase() !== otherHospital.toLowerCase()) return false;

      const d1 = parseDate(docDate)?.getTime() ?? NaN;
      const d2 = parseDate(otherDate)?.getTime() ?? NaN;
      if (isNaN(d1) || isNaN(d2) || Math.abs(d1 - d2) > 30 * 24 * 60 * 60 * 1000) return false;

      if (diagnoses.length === 0 && otherDiagnoses.length === 0) return true;
      return diagnoses.some((d) =>
        otherDiagnoses.some((od) => d.toLowerCase() === od.toLowerCase())
      );
    });
  }, [record, allDocuments]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F5F3F0]" edges={['top']}>
        <View className="bg-white border-b border-[#E5E2DE] px-4 py-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3" activeOpacity={0.75} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#2D3A2F" />
          </TouchableOpacity>
          <Text className="text-xl font-display-bold text-[#2D3A2F]">Record Details</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#004D36" />
          <Text className="text-sm text-[#819685] font-display-medium mt-4">Loading record...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!record) {
    return (
      <SafeAreaView className="flex-1 bg-[#F5F3F0]" edges={['top']}>
        <View className="bg-white border-b border-[#E5E2DE] px-4 py-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3" activeOpacity={0.75} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#2D3A2F" />
          </TouchableOpacity>
          <Text className="text-xl font-display-bold text-[#2D3A2F]">Record Details</Text>
        </View>
        <View className="flex-1 items-center justify-center p-6">
          <MaterialCommunityIcons name="file-alert-outline" size={64} color="#94A3B8" />
          <Text className="text-xl font-display-bold mt-4 text-slate-900">Record not found</Text>
          <TouchableOpacity
            className="mt-6 h-12 px-8 bg-[#004D36] rounded-full items-center justify-center"
            onPress={() => router.back()}
            activeOpacity={0.75}
          >
            <Text className="text-white font-display-bold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayLabel = record.document_label || 'document';
  const rawTitle = record.document_title || record.file_name || 'Document';
  const displayTitle = cleanDocumentTitle(rawTitle);
  const displayDate = record.extracted_data?.document_date || record.created_at;
  const extractedData = record.extracted_data || {};
  
  const hasPreview = !!b2Url;
  
  const labValues = extractedData.lab_values || [];
  const filteredLabValues = showOnlyAlerts
    ? labValues.filter((lv: any) => {
        const status = getLabStatus(lv);
        return status === 'HIGH' || status === 'LOW';
      })
    : labValues;

  const hasDoctor = isKnown(extractedData.doctor_name);
  const hasHospital = isKnown(extractedData.hospital_name);

  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      <MeshBackground />
      {/* Header Area */}
      <BlurView intensity={40} tint="light" className="shrink-0 pt-4 pb-4 px-6 border-b border-[#E5E2DE] z-20 flex-row items-center justify-between">
        <TouchableOpacity 
          className="w-10 h-10 rounded-full bg-white/40 items-center justify-center border border-white/50 shadow-sm"
          onPress={() => router.back()}
          activeOpacity={0.75}
          hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#004D36" />
        </TouchableOpacity>
        <Text className="text-[#004D36] text-lg font-display-bold tracking-tight">Report Details</Text>
        <View className="flex-row gap-2 items-center">
          <TouchableOpacity 
            className="w-10 h-10 rounded-full bg-white/40 items-center justify-center border border-white/50 shadow-sm"
            onPress={handleShare}
            activeOpacity={0.75}
            hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
          >
            <MaterialCommunityIcons name="share-variant" size={20} color="#004D36" />
          </TouchableOpacity>
          <TouchableOpacity 
            className="w-10 h-10 rounded-full bg-white/40 items-center justify-center border border-white/50 shadow-sm"
            onPress={() => setShowMenu(!showMenu)}
            activeOpacity={0.75}
            hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
          >
            <MaterialCommunityIcons name="dots-vertical" size={24} color="#004D36" />
          </TouchableOpacity>
        </View>
      </BlurView>

      {/* More Options Dropdown Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' }}
        >
          <View
            style={{
              position: 'absolute',
              top: insets.top + 60,
              right: 20,
              width: 185,
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
            }}
            className="bg-white rounded-2xl border border-[#E5E2DE] overflow-hidden"
          >
            <TouchableOpacity 
              className="flex-row items-center gap-3 px-4 py-3.5 bg-white active:bg-[#FEE2E2]"
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="delete-outline" size={20} color="#C62828" />
              <Text className="text-[#C62828] font-display-semibold text-[14px]">Delete Document</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 180 }}>
        <View className="px-6 pt-6 pb-8">
          
          {/* Document Preview Hero */}
          <View className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-4 shadow-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.4)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.5)' }}>
            {!hasPreview ? (
              <View className="flex-1 items-center justify-center">
                <MaterialCommunityIcons name="file-document-outline" size={48} color="#004D36" />
                <Text className="text-[#2D3A2F] font-display-bold mt-4 text-base">Document preview</Text>
                <Text className="text-[#819685] text-[12px] font-display mt-1">Not available for older records</Text>
              </View>
            ) : (
              <View className="flex-1 relative">
                {!previewLoaded && (
                  <View className="absolute inset-0 items-center justify-center z-10 bg-white/20">
                    <ActivityIndicator size="small" color="#004D36" />
                  </View>
                )}
                <Animated.View style={{ flex: 1, width: '100%', height: '100%', opacity: fadeAnim }}>
                  {isPdf ? (
                    pdfImageUrl ? (
                      <ExpoImage 
                        source={{ uri: pdfImageUrl }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        cachePolicy="disk"
                        onLoad={() => setPreviewLoaded(true)}
                        onError={() => setPreviewLoaded(true)}
                      />
                    ) : null
                  ) : (
                    <ExpoImage 
                      source={{ uri: previewUrl }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                      cachePolicy="disk"
                      onLoad={() => setPreviewLoaded(true)}
                      onError={() => setPreviewLoaded(true)}
                    />
                  )}
                </Animated.View>
                
                {/* Glass Gradient overlay at the bottom */}
                <LinearGradient
                  colors={['transparent', 'rgba(0, 77, 54, 0.8)']}
                  style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', justifyContent: 'flex-end', padding: 16 }}
                >
                  <TouchableOpacity activeOpacity={0.8} className="flex-row self-start items-center gap-2 bg-white/20 rounded-full px-4 py-2 border border-white/30" style={{ overflow: 'hidden' }}>
                    <BlurView intensity={20} tint="light" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
                    <MaterialCommunityIcons name="fullscreen" size={18} color="white" />
                    <Text className="text-white font-display-medium text-[13px]">View Full Document</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            )}
          </View>

          {/* Document Title & Meta */}
          <View className="flex-col mb-6">
            <View className="flex-row items-center gap-2 mb-2 flex-wrap">
              <View className="px-3 py-1 bg-[#aef1d1]/30 rounded-full border border-[#aef1d1]">
                <Text className="text-[#07513a] text-[11px] font-display-bold uppercase tracking-widest">
                  {displayLabel.replace(/_/g, ' ')}
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <MaterialCommunityIcons name="calendar-today" size={14} color="#5C6E60" />
                <Text className="text-[#5C6E60] text-xs font-display-medium">{formatDate(displayDate)}</Text>
              </View>
            </View>
            <Text className="text-[#004D36] text-2xl font-display-bold leading-tight mb-3">
              {displayTitle}
            </Text>
            
            {(hasDoctor || hasHospital) && (
              <View className="flex-row items-center gap-3 flex-wrap">
                {hasDoctor && (
                  <View className="flex-row items-center gap-1.5">
                    <MaterialCommunityIcons name="account" size={18} color="#5C6E60" />
                    <Text className="text-sm text-[#404944] font-display-medium">
                      Dr. {extractedData.doctor_name.trim().replace(/^Dr\.\s*/i, '')}
                    </Text>
                  </View>
                )}
                {hasDoctor && hasHospital && (
                  <View className="w-1 h-1 rounded-full bg-[#bfc9c2]" />
                )}
                {hasHospital && (
                  <View className="flex-row items-center gap-1.5">
                    <MaterialCommunityIcons name="hospital-building" size={18} color="#5C6E60" />
                    <Text className="text-sm text-[#404944] font-display-medium" numberOfLines={1} style={{ maxWidth: 180 }}>
                      {extractedData.hospital_name}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>



          {/* Lab Results */}
          {labValues.length > 0 && (
            <ExpandableSection title="Lab Results" icon="test-tube" defaultOpen>
              <View className="flex-row items-center justify-between mb-4 mt-1 px-1">
                <Text className="text-[12px] font-display-medium text-[#819685]">
                  {filteredLabValues.length} {filteredLabValues.length === 1 ? 'result' : 'results'}
                </Text>
                <View className="flex-row items-center gap-2.5">
                  <Text className={`text-[12px] font-display-medium ${showOnlyAlerts ? 'text-[#004D36]' : 'text-[#819685]'}`}>
                    Show Alerts Only
                  </Text>
                  <Switch
                    value={showOnlyAlerts}
                    onValueChange={setShowOnlyAlerts}
                    trackColor={{ false: '#E5E2DE', true: '#004D36' }}
                    thumbColor="white"
                    ios_backgroundColor="#E5E2DE"
                  />
                </View>
              </View>

              {filteredLabValues.map((lv: any, idx: number) => (
                <LabResultRow
                  key={idx}
                  lv={lv}
                  isLast={idx === filteredLabValues.length - 1}
                />
              ))}
              {filteredLabValues.length === 0 && showOnlyAlerts && (
                <Text className="text-[13px] font-display text-[#819685] py-4 text-center">No abnormal results found.</Text>
              )}
            </ExpandableSection>
          )}

          {/* Medications */}
          {extractedData.medications && extractedData.medications.length > 0 && (
            <ExpandableSection title="Medications" icon="pill" defaultOpen>
              <View className="flex-col gap-3 pt-2">
                {extractedData.medications
                  .filter((med: any) => isKnown(med.medicine_name || med.name))
                  .map((med: any, idx: number) => {
                    const medName = (med.medicine_name || med.name || '').trim();
                    const details = [med.dose, med.frequency, med.duration].filter(isKnown).join(' · ');
                    return (
                      <View key={idx} className="bg-white/20 border border-white/50 rounded-2xl p-4 flex-row items-start gap-3">
                        <Text className="text-lg">💊</Text>
                        <View className="flex-1">
                          <Text className="text-[14px] font-display-bold text-[#E65100]">{medName}</Text>
                          {details ? (
                            <Text className="text-[13px] font-display text-[#404944] mt-1">{details}</Text>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
              </View>
            </ExpandableSection>
          )}

          {/* Diagnoses */}
          {record.condition_terms_raw && record.condition_terms_raw.length > 0 && (
            <ExpandableSection title="Diagnoses" icon="stethoscope" defaultOpen>
              <View className="flex-row flex-wrap gap-2 pt-2">
                {record.condition_terms_raw.filter(isKnown).map((term: string, idx: number) => (
                  <View key={idx} className="bg-[#d7e7d7]/50 border border-white/50 rounded-full px-3 py-1.5 flex-row items-center gap-1.5">
                    <MaterialCommunityIcons name="hospital-box-outline" size={14} color="#004D36" />
                    <Text className="text-[12px] font-display-medium text-[#004D36]">{term}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>
          )}

          {/* Related Timeline */}
          {relatedDocuments.length > 0 && (
            <View className="mb-12">
              <View className="flex-row items-center gap-2 mb-6">
                <MaterialCommunityIcons name="timeline-clock-outline" size={24} color="#004D36" />
                <Text className="text-[#004D36] font-display-bold text-lg">Related History</Text>
              </View>
              <View className="relative flex-col gap-5">
                <View className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-[#aef1d1]/50 z-0" />
                
                {relatedDocuments.map((doc, idx) => {
                  const category = CATEGORIES.find(c => c.id === doc.document_label) || CATEGORIES.find(c => c.id === 'other')!;
                  const docDate = doc.extracted_data?.document_date || doc.created_at;
                  return (
                    <TouchableOpacity 
                      key={doc.document_id}
                      activeOpacity={0.75}
                      onPress={() => router.push(`/(tabs)/records/${doc.document_id}`)}
                      className="relative z-10 flex-row gap-4"
                    >
                      <View className="w-10 h-10 rounded-full bg-[#f8faf9] border-4 border-[#aef1d1] shadow-sm items-center justify-center shrink-0">
                        <MaterialCommunityIcons name={category.icon as any} size={16} color="#004D36" />
                      </View>
                      <View className="flex-1 p-4 rounded-2xl shadow-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.4)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)' }}>
                        <BlurView intensity={20} tint="light" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
                        <View className="flex-row justify-between items-start mb-1">
                          <Text className="text-[#004D36] font-display-bold text-[15px]" numberOfLines={1}>{doc.document_title || category.name}</Text>
                          <Text className="text-[11px] text-[#5C6E60] font-display-medium shrink-0 ml-2">{formatDate(docDate)}</Text>
                        </View>
                        <Text className="text-[#404944] text-[13px] font-display" numberOfLines={2}>
                          {doc.summary || 'View document for details.'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
          
        </View>
      </ScrollView>

      {record.status === 'ready' && (
        <TouchableOpacity
          onPress={openSummary}
          activeOpacity={0.85}
          style={{
            position: 'absolute',
            bottom: 112,
            right: 24,
            elevation: 8,
            shadowColor: '#004D36',
            shadowOpacity: 0.4,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
          }}
        >
          <Animated.View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#004D36',
              borderRadius: 9999,
              height: 56,
              paddingLeft: 17,
              paddingRight: explainAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [17, 24],
              }),
            }}
          >
            <MaterialCommunityIcons name="lightbulb-on-outline" size={22} color="white" />
            <Animated.View
              style={{
                overflow: 'hidden',
                width: explainAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 115],
                }),
                opacity: explainAnim.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: [0, 0.8, 1],
                }),
                marginLeft: explainAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 12],
                }),
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  color: 'white',
                  fontFamily: 'Inter_700Bold',
                  fontSize: 15,
                  letterSpacing: 0.3,
                  width: 140,
                }}
              >
                Explain This
              </Text>
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
      )}


    </SafeAreaView>
  );
}
