/**
 * DocumentCard — DESIGN.md Phase 3
 *
 * THE most reused component in the app. Built defensively with all 4 variants
 * verified against edge cases before any screen consumes it.
 *
 * Variants:
 *   'default'     — standard pressable card, routes to record detail on press
 *   'processing'  — shows animated processing thumbnail + stage label, non-navigable
 *   'failed'      — red-tinted, shows retry CTA, triggers retryDocument
 *   'selectable'  — checkbox mode for bulk-select (used in Share QR flow)
 *
 * Edge cases verified:
 *   ✓ No hospital_name — only date shown, no "undefined" text
 *   ✓ Very long title  — numberOfLines={2} with ellipsis (not 1 — 2 gives readable truncation)
 *   ✓ Failed state     — visually distinct from processing (red tint, static, retry CTA)
 *   ✓ Multi-word category — wrapped via CategoryBadge, never clipped horizontally
 *
 * Press behaviour:
 *   default     → router.push(/(tabs)/records/{id})
 *   processing  → no-op (non-interactive badge shows status instead)
 *   failed      → calls onRetry prop (or retryDocument from documentsStore)
 *   selectable  → calls onSelect(document_id)
 *
 * Animation: scale(0.97) on press with spring return — per DESIGN.md §9.
 * Uses ELEVATION_RN[2] (2-layer shadow) — per DESIGN.md §4, never flat.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { COLORS, FONTS, RADIUS, SPACING, ELEVATION_RN } from '../../constants/theme';
import { SPRING, DURATION } from '../../constants/motion';
import CategoryBadge, { normaliseCategory } from './CategoryBadge';
import AIContentBadge from './AIContentBadge';
import DocumentThumbnail, { ThumbnailState } from './DocumentThumbnail';
import { type DocumentRecord } from '../../store/documentsStore';
import { retryDocument } from '../../services/api';
import { useDocumentsStore } from '../../store/documentsStore';
import { toast } from '../feedback/toastStore';
import { logger } from '../../utils/logger';

// ─────────────────────────────────────────────
// Processing stage labels — human readable
// ─────────────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  uploading:          'Preparing upload…',
  uploaded:           'Securely stored',
  queued:             'Queued for AI…',
  preparing:          'Preparing document…',
  reading_pages:      'Reading pages…',
  extracting:         'Extracting medical data…',
  generating_summary: 'Generating summary…',
  finalizing:         'Finalizing…',
  ready:              'Complete',
  failed:             'Processing failed',
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return '';
  }
}

// ─────────────────────────────────────────────
// Derive thumbnail state from document status
// ─────────────────────────────────────────────

function resolveThumbnailState(doc: DocumentRecord): ThumbnailState {
  if (doc.status === 'failed') return 'failed';
  if (
    doc.status === 'uploading' ||
    doc.status === 'uploaded'  ||
    doc.status === 'queued'    ||
    doc.status === 'processing'
  ) return 'processing';
  // Ready — pick image or pdf based on file type
  const ext = doc.file_type?.toLowerCase() ?? '';
  if (ext === 'pdf' || ext.includes('pdf')) return 'pdf';
  if (doc.b2_file_url) return 'image';
  return 'pdf'; // fallback
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

export type DocumentCardVariant = 'default' | 'processing' | 'failed' | 'selectable';

interface DocumentCardProps {
  document:    DocumentRecord;
  variant?:    DocumentCardVariant;
  /** selectable variant: whether this card is checked */
  selected?:   boolean;
  /** selectable variant: fires with document_id */
  onSelect?:   (id: string) => void;
  /** optional override for retry — defaults to documentsStore retryDocument */
  onRetry?:    (id: string) => void;
  /** optional override for press — defaults to navigation */
  onPress?:    (id: string) => void;
  /** optional handler for long press */
  onLongPress?: (id: string) => void;
  style?:      object;
  testID?:     string;
}

