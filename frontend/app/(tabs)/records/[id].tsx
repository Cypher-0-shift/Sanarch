import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getDocument, summarizeDocument } from '../../../services/api';
import { useAlertStore } from '../../../store/alertStore';

function ExpandableSection({ title, icon, children, defaultOpen = false }: { title: string, icon: string, children: React.ReactNode, defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View className="bg-white rounded-[24px] border border-[#E5E2DE] overflow-hidden mb-4">
      <TouchableOpacity 
        className="w-full flex-row items-center justify-between p-5"
        onPress={() => setOpen(!open)}
        activeOpacity={0.75}
      >
        <View className="flex-row items-center gap-3">
          <MaterialCommunityIcons name={icon as any} size={20} color="#004D36" />
          <Text className="font-display-bold text-[#2D3A2F] text-base">{title}</Text>
        </View>
        <MaterialCommunityIcons 
          name={open ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#819685" 
        />
      </TouchableOpacity>
      {open && (
        <View className="px-5 pb-5">
          {children}
        </View>
      )}
    </View>
  );
}

export default function RecordDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [summarizing, setSummarizing] = useState(false);

  const handleSummarize = async () => {
    if (!id) return;
    setSummarizing(true);
    try {
      const data = await summarizeDocument(id as string);
      setSummaryData(data);
    } catch (e: any) {
      useAlertStore.getState().showAlert('Summary Failed', e.response?.data?.detail || 'Could not generate summary.');
    } finally {
      setSummarizing(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const data = await getDocument(id);
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

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });

  // Extract display values from record
  const displayLabel = record.label || 'document';
  const displayTitle = record.original_filename || 'Document';
  const displayDate = record.uploaded_at || new Date().toISOString();
  const extractedFields = record.extracted_fields || {};

  return (
    <SafeAreaView className="flex-1 bg-[#F5F3F0]" edges={['top']}>
      {/* Header Area */}
      <View className="shrink-0 pt-4 pb-4 px-6 bg-white border-b border-[#E5E2DE] z-20 flex-row items-center justify-between">
        <TouchableOpacity 
          className="w-10 h-10 rounded-xl bg-[#F5F3F0] items-center justify-center"
          onPress={() => router.back()}
          activeOpacity={0.75}
          hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#2D3A2F" />
        </TouchableOpacity>
        <Text className="text-[#2D3A2F] text-lg font-display-bold tracking-tight">Report Details</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity 
            className="w-10 h-10 rounded-xl bg-[#F5F3F0] items-center justify-center"
            onPress={() => useAlertStore.getState().showAlert('Coming Soon', 'Document sharing coming in the next update.')}
            activeOpacity={0.75}
            hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
          >
            <MaterialCommunityIcons name="share-variant" size={20} color="#2D3A2F" />
          </TouchableOpacity>
          <TouchableOpacity 
            className="w-10 h-10 rounded-xl bg-[#F5F3F0] items-center justify-center"
            onPress={() => useAlertStore.getState().showAlert('Options', 'Coming soon.')}
            activeOpacity={0.75}
            hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
          >
            <MaterialCommunityIcons name="dots-vertical" size={24} color="#2D3A2F" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-6 pb-8">
          
          {/* Document Preview Hero */}
          <View className="bg-white rounded-[28px] p-2 border border-[#E5E2DE] mb-6 shadow-sm">
            <View className="aspect-[3/4] rounded-[22px] bg-[#F8FAF9] border border-[#F0F2F1] items-center justify-center overflow-hidden relative">
               <MaterialCommunityIcons name="file-document-outline" size={48} color="#004D36" />
               <Text className="text-[#2D3A2F] font-display-bold mt-4 text-base">Document preview</Text>
               <Text className="text-[#819685] text-[12px] font-display mt-1">Available after upload</Text>
            </View>
          </View>

          {/* Document Title & Meta */}
          <View className="flex-col mb-8">
            <View className="flex-row items-center gap-2 mb-2">
              <View className="px-2.5 py-1 bg-[#E8F5E9] rounded-lg">
                <Text className="text-[#004D36] text-[10px] font-display-bold uppercase tracking-widest">
                  {displayLabel.replace(/_/g, ' ')}
                </Text>
              </View>
              <Text className="text-[#819685] text-xs font-display-medium">Uploaded {formatDate(displayDate)}</Text>
            </View>
            <Text className="text-[#2D3A2F] text-2xl font-display-bold leading-tight mb-2">
              {displayTitle}
            </Text>
            
            <View className="flex-row items-center gap-4 py-3">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-full bg-[#F5F3F0] items-center justify-center">
                  <MaterialCommunityIcons name="account" size={16} color="#004D36" />
                </View>
                <View className="flex-col">
                  <Text className="text-[10px] text-[#819685] font-display-bold uppercase tracking-wider">Provider</Text>
                  <Text className="text-sm text-[#2D3A2F] font-display-semibold">{extractedFields.doctor || 'Unknown'}</Text>
                </View>
              </View>
              <View className="w-[1px] h-6 bg-[#E5E2DE]" />
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-full bg-[#F5F3F0] items-center justify-center">
                  <MaterialCommunityIcons name="hospital-building" size={16} color="#004D36" />
                </View>
                <View className="flex-col">
                  <Text className="text-[10px] text-[#819685] font-display-bold uppercase tracking-wider">Facility</Text>
                  <Text className="text-sm text-[#2D3A2F] font-display-semibold" numberOfLines={1} style={{ maxWidth: 120 }}>{extractedFields.hospital || 'Unknown'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="flex-row gap-3 mb-10">
            <TouchableOpacity activeOpacity={0.75} className="flex-1 flex-col items-center justify-center gap-2 p-4 bg-white rounded-[24px] border border-[#E5E2DE]">
              <MaterialCommunityIcons name="share-variant-outline" size={20} color="#004D36" />
              <Text className="text-[11px] font-display-bold text-[#5C6E60] uppercase">Share</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.75} className="flex-1 flex-col items-center justify-center gap-2 p-4 bg-white rounded-[24px] border border-[#E5E2DE]">
              <MaterialCommunityIcons name="download-outline" size={20} color="#004D36" />
              <Text className="text-[11px] font-display-bold text-[#5C6E60] uppercase">Save</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.75} className="flex-1 flex-col items-center justify-center gap-2 p-4 bg-[#004D36] rounded-[24px] shadow-sm">
              <MaterialCommunityIcons name="history" size={20} color="white" />
              <Text className="text-[11px] font-display-bold text-white uppercase">Timeline</Text>
            </TouchableOpacity>
          </View>

          {/* Expandable Medical Annotations */}
          {/* AI Summary Section */}
          <View className="mb-10">
            {summaryData ? (
              <ExpandableSection 
                title={`✨ AI Summary · ${summaryData.flag === 'normal' ? 'Normal ✓' : summaryData.flag === 'attention' ? 'Attention' : 'Urgent'}`} 
                icon="auto-fix" 
                defaultOpen
              >
                <View className="mb-4">
                  <Text className="text-[#2D3A2F] text-base font-display-bold mb-2">{summaryData.headline}</Text>
                  <Text className="text-[#5C6E60] text-sm leading-relaxed font-display">{summaryData.summary}</Text>
                </View>
                
                {summaryData.key_points && summaryData.key_points.length > 0 && (
                  <View className="mb-4">
                    {summaryData.key_points.map((pt: string, idx: number) => (
                      <View key={idx} className="flex-row items-start gap-2 mb-1">
                        <Text className="text-[#004D36] mt-0.5">•</Text>
                        <Text className="text-sm text-[#5C6E60] font-display flex-1">{pt}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {summaryData.flag !== 'normal' && (
                  <View className={`p-4 rounded-xl border ${summaryData.flag === 'attention' ? 'bg-[#FFF8E1] border-[#FFECB3]' : 'bg-[#FFEBEE] border-[#FFCDD2]'}`}>
                    <View className="flex-row items-center gap-2 mb-2">
                      <MaterialCommunityIcons 
                        name="alert-circle-outline" 
                        size={16} 
                        color={summaryData.flag === 'attention' ? '#F57F17' : '#C62828'} 
                      />
                      <Text className={`text-xs font-display-bold ${summaryData.flag === 'attention' ? 'text-[#F57F17]' : 'text-[#C62828]'}`}>
                        {summaryData.flag === 'attention' ? 'Attention Needed' : 'Urgent Flag'}
                      </Text>
                    </View>
                    <Text className={`text-xs font-display ${summaryData.flag === 'attention' ? 'text-[#F57F17]' : 'text-[#C62828]'}`}>
                      {summaryData.flag_reason || 'Values outside optimal range detected.'}
                    </Text>
                  </View>
                )}
              </ExpandableSection>
            ) : (
              (record.status === 'complete' || record.status === 'pending_review') && (
                <TouchableOpacity 
                  onPress={handleSummarize}
                  disabled={summarizing}
                  activeOpacity={0.8}
                  className="bg-[#004D36] rounded-[24px] p-5 flex-row items-center justify-center gap-2 mb-4"
                >
                  {summarizing ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <MaterialCommunityIcons name="auto-fix" size={20} color="white" />
                  )}
                  <Text className="text-white font-display-bold text-base">
                    {summarizing ? 'Analyzing document...' : 'Summarize with AI'}
                  </Text>
                </TouchableOpacity>
              )
            )}

            <ExpandableSection title="Clinical Findings" icon="format-list-checks">
               <View className="flex-row justify-between items-center py-2 border-b border-[#F5F3F0]">
                 <Text className="text-sm text-[#5C6E60] font-display">White Blood Cells</Text>
                 <Text className="text-sm font-display-bold text-[#2D3A2F]">6.4 K/uL</Text>
               </View>
               <View className="flex-row justify-between items-center py-2 border-b border-[#F5F3F0]">
                 <Text className="text-sm text-[#5C6E60] font-display">Platelets</Text>
                 <Text className="text-sm font-display-bold text-[#2D3A2F]">245 K/uL</Text>
               </View>
               <View className="flex-row justify-between items-center py-2">
                 <Text className="text-sm text-[#5C6E60] font-display">RBC Count</Text>
                 <Text className="text-sm font-display-bold text-[#2D3A2F]">4.2 M/uL</Text>
               </View>
            </ExpandableSection>
          </View>

          {/* Related Timeline */}
          <View className="mb-12">
            <Text className="text-[#2D3A2F] font-display-bold text-lg mb-6">Related Context</Text>
            <View className="relative flex-col gap-4">
              <View className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-[#E5E2DE] z-0" />
              
              <View className="relative z-10 flex-row gap-4 opacity-60">
                <View className="w-10 h-10 rounded-full bg-white border-4 border-[#F5F3F0] shadow-sm items-center justify-center shrink-0">
                  <MaterialCommunityIcons name="pill" size={18} color="#004D36" />
                </View>
                <View className="bg-white flex-1 p-4 rounded-[20px] shadow-sm border border-[#E5E2DE]">
                  <View className="flex-row justify-between items-start">
                    <Text className="text-[#2D3A2F] font-display-bold text-sm">Supplements</Text>
                    <Text className="text-[11px] text-[#819685] font-display-medium">Previous</Text>
                  </View>
                  <Text className="text-[#5C6E60] text-xs font-display mt-1">Prescribed during initial checkup</Text>
                </View>
              </View>

              <View className="relative z-10 flex-row gap-4 opacity-60">
                <View className="w-10 h-10 rounded-full bg-white border-4 border-[#F5F3F0] shadow-sm items-center justify-center shrink-0">
                  <MaterialCommunityIcons name="file-document-outline" size={18} color="#004D36" />
                </View>
                <View className="bg-white flex-1 p-4 rounded-[20px] shadow-sm border border-[#E5E2DE]">
                  <View className="flex-row justify-between items-start">
                    <Text className="text-[#2D3A2F] font-display-bold text-sm">Previous Report</Text>
                    <Text className="text-[11px] text-[#819685] font-display-medium">Earlier</Text>
                  </View>
                  <Text className="text-[#5C6E60] text-xs font-display mt-1">Comparing to baseline values</Text>
                </View>
              </View>

            </View>
          </View>
          
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
