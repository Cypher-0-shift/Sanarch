import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push('/menu' as any)}>
          <MaterialIcons name="menu" size={26} color="#143832" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.avatarBtn}>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDseqdgU_Nz05itsnBZlnV4oOZaxMTIX34DWy6kFZeSrVRk0P7lnudhkykuGktiv8IZFJouO4tGEF7_quvgvxAW5gB4RDLmBFRwlRhxFVtPwImDqXfvKCy7ctizVzlnVzSrsSbXsYCM7NaThx_XEmuj5tNIgT0Vx44atDW0nRAe5uBp1ig6s2UPLe3pfeID0cih8s5YpidE-ieUmjrn9jprWtIrodc3g8kS2iexmkNw9TwQxPyPO3ABECL6vHWr6yty52W8jfbH' }} 
            style={styles.avatarImg} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.heroSection}>
          <View style={styles.heroCardContent}>
            <View style={styles.heroAvatarBox}>
              <View style={styles.heroAvatarBorder}>
                <Image 
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJDZZm5a2EZipp1esFEnjvcEBApzniTmpqn0Rx07GcLVzc_BnZ8-86TaPgzqBF9pXpitCJV4sQxuusbac9ims-ddrkpFXNzb7kizBWglGVUOH8L6X49Laz2VQf9F-QSgTKW0eKs3tbIMAEPQaITKYCe2P-S1yuQnQ6iFjPj2wFcFnrJ1qJBaRrJ0k9MYQ9S7x6PBiZ83oiyx4keuxabt7kJ7nTM-TJEvlTOQe04VRQWKYMRIqeL1HX80YymedR4wO3-XUsCYms' }} 
                  style={styles.heroAvatarImg} 
                />
              </View>
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="verified" size={14} color="#006946" />
              </View>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>Sarah Henderson</Text>
              <Text style={styles.heroId}>Patient ID: #SAN-992-881</Text>
              <View style={styles.heroTags}>
                <View style={styles.heroTag}>
                  <Text style={styles.heroTagText}>BLOOD TYPE: O+</Text>
                </View>
                <View style={styles.heroTag}>
                  <Text style={styles.heroTagText}>AGE: 29</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.gridSection}>
          <View style={styles.statsCard}>
            <MaterialIcons name="favorite" size={24} color="#006a35" style={styles.statsIcon} />
            <Text style={styles.statsLabel}>Heart Rate</Text>
            <Text style={styles.statsValue}>72 <Text style={styles.statsUnit}>bpm</Text></Text>
          </View>
          <View style={styles.statsCard}>
            <MaterialIcons name="bloodtype" size={24} color="#006576" style={styles.statsIcon} />
            <Text style={styles.statsLabel}>Blood Pressure</Text>
            <Text style={styles.statsValue}>120/80</Text>
          </View>
          <View style={styles.statsCard}>
            <MaterialIcons name="fitness-center" size={24} color="#f97316" style={styles.statsIcon} />
            <Text style={styles.statsLabel}>Weight</Text>
            <Text style={styles.statsValue}>64.5 <Text style={styles.statsUnit}>kg</Text></Text>
          </View>
          <View style={styles.statsCard}>
            <MaterialIcons name="height" size={24} color="#3b82f6" style={styles.statsIcon} />
            <Text style={styles.statsLabel}>Height</Text>
            <Text style={styles.statsValue}>172 <Text style={styles.statsUnit}>cm</Text></Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>ACCOUNT SETTINGS</Text>
          <View style={styles.settingsList}>
            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIconBox, { backgroundColor: 'rgba(107,254,156,0.2)' }]}>
                  <MaterialIcons name="person" size={24} color="#006a35" />
                </View>
                <View>
                  <Text style={styles.settingsItemTitle}>Personal Information</Text>
                  <Text style={styles.settingsItemDesc}>Update your details and status</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#747778" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIconBox, { backgroundColor: 'rgba(0,101,118,0.2)' }]}>
                  <MaterialIcons name="security" size={24} color="#006576" />
                </View>
                <View>
                  <Text style={styles.settingsItemTitle}>Security & Privacy</Text>
                  <Text style={styles.settingsItemDesc}>2FA, Password management</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#747778" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIconBox, { backgroundColor: 'rgba(59,130,246,0.2)' }]}>
                  <MaterialIcons name="family-restroom" size={24} color="#3b82f6" />
                </View>
                <View>
                  <Text style={styles.settingsItemTitle}>Family Members</Text>
                  <Text style={styles.settingsItemDesc}>Manage health records for family</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#747778" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIconBox, { backgroundColor: 'rgba(114,251,189,0.2)' }]}>
                  <MaterialIcons name="payments" size={24} color="#006946" />
                </View>
                <View>
                  <Text style={styles.settingsItemTitle}>Insurance & Billing</Text>
                  <Text style={styles.settingsItemDesc}>Manage plans and payments</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#747778" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.updateBtn} activeOpacity={0.8}>
          <MaterialIcons name="edit" size={20} color="#ffffff" />
          <Text style={styles.updateBtnText}>Update Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutBtn} activeOpacity={0.8} onPress={() => router.replace('/login' as any)}>
          <MaterialIcons name="logout" size={20} color="#b31b25" />
          <Text style={styles.signOutBtnText}>Sign Out</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* NO FAB ON PROFILE */}

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/dashboard')}>
          <MaterialIcons name="home" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>HOME</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/services')}>
          <MaterialIcons name="medical-services" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>SERVICES</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/records')}>
          <MaterialIcons name="description" size={24} color="#94a3b8" />
          <Text style={styles.navLabel}>RECORDS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]} activeOpacity={1}>
          <MaterialIcons name="person" size={24} color="#ffffff" />
          <Text style={styles.navLabelActive}>PROFILE</Text>
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
  heroSection: {
    backgroundColor: '#006a35',
    borderRadius: 32,
    padding: 32,
    marginBottom: 24,
    shadowColor: '#006a35',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  heroCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  heroAvatarBox: {
    position: 'relative',
  },
  heroAvatarBorder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 4,
  },
  heroAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#72fbbd',
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: '#006a35',
  },
  heroInfo: {
    flex: 1,
  },
  heroName: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  heroId: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(205,255,212,0.8)',
    marginBottom: 16,
  },
  heroTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroTag: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  heroTagText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 1,
  },
  gridSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  statsCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  statsIcon: {
    marginBottom: 8,
  },
  statsLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    color: '#595c5d',
    marginBottom: 4,
  },
  statsValue: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 20,
    fontWeight: '700',
    color: '#2c2f30',
  },
  statsUnit: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: '#595c5d',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 14,
    fontWeight: '700',
    color: '#595c5d',
    letterSpacing: 2,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  settingsList: {
    backgroundColor: '#eef1f2',
    borderRadius: 32,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingsIconBox: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsItemTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#2c2f30',
    marginBottom: 4,
  },
  settingsItemDesc: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#595c5d',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(217,221,223,0.3)',
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#006a35',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#006a35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  updateBtnText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(179,27,37,0.2)',
    paddingVertical: 16,
    borderRadius: 16,
  },
  signOutBtnText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#b31b25',
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
