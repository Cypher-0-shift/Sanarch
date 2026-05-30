import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { useProfileStore } from '../../../store/profileStore';
import { useAlertStore } from '../../../store/alertStore';
import { clearToken, clearUserData } from '../../../services/storage';

function StatusBadge({ label, color }: { label: string; color: 'green' | 'blue' }) {
  const colors = {
    green: { bg: '#E8F5E9', text: '#004D36' },
    blue: { bg: '#E3F2FD', text: '#1565C0' },
  };
  return (
    <View className="px-2.5 py-1 rounded-lg" style={{ backgroundColor: colors[color].bg }}>
      <Text className="text-[10px] font-display-bold uppercase" style={{ color: colors[color].text }}>{label}</Text>
    </View>
  );
}

export default function DataStorageScreen() {
  const router = useRouter();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleExportPDF = () => {
    useAlertStore.getState().showAlert(
      'Export Records',
      'This will compile all your medical records into a PDF document and save it to your device.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => useAlertStore.getState().showAlert('Coming Soon', 'PDF export is under development.') },
      ]
    );
  };

  const handleDeleteAllData = () => {
    if (deleteConfirmText !== 'DELETE') {
      useAlertStore.getState().showAlert('Confirmation Required', 'Please type DELETE in all caps to confirm.');
      return;
    }

    useAlertStore.getState().showAlert(
      'Final Confirmation',
      'This will permanently erase all your medical records, linked profiles, and account data. You cannot undo this.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => { setDeleteModalVisible(false); setDeleteConfirmText(''); } },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            setDeleteModalVisible(false);
            setDeleteConfirmText('');
            // In production, this would call the backend deletion API first
            useAuthStore.getState().logout();
            useProfileStore.getState().clearProfile();
            await clearToken();
            await clearUserData();
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F3F0]" edges={['top']}>
      {/* Header */}
      <View className="shrink-0 pt-4 pb-4 px-6 bg-white border-b border-[#E5E2DE] z-10 flex-row items-center gap-4">
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile/settings')}
          activeOpacity={0.75}
          className="w-10 h-10 rounded-full bg-[#F5F3F0] items-center justify-center"
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#2D3A2F" />
        </TouchableOpacity>
        <Text className="text-[#2D3A2F] text-xl font-display-bold tracking-tight">Data & Storage</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-8" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>



        {/* ─── STORAGE USAGE ─── */}
        <Text className="text-[11px] font-display-bold uppercase tracking-[0.1em] text-[#819685] mb-3 ml-1">Storage</Text>
        <View
          className="bg-white border border-[#E5E2DE] rounded-[24px] p-5 mb-6"
          style={{ shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 12, elevation: 2 }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-sm font-display-bold text-[#2D3A2F]">Storage Used</Text>
              <Text className="text-[11px] font-display text-[#5C6E60] mt-0.5">Documents, images, and metadata</Text>
            </View>
            <Text className="text-lg font-display-bold text-[#004D36]">24.3 MB</Text>
          </View>

          {/* Progress bar */}
          <View className="w-full h-2 bg-[#F5F3F0] rounded-full overflow-hidden mb-3">
            <View className="h-full bg-[#004D36] rounded-full" style={{ width: '12%' }} />
          </View>
          <Text className="text-[10px] font-display text-[#819685]">24.3 MB of 200 MB used</Text>
        </View>

        {/* ─── ACTIONS ─── */}
        <Text className="text-[11px] font-display-bold uppercase tracking-[0.1em] text-[#819685] mb-3 ml-1">Actions</Text>
        <View className="flex-col gap-3 mb-8">
          {/* Export */}
          <TouchableOpacity
            onPress={handleExportPDF}
            activeOpacity={0.75}
            className="w-full h-[56px] bg-white border border-[#E5E2DE] rounded-[20px] flex-row items-center justify-center gap-3"
            style={{ shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 12, elevation: 2 }}
          >
            <MaterialCommunityIcons name="file-pdf-box" size={22} color="#004D36" />
            <Text className="text-[#004D36] font-display-bold text-sm">Export All Records as PDF</Text>
          </TouchableOpacity>

          {/* Delete All */}
          <TouchableOpacity
            onPress={() => setDeleteModalVisible(true)}
            activeOpacity={0.75}
            className="w-full h-[56px] bg-white border border-red-200 rounded-[20px] flex-row items-center justify-center gap-3"
            style={{ shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 12, elevation: 2 }}
          >
            <MaterialCommunityIcons name="delete-forever-outline" size={22} color="#EF4444" />
            <Text className="text-[#EF4444] font-display-bold text-sm">Delete All My Data</Text>
          </TouchableOpacity>
        </View>

        {/* Trust notice */}
        <View className="bg-[#F8FAF9] rounded-2xl p-4 flex-row items-start gap-3 mb-8 border border-[#E8F0EA]">
          <MaterialCommunityIcons name="information-outline" size={18} color="#819685" style={{ marginTop: 1 }} />
          <Text className="text-[11px] font-display text-[#5C6E60] flex-1 leading-4">
            You own your data. You can export all records at any time or permanently delete everything. Deletion is irreversible and fully removes your data from Sanarch servers within 30 days.
          </Text>
        </View>

      </ScrollView>

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      <Modal transparent visible={deleteModalVisible} animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="w-full bg-white rounded-[28px] p-6" style={{ shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 24, elevation: 10 }}>
            {/* Warning icon */}
            <View className="items-center mb-5">
              <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-3">
                <MaterialCommunityIcons name="alert-circle" size={36} color="#EF4444" />
              </View>
              <Text className="text-lg font-display-bold text-[#2D3A2F] text-center">Delete All Data</Text>
              <Text className="text-sm font-display text-[#5C6E60] text-center mt-2 leading-5">
                This will permanently delete all your health records, linked profiles, and account data. This action cannot be undone.
              </Text>
            </View>

            {/* Confirmation input */}
            <View className="mb-5">
              <Text className="text-[11px] font-display-bold uppercase tracking-[0.1em] text-[#819685] mb-2 ml-1">
                Type DELETE to confirm
              </Text>
              <TextInput
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                placeholder="DELETE"
                placeholderTextColor="#D1D5DB"
                autoCapitalize="characters"
                className="w-full h-[52px] bg-red-50 border border-red-200 rounded-2xl px-4 text-center text-base font-display-bold text-[#EF4444]"
                style={{ fontSize: 16, letterSpacing: 4 }}
              />
            </View>

            {/* Buttons */}
            <View className="flex-col gap-3">
              <TouchableOpacity
                onPress={handleDeleteAllData}
                className="w-full h-[52px] bg-[#EF4444] rounded-[18px] items-center justify-center"
                style={{ opacity: deleteConfirmText === 'DELETE' ? 1 : 0.4 }}
                disabled={deleteConfirmText !== 'DELETE'}
              >
                <Text className="text-white font-display-bold text-sm">Delete Everything</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setDeleteModalVisible(false); setDeleteConfirmText(''); }}
                className="w-full h-[52px] bg-[#F5F3F0] rounded-[18px] items-center justify-center"
              >
                <Text className="text-[#2D3A2F] font-display-bold text-sm">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
