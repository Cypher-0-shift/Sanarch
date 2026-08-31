import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { getDocument, summarizeDocument } from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';

export default function ExplainScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [record, setRecord] = useState<any>(null);
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError('');
        
        // Fetch the document details to get extracted data
        const doc = await getDocument(id);
        setRecord(doc);
        
        // Fetch the AI Summary
        const summaryRes = await summarizeDocument(id);
        setAiSummary(summaryRes);
        
      } catch (e: any) {
        console.error('[ExplainScreen] Failed:', e);
        setError(e.message || 'Failed to load report analysis.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [id]);

  const extracted = record?.extracted_data || {};

  return (
    <SafeAreaView className="flex-1 bg-[#f4f7f5]">
      {/* Header */}
      <View className="px-4 py-3 flex-row items-center gap-3 bg-white border-b border-[#E5E2DE] z-10" style={{ elevation: 1 }}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 rounded-full bg-[#f4f7f5] items-center justify-center"
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#1e3124" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-[17px] font-display-bold text-[#1e3124]">Report Analysis</Text>
          <Text className="text-[12px] font-display text-[#5C6E60]">AI-Powered Insights</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#004D36" />
          <Text className="text-[#004D36] font-display-medium mt-4">Analyzing your document...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center p-6">
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#C62828" />
          <Text className="text-[#C62828] font-display-medium text-center mt-4 text-base">{error}</Text>
          <TouchableOpacity onPress={() => router.back()} className="mt-8 px-6 py-3 bg-[#FFCDD2] rounded-full">
            <Text className="text-[#C62828] font-display-bold">Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
          
          <View className="bg-[#d2e8d5]/50 border border-[#d2e8d5] rounded-xl p-4 mb-6 flex-row gap-3">
            <MaterialCommunityIcons name="information" size={20} color="#1e3124" style={{ marginTop: 2 }} />
            <Text className="flex-1 text-[#1e3124] text-[13px] font-display-medium leading-5">
              This is a simplified explanation, not medical advice. Always consult your doctor about your results.
            </Text>
          </View>

          {/* AI Summary Section */}
          {aiSummary && (
            <View className="mb-8">
              <Text className="text-xl font-display-bold text-[#004D36] leading-tight mb-4">
                {aiSummary.headline}
              </Text>

              {aiSummary.flag && aiSummary.flag !== 'normal' && (
                <View className={`p-4 rounded-2xl border mb-5 ${aiSummary.flag === 'urgent' ? 'bg-[#FFCDD2]/30 border-[#ef9a9a]' : 'bg-[#FFF9C4]/40 border-[#fff59d]'}`}>
                  <View className="flex-row items-center gap-2 mb-2">
                    <MaterialCommunityIcons name={aiSummary.flag === 'urgent' ? 'alert' : 'alert-circle'} size={20} color={aiSummary.flag === 'urgent' ? '#C62828' : '#F57F17'} />
                    <Text className="font-display-bold uppercase tracking-widest text-[12px]" style={{ color: aiSummary.flag === 'urgent' ? '#C62828' : '#F57F17' }}>
                      Requires {aiSummary.flag}
                    </Text>
                  </View>
                  <Text className="text-[14px] font-display-medium text-[#404944] leading-5">
                    {aiSummary.flag_reason}
                  </Text>
                </View>
              )}

              <View className="mb-6">
                <Text className="text-[12px] font-display-bold text-[#819685] uppercase tracking-widest mb-2">Overview</Text>
                <Text className="text-[15px] text-[#2D3A2F] leading-relaxed font-display">
                  {aiSummary.summary}
                </Text>
              </View>

              {aiSummary.key_points && aiSummary.key_points.length > 0 && (
                <View className="mb-6">
                  <Text className="text-[12px] font-display-bold text-[#819685] uppercase tracking-widest mb-3">Key Takeaways</Text>
                  <View className="flex-col gap-3">
                    {aiSummary.key_points.map((point: string, idx: number) => (
                      <View key={idx} className="flex-row items-start gap-3 bg-white border border-[#e1e3e2] p-4 rounded-2xl shadow-sm">
                        <View className="w-2 h-2 rounded-full bg-[#004D36] mt-1.5 shrink-0" />
                        <Text className="flex-1 text-[14.5px] text-[#2D3A2F] leading-relaxed font-display">
                          {point}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Extracted Details Section */}
          <View className="mt-2 pt-6 border-t border-[#e1e3e2]/60">
            <Text className="text-lg font-display-bold text-[#1e3124] mb-4">Extracted Details</Text>
            
            <View className="bg-white rounded-3xl border border-[#e1e3e2]/60 overflow-hidden shadow-sm">
              
              {/* Doctor / Hospital */}
              {(extracted.doctor_name || extracted.hospital_name) && (
                <View className="p-5 border-b border-[#e1e3e2]/40">
                  <Text className="text-[12px] font-display-bold text-[#819685] uppercase tracking-wider mb-1">Provider</Text>
                  {extracted.doctor_name && <Text className="text-[15px] font-display-bold text-[#1e3124]">{extracted.doctor_name}</Text>}
                  {extracted.hospital_name && <Text className="text-[14px] font-display text-[#5C6E60] mt-0.5">{extracted.hospital_name}</Text>}
                </View>
              )}

              {/* Diagnoses */}
              {extracted.diagnosis && extracted.diagnosis.length > 0 && (
                <View className="p-5 border-b border-[#e1e3e2]/40">
                  <Text className="text-[12px] font-display-bold text-[#819685] uppercase tracking-wider mb-2">Diagnosis</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {extracted.diagnosis.map((d: string, i: number) => (
                      <View key={i} className="bg-[#f0f4f1] px-3 py-1.5 rounded-full border border-[#d2e8d5]">
                        <Text className="text-[#1e3124] text-[13px] font-display-medium">{d}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Lab Results */}
              {extracted.lab_results && Object.keys(extracted.lab_results).length > 0 && (
                <View className="p-5 border-b border-[#e1e3e2]/40">
                  <Text className="text-[12px] font-display-bold text-[#819685] uppercase tracking-wider mb-3">Lab Results</Text>
                  <View className="flex-col gap-3">
                    {Object.entries(extracted.lab_results).map(([test, val]: any, i) => (
                      <View key={i} className="flex-row justify-between items-center py-1">
                        <Text className="text-[#404944] text-[14px] font-display flex-1 mr-4 capitalize">{test.replace(/_/g, ' ')}</Text>
                        <Text className="text-[#1e3124] text-[15px] font-display-bold">{val}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Medications */}
              {extracted.medications && extracted.medications.length > 0 && (
                <View className="p-5 border-b border-[#e1e3e2]/40">
                  <Text className="text-[12px] font-display-bold text-[#819685] uppercase tracking-wider mb-3">Medications</Text>
                  <View className="flex-col gap-4">
                    {extracted.medications.map((med: any, i: number) => (
                      <View key={i} className="flex-row items-center gap-3">
                        <View className="w-10 h-10 rounded-full bg-[#f0f4f1] items-center justify-center">
                          <MaterialCommunityIcons name="pill" size={20} color="#004D36" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-[15px] font-display-bold text-[#1e3124]">{med.name || 'Unknown'}</Text>
                          <Text className="text-[13px] font-display text-[#5C6E60]">
                            {[med.dosage, med.frequency, med.duration].filter(Boolean).join(' • ')}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Additional Notes */}
              {extracted.notes && (
                <View className="p-5">
                  <Text className="text-[12px] font-display-bold text-[#819685] uppercase tracking-wider mb-2">Notes</Text>
                  <Text className="text-[14px] text-[#404944] font-display leading-relaxed">{extracted.notes}</Text>
                </View>
              )}
              
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
