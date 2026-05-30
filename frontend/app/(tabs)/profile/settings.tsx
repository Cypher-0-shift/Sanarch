import { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Switch, Alert,
  Modal, TextInput, Animated, Linking, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { useProfileStore } from '../../../store/profileStore';
import { clearToken } from '../../../services/storage';
import { useAlertStore } from '../../../store/alertStore';
import { TERMS_OF_SERVICE, PRIVACY_POLICY } from '../../../constants/legal';
import * as LocalAuthentication from 'expo-local-authentication';
import { deleteMe } from '../../../services/api';
import { logout as firebaseLogout } from '../../../services/auth';

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={{
      fontSize: 11, fontFamily: 'Inter_700Bold',
      textTransform: 'uppercase', letterSpacing: 1.5,
      color: '#819685', marginBottom: 10, marginLeft: 4
    }}>
      {title}
    </Text>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <View style={{
      backgroundColor: 'white', borderRadius: 20,
      borderWidth: 1, borderColor: '#E5E2DE',
      overflow: 'hidden', marginBottom: 24,
      shadowColor: '#000', shadowOpacity: 0.02,
      shadowRadius: 8, elevation: 1
    }}>
      {children}
    </View>
  );
}

function SettingsRow({
  icon, iconBg = '#E8F5E9', iconColor = '#004D36',
  label, sublabel, right, onPress, borderBottom = true, danger = false
}: {
  icon: string, iconBg?: string, iconColor?: string,
  label: string, sublabel?: string,
  right?: React.ReactNode, onPress?: () => void,
  borderBottom?: boolean, danger?: boolean
}) {
  const content = (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      padding: 16, gap: 14,
      borderBottomWidth: borderBottom ? 1 : 0,
      borderBottomColor: '#F5F3F0'
    }}>
      <View style={{
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: iconBg, alignItems: 'center',
        justifyContent: 'center'
      }}>
        <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 14, fontFamily: 'Inter_600SemiBold',
          color: danger ? '#EF4444' : '#2D3A2F'
        }}>{label}</Text>
        {sublabel && (
          <Text style={{
            fontSize: 11, fontFamily: 'Inter_400Regular',
            color: '#5C6E60', marginTop: 1
          }}>{sublabel}</Text>
        )}
      </View>
      {right}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

