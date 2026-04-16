import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function FamilyMembersScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      {/* TopAppBar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#047857" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Family Members</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Primary User Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>YOU (PRIMARY)</Text>
          <View style={styles.pulseDot} />
        </View>

        <View style={styles.memberCard}>
          <View style={styles.memberCardHeader}>
            <View style={styles.avatarMain}>
              <Text style={styles.avatarTextMain}>SH</Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>Sarah Henderson</Text>
              <Text style={styles.memberSmartId}>SMART-ID SM123456789</Text>
              
              <View style={styles.statsRow}>
                <View style={styles.statBlock}>
                  <Text style={styles.statLabel}>MEDICAL RECORDS</Text>
                  <Text style={styles.statValue}>23 Records</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statBlock}>
                  <Text style={styles.statLabel}>MEDICATIONS</Text>
                  <Text style={styles.statValue}>3 Active</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <TouchableOpacity 
              style={styles.viewProfileBtn}
              onPress={() => router.push('/family-member-status' as any)}
            >
              <Text style={styles.viewProfileText}>View Profile</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#006a35" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Family Members Section */}
        <View style={[styles.sectionHeaderRow, { marginTop: 40 }]}>
          <Text style={styles.sectionLabel}>FAMILY MEMBERS</Text>
        </View>

        {/* Mother Card */}
        <View style={styles.memberCard}>
          <View style={styles.memberCardHeader}>
            <View style={styles.avatarSub}>
              <Text style={styles.avatarTextSub}>MH</Text>
            </View>
            <View style={styles.memberInfo}>
              <View style={styles.nameRow}>
                <View>
                  <Text style={styles.memberName}>Mother</Text>
                  <Text style={styles.subIdText}>SMART-ID SM987654321</Text>
                </View>
                <MaterialIcons name="more-vert" size={20} color="#abadae" />
              </View>

              <View style={styles.subStatsRow}>
                <View style={styles.subStatItem}>
                  <MaterialIcons name="description" size={14} color="#595c5d" />
                  <Text style={styles.subStatText}>15 Records</Text>
                </View>
                <View style={styles.subStatItem}>
                  <MaterialIcons name="medical-services" size={14} color="#595c5d" />
                  <Text style={styles.subStatText}>5 Active Meds</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.cardFooterSub}>
            <TouchableOpacity 
              style={styles.viewProfileBtnSub}
              onPress={() => router.push('/family-member-status' as any)}
            >
              <Text style={styles.viewProfileTextSub}>View Profile</Text>
              <MaterialIcons name="arrow-forward" size={14} color="#006a35" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Father Card */}
        <View style={styles.memberCard}>
          <View style={styles.memberCardHeader}>
            <View style={styles.avatarSub}>
              <Text style={styles.avatarTextSub}>FH</Text>
            </View>
            <View style={styles.memberInfo}>
              <View style={styles.nameRow}>
                <View>
                  <Text style={styles.memberName}>Father</Text>
                  <Text style={styles.subIdText}>SMART-ID SM112233445</Text>
                </View>
                <MaterialIcons name="more-vert" size={20} color="#abadae" />
              </View>

              <View style={styles.subStatsRow}>
                <View style={styles.subStatItem}>
                  <MaterialIcons name="description" size={14} color="#595c5d" />
                  <Text style={styles.subStatText}>8 Records</Text>
                </View>
                <View style={styles.subStatItem}>
                  <MaterialIcons name="medical-services" size={14} color="#595c5d" />
                  <Text style={styles.subStatText}>2 Active Meds</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.cardFooterSub}>
            <TouchableOpacity 
              style={styles.viewProfileBtnSub}
              onPress={() => router.push('/family-member-status' as any)}
            >
              <Text style={styles.viewProfileTextSub}>View Profile</Text>
              <MaterialIcons name="arrow-forward" size={14} color="#006a35" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Add Member Card */}
        <TouchableOpacity style={styles.addMemberCard} activeOpacity={0.7}>
          <View style={styles.addIconWrapper}>
            <MaterialIcons name="add" size={24} color="#595c5d" />
          </View>
          <View style={styles.addMemberTextWrapper}>
            <Text style={styles.addMemberTitle}>Add Family Member</Text>
            <Text style={styles.addMemberSub}>Link existing SMART-ID or create new profile</Text>
          </View>
        </TouchableOpacity>

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
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  backBtn: {
    position: 'absolute',
    left: 24,
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
    paddingBottom: 40,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  sectionLabel: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '700',
    color: '#595c5d',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#006a35',
  },
  memberCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(171,173,174,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 30,
    elevation: 3,
  },
  memberCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  avatarMain: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#006a35',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#006a35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  avatarTextMain: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 18,
    fontWeight: '700',
    color: '#cdffd4',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 20,
    fontWeight: '700',
    color: '#2c2f30',
  },
  memberSmartId: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#006a35',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  statBlock: {
    flexDirection: 'column',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#595c5d',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c2f30',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#e5e9ea',
  },
  cardFooter: {
    marginTop: 24,
    alignItems: 'flex-end',
  },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef1f2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  viewProfileText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006a35',
  },
  avatarSub: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#dfe3e4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextSub: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 18,
    fontWeight: '700',
    color: '#006a35',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subIdText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(89,92,93,0.8)',
  },
  subStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
  },
  subStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subStatText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#595c5d',
  },
  cardFooterSub: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(229,233,234,0.5)',
    alignItems: 'flex-end',
  },
  viewProfileBtnSub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewProfileTextSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006a35',
  },
  addMemberCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(171,173,174,0.4)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  addIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e9ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMemberTextWrapper: {
    alignItems: 'center',
  },
  addMemberTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 16,
    fontWeight: '700',
    color: '#2c2f30',
  },
  addMemberSub: {
    fontSize: 12,
    color: '#595c5d',
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 200,
  },
});
