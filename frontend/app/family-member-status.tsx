import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function FamilyMemberStatusScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#047857" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alex Henderson</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBg}>
              <Text style={styles.avatarText}>AH</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={14} color="#ffffff" />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>Alex Henderson</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>Dependent</Text>
              </View>
            </View>
            <Text style={styles.smartId}>SMART-ID: SH-992-041</Text>
            <Text style={styles.memberSince}>Member since Oct 2022</Text>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Health Overview</Text>
            <TouchableOpacity>
              <Text style={styles.linkText}>Full Report</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.gridContainer}>
            <View style={[styles.gridCell, { backgroundColor: '#eef1f2', borderWidth: 0 }]}>
              <View style={styles.cellHeader}>
                <MaterialIcons name="monitor-heart" size={20} color="#006a35" />
                <Text style={styles.cellLabel}>BP</Text>
              </View>
              <View>
                <Text style={styles.cellValueLarge}>120/80</Text>
                <Text style={styles.cellSubValue}>Normal</Text>
              </View>
            </View>
            
            <View style={styles.gridCell}>
              <View style={styles.cellHeader}>
                <MaterialIcons name="favorite" size={20} color="#006576" />
                <Text style={styles.cellLabel}>PULSE</Text>
              </View>
              <View>
                <Text style={styles.cellValueLarge}>72 <Text style={styles.unitText}>bpm</Text></Text>
                <Text style={styles.cellSubValue}>Resting</Text>
              </View>
            </View>

            <View style={[styles.gridCell, { backgroundColor: '#eef1f2', borderWidth: 0 }]}>
              <View style={styles.cellHeader}>
                <MaterialIcons name="air" size={20} color="#005361" />
                <Text style={styles.cellLabel}>SPO2</Text>
              </View>
              <View>
                <Text style={styles.cellValueLarge}>98 <Text style={styles.unitText}>%</Text></Text>
                <Text style={styles.cellSubValue}>Optimal</Text>
              </View>
            </View>

            <View style={styles.gridCell}>
              <View style={styles.cellHeader}>
                <MaterialIcons name="scale" size={20} color="#005c2d" />
                <Text style={styles.cellLabel}>WEIGHT</Text>
              </View>
              <View>
                <Text style={styles.cellValueLarge}>74.2 <Text style={styles.unitText}>kg</Text></Text>
                <Text style={[styles.cellSubValue, { color: '#abadae' }]}>-0.5 kg this week</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainerLight}>
          <View style={[styles.sectionHeader, { justifyContent: 'flex-start', gap: 8 }]}>
            <MaterialIcons name="medication" size={24} color="#2c2f30" />
            <Text style={styles.sectionTitle}>Current Medications</Text>
          </View>
          
          <View style={styles.medsList}>
            <View style={styles.medCard}>
              <View style={styles.medCardLeft}>
                <View style={styles.medIconBox}>
                  <MaterialIcons name="local-pharmacy" size={20} color="#006a35" />
                </View>
                <View>
                  <Text style={styles.medTitle}>Lisinopril 10mg</Text>
                  <Text style={styles.medDesc}>Once daily, Morning</Text>
                </View>
              </View>
              <MaterialIcons name="info-outline" size={20} color="#abadae" />
            </View>

            <View style={styles.medCard}>
              <View style={styles.medCardLeft}>
                <View style={styles.medIconBox}>
                  <MaterialIcons name="local-pharmacy" size={20} color="#006a35" />
                </View>
                <View>
                  <Text style={styles.medTitle}>Metformin 500mg</Text>
                  <Text style={styles.medDesc}>Twice daily, With meals</Text>
                </View>
              </View>
              <MaterialIcons name="info-outline" size={20} color="#abadae" />
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Recent Records</Text>
          
          <View style={styles.recordsList}>
            <TouchableOpacity style={styles.recordItem} activeOpacity={0.7}>
               <View style={styles.recordIconBox}>
                 <MaterialIcons name="description" size={24} color="#006576" />
               </View>
               <View style={styles.recordInfo}>
                 <Text style={styles.recordTitle}>Annual Blood Panel</Text>
                 <Text style={styles.recordMeta}>Uploaded on Sep 12, 2023 • 2.4 MB</Text>
               </View>
               <MaterialIcons name="chevron-right" size={24} color="#abadae" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.recordItem} activeOpacity={0.7}>
               <View style={[styles.recordIconBox, { backgroundColor: 'rgba(0,106,53,0.1)' }]}>
                 <MaterialIcons name="medical-services" size={24} color="#006a35" />
               </View>
               <View style={styles.recordInfo}>
                 <Text style={styles.recordTitle}>Chest X-Ray</Text>
                 <Text style={styles.recordMeta}>Uploaded on Aug 28, 2023 • 15.8 MB</Text>
               </View>
               <MaterialIcons name="chevron-right" size={24} color="#abadae" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.recordItem} activeOpacity={0.7}>
               <View style={[styles.recordIconBox, { backgroundColor: 'rgba(107,254,156,0.3)' }]}>
                 <MaterialIcons name="vaccines" size={24} color="#005f2f" />
               </View>
               <View style={styles.recordInfo}>
                 <Text style={styles.recordTitle}>Immunization Record</Text>
                 <Text style={styles.recordMeta}>Uploaded on Aug 15, 2023 • 1.1 MB</Text>
               </View>
               <MaterialIcons name="chevron-right" size={24} color="#abadae" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.uploadBtn} activeOpacity={0.7}>
            <MaterialIcons name="add-circle" size={20} color="#595c5d" />
            <Text style={styles.uploadBtnText}>Upload New Record</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
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
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 18,
    fontWeight: '700',
    color: '#047857',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#6bfe9c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 32,
    fontWeight: '800',
    color: '#005f2f',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#006a35',
    borderWidth: 4,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  profileName: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 20,
    fontWeight: '700',
    color: '#2c2f30',
  },
  roleBadge: {
    backgroundColor: '#72fbbd',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#005e3e',
  },
  smartId: {
    fontSize: 14,
    fontWeight: '500',
    color: '#595c5d',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 12,
    color: 'rgba(89,92,93,0.7)',
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionContainerLight: {
    backgroundColor: '#eef1f2',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 18,
    fontWeight: '700',
    color: '#2c2f30',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#006a35',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridCell: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(0,106,53,0.05)',
  },
  cellHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cellLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#595c5d',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cellValueLarge: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 24,
    fontWeight: '800',
    color: '#2c2f30',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#595c5d',
  },
  cellSubValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006a35',
    marginTop: 2,
  },
  medsList: {
    gap: 12,
  },
  medCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
  },
  medCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  medIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#2c2f30',
    fontSize: 14,
  },
  medDesc: {
    fontSize: 12,
    color: '#595c5d',
    marginTop: 2,
  },
  recordsList: {
    gap: 16,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  recordIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(0,101,118,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
    color: '#2c2f30',
    marginBottom: 2,
  },
  recordMeta: {
    fontSize: 12,
    color: '#595c5d',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 20,
    marginTop: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(171,173,174,0.3)',
    borderStyle: 'dashed',
    gap: 8,
  },
  uploadBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#595c5d',
  },
});
