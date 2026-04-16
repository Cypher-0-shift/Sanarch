import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

export default function RecordsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push('/menu' as any)}>
          <MaterialIcons name="menu" size={26} color="#143832" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Records</Text>
        <TouchableOpacity style={styles.avatarBtn} onPress={() => router.push('/profile')}>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuAhHE6UKzkbJOTAW8b7LdrF8Chc9avEk0xpW0unrIc150d1ABgbo3xOMiuEZ3hI5zO2BgwdKsoX7AXPiXdHsC1j2KBY-RbiSo5AfRdT08wAop54DrzoIRwVpq8w3RE1QtqV4phGtAZAuhFmSZm5rAdyElcq_KG21iD51AMP9K3KUC8e47aRRZPNb3zbtNeUX7cshsZpDJbcc3xvyRCtkTkBIYqT58sAUbMRv_m1pg-OMcTqhauKY-57GgWXQ_QosIgEx3K8T3' }} 
            style={styles.avatarImg} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color="#595c5d" style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search medical records, labs, or doctors..."
              placeholderTextColor="#9a9d9e"
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity style={[styles.filterChip, styles.filterChipActive]}>
              <Text style={[styles.filterText, styles.filterTextActive]}>All Records</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChip}>
              <Text style={styles.filterText}>Lab Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChip}>
              <Text style={styles.filterText}>Prescriptions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChip}>
              <Text style={styles.filterText}>Vaccinations</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons name="auto-awesome" size={20} color="#006a35" />
            <Text style={styles.sectionTitle}>AI Insights</Text>
          </View>
          <View style={styles.insightCard}>
            <View style={styles.insightCol}>
              <Text style={styles.insightLabel}>DIABETES SCREENING</Text>
              <View style={styles.insightValRow}>
                <Text style={styles.insightValueMain}>6.8%</Text>
                <Text style={styles.insightValueSubWarn}>HbA1c (Slightly High)</Text>
              </View>
              <Text style={styles.insightDesc}>Target is usually below 5.7%</Text>
            </View>
            <View style={styles.insightDivider} />
            <View style={styles.insightCol}>
              <Text style={styles.insightLabel}>BLOOD HEALTH</Text>
              <View style={styles.insightValRow}>
                <Text style={styles.insightValueMain}>12.3 <Text style={styles.insightUnit}>g/dL</Text></Text>
                <Text style={styles.insightValueSubNormal}>Hemoglobin (Normal)</Text>
              </View>
              <Text style={styles.insightDesc}>Optimal range: 12.0 - 15.5 g/dL</Text>
            </View>
          </View>
        </View>

        <View style={styles.gridSection}>
          <View style={styles.heroSummaryCard}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>LATEST UPDATE</Text>
            </View>
            <Text style={styles.heroTitle}>Annual Wellness Checkup</Text>
            <Text style={styles.heroDesc}>Your overall health score has improved by 12% since your last visit. Download the full summary below.</Text>
            <TouchableOpacity style={styles.downloadBtn}>
              <MaterialIcons name="download" size={20} color="#005f2f" />
              <Text style={styles.downloadBtnText}>Download Report</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bpCard}>
            <View style={styles.bpIconBox}>
              <MaterialIcons name="favorite" size={24} color="#004956" />
            </View>
            <View>
              <Text style={styles.bpLabel}>Blood Pressure</Text>
              <Text style={styles.bpValue}>118/75</Text>
              <Text style={styles.bpStatus}>NORMAL RANGE</Text>
            </View>
            <View style={styles.chartMock}>
              <View style={[styles.chartBar, { height: '40%' }]} />
              <View style={[styles.chartBar, { height: '60%' }]} />
              <View style={[styles.chartBar, { height: '45%' }]} />
              <View style={[styles.chartBar, { height: '75%', backgroundColor: '#00cdee' }]} />
              <View style={[styles.chartBar, { height: '55%' }]} />
              <View style={[styles.chartBar, { height: '90%', backgroundColor: '#00dcff' }]} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginLeft: 4 }]}>Recent Documents</Text>
          <View style={styles.recordList}>
            <TouchableOpacity style={styles.recordItem}>
              <View style={styles.recordIconBox}>
                <MaterialIcons name="description" size={24} color="#595c5d" />
              </View>
              <View style={styles.recordInfo}>
                <Text style={styles.recordTitle}>Complete Blood Count (CBC)</Text>
                <Text style={styles.recordMeta}>Diagnostics Center • Oct 24, 2023</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#abadae" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.recordItem}>
              <View style={styles.recordIconBox}>
                <MaterialIcons name="medical-services" size={24} color="#595c5d" />
              </View>
              <View style={styles.recordInfo}>
                <Text style={styles.recordTitle}>Cardiology Referral</Text>
                <Text style={styles.recordMeta}>Dr. Sarah Jenkins • Sep 12, 2023</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#abadae" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.recordItem}>
              <View style={styles.recordIconBox}>
                <MaterialIcons name="vaccines" size={24} color="#595c5d" />
              </View>
              <View style={styles.recordInfo}>
                <Text style={styles.recordTitle}>COVID-19 Booster Dose</Text>
                <Text style={styles.recordMeta}>Public Health Clinic • Aug 05, 2023</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#abadae" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 110, right: 24, zIndex: 60 }}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/scanner')}>
          <LinearGradient
            colors={['#15803d', '#4ade80']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <MaterialIcons name="add" size={28} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/dashboard')}>
          <MaterialIcons name="home" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>HOME</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/services')}>
          <MaterialIcons name="medical-services" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>SERVICES</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]} activeOpacity={1}>
          <MaterialIcons name="description" size={24} color="#ffffff" />
          <Text style={styles.navLabelActive}>RECORDS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile')}>
          <MaterialIcons name="person" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>PROFILE</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerIconBtn: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 18,
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
    paddingBottom: 100,
  },
  searchSection: {
    marginBottom: 32,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef1f2',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#2c2f30',
  },
  filterScroll: {
    gap: 8,
    paddingRight: 24,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#dfe3e4',
  },
  filterChipActive: {
    backgroundColor: '#72fbbd',
  },
  filterText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#595c5d',
  },
  filterTextActive: {
    color: '#005e3e',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 18,
    fontWeight: '700',
    color: '#2c2f30',
  },
  insightCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(220,252,231,0.5)',
  },
  insightCol: {
    flex: 1,
    marginBottom: 16,
  },
  insightLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(22,101,52,0.6)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  insightValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 4,
  },
  insightValueMain: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 24,
    fontWeight: '800',
    color: '#14532d',
  },
  insightUnit: {
    fontSize: 18,
    fontWeight: '500',
  },
  insightValueSubWarn: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#d97706',
  },
  insightValueSubNormal: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#006a35',
  },
  insightDesc: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: 'rgba(22,101,52,0.7)',
  },
  insightDivider: {
    height: 1,
    backgroundColor: 'rgba(187,247,208,0.5)',
    marginVertical: 16,
  },
  gridSection: {
    gap: 24,
    marginBottom: 32,
  },
  heroSummaryCard: {
    backgroundColor: '#006a35',
    borderRadius: 24,
    padding: 32,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 24,
  },
  heroBadgeText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  heroTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 16,
  },
  heroDesc: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: 'rgba(205,255,212,0.8)',
    lineHeight: 20,
    marginBottom: 24,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6bfe9c',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignSelf: 'flex-start',
  },
  downloadBtnText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#004a23',
  },
  bpCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
  },
  bpIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#00dcff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bpLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#595c5d',
  },
  bpValue: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 36,
    fontWeight: '800',
    color: '#2c2f30',
    marginTop: 4,
  },
  bpStatus: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: '#006a35',
    letterSpacing: 1,
    marginTop: 8,
  },
  chartMock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: '#eef1f2',
    height: 48,
    borderRadius: 12,
    marginTop: 24,
    padding: 4,
  },
  chartBar: {
    width: '15%',
    backgroundColor: 'rgba(0,220,255,0.4)',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  recordList: {
    gap: 12,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
  },
  recordIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#dfe3e4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#2c2f30',
    marginBottom: 4,
  },
  recordMeta: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#595c5d',
  },
  fabGradient: {
    width: 70,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  navItemActive: {
    backgroundColor: '#006a35',
    borderRadius: 20,
    width: 70,
    height: 40,
    paddingVertical: 0,
    paddingHorizontal: 0,
    shadowColor: '#006a35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  navLabel: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 4,
  },
  navLabelActive: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
});
