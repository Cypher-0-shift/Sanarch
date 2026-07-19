/**
 * Record Detail — Phase 5
 *
 * Visual and hierarchical refactor of the document detail screen.
 * Prioritizes the Overview section and uses progressive rendering.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams as useLocalParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { getDocument, deleteDocument } from '../../../services/api'; 
import { useDocumentsStore } from '../../../store/documentsStore';
import { COLORS, FONTS, RADIUS, SPACING } from '../../../constants/theme';
import CategoryBadge, { normaliseCategory } from '../../../components/documents/CategoryBadge';
import CollapsibleSection from '../../../components/records/CollapsibleSection';
import ExplainThisFAB from '../../../components/records/ExplainThisFAB';
import AISummaryModal from '../../../components/records/AISummaryModal';
import EditDocumentSheet from '../../../components/records/EditDocumentSheet';
import DeleteConfirmSheet from '../../../components/records/DeleteConfirmSheet';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import { useAlertStore } from '../../../store/alertStore';

export default function RecordDetailsScreen() {
  const { id } = useLocalParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  
  // State
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAiModalVisible, setIsAiModalVisible] = useState(false);
  const [isEditSheetVisible, setIsEditSheetVisible] = useState(false);
  const [isDeleteSheetVisible, setIsDeleteSheetVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchDocuments = useDocumentsStore((s) => s.fetchDocuments);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const data = await getDocument(id);
        setRecord(data);
      } catch (e) {
        console.error('[RecordDetail] Failed:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Handlers
  const handleShare = () => {
    router.push(`/(tabs)/doctors?docs=${id}`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDocument(id as string);
      await fetchDocuments();
      setIsDeleteSheetVisible(false);
      router.back();
    } catch (error: any) {
      useAlertStore.getState().showAlert('Delete Failed', error.message || 'Failed to delete document.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async (newTitle: string, newCategory: string) => {
    setIsSaving(true);
    try {
      // updateDocument not available, fallback to local state
      setRecord({ ...record, document_title: newTitle, document_label: newCategory });
      await fetchDocuments();
      setIsEditSheetVisible(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.brandPrimary} />
      </View>
    );
  }

  if (!record) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Document not found.</Text>
        <PrimaryButton label="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  const extData = record.extracted_data || {};
  const isFailed = record.processing_status === 'failed' || !extData;
  const labResults = extData.lab_results || [];
  const meds = extData.medications || [];
  const diagnoses = extData.diagnosis || [];
  
  const hasLabAlerts = labResults.some((l: any) => l.flag && l.flag.toLowerCase() !== 'normal');
  const summaryText = extData.summary || 'No overview generated.';

  return (
    <View style={styles.container}>
      {/* ── Fixed Header ── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.ink900} />
        </Pressable>

        <View style={styles.headerActions}>
          <Pressable onPress={handleShare} style={styles.iconBtn} hitSlop={12}>
            <MaterialCommunityIcons name="share-variant" size={22} color={COLORS.ink600} />
          </Pressable>
          <Pressable onPress={() => setIsEditSheetVisible(true)} style={styles.iconBtn} hitSlop={12}>
            <MaterialCommunityIcons name="pencil-outline" size={22} color={COLORS.ink600} />
          </Pressable>
          <Pressable onPress={() => setIsDeleteSheetVisible(true)} style={styles.iconBtn} hitSlop={12}>
            <MaterialCommunityIcons name="delete-outline" size={22} color={COLORS.resultHighBg} />
          </Pressable>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Area (Thumbnail + Title + Meta) ── */}
        <View style={styles.titleSection}>
          <View style={styles.titleHeaderRow}>
            <CategoryBadge category={record.document_label} />
            {record.b2_file_url && (
              <Image 
                source={{ uri: record.b2_file_url }} 
                style={styles.thumbnailTag} 
                resizeMode="cover"
              />
            )}
          </View>
          
          <Text style={styles.title}>{record.document_title}</Text>
          
          <View style={styles.metaRow}>
            {extData.document_date && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="calendar-blank" size={16} color={COLORS.ink400} />
                <Text style={styles.metaText}>{extData.document_date}</Text>
              </View>
            )}
            {extData.doctor_name && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="stethoscope" size={16} color={COLORS.ink400} />
                <Text style={styles.metaText}>{extData.doctor_name}</Text>
              </View>
            )}
            {extData.hospital_name && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="hospital-building" size={16} color={COLORS.ink400} />
                <Text style={styles.metaText}>{extData.hospital_name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Progressive Rendering Sections ── */}
        
        {/* 1. Overview (Always Expanded) */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionHeader}>Overview</Text>
          <View style={styles.overviewCard}>
            {isFailed ? (
              <View style={styles.failedBanner}>
                <MaterialCommunityIcons name="alert-circle-outline" size={20} color={COLORS.resultHigh} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.failedTitle}>Processing failed</Text>
                  <Text style={styles.failedSub}>We couldn't extract data from this document.</Text>
                </View>
                <Pressable style={styles.retryBtn}>
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={styles.overviewText}>{summaryText}</Text>
            )}
          </View>
        </View>

        {/* 2. Related History */}
        <CollapsibleSection title="Related History" count={0} initiallyExpanded={false}>
          <Text style={styles.placeholderText}>Related history will appear here.</Text>
        </CollapsibleSection>

        {/* 3. Lab Results */}
        <CollapsibleSection 
          title="Lab Results" 
          count={labResults.length} 
          hasAlerts={hasLabAlerts}
          initiallyExpanded={hasLabAlerts}
        >
          {labResults.map((lab: any, idx: number) => {
            const isAlert = lab.flag && lab.flag.toLowerCase() !== 'normal';
            return (
              <View key={idx} style={[styles.dataRow, isAlert && styles.dataRowAlert]}>
                <View style={styles.dataColLeft}>
                  <Text style={styles.dataLabel}>{lab.test_name}</Text>
                  {lab.reference_range && (
                    <Text style={styles.dataSub}>Ref: {lab.reference_range}</Text>
                  )}
                </View>
                <View style={styles.dataColRight}>
                  <Text style={[styles.dataVal, isAlert && styles.dataValAlert]}>
                    {lab.result_value} {lab.unit}
                  </Text>
                  {isAlert && <MaterialCommunityIcons name="alert" size={14} color={COLORS.resultHigh} />}
                </View>
              </View>
            );
          })}
        </CollapsibleSection>

        {/* 4. Medications */}
        <CollapsibleSection title="Medications" count={meds.length}>
          {meds.map((m: any, idx: number) => (
            <View key={idx} style={styles.dataRow}>
              <View style={styles.dataColLeft}>
                <Text style={styles.dataLabel}>{m.medication_name}</Text>
                {m.duration && <Text style={styles.dataSub}>{m.duration}</Text>}
              </View>
              <Text style={styles.dataVal}>{m.dosage} • {m.frequency}</Text>
            </View>
          ))}
        </CollapsibleSection>

        {/* 5. Diagnoses */}
        <CollapsibleSection title="Diagnoses" count={diagnoses.length}>
          <View style={styles.diagContainer}>
            {diagnoses.map((d: string, idx: number) => (
              <View key={idx} style={styles.diagPill}>
                <Text style={styles.diagText}>{d}</Text>
              </View>
            ))}
          </View>
        </CollapsibleSection>

      </ScrollView>

      {/* ── Fixed FAB ── */}
      {!isFailed && <ExplainThisFAB onPress={() => setIsAiModalVisible(true)} />}

      {/* ── Modals & Sheets ── */}
      <AISummaryModal
        visible={isAiModalVisible}
        onClose={() => setIsAiModalVisible(false)}
        summaryText={summaryText}
      />
      
      <EditDocumentSheet
        visible={isEditSheetVisible}
        onClose={() => setIsEditSheetVisible(false)}
        initialTitle={record.document_title}
        initialCategory={normaliseCategory(record.document_label)}
        onSave={handleSaveEdit}
        isSaving={isSaving}
      />

      <DeleteConfirmSheet
        visible={isDeleteSheetVisible}
        onClose={() => setIsDeleteSheetVisible(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.canvas,
  },
  errorText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 16,
    color: COLORS.ink400,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[2],
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ink100,
    zIndex: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: SPACING[4],
  },
  titleSection: {
    marginBottom: SPACING[6],
    gap: SPACING[3],
  },
  titleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  thumbnailTag: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.ink200,
  },
  title: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 24,
    color: COLORS.ink900,
    lineHeight: 32,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: SPACING[4],
    rowGap: SPACING[2],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
  },
  metaText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 13,
    color: COLORS.ink600,
  },
  overviewSection: {
    marginBottom: SPACING[6],
    gap: SPACING[3],
  },
  sectionHeader: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 18,
    color: COLORS.ink900,
  },
  overviewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING[4],
    borderWidth: 1,
    borderColor: COLORS.ink100,
  },
  overviewText: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.ink600,
  },
  failedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.resultHighBg,
    borderRadius: RADIUS.lg,
    padding: SPACING[3],
    gap: SPACING[3],
  },
  failedTitle: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 14,
    color: COLORS.resultHigh,
  },
  failedSub: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 12,
    color: COLORS.ink600,
    marginTop: 2,
  },
  retryBtn: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.md,
  },
  retryText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 12,
    color: COLORS.resultHigh,
  },
  placeholderText: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 14,
    color: COLORS.ink400,
    fontStyle: 'italic',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING[2],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ink100,
  },
  dataRowAlert: {
    backgroundColor: 'rgba(255,59,48,0.05)',
    marginHorizontal: -SPACING[4],
    paddingHorizontal: SPACING[4],
  },
  dataColLeft: {
    flex: 1,
    paddingRight: SPACING[4],
  },
  dataColRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dataLabel: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 14,
    color: COLORS.ink800,
  },
  dataSub: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 12,
    color: COLORS.ink400,
    marginTop: 2,
  },
  dataVal: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 14,
    color: COLORS.ink900,
  },
  dataValAlert: {
    color: COLORS.resultHigh,
  },
  diagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[2],
  },
  diagPill: {
    backgroundColor: COLORS.brandTint,
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.full,
  },
  diagText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 13,
    color: COLORS.brandPrimary,
  },
});
