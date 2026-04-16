import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

export default function ServicesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push('/menu' as any)}>
          <MaterialIcons name="menu" size={26} color="#143832" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Services</Text>
        <TouchableOpacity style={styles.avatarBtn} onPress={() => router.push('/profile')}>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuAhHE6UKzkbJOTAW8b7LdrF8Chc9avEk0xpW0unrIc150d1ABgbo3xOMiuEZ3hI5zO2BgwdKsoX7AXPiXdHsC1j2KBY-RbiSo5AfRdT08wAop54DrzoIRwVpq8w3RE1QtqV4phGtAZAuhFmSZm5rAdyElcq_KG21iD51AMP9K3KUC8e47aRRZPNb3zbtNeUX7cshsZpDJbcc3xvyRCtkTkBIYqT58sAUbMRv_m1pg-OMcTqhauKY-57GgWXQ_QosIgEx3K8T3' }} 
            style={styles.avatarImg} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>How can we help you today?</Text>
            <Text style={styles.heroDesc}>Explore our range of clinical and diagnostic services designed for your vital wellness.</Text>
          </View>
          <View style={styles.heroIconBg}>
            <MaterialIcons name="health-and-safety" size={160} color="rgba(255,255,255,0.1)" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Primary Care</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            <View style={styles.primaryCard}>
              <View style={styles.primaryContent}>
                <MaterialIcons name="medical-information" size={32} color="#006a35" />
                <View>
                  <Text style={styles.primaryCardTitle}>General Consultation</Text>
                  <Text style={styles.primaryCardDesc}>Comprehensive health check-ups and routine medical assessments.</Text>
                </View>
              </View>
              <View style={styles.primaryBgIcon}>
                <MaterialIcons name="stethoscope" size={100} color="rgba(44,47,48,0.05)" />
              </View>
            </View>

            <View style={styles.primaryCard}>
              <View style={styles.primaryContent}>
                <MaterialIcons name="medication" size={32} color="#006a35" />
                <View>
                  <Text style={styles.primaryCardTitle}>Pharmacy</Text>
                  <Text style={styles.primaryCardDesc}>Quick access to prescription drugs and over-the-counter medicine.</Text>
                </View>
              </View>
              <View style={styles.primaryBgIcon}>
                <MaterialIcons name="healing" size={100} color="rgba(44,47,48,0.05)" />
              </View>
            </View>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specialists</Text>
          <View style={styles.gridContainer}>
            <View style={[styles.gridCard, { backgroundColor: '#006a35' }]}>
              <View style={[styles.gridBadge, { backgroundColor: '#6bfe9c' }]}>
                <Text style={[styles.gridBadgeText, { color: '#005f2f' }]}>CARDIOLOGY</Text>
              </View>
              <Text style={styles.gridCardTitle}>Expert Heart Care</Text>
              <MaterialIcons name="monitor-heart" size={40} color="rgba(205,255,212,0.5)" style={styles.gridIconAlign} />
            </View>

            <View style={[styles.gridCard, { backgroundColor: '#006946' }]}>
              <View style={[styles.gridBadge, { backgroundColor: '#72fbbd' }]}>
                <Text style={[styles.gridBadgeText, { color: '#005e3e' }]}>PEDIATRICS</Text>
              </View>
              <Text style={styles.gridCardTitle}>Infant Health</Text>
              <MaterialIcons name="child-care" size={40} color="rgba(201,255,223,0.5)" style={styles.gridIconAlign} />
            </View>

            <View style={[styles.gridCard, { backgroundColor: '#006576' }]}>
              <View style={[styles.gridBadge, { backgroundColor: '#00dcff' }]}>
                <Text style={[styles.gridBadgeText, { color: '#004956' }]}>DENTISTRY</Text>
              </View>
              <Text style={styles.gridCardTitle}>Oral Hygiene</Text>
              <MaterialIcons name="face" size={40} color="rgba(221,247,255,0.5)" style={styles.gridIconAlign} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnostic Services</Text>
          <View style={styles.diagnosticList}>
            <View style={styles.diagnosticCard}>
              <View style={[styles.diagIconBox, { backgroundColor: 'rgba(0,220,255,0.3)' }]}>
                <MaterialIcons name="biotech" size={32} color="#004956" />
              </View>
              <View style={styles.diagInfo}>
                <Text style={styles.diagTitle}>Lab Tests</Text>
                <Text style={styles.diagDesc}>Accurate blood, urine, and pathology results delivered digitally.</Text>
              </View>
            </View>

            <View style={styles.diagnosticCard}>
              <View style={[styles.diagIconBox, { backgroundColor: 'rgba(251,81,81,0.2)' }]}>
                <MaterialIcons name="emergency" size={32} color="#b31b25" />
              </View>
              <View style={styles.diagInfo}>
                <Text style={styles.diagTitle}>Ambulance</Text>
                <Text style={styles.diagDesc}>24/7 emergency response and rapid medical transit services.</Text>
              </View>
            </View>
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
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]} activeOpacity={1}>
          <MaterialIcons name="medical-services" size={24} color="#ffffff" />
          <Text style={styles.navLabelActive}>SERVICES</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/records')}>
          <MaterialIcons name="description" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>RECORDS</Text>
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
  },
  headerIconBtn: {
    width: 26,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 18,
    fontWeight: '600',
    color: '#143832',
  },
  avatarBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: '#d9dddf',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  heroSection: {
    backgroundColor: '#006a35',
    borderRadius: 24,
    minHeight: 180,
    padding: 32,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 32,
  },
  heroContent: {
    position: 'relative',
    zIndex: 10,
    width: '70%',
  },
  heroTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
  },
  heroDesc: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(205,255,212,0.8)',
  },
  heroIconBg: {
    position: 'absolute',
    right: -32,
    bottom: -32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 20,
    fontWeight: '700',
    color: '#2c2f30',
    marginBottom: 16,
  },
  horizontalScroll: {
    gap: 16,
    paddingRight: 24,
  },
  primaryCard: {
    width: 280,
    backgroundColor: '#eef1f2',
    borderRadius: 24,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    marginRight: 16,
  },
  primaryContent: {
    position: 'relative',
    zIndex: 10,
    flexDirection: 'col',
    gap: 16,
  },
  primaryCardTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 18,
    fontWeight: '700',
    color: '#2c2f30',
    marginTop: 16,
    marginBottom: 4,
  },
  primaryCardDesc: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#595c5d',
  },
  primaryBgIcon: {
    position: 'absolute',
    right: -16,
    bottom: -16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridCard: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
  },
  gridBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  gridBadgeText: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '700',
  },
  gridCardTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 8,
  },
  gridIconAlign: {
    alignSelf: 'flex-end',
  },
  diagnosticList: {
    gap: 16,
  },
  diagnosticCard: {
    backgroundColor: '#eef1f2',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  diagIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diagInfo: {
    flex: 1,
  },
  diagTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 18,
    fontWeight: '700',
    color: '#2c2f30',
  },
  diagDesc: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#595c5d',
    marginTop: 4,
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
