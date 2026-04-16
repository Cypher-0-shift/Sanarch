import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function ScannerResultsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      {/* Background Decorators */}
      <View style={[styles.bgCircle, styles.bgCircleTopRight]} />
      <View style={[styles.bgCircle, styles.bgCircleBottomLeft]} />

      <View style={styles.header}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push('/menu' as any)}>
            <MaterialIcons name="menu" size={24} color="#006a35" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Analysis</Text>
        </View>
        <TouchableOpacity style={styles.avatarBtn} onPress={() => router.push('/profile')}>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAG5qL6RviVNH1di8xRnnW9M15pWKLMsdbqCvFTCaSHAdjEwgRvm0loED7lPwr8pO6K7tHFd0f7np-gZNP1p-qVhFQ8Btntyudg7rWQM34UtMm5-T6PKrajWCzq2ynqx9kI_u3qOEiDNnoa3_37JaXYyabu0QSVZH90GB_A5vo_SnCLV5OhP6vFHzonf3FdmXUaU09wnq_8qamX3ONZojKrUehxiXsfsPtGabmemLsJeLhiqFF8hRquS05EhS3VGD2PHwtUJ1Y6' }} 
            style={styles.avatarImg} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.previewSection}>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCw9dBLsZncrl2JBz26WiYZA55HEFQxqFk45H3EXZBvS2I8076QcrxsYLyx4rlyda_ZDIPo7y9IxEC2ef2DYXswD2SOQc0rpCZAOEpoBTb6a3Fi3iFQyA6uGZKnu4jih7xLegRDVwVx2UPXdwsqHBIleq0_d6fs1eKZ5eRd4EeV2TSmg0w1bCFWN9tc-mPcs1TbjK3llwGB4rrzb2WFmBsn9uDfa3CUlpqydL0a23XzH-nomp8FZYFhkX1EIW5BNxRpsfj7hosd' }} 
            style={styles.previewImg} 
            blurRadius={10}
          />
          <View style={styles.previewOverlayGradient} />
          
          <View style={styles.extractionBadgeContainer}>
            <View style={styles.extractionIconCircle}>
              <MaterialIcons name="auto-awesome" size={40} color="#006a35" />
            </View>
            <View style={styles.extractionPill}>
              <View style={styles.pulsingDot} />
              <Text style={styles.extractionPillText}>Extraction 85% Complete</Text>
            </View>
          </View>

          <View style={styles.scanLine} />
        </View>

        <View style={styles.dataSection}>
          <View style={styles.dataHeader}>
            <Text style={styles.dataTitle}>Extracted Data</Text>
            <Text style={styles.dataVerified}>Verified by AI</Text>
          </View>

          <View style={styles.bentoGrid}>
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

            <View style={[styles.card, styles.cardHalf]}>
              <Text style={styles.cardSuperTitle}>DOCUMENT TYPE</Text>
              <Text style={styles.cardSubValue}>Blood Test Report</Text>
            </View>

            <View style={[styles.card, styles.cardHalf]}>
              <Text style={styles.cardSuperTitle}>DATE</Text>
              <Text style={styles.cardSubValue}>Oct 24, 2023</Text>
            </View>

            <View style={[styles.cardHighlight, styles.cardFull]}>
              <View style={styles.highlightHeader}>
                <MaterialIcons name="analytics" size={24} color="#006a35" />
                <Text style={styles.highlightTitle}>Key Findings</Text>
              </View>

              <View style={styles.metricList}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Glucose</Text>
                  <View style={styles.metricValueRow}>
                    <Text style={styles.metricValueLarge}>102</Text>
                    <Text style={styles.metricUnit}>mg/dL</Text>
                  </View>
                </View>

                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Cholesterol</Text>
                  <View style={styles.metricValueRow}>
                    <Text style={styles.metricValueLarge}>185</Text>
                    <Text style={styles.metricUnit}>mg/dL</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 180 }} />
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8} onPress={() => router.push('/records')}>
          <MaterialIcons name="save" size={24} color="#ffffff" />
          <Text style={styles.saveBtnText}>Save to Records</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.push('/dashboard')}>
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
    position: 'relative',
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
    backgroundColor: 'rgba(245,247,248,0.8)',
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIconBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 18,
    fontWeight: '700',
    color: '#006a35',
    letterSpacing: -0.5,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    aspectRatio: 3/4,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#eef1f2',
    position: 'relative',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  previewImg: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  previewOverlayGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: 'rgba(0,106,53,0.1)',
  },
  extractionBadgeContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -70 }], // Approximate centering
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
  },
  extractionIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(245,247,248,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#6bfe9c',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  extractionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#006a35',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  scanLine: {
    position: 'absolute',
    top: '85%',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#6bfe9c',
    shadowColor: '#6bfe9c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  dataSection: {
    gap: 24,
  },
  dataHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  dataTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 24,
    fontWeight: '700',
    color: '#2c2f30',
  },
  dataVerified: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#006a35',
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(171,173,174,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardFull: {
    width: '100%',
  },
  cardHalf: {
    width: '47%',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardSuperTitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: '#595c5d',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardMainTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 20,
    fontWeight: '700',
    color: '#2c2f30',
  },
  cardIconBox: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#006a35',
  },
  cardSubValue: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 16,
    fontWeight: '600',
    color: '#2c2f30',
    marginTop: 4,
  },
  cardHighlight: {
    backgroundColor: '#eef1f2',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,106,53,0.05)',
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  highlightTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 16,
    fontWeight: '700',
    color: '#2c2f30',
  },
  metricList: {
    gap: 16,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#595c5d',
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  metricValueLarge: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 24,
    fontWeight: '800',
    color: '#006a35',
  },
  metricUnit: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: '#595c5d',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 32,
    alignItems: 'center',
    gap: 24,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    backgroundColor: '#006a35',
    paddingVertical: 20,
    borderRadius: 40,
    shadowColor: '#006a35',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
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
