import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function ScannerScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push('/menu' as any)}>
          <MaterialIcons name="menu" size={26} color="#9a9d9e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scanner</Text>
        <TouchableOpacity style={styles.avatarBtn} onPress={() => router.push('/profile')}>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKsIra3Im_9AUwsJYU09pHzYU2hVO6FV-0Ra0aROBhsvjI09yWSvxKy35QmDpqHQPfMxDt3GuL8Uu4uc9MHvbgKaP4Yi88eoK1jsq6pMIvfXGHYzKTGbMQJDrRucgmlXFSyUSwzAZ5lRQGP6OvH9ygJbT5dqdQFQMEEJFp9t-o7Y5yaQq4y90egG40jckFH-JI4kMaU624BPVRlMaoR3t_kLibTGMwD1HngbSWWlpOSeVf91xZ3KYlyj_kHGf9Jq0zH_8nBi6e' }} 
            style={styles.avatarImg} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Add New Records</Text>
          <Text style={styles.heroDesc}>Select a method to digitize your medical documents with AI precision.</Text>
        </View>

        <View style={styles.gridSection}>
          <TouchableOpacity style={styles.actionCard} activeOpacity={0.8} onPress={() => router.push('/scan-analysis' as any)}>
            <View style={styles.actionIconBgOverlay}>
              <MaterialIcons name="photo-camera" size={80} color="rgba(44,47,48,0.05)" />
            </View>
            <View style={{ zIndex: 10 }}>
              <View style={[styles.actionIconBox, { backgroundColor: '#006a35' }]}>
                <MaterialIcons name="document-scanner" size={28} color="#cdffd4" />
              </View>
              <Text style={styles.actionCardTitle}>Scan Document</Text>
              <Text style={styles.actionCardDesc}>Use your camera to capture and extract data from physical files.</Text>
            </View>
            <View style={styles.actionCardFooter}>
              <Text style={[styles.actionCardFooterText, { color: '#006a35' }]}>Start Scanning</Text>
              <MaterialIcons name="arrow-forward" size={18} color="#006a35" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCardLight} activeOpacity={0.8}>
            <View style={styles.actionIconBgOverlay}>
              <MaterialIcons name="upload-file" size={80} color="rgba(44,47,48,0.05)" />
            </View>
            <View style={{ zIndex: 10 }}>
              <View style={[styles.actionIconBox, { backgroundColor: '#72fbbd', shadowColor: 'transparent', elevation: 0 }]}>
                <MaterialIcons name="cloud-upload" size={28} color="#005e3e" />
              </View>
              <Text style={styles.actionCardTitle}>Upload File</Text>
              <Text style={styles.actionCardDesc}>Import PDF, JPG, or PNG files directly from your device storage.</Text>
            </View>
            <View style={styles.actionCardFooter}>
              <Text style={[styles.actionCardFooterText, { color: '#006946' }]}>Browse Files</Text>
              <MaterialIcons name="folder-open" size={18} color="#006946" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <View style={styles.recentHeaderLeft}>
              <View style={styles.recentBarIndicator} />
              <Text style={styles.recentTitle}>Recent Activity</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recentList}>
            <TouchableOpacity style={styles.recentItem}>
              <View style={styles.recentItemLeft}>
                <View style={[styles.recentIconBox, { backgroundColor: 'rgba(0,101,118,0.1)' }]}>
                  <MaterialIcons name="description" size={24} color="#006576" />
                </View>
                <View>
                  <Text style={styles.recentItemTitle}>Blood_Test_Results.pdf</Text>
                  <View style={styles.recentMetaRow}>
                    <MaterialIcons name="schedule" size={14} color="#595c5d" />
                    <Text style={styles.recentMetaText}>2 hours ago • 1.2 MB</Text>
                  </View>
                </View>
              </View>
              <View style={styles.recentItemRight}>
                <View style={[styles.statusBadge, { backgroundColor: 'rgba(114,251,189,0.3)' }]}>
                  <Text style={[styles.statusBadgeText, { color: '#005e3e' }]}>PROCESSING</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#abadae" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.recentItem}>
              <View style={styles.recentItemLeft}>
                <View style={[styles.recentIconBox, { backgroundColor: 'rgba(0,106,53,0.1)' }]}>
                  <MaterialIcons name="science" size={24} color="#006a35" />
                </View>
                <View>
                  <Text style={styles.recentItemTitle}>Prescription_Aug_2023</Text>
                  <View style={styles.recentMetaRow}>
                    <MaterialIcons name="calendar-today" size={14} color="#595c5d" />
                    <Text style={styles.recentMetaText}>Yesterday • Scan</Text>
                  </View>
                </View>
              </View>
              <View style={styles.recentItemRight}>
                <View style={[styles.statusBadge, { backgroundColor: '#dfe3e4' }]}>
                  <Text style={[styles.statusBadgeText, { color: '#595c5d' }]}>COMPLETED</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#abadae" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.recentItem, styles.recentItemDashed]}>
              <View style={styles.recentItemLeft}>
                <View style={[styles.recentIconBox, { backgroundColor: 'rgba(251,81,81,0.1)' }]}>
                  <MaterialIcons name="text-snippet" size={24} color="#b31b25" />
                </View>
                <View>
                  <Text style={styles.recentItemTitle}>Radiology_Report_Partial</Text>
                  <View style={styles.recentMetaRow}>
                    <MaterialIcons name="warning" size={14} color="#b31b25" />
                    <Text style={[styles.recentMetaText, { color: '#b31b25', fontWeight: '500' }]}>Draft • Needs review</Text>
                  </View>
                </View>
              </View>
              <View style={styles.recentItemRight}>
                <MaterialIcons name="edit-note" size={24} color="#abadae" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.homeFooter}>
        <TouchableOpacity style={styles.homeBtn} activeOpacity={0.8} onPress={() => router.push('/dashboard')}>
          <MaterialIcons name="home" size={24} color="#006a35" />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  headerIconBtn: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 20,
    fontWeight: '600',
    color: '#143832',
  },
  avatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#d9dddf',
    borderWidth: 1,
    borderColor: '#e5e9ea',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    padding: 24,
  },
  heroSection: {
    marginBottom: 40,
  },
  heroTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 28,
    fontWeight: '800',
    color: '#2c2f30',
    marginBottom: 8,
  },
  heroDesc: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#595c5d',
    lineHeight: 24,
  },
  gridSection: {
    gap: 24,
    marginBottom: 48,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,106,53,0.05)',
    shadowColor: '#006a35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  actionCardLight: {
    backgroundColor: '#eef1f2',
    borderRadius: 24,
    padding: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  actionIconBgOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  actionIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#006a35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionCardTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 24,
    fontWeight: '700',
    color: '#2c2f30',
    marginBottom: 8,
  },
  actionCardDesc: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#595c5d',
    lineHeight: 22,
    maxWidth: '80%',
  },
  actionCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    gap: 8,
  },
  actionCardFooterText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
  },
  recentSection: {
    backgroundColor: '#eef1f2',
    borderRadius: 32,
    padding: 24,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  recentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recentBarIndicator: {
    width: 8,
    height: 24,
    backgroundColor: '#006a35',
    borderRadius: 4,
  },
  recentTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 20,
    fontWeight: '700',
    color: '#2c2f30',
  },
  viewAllText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#006a35',
  },
  recentList: {
    gap: 16,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 24,
  },
  recentItemDashed: {
    borderWidth: 1,
    borderColor: 'rgba(171,173,174,0.3)',
    borderStyle: 'dashed',
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  recentIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentItemTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#2c2f30',
    marginBottom: 4,
  },
  recentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recentMetaText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#595c5d',
  },
  recentItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  homeFooter: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  homeBtn: {
    width: 70,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#006a35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