export default function DocumentCard({
  document,
  variant    = 'default',
  selected   = false,
  onSelect,
  onRetry,
  onPress,
  onLongPress,
  style,
  testID,
}: DocumentCardProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [imageError, setImageError] = useState(false);

  const pressScale = useSharedValue(1);
  const checkScale = useSharedValue(selected ? 1 : 0);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  // Checkbox pop animation for selectable variant
  React.useEffect(() => {
    checkScale.value = withSpring(selected ? 1 : 0, SPRING.buttonReturn);
  }, [selected]);

  const checkStyle = useAnimatedStyle(() => ({
    transform:  [{ scale: checkScale.value }],
    opacity:    checkScale.value,
  }));

  // ── Derived values ─────────────────────────────────────────────
  const {
    document_id,
    document_title,
    document_label,
    status,
    processing_progress,
    processing_stage,
    created_at,
    extracted_data,
  } = document;

  const cat          = normaliseCategory(document_label);
  const thumbState   = imageError ? 'pdf' : resolveThumbnailState(document);
  const stageLabel   = STAGE_LABELS[processing_stage] ?? 'Processing…';
  const hasAIData    = !!(extracted_data && Object.keys(extracted_data).length > 0);
  const isFailed     = status === 'failed' || variant === 'failed';
  const isProcessing = variant === 'processing' ||
    ['uploading', 'uploaded', 'queued', 'processing'].includes(status);

  // Build secondary line — never shows undefined/null
  const ext           = extracted_data ?? {};
  let   secondaryLine = '';
  if (ext.hospital_name && ext.doctor_name) {
    secondaryLine = `Dr. ${ext.doctor_name} · ${ext.hospital_name}`;
  } else if (ext.doctor_name) {
    secondaryLine = `Dr. ${ext.doctor_name}`;
  } else if (ext.hospital_name) {
    secondaryLine = ext.hospital_name;
  }
  // No secondary line if neither — just shows date (no empty placeholder)

  const dateLabel = formatDate(created_at);

  // ── Handlers ──────────────────────────────────────────────────
  function handlePressIn() {
    if (isProcessing) return;
    pressScale.value = withTiming(0.97, { duration: DURATION.micro });
  }

  function handlePressOut() {
    pressScale.value = withSpring(1, SPRING.buttonReturn);
  }

  async function handlePress() {
    if (isProcessing) return;

    if (variant === 'selectable') {
      onSelect?.(document_id);
      return;
    }

    if (isFailed) {
      if (onRetry) {
        onRetry(document_id);
        return;
      }
      if (isRetrying) return;
      setIsRetrying(true);
      try {
        await retryDocument(document_id);
        useDocumentsStore.getState().updateDocument(document_id, {
          status:              'queued',
          processing_progress: 25,
          processing_stage:    'queued',
        });
        toast.success('Retrying…');
      } catch (err: any) {
        logger.error('[DocumentCard] retry failed:', err);
        toast.error(err.message ?? 'Retry failed. Try again.');
      } finally {
        setIsRetrying(false);
      }
      return;
    }

    // Default — navigate to record detail
    if (onPress) {
      onPress(document_id);
    } else {
      router.push(`/(tabs)/records/${document_id}` as any);
    }
  }

  // ── Card border for selectable ─────────────────────────────────
  const cardBorderColor = variant === 'selectable' && selected
    ? COLORS.brandPrimary
    : isFailed
    ? 'rgba(220,38,38,0.20)'
    : 'rgba(17,24,39,0.06)';

  const cardBgColor = isFailed
    ? COLORS.resultHighBg   // #FEF2F2 — red tint for failed
    : COLORS.surface;       // #FFFFFF — standard

  // ─────────────────────────────────────────────
  return (
    <Animated.View style={[pressStyle, style]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        onLongPress={() => onLongPress?.(document_id)}
        disabled={isProcessing}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`Document: ${document_title || cat}`}
        accessibilityState={{ selected }}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: cardBgColor,
              borderColor:     cardBorderColor,
              borderWidth:     variant === 'selectable' && selected ? 2 : 1,
            },
          ]}
        >
          {/* ── Thumbnail ── */}
          <DocumentThumbnail
            state={thumbState}
            imageUri={document.b2_file_url}
            category={document_label}
            size="md"
            progress={processing_progress}
            onImageError={() => setImageError(true)}
          />

          {/* ── Content block ── */}
          <View style={styles.content}>
            {/* Row 1: Title + selectable checkbox */}
            <View style={styles.titleRow}>
              <Text
                style={[styles.title, isFailed && styles.titleFailed]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {document_title || CATEGORY_CONFIG_LOCAL[cat]}
              </Text>

              {/* Selectable checkbox */}
              {variant === 'selectable' && (
                <Animated.View style={[styles.checkbox, checkStyle, selected && styles.checkboxSelected]}>
                  {selected && <Text style={styles.checkmark}>✓</Text>}
                </Animated.View>
              )}
            </View>

            {/* Row 2: Badges */}
            <View style={styles.badgeRow}>
              <CategoryBadge category={document_label} size="sm" />
              {hasAIData && !isProcessing && !isFailed && (
                <AIContentBadge />
              )}
            </View>

            {/* Row 3: Processing stage label or hospital + date */}
            {isProcessing ? (
              <Text style={styles.stageText} numberOfLines={1}>
                {stageLabel}
              </Text>
            ) : isFailed ? (
              <Text style={styles.failedText}>
                {isRetrying ? 'Retrying…' : 'Tap to retry'}
              </Text>
            ) : (
              <View style={styles.metaRow}>
                {secondaryLine ? (
                  <Text style={styles.metaText} numberOfLines={1} ellipsizeMode="tail">
                    {secondaryLine}
                  </Text>
                ) : null}
                {dateLabel ? (
                  <Text style={styles.dateText}>{dateLabel}</Text>
                ) : null}
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Local fallback map for untitled documents ──────────────────────────────

import { CATEGORY_CONFIG } from './CategoryBadge';
const CATEGORY_CONFIG_LOCAL: Record<string, string> = {
  lab_report:        'Lab Report',
  prescription:      'Prescription',
  imaging_scan:      'Imaging / Scan',
  discharge_summary: 'Discharge Summary',
  other:             'Document',
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    borderRadius:  RADIUS['2xl'],
    padding:       SPACING[3],   // 12
    gap:           SPACING[3],   // 12
    ...ELEVATION_RN[2],
  },

  // Content column
  content: {
    flex: 1,
    gap:  SPACING[1] + 2,   // ~6 — tight vertical rhythm
    alignSelf: 'stretch',
    justifyContent: 'center',
  },

  // Title
  titleRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           SPACING[2],
  },
  title: {
    flex:          1,
    fontFamily:    FONTS.jakartaSemiBold,
    fontSize:      14,
    lineHeight:    20,
    color:         COLORS.ink800,
  },
  titleFailed: {
    color: COLORS.resultHigh,
  },

  // Badges
  badgeRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           SPACING[1],  // 4
    alignItems:    'center',
  },

  // Meta
  metaRow: {
    flexDirection: 'row',
    alignItems:    'center',
    justifyContent: 'space-between',
    gap:           SPACING[2],
  },
  metaText: {
    flex:          1,
    fontFamily:    FONTS.jakartaRegular,
    fontSize:      11,
    color:         COLORS.ink400,
  },
  dateText: {
    fontFamily: FONTS.jakartaRegular,
    fontSize:   11,
    color:      COLORS.ink300,
    flexShrink: 0,
  },

  // Processing
  stageText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize:   11,
    color:      COLORS.brandPrimary,
  },

  // Failed
  failedText: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize:   11,
    color:      COLORS.resultHigh,
  },

  // Selectable checkbox
  checkbox: {
    width:          20,
    height:         20,
    borderRadius:   RADIUS.sm,    // 6 — slightly rounded square
    borderWidth:    1.5,
    borderColor:    COLORS.ink300,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  checkboxSelected: {
    backgroundColor: COLORS.brandPrimary,
    borderColor:     COLORS.brandPrimary,
  },
  checkmark: {
    fontFamily: FONTS.jakartaBold,
    fontSize:   11,
    color:      COLORS.surface,
    lineHeight: 16,
  },
});
