import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, 
  InteractionManager, StyleSheet 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { COLORS, FONTS, RADIUS, SPACING } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useProfileStore } from '../../store/profileStore';
import { useDocumentsStore } from '../../store/documentsStore';
import { EMPTY_USER } from '../../constants/placeholders';

import DocumentCard from '../../components/documents/DocumentCard';
import PrimaryButton from '../../components/buttons/PrimaryButton';
import EmptyStateCard from '../../components/empty-states/EmptyStateCard';
import QRDisplay from '../../components/doctors/QRDisplay';

// Simple payload encoding for the QR code
const encodePayload = (payload: object): string => {
  const str = JSON.stringify(payload);
  return encodeURIComponent(str);
};

export default function ShareRecordsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user) ?? EMPTY_USER;
  const activeProfile = useProfileStore((s) => s.activeProfile);
  
  const documents = useDocumentsStore((s) => s.documents);
  const fetchDocuments = useDocumentsStore((s) => s.fetchDocuments);

  const [isReady, setIsReady] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [qrExpired, setQrExpired] = useState(false);
  
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
      fetchDocuments(); // Ensure we have the latest documents
    });
    return () => task.cancel();
  }, []);

  // --- Handlers ---
  const toggleRecord = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === documents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(documents.map((d) => d.document_id)));
    }
  }, [documents, selectedIds]);

  const handleGenerateQR = () => {
    const payload = {
      patientId: activeProfile?.id ?? user.id,
      documentIds: Array.from(selectedIds),
      access: 'read_only',
      expires: Date.now() + 600 * 1000 // 10 minutes in ms
    };
    
    setQrValue(encodePayload(payload));
    setQrExpired(false);
  };

  const handleRegenerate = () => {
    handleGenerateQR();
  };

  // --- Scanning Views ---
  if (token && !scanning) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Doctor View Token: {token}</Text>
      </View>
    );
  }

  if (scanning) {
    if (!permission) return <View />;
    if (!permission.granted) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.canvas, alignItems: 'center', justifyContent: 'center', padding: SPACING[6] }}>
          <Text style={{ textAlign: 'center', marginBottom: SPACING[4], fontFamily: FONTS.jakartaMedium, color: COLORS.ink900 }}>
            We need your permission to show the camera
          </Text>
          <PrimaryButton label="Grant Permission" onPress={requestPermission as any} />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
        <CameraView
          style={{ flex: 1 }}
          onBarcodeScanned={({ data }) => {
            setScanning(false);
            if (data.startsWith('sanarch://share/')) {
              const scannedToken = data.split('/').pop();
              router.push(`/(tabs)/doctors?token=${scannedToken}`);
            } else {
              router.push(`/(tabs)/doctors?token=${data}`);
            }
          }}
        />
        <TouchableOpacity 
          onPress={() => setScanning(false)}
          style={{ position: 'absolute', top: 60, right: 24, backgroundColor: 'rgba(0,0,0,0.5)', padding: 12, borderRadius: 24 }}
        >
          <MaterialCommunityIcons name="close" size={24} color="white" />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!isReady) return <View style={styles.container} />;

  const isAllSelected = documents.length > 0 && selectedIds.size === documents.length;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* ShareHeader */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Share Records</Text>
        <TouchableOpacity 
          onPress={() => setScanning(true)} 
          style={styles.scanButton}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={16} color={COLORS.catLabPrimary} />
          <Text style={styles.scanButtonText}>Scan</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ActiveProfileStrip */}
        <View style={styles.profileStrip}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(activeProfile?.name ?? user.full_name ?? 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {activeProfile?.name ?? user.full_name ?? 'Your Profile'}
            </Text>
            <Text style={styles.profileId}>
              {activeProfile?.sanarchId ?? user.sanarch_id ?? '—'}
            </Text>
          </View>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>ACTIVE PROFILE</Text>
          </View>
        </View>

        {/* QR Section or Document Selection */}
        {qrValue && !qrExpired ? (
          <View style={styles.qrSection}>
            <QRDisplay 
              value={qrValue} 
              durationSeconds={600} 
              onExpired={() => setQrExpired(true)} 
            />
            <View style={styles.qrSummaryPill}>
              <Text style={styles.qrSummaryText}>
                {selectedIds.size} record{selectedIds.size > 1 ? 's' : ''} · Read Only
              </Text>
            </View>
          </View>
        ) : qrValue && qrExpired ? (
          <View style={styles.qrSection}>
            <MaterialCommunityIcons name="timer-off-outline" size={48} color={COLORS.ink400} />
            <Text style={styles.expiredTitle}>QR Code Expired</Text>
            <Text style={styles.expiredSubtitle}>For security, codes expire after 10 minutes.</Text>
            
            <View style={styles.regenerateContainer}>
              <TouchableOpacity onPress={handleRegenerate} activeOpacity={0.7} style={styles.regenerateBtn}>
                <MaterialCommunityIcons name="refresh" size={18} color={COLORS.brandPrimary} />
                <Text style={styles.regenerateText}>Generate new code</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => { setQrValue(null); setQrExpired(false); }} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Change selection</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.selectionSection}>
            {documents.length > 0 ? (
              <>
                <View style={styles.selectionHeader}>
                  <Text style={styles.selectionTitle}>Select Records</Text>
                  <TouchableOpacity onPress={handleSelectAll} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.selectAllText}>
                      {isAllSelected ? "Deselect All" : "Select All"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {documents.map((doc) => (
                  <DocumentCard 
                    key={doc.document_id} 
                    document={doc}
                    variant="selectable"
                    selected={selectedIds.has(doc.document_id)}
                    onPress={() => toggleRecord(doc.document_id)}
                    style={{ marginBottom: SPACING[3] }}
                  />
                ))}

                <View style={styles.generateButtonWrapper}>
                  <PrimaryButton 
                    label="Generate QR" 
                    onPress={handleGenerateQR}
                    variant={selectedIds.size === 0 ? 'disabled' : 'default'}
                  />
                </View>
              </>
            ) : (
              <EmptyStateCard
                illustration={<MaterialCommunityIcons name="folder-open-outline" size={48} color={COLORS.ink400} />}
                headline="No records yet"
                subtext="Upload medical documents first to share them with a doctor."
                cta={{ label: "Upload Records", onPress: () => router.push('/(tabs)/upload') }}
              />
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING[6],
    paddingTop: SPACING[4],
    paddingBottom: SPACING[4],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ink200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.jakartaBold,
    color: COLORS.ink900,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.catLabBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  scanButtonText: {
    color: COLORS.catLabPrimary,
    fontFamily: FONTS.jakartaBold,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING[6],
    paddingBottom: 120,
  },
  profileStrip: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.ink200,
    padding: SPACING[4],
    marginBottom: SPACING[6],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.surface,
    fontFamily: FONTS.jakartaBold,
    fontSize: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 14,
    fontFamily: FONTS.jakartaBold,
    color: COLORS.ink900,
  },
  profileId: {
    fontSize: 11,
    fontFamily: FONTS.jakartaMedium,
    color: COLORS.ink400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: COLORS.brandTint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  activeBadgeText: {
    fontSize: 9,
    fontFamily: FONTS.jakartaBold,
    color: COLORS.brandPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectionSection: {
    flex: 1,
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING[3],
  },
  selectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.jakartaBold,
    color: COLORS.ink900,
  },
  selectAllText: {
    fontSize: 14,
    fontFamily: FONTS.jakartaBold,
    color: COLORS.brandPrimary,
  },
  generateButtonWrapper: {
    marginTop: SPACING[6],
  },
  qrSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING[6],
  },
  qrSummaryPill: {
    marginTop: SPACING[6],
    backgroundColor: COLORS.ink100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  qrSummaryText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 13,
    color: COLORS.ink600,
  },
  expiredTitle: {
    fontSize: 20,
    fontFamily: FONTS.jakartaBold,
    color: COLORS.ink900,
    marginTop: SPACING[4],
    marginBottom: 4,
  },
  expiredSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.jakartaRegular,
    color: COLORS.ink600,
    textAlign: 'center',
    marginBottom: SPACING[6],
  },
  regenerateContainer: {
    marginBottom: SPACING[4],
  },
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.brandTint,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
  },
  regenerateText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 14,
    color: COLORS.brandPrimary,
  },
  cancelText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 14,
    color: COLORS.ink600,
  }
});
