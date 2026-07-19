import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Switch,
  Modal, TextInput, StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';

import { useAuthStore } from '../../../store/authStore';
import { useProfileStore } from '../../../store/profileStore';
import { useAlertStore } from '../../../store/alertStore';
import { toast } from '../../../components/feedback/toastStore';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import { COLORS, FONTS, RADIUS, SPACING } from '../../../constants/theme';
import { deleteMe } from '../../../services/api';
import { logout as firebaseLogout } from '../../../services/auth';
import { LEGAL_URLS } from '../../../constants/legal';
import * as Linking from 'expo-linking';

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={styles.sectionHeader}>{title}</Text>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.card}>{children}</View>
  );
}

function SettingsRow({
  icon, iconBg = COLORS.ink100, iconColor = COLORS.ink600,
  label, sublabel, right, onPress, borderBottom = true, danger = false
}: {
  icon: string, iconBg?: string, iconColor?: string,
  label: string, sublabel?: string,
  right?: React.ReactNode, onPress?: () => void,
  borderBottom?: boolean, danger?: boolean
}) {
  const content = (
    <View style={[styles.row, borderBottom && styles.rowBorder]}>
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={danger ? COLORS.resultHigh : iconColor} />
      </View>
      <View style={styles.rowTextContainer}>
        <Text style={[styles.rowLabel, danger && { color: COLORS.resultHigh }]}>{label}</Text>
        {sublabel && <Text style={styles.rowSublabel}>{sublabel}</Text>}
      </View>
      {right}
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>;
  }
  return content;
}

