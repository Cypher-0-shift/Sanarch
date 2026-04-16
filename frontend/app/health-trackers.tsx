import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

export default function HealthTrackersScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      {/* TopAppBar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#064e3b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Trackers</Text>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="add" size={24} color="#064e3b" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#747778" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search trackers..."
            placeholderTextColor="#abadae"
          />
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Metrics</Text>
          <Text style={styles.updatedText}>UPDATED JUST NOW</Text>
        </View>

        {/* Tracker Grid */}
        <View style={styles.gridContainer}>
          
          {/* Heart Rate */}
          <TouchableOpacity 
            style={styles.vitalCard} 
            activeOpacity={0.8}
            onPress={() => router.push('/heart-rate')}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: '#fef2f2' }]}>
                <MaterialIcons name="favorite" size={20} color="#ef4444" />
              </View>
              <View style={styles.badgeNormal}>
                <Text style={styles.badgeTextNormal}>NORMAL</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Heart Rate</Text>
              <View style={styles.cardValueRow}>
                <Text style={styles.cardValueLarge}>72</Text>
                <Text style={styles.cardUnit}>BPM</Text>
              </View>
            </View>
            <View style={styles.cardFooter}>
              <TouchableOpacity style={styles.addBtn}>
                <MaterialIcons name="add" size={18} color="#006a35" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* Blood Sugar */}
          <TouchableOpacity 
            style={styles.vitalCard} 
            activeOpacity={0.8}
            onPress={() => router.push('/blood-sugar')}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: '#fff7ed' }]}>
                <MaterialIcons name="bloodtype" size={20} color="#f97316" />
              </View>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Blood Sugar</Text>
              <Text style={styles.cardValueSubText}>Add reading</Text>
            </View>
            <View style={styles.cardFooter}>
              <TouchableOpacity style={styles.addBtn}>
                <MaterialIcons name="add" size={18} color="#006a35" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* Blood Pressure */}
          <TouchableOpacity style={styles.vitalCard} activeOpacity={0.8}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: '#faf5ff' }]}>
                <MaterialIcons name="health-and-safety" size={20} color="#a855f7" />
              </View>
              <View style={styles.badgeNormal}>
                <Text style={styles.badgeTextNormal}>NORMAL</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Blood Pressure</Text>
              <View style={styles.cardValueRow}>
                <Text style={styles.cardValueLarge}>120/80</Text>
              </View>
            </View>
            <View style={styles.cardFooter}>
              <TouchableOpacity style={styles.addBtn}>
                <MaterialIcons name="add" size={18} color="#006a35" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* Weight */}
          <TouchableOpacity style={styles.vitalCard} activeOpacity={0.8}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: '#eff6ff' }]}>
                <MaterialIcons name="fitness-center" size={20} color="#3b82f6" />
              </View>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Weight</Text>
              <Text style={styles.cardValueSubText}>Add reading</Text>
            </View>
            <View style={styles.cardFooter}>
              <TouchableOpacity style={styles.addBtn}>
                <MaterialIcons name="add" size={18} color="#006a35" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* Temperature */}
          <TouchableOpacity style={styles.vitalCard} activeOpacity={0.8}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: '#fefce8' }]}>
                <MaterialIcons name="thermostat" size={20} color="#ca8a04" />
              </View>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Temperature</Text>
              <Text style={styles.cardValueSubText}>Add reading</Text>
            </View>
            <View style={styles.cardFooter}>
              <TouchableOpacity style={styles.addBtn}>
                <MaterialIcons name="add" size={18} color="#006a35" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* Water Intake */}
          <TouchableOpacity style={styles.vitalCard} activeOpacity={0.8}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: '#ecfeff' }]}>
                <MaterialIcons name="water-drop" size={20} color="#06b6d4" />
              </View>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Water Intake</Text>
              <Text style={styles.cardValueSubText}>Add reading</Text>
            </View>
            <View style={styles.cardFooter}>
              <TouchableOpacity style={styles.addBtn}>
                <MaterialIcons name="add" size={18} color="#006a35" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

        </View>

        {/* CTA Banner */}
        <View style={styles.ctaBanner}>
          <LinearGradient
            colors={['#006a35', '#004a23']}
            style={styles.ctaGradient}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
          >
            <View style={styles.ctaContent}>
              <Text style={styles.ctaBannerTitle}>Personalize Your Dashboard</Text>
              <Text style={styles.ctaBannerSubtitle}>Rearrange or hide trackers to match your health goals.</Text>
              <TouchableOpacity style={styles.ctaBtn}>
                <Text style={styles.ctaBtnText}>Edit Trackers</Text>
              </TouchableOpacity>
            </View>
            {/* Decors */}
            <View style={styles.decor1} />
            <View style={styles.decor2} />
          </LinearGradient>
        </View>

      </ScrollView>

      {/* Bottom NavBar (Trackers Active) */}
      <View style={styles.bottomNavContainer}>
        {/* Home */}
        <TouchableOpacity style={styles.navItemContainer} onPress={() => router.back()}>
          <View style={styles.navItemInactive}>
            <MaterialIcons name="home" size={20} color="#9a9d9e" />
            <Text style={styles.navItemText}>Home</Text>
          </View>
        </TouchableOpacity>

        {/* Trackers */}
        <TouchableOpacity style={styles.navItemContainer}>
          <LinearGradient
            colors={['#d1fae5', '#a7f3d0']} 
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.navItemActiveBg}
          >
            <MaterialIcons name="insights" size={20} color="#065f46" />
            <Text style={[styles.navItemText, { color: '#064e3b' }]}>Trackers</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Records */}
        <TouchableOpacity style={styles.navItemContainer}>
          <View style={styles.navItemInactive}>
            <MaterialIcons name="folder-open" size={20} color="#9a9d9e" />
            <Text style={styles.navItemText}>Records</Text>
          </View>
        </TouchableOpacity>

        {/* Profile */}
        <TouchableOpacity style={styles.navItemContainer}>
          <View style={styles.navItemInactive}>
            <MaterialIcons name="person" size={20} color="#9a9d9e" />
            <Text style={styles.navItemText}>Profile</Text>
          </View>
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
  iconButton: {
    padding: 8,
  },
  headerTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 18,
    fontWeight: '700',
    color: '#064e3b',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef1f2',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#2c2f30',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 24,
    fontWeight: '700',
    color: '#2c2f30',
    letterSpacing: -0.5,
  },
  updatedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#abadae',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 48,
  },
  vitalCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 24,
    padding: 20,
    minHeight: 180,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeNormal: {
    backgroundColor: '#72fbbd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeTextNormal: {
    fontSize: 8,
    fontWeight: '800',
    color: '#005e3e',
    textTransform: 'uppercase',
  },
  cardContent: {
    marginTop: 16,
    flex: 1,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#747778',
    marginBottom: 4,
  },
  cardValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  cardValueLarge: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 28,
    fontWeight: '700',
    color: '#2c2f30',
  },
  cardUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#747778',
    marginLeft: 4,
  },
  cardValueSubText: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 18,
    fontWeight: '700',
    color: '#abadae',
  },
  cardFooter: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eef1f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBanner: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
  },
  ctaGradient: {
    padding: 24,
    position: 'relative',
  },
  ctaContent: {
    position: 'relative',
    zIndex: 10,
  },
  ctaBannerTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  ctaBannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
    maxWidth: '70%',
  },
  ctaBtn: {
    backgroundColor: '#6bfe9c',
    alignSelf: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  ctaBtnText: {
    color: '#005f2f',
    fontWeight: '700',
    fontSize: 14,
  },
  decor1: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 160,
    height: 160,
    backgroundColor: 'rgba(107, 254, 156, 0.2)',
    borderRadius: 80,
  },
  decor2: {
    position: 'absolute',
    right: -10,
    top: -10,
    width: 96,
    height: 96,
    backgroundColor: 'rgba(114, 251, 189, 0.3)',
    borderRadius: 48,
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
  navItemActiveBg: {
    width: 70,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
