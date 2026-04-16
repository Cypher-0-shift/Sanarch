import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* TopAppBar */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/menu')}>
          <MaterialIcons name="menu" size={26} color="#747778" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Home</Text>
        <TouchableOpacity style={styles.avatarContainer} onPress={() => router.push('/profile')}>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDG1eZMX0lFYcll3JuXe9P4AI7aRY-wA23AbMcg1VHhg03NbteY4LOlcO68VwVRhLfCX2z3aaTIBYFtKkYoKPQjCGyROv7e_ajgCwfopYRTnuQiatOpwQz0tpTwk5KHIl9uFLIPHzCsYSGh8JaMN8-KvnPUp_5ISrtmIDWfKawbv7DsGHI3WxtnieyQpGtUEDh4FO7eUGHR4tddogZBX0O6YFVVObkxy94xMkzNr76cf9NIyy97akKBNWtcTKWD7j5ENahraulq' }}
            style={styles.avatar}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
        
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <LinearGradient
            colors={['#006a35', '#005c2d']} // primary to primary-dim
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <Text style={styles.heroTag}>Vital Statistics</Text>
            <Text style={styles.heroTitle}>Your health is{'\n'}reaching a new peak.</Text>
            <View style={styles.heroActionRow}>
              <TouchableOpacity style={styles.heroButtonPrimary}>
                <Text style={styles.heroButtonTextPrimary}>View Records</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroButtonSecondary}>
                <Text style={styles.heroButtonTextSecondary}>Share Status</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.heroDecoration} />
          </LinearGradient>

          {/* Average Heart Rate Mini Card */}
          <View style={styles.heartRateMiniCard}>
            <View>
              <MaterialIcons name="favorite" size={32} color="#006a35" style={{ marginBottom: 12 }} />
              <Text style={styles.miniCardTitle}>Average Heart Rate</Text>
            </View>
            <View style={styles.miniCardValueRow}>
              <Text style={styles.miniCardLargeValue}>72</Text>
              <Text style={styles.miniCardUnit}>BPM</Text>
            </View>
          </View>
        </View>

        {/* Quick Trackers Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Trackers</Text>
          <TouchableOpacity onPress={() => router.push('/health-trackers' as any)}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gridContainer}>
          {/* Heart Rate */}
          <TouchableOpacity 
            style={styles.gridItem}
            onPress={() => router.push('/heart-rate' as any)}
          >
            <View style={[styles.gridIconContainer, { backgroundColor: 'rgba(114, 251, 189, 0.3)' }]}>
              <MaterialIcons name="favorite" size={24} color="#006a35" />
            </View>
            <Text style={styles.gridItemTitle}>Heart Rate</Text>
            <Text style={styles.gridItemValue}>72 <Text style={styles.gridItemUnit}>BPM</Text></Text>
          </TouchableOpacity>

          {/* Blood Sugar */}
          <TouchableOpacity 
            style={[styles.gridItem, styles.gridItemDashed]}
            onPress={() => router.push('/blood-sugar' as any)}
          >
            <View style={[styles.gridIconContainer, { backgroundColor: 'rgba(0, 220, 255, 0.2)' }]}>
              <MaterialIcons name="water-drop" size={24} color="#006576" />
            </View>
            <Text style={styles.gridItemTitle}>Blood Sugar</Text>
            <Text style={styles.addReadingText}>Add reading</Text>
          </TouchableOpacity>

          {/* Blood Pressure */}
          <View style={styles.gridItem}>
            <View style={[styles.gridIconContainer, { backgroundColor: 'rgba(107, 254, 156, 0.3)' }]}>
              <MaterialIcons name="monitor-heart" size={24} color="#006a35" />
            </View>
            <Text style={styles.gridItemTitle}>Blood Pressure</Text>
            <Text style={[styles.gridItemValue, { color: '#005c2d' }]}>120/80</Text>
          </View>

          {/* Weight */}
          <TouchableOpacity 
            style={[styles.gridItem, styles.gridItemDashed]}
            onPress={() => router.push('/health-trackers' as any)}
          >
            <View style={[styles.gridIconContainer, { backgroundColor: 'rgba(114, 251, 189, 0.2)' }]}>
              <MaterialIcons name="monitor-weight" size={24} color="#006946" />
            </View>
            <Text style={styles.gridItemTitle}>Weight</Text>
            <Text style={styles.addReadingText}>Add reading</Text>
          </TouchableOpacity>
        </View>

        {/* Recently Tracked Widget */}
        <View style={styles.historyWidget}>
          <View style={styles.historyHeader}>
            <View style={styles.historyTitleRow}>
              <View style={styles.historyIconWrapper}>
                <MaterialIcons name="history" size={20} color="#006a35" />
              </View>
              <Text style={styles.historyTitleText}>Recently Tracked</Text>
            </View>
            <Text style={styles.historySubtitle}>Heart Rate</Text>
          </View>

          <View style={styles.historyContent}>
            <View style={styles.historyDataRow}>
              <Text style={styles.historyLargeValue}>74 <Text style={styles.historySmallUnit}>BPM</Text></Text>
              <Text style={styles.historyTimestamp}>Today, 08:30 AM</Text>
            </View>
            <View style={styles.historyTrendRow}>
              <MaterialIcons name="trending-up" size={16} color="#006a35" />
              <Text style={styles.historyTrendText}>2%</Text>
            </View>
          </View>
        </View>

        {/* Dynamic Appointment Card */}
        <View style={styles.appointmentWrapper}>
          <View style={styles.appointmentCard}>
            <View style={styles.doctorImageContainer}>
              <Image 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBup50Msj1UMIqwmHruNAmy8GJ_HCqkucNso8TBFMCyWKBgN20llw60OhF5w2vJ_ZM_glFQQ8dhv22DlVZuFat1MH4zmCLBJw8559SyQgzk4KohbtBZF4MbVPhR96yp5Il8FcHD5bffmLTgjScG5CZheavmYR6cgk3krJutba77nFLWwPFxZN4UCa7_OMprm_m3Ba8FEESFH7UfP5apoaX5osNM7_vZGfcu48iTWSq3MeCXEDsPAs9Ej0G1Cqv1XMHBRoHKsAwq' }}
                style={styles.doctorImage}
              />
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="verified" size={16} color="#ffffff" />
              </View>
            </View>
            <View style={styles.appointmentInfo}>
              <Text style={styles.appointmentTitle}>Next Consultation</Text>
              <Text style={styles.doctorName}>Dr. Sarah Jenkins • Cardiologist</Text>
              <View style={styles.appointmentDetailsRow}>
                <View style={styles.detailPill}>
                  <MaterialIcons name="calendar-today" size={14} color="#006a35" />
                  <Text style={styles.detailPillText}>Tomorrow, 10:30 AM</Text>
                </View>
                <View style={styles.detailPill}>
                  <MaterialIcons name="location-pin" size={14} color="#006a35" />
                  <Text style={styles.detailPillText}>Green Valley Clinic</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.remindButton}>
              <Text style={styles.remindButtonText}>Remind Me</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* Floating Action Button */}
      <View style={[styles.fabContainer, { bottom: insets.bottom + 90 }]}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/scanner')}>
          <LinearGradient
            colors={['#15803d', '#4ade80']} // green-700 to green-400 equivalent
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fab}
          >
            <MaterialIcons name="add" size={28} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Bottom NavBar */}
      <View style={[styles.bottomNavContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        
        {/* Home (Active) */}
        <TouchableOpacity style={styles.navItemContainer} activeOpacity={1}>
          <View style={styles.navItemActive}>
            <MaterialIcons name="home" size={20} color="#ffffff" />
            <Text style={[styles.navItemText, { color: '#ffffff' }]}>Home</Text>
          </View>
        </TouchableOpacity>

        {/* Services */}
        <TouchableOpacity style={styles.navItemContainer} onPress={() => router.push('/services')}>
          <View style={styles.navItemInactive}>
            <MaterialIcons name="medical-services" size={20} color="#9a9d9e" />
            <Text style={styles.navItemText}>Services</Text>
          </View>
        </TouchableOpacity>

        {/* Records */}
        <TouchableOpacity style={styles.navItemContainer} onPress={() => router.push('/records')}>
          <View style={styles.navItemInactive}>
            <MaterialIcons name="description" size={20} color="#9a9d9e" />
            <Text style={styles.navItemText}>Records</Text>
          </View>
        </TouchableOpacity>

        {/* Profile */}
        <TouchableOpacity style={styles.navItemContainer} onPress={() => router.push('/profile')}>
          <View style={styles.navItemInactive}>
            <MaterialIcons name="person" size={20} color="#9a9d9e" />
            <Text style={styles.navItemText}>Profile</Text>
          </View>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7f8',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.9)',
    zIndex: 50,
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 20,
    fontWeight: '600',
    color: '#143832',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#d9dddf',
    borderColor: '#f5f5f5',
    borderWidth: 1,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    padding: 24,
  },
  welcomeSection: {
    marginBottom: 32,
    gap: 16,
  },
  heroCard: {
    borderRadius: 32,
    padding: 32,
    overflow: 'hidden',
  },
  heroTag: {
    color: 'rgba(205, 255, 212, 0.8)', 
    fontWeight: '500',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 38,
    marginBottom: 24,
  },
  heroActionRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  heroButtonPrimary: {
    backgroundColor: '#6bfe9c', 
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  heroButtonTextPrimary: {
    color: '#005f2f', 
    fontWeight: '700',
    fontSize: 14,
  },
  heroButtonSecondary: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroButtonTextSecondary: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  heroDecoration: {
    position: 'absolute',
    right: -40,
    bottom: -40,
    width: 250,
    height: 250,
    backgroundColor: '#6bfe9c',
    opacity: 0.1,
    borderRadius: 125,
  },
  heartRateMiniCard: {
    backgroundColor: '#eef1f2', 
    borderRadius: 32,
    padding: 24,
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 160,
    marginTop: 16,
  },
  miniCardTitle: {
    color: '#595c5d', 
    fontWeight: '600',
    fontSize: 16,
  },
  miniCardValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 16,
  },
  miniCardLargeValue: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 48,
    fontWeight: '800',
    color: '#2c2f30', 
    letterSpacing: -1,
  },
  miniCardUnit: {
    color: '#595c5d',
    fontWeight: '500',
    fontSize: 16,
    marginLeft: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 20,
    fontWeight: '700',
    color: '#2c2f30',
  },
  viewAllText: {
    color: '#006a35',
    fontWeight: '700',
    fontSize: 14,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 24,
  },
  gridItem: {
    width: '47%',
    backgroundColor: '#ffffff', 
    padding: 24,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 8,
  },
  gridItemDashed: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#dfe3e4', 
    backgroundColor: '#ffffff',
    shadowOpacity: 0,
    elevation: 0,
  },
  gridIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  gridItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#595c5d',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  gridItemValue: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 24,
    fontWeight: '800',
    color: '#006a35',
  },
  gridItemUnit: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  addReadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#006a35',
    marginTop: 4,
  },
  historyWidget: {
    backgroundColor: '#eef1f2',
    borderRadius: 32,
    padding: 24,
    marginBottom: 24,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,106,53,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyTitleText: {
    fontWeight: '700',
    fontSize: 16,
    color: '#2c2f30',
  },
  historySubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#595c5d',
  },
  historyContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyDataRow: {
    flexDirection: 'column',
  },
  historyLargeValue: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 18,
    fontWeight: '700',
    color: '#2c2f30',
  },
  historySmallUnit: {
    fontSize: 12,
    fontWeight: '500',
  },
  historyTimestamp: {
    fontSize: 10,
    color: '#595c5d',
    fontWeight: '500',
    marginTop: 2,
  },
  historyTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyTrendText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006a35',
    marginLeft: 4,
  },
  appointmentWrapper: {
    backgroundColor: '#eef1f2',
    borderRadius: 40,
    padding: 4,
  },
  appointmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 38,
    padding: 32,
    alignItems: 'center',
  },
  doctorImageContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  doctorImage: {
    width: 128,
    height: 128,
    borderRadius: 32,
    transform: [{ rotate: '3deg' }],
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: '#006a35',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appointmentTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 24,
    fontWeight: '800',
    color: '#2c2f30',
    marginBottom: 4,
  },
  doctorName: {
    color: '#595c5d',
    marginBottom: 24,
    fontWeight: '600',
  },
  appointmentDetailsRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef1f2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  detailPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c2f30',
    marginLeft: 8,
  },
  remindButton: {
    backgroundColor: '#006a35',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#006a35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  remindButtonText: {
    color: '#cdffd4',
    fontWeight: '700',
    fontSize: 16,
  },
  fabContainer: {
    position: 'absolute',
    right: 24,
    zIndex: 50,
  },
  fab: {
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
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 15,
  },
  navItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemActive: {
    backgroundColor: '#006a35',
    borderRadius: 20,
    width: 70,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#006a35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  navItemInactive: {
    width: 70,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemText: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
    color: '#9a9d9e',
  },
});