export default function SettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  // Toggles
  const [biometricLock, setBiometricLock] = useState(false);
  const [notifyProcessing, setNotifyProcessing] = useState(true);

  // Delete Account Flow State (0=Closed, 1=Confirm, 2=Type)
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [deleteText, setDeleteText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Report Issue
  const [showReportIssue, setShowReportIssue] = useState(false);

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!compatible || !enrolled) {
        useAlertStore.getState().showAlert(
          'Biometric Not Available',
          'Your device does not support biometric authentication or no biometrics are enrolled in your device settings.'
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

  const handleExportData = () => {
    toast.show({ message: 'Export My Data coming soon', type: 'info' });
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMe();
      await firebaseLogout();
      useAuthStore.getState().logout();
      useProfileStore.getState().clearProfile();
      router.replace('/auth/login');
    } catch (error) {
      toast.show({ message: 'Failed to delete account', type: 'error' });
    } finally {
      setIsDeleting(false);
      setDeleteStep(0);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={COLORS.ink900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        
        {/* SECTION 1: SECURITY */}
        <SectionHeader title="Security" />
        <SettingsCard>
          <SettingsRow
            icon="face-recognition"
            label="Face ID / Touch ID"
            sublabel="Require biometrics to open Sanarch"
            iconBg={COLORS.brandTint}
            iconColor={COLORS.brandPrimary}
            borderBottom={false}
            right={
              <Switch
                value={biometricLock}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: COLORS.ink200, true: COLORS.brandPrimary }}
                thumbColor="white"
              />
            }
          />
        </SettingsCard>

        {/* SECTION 2: NOTIFICATIONS */}
        <SectionHeader title="Notifications" />
        <SettingsCard>
          <SettingsRow
            icon="bell-outline"
            label="Document Processing"
            sublabel="Alert me when AI extraction finishes"
            borderBottom={false}
            right={
              <Switch
                value={notifyProcessing}
                onValueChange={setNotifyProcessing}
                trackColor={{ false: COLORS.ink200, true: COLORS.brandPrimary }}
                thumbColor="white"
              />
            }
          />
        </SettingsCard>

        {/* SECTION 3: PRIVACY & DATA */}
        <SectionHeader title="Privacy & Data" />
        <SettingsCard>
          <SettingsRow
            icon="export"
            label="Export My Data"
            sublabel="Download your records as JSON/PDF"
            onPress={handleExportData}
            right={<MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.ink400} />}
          />
          <SettingsRow
            icon="delete-outline"
            label="Delete Account"
            sublabel="Permanently erase all your data"
            danger
            iconBg={COLORS.resultHighBg}
            borderBottom={false}
            onPress={() => setDeleteStep(1)}
            right={<MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.ink400} />}
          />
        </SettingsCard>

        {/* SECTION 4: ABOUT */}
        <SectionHeader title="About" />
        <SettingsCard>
          <SettingsRow
            icon="information-outline"
            label="App Version"
            sublabel="1.0.0 (Build 42)"
            right={<Text style={styles.versionText}>Up to date</Text>}
          />
          <SettingsRow
            icon="file-document-outline"
            label="Terms of Service"
            onPress={() => Linking.openURL(LEGAL_URLS.TERMS_AND_CONDITIONS)}
            right={<MaterialCommunityIcons name="open-in-new" size={16} color={COLORS.ink400} />}
          />
          <SettingsRow
            icon="shield-check-outline"
            label="Privacy Policy"
            onPress={() => Linking.openURL(LEGAL_URLS.PRIVACY_POLICY)}
            right={<MaterialCommunityIcons name="open-in-new" size={16} color={COLORS.ink400} />}
          />
          <SettingsRow
            icon="bug-outline"
            label="Report an Issue"
            borderBottom={false}
            onPress={() => setShowReportIssue(true)}
            right={<MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.ink400} />}
          />
        </SettingsCard>

      </ScrollView>

      {/* Delete Account 3-Step Flow */}
      <Modal visible={deleteStep > 0} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <MaterialCommunityIcons name="alert" size={32} color={COLORS.resultHigh} />
            </View>
            <Text style={styles.modalTitle}>Delete Account?</Text>
            
            {deleteStep === 1 ? (
              <>
                <Text style={styles.modalDesc}>
                  This action is irreversible. All your medical records, dependent profiles, and AI insights will be permanently erased.
                </Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity onPress={() => setDeleteStep(0)} style={styles.modalCancelBtn}>
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setDeleteStep(2)} style={styles.modalDangerBtn}>
                    <Text style={styles.modalDangerText}>Yes, delete everything</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalDesc}>
                  Type <Text style={{ fontFamily: FONTS.monoMedium, color: COLORS.resultHigh }}>DELETE</Text> below to confirm.
                </Text>
                <TextInput
                  style={styles.deleteInput}
                  value={deleteText}
                  onChangeText={setDeleteText}
                  autoCapitalize="characters"
                  placeholder="DELETE"
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity onPress={() => { setDeleteStep(0); setDeleteText(''); }} style={styles.modalCancelBtn}>
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={executeDelete} 
                    disabled={deleteText !== 'DELETE' || isDeleting}
                    style={[styles.modalDangerBtn, (deleteText !== 'DELETE' || isDeleting) && { opacity: 0.5 }]}
                  >
                    <Text style={styles.modalDangerText}>{isDeleting ? 'Deleting...' : 'Confirm'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Mock Report Issue Modal */}
      <Modal visible={showReportIssue} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report Issue</Text>
            <Text style={styles.modalDesc}>Please describe what went wrong.</Text>
            <TextInput
              style={[styles.deleteInput, { height: 100, textAlignVertical: 'top' }]}
              multiline
              placeholder="Description..."
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowReportIssue(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowReportIssue(false); toast.show({ message: 'Issue reported', type: 'success' }); }} style={styles.modalPrimaryBtn}>
                <Text style={styles.modalPrimaryText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[6],
    paddingVertical: SPACING[4],
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ink200,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.ink100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.jakartaBold,
    color: COLORS.ink900,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING[6],
    paddingBottom: 100,
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: FONTS.jakartaBold,
    color: COLORS.ink600,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING[3],
    marginLeft: SPACING[2],
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.ink200,
    marginBottom: SPACING[6],
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[4],
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ink100,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING[3],
  },
  rowTextContainer: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: FONTS.jakartaBold,
    color: COLORS.ink900,
  },
  rowSublabel: {
    fontSize: 12,
    fontFamily: FONTS.jakartaRegular,
    color: COLORS.ink600,
    marginTop: 2,
  },
  versionText: {
    fontSize: 12,
    fontFamily: FONTS.jakartaMedium,
    color: COLORS.ink400,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING[6],
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING[6],
    alignItems: 'center',
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.resultHighBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[4],
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.jakartaBold,
    color: COLORS.ink900,
    marginBottom: SPACING[3],
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 14,
    fontFamily: FONTS.jakartaRegular,
    color: COLORS.ink600,
    textAlign: 'center',
    marginBottom: SPACING[6],
    lineHeight: 20,
  },
  deleteInput: {
    borderWidth: 1,
    borderColor: COLORS.ink200,
    borderRadius: RADIUS.md,
    padding: SPACING[3],
    width: '100%',
    fontFamily: FONTS.monoMedium,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: SPACING[6],
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING[3],
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.ink100,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 14,
    color: COLORS.ink800,
  },
  modalDangerBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.resultHigh,
    alignItems: 'center',
  },
  modalDangerText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 14,
    color: COLORS.surface,
  },
  modalPrimaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.brandPrimary,
    alignItems: 'center',
  },
  modalPrimaryText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 14,
    color: COLORS.surface,
  }
});
