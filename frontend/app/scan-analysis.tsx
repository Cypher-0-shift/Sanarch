import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function ScanAnalysisScreen() {
  const router = useRouter();
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for the icon circle
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Scan line animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Background Decorators */}
      <View style={[styles.bgCircle, styles.bgCircleTopRight]} />
      <View style={[styles.bgCircle, styles.bgCircleBottomLeft]} />

      {/* TopAppBar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#006a35" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Analysis</Text>
        <TouchableOpacity style={styles.avatarBtn} onPress={() => router.push('/profile')}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAG5qL6RviVNH1di8xRnnW9M15pWKLMsdbqCvFTCaSHAdjEwgRvm0loED7lPwr8pO6K7tHFd0f7np-gZNP1p-qVhFQ8Btntyudg7rWQM34UtMm5-T6PKrajWCzq2ynqx9kI_u3qOEiDNnoa3_37JaXYyabu0QSVZH90GB_A5vo_SnCLV5OhP6vFHzonf3FdmXUaU09wnq_8qamX3ONZojKrUehxiXsfsPtGabmemLsJeLhiqFF8hRquS05EhS3VGD2PHwtUJ1Y6' }}
            style={styles.avatarImg}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Document Preview Card */}
        <View style={styles.previewSection}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCw9dBLsZncrl2JBz26WiYZA55HEFQxqFk45H3EXZBvS2I8076QcrxsYLyx4rlyda_ZDIPo7y9IxEC2ef2DYXswD2SOQc0rpCZAOEpoBTb6a3Fi3iFQyA6uGZKnu4jih7xLegRDVwVx2UPXdwsqHBIleq0_d6fs1eKZ5eRd4EeV2TSmg0w1bCFWN9tc-mPcs1TbjK3llwGB4rrzb2WFmBsn9uDfa3CUlpqydL0a23XzH-nomp8FZYFhkX1EIW5BNxRpsfj7hosd' }}
            style={styles.previewImg}
            blurRadius={4}
          />
          {/* Gradient overlay */}
          <View style={styles.previewOverlay} />

          {/* Centered badge */}
          <View style={styles.extractionBadgeContainer}>
            <Animated.View style={[styles.extractionIconCircle, { transform: [{ scale: pulseAnim }] }]}>
              <MaterialIcons name="auto-awesome" size={44} color="#006a35" />
            </Animated.View>
            <View style={styles.extractionPill}>
              <View style={styles.pulsingDot} />
              <Text style={styles.extractionPillText}>Extraction 85% Complete</Text>
            </View>
          </View>

          {/* Animated scan line */}
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [
                  {
                    translateY: scanLineAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 180],
                    }),
                  },
                ],
              },
            ]}
          />

          {/* Progress bar at bottom */}
          <View style={styles.progressBarBg}>
            <View style={styles.progressBarFill} />
          </View>
        </View>

        {/* Extracted Data Section */}
        <View style={styles.dataSection}>
          <View style={styles.dataSectionHeader}>
            <Text style={styles.dataSectionTitle}>Extracted Data</Text>
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={14} color="#006a35" />
              <Text style={styles.verifiedText}>Verified by AI</Text>
            </View>
          </View>

          {/* Patient Card */}
          <View style={[styles.card, styles.cardFull]}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardSuperTitle}>PATIENT</Text>
                <Text style={styles.cardMainTitle}>Sarah Henderson</Text>
              </View>
              <View style={styles.cardIconBox}>
                <MaterialIcons name="person" size={24} color="#6bfe9c" />
              </View>
            </View>
          </View>

          {/* Two half cards */}
          <View style={styles.halfCardRow}>
            <View style={[styles.card, styles.cardHalf]}>
              <Text style={styles.cardSuperTitle}>DOCUMENT TYPE</Text>
              <Text style={styles.cardSubValue}>Blood Test Report</Text>
            </View>
            <View style={[styles.card, styles.cardHalf]}>
              <Text style={styles.cardSuperTitle}>DATE</Text>
              <Text style={styles.cardSubValue}>Oct 24, 2023</Text>
            </View>
          </View>

          {/* Key Findings */}
          <View style={styles.findingsCard}>
            <View style={styles.findingsHeader}>
              <MaterialIcons name="analytics" size={24} color="#006a35" />
              <Text style={styles.findingsTitle}>📊 Key Findings</Text>
            </View>

            {[
              { label: 'Glucose', value: '102', unit: 'mg/dL', status: 'Slightly High', statusColor: '#f97316', statusBg: '#fff7ed' },
              { label: 'HbA1c', value: '6.8', unit: '%', status: 'Slightly High', statusColor: '#f97316', statusBg: '#fff7ed' },
              { label: 'Hemoglobin', value: '12.3', unit: 'g/dL', status: 'Normal', statusColor: '#006a35', statusBg: '#f0fdf4' },
              { label: 'Cholesterol', value: '185', unit: 'mg/dL', status: 'Normal', statusColor: '#006a35', statusBg: '#f0fdf4' },
            ].map((item, idx) => (
              <View key={idx} style={styles.metricItem}>
                <Text style={styles.metricLabel}>{item.label}</Text>
                <View style={styles.metricRight}>
                  <Text style={styles.metricValueLarge}>
                    {item.value}
                    <Text style={styles.metricUnit}> {item.unit}</Text>
                  </Text>
                  <View style={[styles.statusPill, { backgroundColor: item.statusBg }]}>
                    <Text style={[styles.statusText, { color: item.statusColor }]}>{item.status}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.saveBtn}
          activeOpacity={0.85}
          onPress={() => router.push('/records')}
        >
          <LinearGradient
            colors={['#006a35', '#4ade80']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtnGradient}
          >
            <MaterialIcons name="save" size={22} color="#ffffff" />
            <Text style={styles.saveBtnText}>Save to Records</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.replace('/dashboard' as any)}>
          <MaterialIcons name="home" size={20} color="#595c5d" />
          <Text style={styles.backHomeBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7f8',
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 999,
  },
  bgCircleTopRight: {
    top: 0,
    right: 0,
    width: 500,
    height: 500,
    backgroundColor: 'rgba(0,106,53,0.05)',
    transform: [{ translateY: -250 }, { translateX: 250 }],
  },
  bgCircleBottomLeft: {
    bottom: 0,
    left: 0,
    width: 400,
    height: 400,
    backgroundColor: 'rgba(0,101,118,0.05)',
    transform: [{ translateY: 200 }, { translateX: -200 }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    height: 64,
    backgroundColor: 'rgba(245,247,248,0.9)',
  },
  headerIconBtn: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 18,
    fontWeight: '700',
    color: '#006a35',
    letterSpacing: -0.5,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#dfe3e4',
    borderWidth: 2,
    borderColor: '#6bfe9c',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    padding: 24,
  },
  previewSection: {
    width: '100%',
    height: 280,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#eef1f2',
    position: 'relative',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  previewImg: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  previewOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: 'rgba(0,106,53,0.08)',
  },
  extractionBadgeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extractionIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(245,247,248,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#6bfe9c',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  extractionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#006a35',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#006a35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6bfe9c',
  },
  extractionPillText: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  scanLine: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#6bfe9c',
    shadowColor: '#6bfe9c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
    opacity: 0.7,
  },
  progressBarBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressBarFill: {
    width: '85%',
    height: '100%',
    backgroundColor: '#6bfe9c',
    borderRadius: 3,
  },
  dataSection: {
    gap: 16,
  },
  dataSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  dataSectionTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 22,
    fontWeight: '700',
    color: '#2c2f30',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,106,53,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#006a35',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(171,173,174,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardFull: {
    width: '100%',
  },
  halfCardRow: {
    flexDirection: 'row',
    gap: 16,
  },
  cardHalf: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(171,173,174,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardSuperTitle: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '700',
    color: '#595c5d',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  cardMainTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 20,
    fontWeight: '700',
    color: '#2c2f30',
  },
  cardIconBox: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#006a35',
  },
  cardSubValue: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 15,
    fontWeight: '600',
    color: '#2c2f30',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  findingsCard: {
    backgroundColor: '#eef1f2',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,106,53,0.06)',
    gap: 12,
  },
  findingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  findingsTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 16,
    fontWeight: '700',
    color: '#2c2f30',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  metricLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#595c5d',
    flex: 1,
  },
  metricRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  metricValueLarge: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 20,
    fontWeight: '800',
    color: '#006a35',
  },
  metricUnit: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: '#595c5d',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '700',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: 'rgba(245,247,248,0.95)',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  saveBtn: {
    width: '100%',
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#006a35',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 40,
  },
  saveBtnText: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  backHomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  backHomeBtnText: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 14,
    fontWeight: '600',
    color: '#595c5d',
  },
});
