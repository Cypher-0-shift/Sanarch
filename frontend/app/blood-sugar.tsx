import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

export default function BloodSugarScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      {/* TopAppBar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#2c2f30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blood Sugar</Text>
        <TouchableOpacity style={styles.profileBtn}>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOu3kY_Y27bMj3kOl0RZjJe9ewDHQWs-ADN-WIgOd9U7unMHLhFJhDMXSNsQPr361PNGT3ZB4_XnMd7Feku1Q25mNuRmUUrgE4LRUeufqfN2EQWsnsg9YV1PHE6iprrldMTU96MbxMSwa8V9HGe3q13G3En2ryNaQ8Hged6WnhlQU8jSssdSvGY6fmUfxxig9WKHwVFZIUaQIEn6kEU2Ghe0HYZ247CKUX34POjrYxatWa1aVl0-W9EYcruyo_3wKRjIRyMGyP' }}
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Main Reading Card */}
        <View style={styles.mainCard}>
          <View style={styles.badgeNormal}>
            <Text style={styles.badgeTextNormal}>NORMAL</Text>
          </View>
          <View style={styles.readingRow}>
            <Text style={styles.readingValue}>98</Text>
            <Text style={styles.readingUnit}>mg/dL</Text>
          </View>
          <Text style={styles.lastChecked}>Last checked 1 hour ago</Text>
        </View>

        {/* Primary Action */}
        <TouchableOpacity activeOpacity={0.8}>
          <LinearGradient
            colors={['#006a35', '#6bfe9c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addActionBtn}
          >
            <MaterialIcons name="add" size={24} color="#ffffff" style={{ fontWeight: '600' }} />
            <Text style={styles.addActionText}>Add New Reading</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Insight Card */}
        <View style={styles.insightCard}>
           <View style={styles.insightIconWrapper}>
             <MaterialIcons name="auto-awesome" size={20} color="#006576" />
           </View>
           <View style={{ flex: 1 }}>
             <Text style={styles.insightTitle}>Health Insight</Text>
             <Text style={styles.insightText}>
               Your glucose levels have been stable for the last 48 hours. <Text style={styles.insightTextBold}>Excellent work!</Text> Keep maintaining your current diet.
             </Text>
           </View>
        </View>

        {/* Trends Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Trends (Last 7 days)</Text>
          <View style={styles.avgBadge}>
            <Text style={styles.avgBadgeText}>Avg: 102 mg/dL</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <View style={styles.chartArea}>
             {[60, 75, 55, 90, 65, 80, 70].map((height, index) => {
               const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
               return (
                  <View key={index} style={styles.chartCol}>
                    <View style={styles.chartBarWrapper}>
                      <View style={[styles.chartBar, { height: `${height}%`, opacity: index === 3 ? 1 : height / 100 }]} />
                    </View>
                    <Text style={styles.chartLabelText}>{days[index]}</Text>
                  </View>
               );
             })}
          </View>
        </View>

        {/* Recent History */}
        <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Recent History</Text>
        
        <View style={styles.historyList}>
          {/* Item 1 */}
          <TouchableOpacity style={styles.historyItem} activeOpacity={0.7}>
            <View style={styles.historyItemLeft}>
              <View style={styles.historyIconBox}>
                <MaterialIcons name="water-drop" size={24} color="#006a35" />
              </View>
              <View>
                <Text style={styles.historyItemValue}>98 mg/dL</Text>
                <Text style={styles.historyItemTime}>Today, 4:30 PM</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#abadae" />
          </TouchableOpacity>

          {/* Item 2 */}
          <TouchableOpacity style={styles.historyItem} activeOpacity={0.7}>
            <View style={styles.historyItemLeft}>
              <View style={styles.historyIconBox}>
                <MaterialIcons name="water-drop" size={24} color="#006a35" />
              </View>
              <View>
                <Text style={styles.historyItemValue}>102 mg/dL</Text>
                <Text style={styles.historyItemTime}>Yesterday, 9:00 AM</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#abadae" />
          </TouchableOpacity>

          {/* Item 3 */}
          <TouchableOpacity style={styles.historyItem} activeOpacity={0.7}>
            <View style={styles.historyItemLeft}>
              <View style={styles.historyIconBox}>
                <MaterialIcons name="water-drop" size={24} color="#006a35" />
              </View>
              <View>
                <Text style={styles.historyItemValue}>115 mg/dL</Text>
                <Text style={styles.historyItemTime}>Yesterday, 8:15 PM</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#abadae" />
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
    backgroundColor: 'rgba(245,247,248,0.8)',
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
    color: '#006a35',
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(0,106,53,0.2)',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 4,
  },
  badgeNormal: {
    backgroundColor: '#72fbbd',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  badgeTextNormal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#005e3e',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  readingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  readingValue: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 72,
    fontWeight: '800',
    color: '#2c2f30',
    letterSpacing: -2,
  },
  readingUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: '#595c5d',
  },
  lastChecked: {
    fontSize: 14,
    fontWeight: '500',
    color: '#595c5d',
    marginTop: 8,
  },
  addActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 30,
    shadowColor: '#006a35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  addActionText: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 12,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0,220,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,101,118,0.05)',
    borderRadius: 24,
    padding: 24,
    marginTop: 32,
    marginBottom: 32,
  },
  insightIconWrapper: {
    backgroundColor: 'rgba(0,220,255,0.3)',
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  insightTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 16,
    fontWeight: '700',
    color: '#2c2f30',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    color: '#595c5d',
    lineHeight: 22,
  },
  insightTextBold: {
    color: '#006a35',
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 20,
    fontWeight: '800',
    color: '#2c2f30',
    letterSpacing: -0.5,
  },
  avgBadge: {
    backgroundColor: 'rgba(0,106,53,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  avgBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006a35',
  },
  chartContainer: {
    backgroundColor: '#eef1f2',
    borderRadius: 24,
    padding: 24,
    height: 192,
    marginBottom: 32,
  },
  chartArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    gap: 12,
  },
  chartBarWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: 4,
  },
  chartBar: {
    width: '100%',
    backgroundColor: '#006a35',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  chartLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#595c5d',
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  historyIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eef1f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyItemValue: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 16,
    fontWeight: '700',
    color: '#2c2f30',
  },
  historyItemTime: {
    fontSize: 12,
    fontWeight: '500',
    color: '#595c5d',
    marginTop: 2,
  },
});