export default function Settings() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user) ?? { full_name: null, sanarch_id: null };
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const familyMembers = useProfileStore((s) => s.familyMembers);

  // Privacy toggles — stored in local state for now
  const [biometricLock, setBiometricLock] = useState(false);

  // Modals
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [showDataStorage, setShowDataStorage] = useState(false);
  const [legalModal, setLegalModal] = useState<{
    visible: boolean;
    title: string;
    content: string;
  }>({ visible: false, title: '', content: '' });
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncData = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      useAlertStore.getState().showAlert('Sync Complete', 'Your health records have been successfully synchronized with the cloud.');
    }, 1500);
  };


  // Report issue form
  const [issueType, setIssueType] = useState<string | null>(null);
  const [issueText, setIssueText] = useState('');

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!compatible || !enrolled) {
        useAlertStore.getState().showAlert(
          'Biometric Not Available',
          'Your device does not support biometric authentication or no biometrics are enrolled in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm your identity to enable biometric lock',
        fallbackLabel: 'Use passcode',
      });
      if (result.success) {
        setBiometricLock(true);
      }
    } else {
      setBiometricLock(false);
    }
  };



  const handleSubmitIssue = () => {
    if (!issueType) {
      useAlertStore.getState().showAlert('Select issue type', 'Please select a category for your issue.');
      return;
    }
    if (issueText.trim().length < 10) {
      useAlertStore.getState().showAlert('Add more detail', 'Please describe the issue in at least 10 characters.');
      return;
    }
    // Simulate submission
    setShowReportIssue(false);
    setIssueType(null);
    setIssueText('');
    useAlertStore.getState().showAlert('Submitted', 'Thank you for your report. We\'ll look into it shortly.');
  };

  const handleLogout = () => {
    useAlertStore.getState().showAlert(
      'Sign Out',
      'Are you sure you want to sign out of Sanarch?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await firebaseLogout();
            } catch {}
            useAuthStore.getState().logout();
            useProfileStore.getState().clearProfile();
            router.replace('/auth/login');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#F5F3F0' }}>
      {/* HEADER */}
      <View style={{ backgroundColor: 'white', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E2DE', flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.75}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F3F0', alignItems: 'center', justifyContent: 'center' }}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#2D3A2F" />
        </TouchableOpacity>
        <View>
          <Text style={{ fontSize: 20, fontFamily: 'Inter_700Bold', color: '#2D3A2F' }}>
            {user.full_name ?? 'Settings'}
          </Text>
          <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#819685', textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {user.sanarch_id ?? '—'}
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 24, paddingTop: 32 }} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* SECTION 1: ACCOUNT */}
        <SectionHeader title="Account" />
        <SettingsCard>
          <SettingsRow
            icon="account-outline"
            label="Edit Profile"
            sublabel={activeProfile?.name ?? 'Update your details'}
            right={<MaterialCommunityIcons name="chevron-right" size={20} color="#819685" />}
            onPress={() => router.push('/(tabs)/profile/edit-profile')}
            borderBottom={true}
          />
          <SettingsRow
            icon="account-multiple-outline"
            label="Linked Profiles"
            sublabel={`${familyMembers.length} profile${familyMembers.length !== 1 ? 's' : ''} on this account`}
            right={<MaterialCommunityIcons name="chevron-right" size={20} color="#819685" />}
            onPress={() => router.push('/(tabs)/profile/family')}
            borderBottom={false}
          />
        </SettingsCard>

        {/* SECTION 2: PRIVACY CONTROLS */}
        <SectionHeader title="Privacy Controls" />
        <SettingsCard>
          <SettingsRow
            icon="fingerprint"
            label="Biometric Lock"
            sublabel="Require Face ID or fingerprint to open app"
            right={
              <Switch
                value={biometricLock}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: '#E5E2DE', true: '#004D36' }}
                thumbColor="white"
              />
            }
            borderBottom={false}
          />
        </SettingsCard>

        {/* SECTION 3: DATA & STORAGE */}
        <SectionHeader title="Data & Storage" />
        <SettingsCard>
          <SettingsRow
            icon="database-outline"
            label="Manage Data & Backups"
            sublabel="Storage usage, exports, and backup status"
            right={<MaterialCommunityIcons name="chevron-right" size={20} color="#819685" />}
            onPress={() => setShowDataStorage(true)}
            borderBottom={true}
          />
          <SettingsRow
            icon="sync"
            label="Sync Data"
            sublabel={isSyncing ? "Syncing with cloud..." : "Manually sync health records"}
            right={
              isSyncing ? (
                <ActivityIndicator color="#004D36" size="small" />
              ) : (
                <MaterialCommunityIcons name="cloud-sync-outline" size={20} color="#004D36" />
              )
            }
            onPress={isSyncing ? undefined : handleSyncData}
            borderBottom={false}
          />
        </SettingsCard>

        {/* SECTION 4: LEGAL & SUPPORT */}
        <SectionHeader title="Legal & Support" />
        <SettingsCard>
          <SettingsRow
            icon="file-document-outline"
            iconBg="#F5F3F0"
            iconColor="#819685"
            label="Terms of Service"
            right={<MaterialCommunityIcons name="chevron-right" size={20} color="#819685" />}
            onPress={() => setLegalModal({
              visible: true,
              title: 'Terms of Service',
              content: TERMS_OF_SERVICE
            })}
            borderBottom={true}
          />
          <SettingsRow
            icon="lock-outline"
            iconBg="#F5F3F0"
            iconColor="#819685"
            label="Privacy Policy"
            right={<MaterialCommunityIcons name="chevron-right" size={20} color="#819685" />}
            onPress={() => setLegalModal({
              visible: true,
              title: 'Privacy Policy',
              content: PRIVACY_POLICY
            })}
            borderBottom={true}
          />
          <SettingsRow
            icon="flag-outline"
            iconBg="#F5F3F0"
            iconColor="#819685"
            label="Report an Issue"
            right={<MaterialCommunityIcons name="chevron-right" size={20} color="#819685" />}
            onPress={() => setShowReportIssue(true)}
            borderBottom={false}
          />
        </SettingsCard>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.75}
          style={{ backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#E5E2DE', paddingVertical: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 12 }}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#2D3A2F" />
          <Text style={{ color: '#2D3A2F', fontFamily: 'Inter_700Bold', fontSize: 14 }}>
            Sign out
          </Text>
        </TouchableOpacity>

        {/* DELETE ACCOUNT (DANGER ZONE) */}

        <TouchableOpacity
          onPress={() => useAlertStore.getState().showAlert(
            'Delete Account',
            'This permanently deletes all your health records and profiles. This cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete Permanently', style: 'destructive',
                onPress: async () => {
                  try {
                    await deleteMe();
                    await firebaseLogout();
                    useAuthStore.getState().logout();
                    useProfileStore.getState().clearProfile();
                    router.replace('/auth/login');
                  } catch (error: any) {
                    Alert.alert(
                      'Error',
                      error?.response?.data?.detail ?? 'Could not delete account. Please contact support@sanarch.io'
                    );
                  }
                }
              }
            ]
          )}
          activeOpacity={0.75}
          style={{ backgroundColor: '#FEF2F2', borderRadius: 20, borderWidth: 1, borderColor: '#FECACA', paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
        >
          <MaterialCommunityIcons name="delete-outline" size={20} color="#EF4444" />
          <Text style={{ color: '#EF4444', fontFamily: 'Inter_700Bold', fontSize: 14 }}>
            Delete Account
          </Text>
        </TouchableOpacity>

        {/* VERSION */}
        <Text style={{ textAlign: 'center', color: '#819685', fontSize: 10, fontFamily: 'Inter_400Regular', marginBottom: 16 }}>
          Sanarch v1.0.0
        </Text>
      </ScrollView>



      {/* MODAL 2: REPORT AN ISSUE */}
      <Modal visible={showReportIssue} animationType="slide" transparent onRequestClose={() => setShowReportIssue(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48 }}>

            {/* Handle bar */}
            <View style={{ width: 40, height: 4, backgroundColor: '#E5E2DE', borderRadius: 2, alignSelf: 'center', marginBottom: 24 }} />

            {/* Title row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 20, fontFamily: 'Inter_700Bold', color: '#2D3A2F' }}>Report an Issue</Text>
              <TouchableOpacity onPress={() => setShowReportIssue(false)} activeOpacity={0.7}>
                <MaterialCommunityIcons name="close" size={24} color="#5C6E60" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 14, color: '#5C6E60', fontFamily: 'Inter_400Regular', marginBottom: 24 }}>Help us improve Sanarch</Text>

            <Text style={{ fontSize: 12, fontFamily: 'Inter_700Bold', color: '#819685', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Issue Type</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {['Bug', 'Wrong data', 'Account issue', 'Other'].map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => setIssueType(option)}
                  activeOpacity={0.7}
                  style={{
                    borderWidth: 1,
                    borderRadius: 999,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    backgroundColor: issueType === option ? '#004D36' : 'white',
                    borderColor: issueType === option ? '#004D36' : '#E5E2DE'
                  }}
                >
                  <Text style={{
                    fontSize: 14,
                    fontFamily: 'Inter_700Bold',
                    color: issueType === option ? 'white' : '#5C6E60'
                  }}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 12, fontFamily: 'Inter_700Bold', color: '#819685', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Describe the issue</Text>
            <TextInput
              multiline
              numberOfLines={4}
              value={issueText}
              onChangeText={setIssueText}
              placeholder="Tell us what happened..."
              placeholderTextColor="#A0ACA3"
              style={{
                backgroundColor: '#F5F3F0',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 16,
                fontSize: 14,
                color: '#2D3A2F',
                fontFamily: 'Inter_500Medium',
                textAlignVertical: 'top',
                minHeight: 120
              }}
            />

            <TouchableOpacity onPress={handleSubmitIssue} activeOpacity={0.8} style={{ width: '100%', backgroundColor: '#004D36', borderRadius: 20, paddingVertical: 16, marginTop: 24, alignItems: 'center' }}>
              <Text style={{ color: 'white', fontFamily: 'Inter_700Bold', fontSize: 16 }}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: DATA & STORAGE */}
      <Modal visible={showDataStorage} animationType="slide" transparent onRequestClose={() => setShowDataStorage(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48 }}>

            {/* Handle bar */}
            <View style={{ width: 40, height: 4, backgroundColor: '#E5E2DE', borderRadius: 2, alignSelf: 'center', marginBottom: 24 }} />

            {/* Title row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 20, fontFamily: 'Inter_700Bold', color: '#2D3A2F' }}>Data & Storage</Text>
              <TouchableOpacity onPress={() => setShowDataStorage(false)} activeOpacity={0.7}>
                <MaterialCommunityIcons name="close" size={24} color="#5C6E60" />
              </TouchableOpacity>
            </View>
            <View style={{ backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#E5E2DE', padding: 16, marginBottom: 16 }}>
              {/* Storage Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#F5F3F0', alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name="database-outline" size={20} color="#004D36" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#2D3A2F' }}>Storage Used</Text>
                  <Text style={{ fontSize: 11, fontFamily: 'Inter_400Regular', color: '#5C6E60', marginTop: 1 }}>Records and documents</Text>
                </View>
                <Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: '#2D3A2F' }}>—</Text>
              </View>
            </View>

            {/* Export button */}
            <TouchableOpacity
              onPress={() => useAlertStore.getState().showAlert('Coming Soon', 'Export feature will be available in the next update.')}
              activeOpacity={0.7}
              style={{ width: '100%', borderWidth: 1, borderColor: '#004D36', borderRadius: 20, paddingVertical: 16, marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <MaterialCommunityIcons name="download" size={20} color="#004D36" />
              <Text style={{ color: '#004D36', fontFamily: 'Inter_700Bold', fontSize: 14 }}>Export All Records</Text>
            </TouchableOpacity>

            {/* Delete data button */}
            <TouchableOpacity
              onPress={() => useAlertStore.getState().showAlert(
                'Delete All Data',
                'Type DELETE to confirm you want to permanently remove all your health records.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'I understand, delete', style: 'destructive',
                    onPress: () => useAlertStore.getState().showAlert('Contact Support', 'Email eduindiafoundatiion@gmail.com to complete this request.')
                  }
                ]
              )}
              activeOpacity={0.7}
              style={{ width: '100%', borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 20, paddingVertical: 16, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <MaterialCommunityIcons name="delete-outline" size={20} color="#EF4444" />
              <Text style={{ color: '#EF4444', fontFamily: 'Inter_700Bold', fontSize: 14 }}>Delete All My Data</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* MODAL 4: LEGAL CONTENT */}
      <Modal
        visible={legalModal.visible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setLegalModal(p => ({ ...p, visible: false }))}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F3F0' }} edges={['top']}>

          <View style={{ backgroundColor: 'white', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E2DE', flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <TouchableOpacity
              onPress={() => setLegalModal(p => ({ ...p, visible: false }))}
              activeOpacity={0.75}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F3F0', alignItems: 'center', justifyContent: 'center' }}
            >
              <MaterialCommunityIcons name="close" size={22} color="#2D3A2F" />
            </TouchableOpacity>
            <Text style={{ fontSize: 20, fontFamily: 'Inter_700Bold', color: '#2D3A2F' }}>
              {legalModal.title}
            </Text>
          </View>

          <ScrollView style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24 }} contentContainerStyle={{ paddingBottom: 60 }}>
            <Text style={{ fontSize: 14, color: '#2D3A2F', lineHeight: 22, fontFamily: 'Inter_400Regular' }}>
              {legalModal.content}
            </Text>

            <Text style={{ fontSize: 12, color: '#819685', textAlign: 'center', marginTop: 24, marginBottom: 32 }}>
              Last updated: May 2026
            </Text>
          </ScrollView>

        </SafeAreaView>
      </Modal>
    </SafeAreaView >
  );
}
