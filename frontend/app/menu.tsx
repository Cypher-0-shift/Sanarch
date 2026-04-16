import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

export default function MenuScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Dimmed Overlay simulating background */}
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={() => router.back()} 
      />

      {/* Drawer */}
      <SafeAreaView style={styles.drawer} edges={['top', 'bottom']}>
        
        {/* Drawer Header */}
        <View style={styles.drawerHeader}>
          <Text style={styles.brandTitle}>Sanarch</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuList}>
          {/* Home */}
          <TouchableOpacity 
            style={styles.menuItemActive} 
            onPress={() => router.replace('/dashboard' as any)}
          >
            <MaterialIcons name="home" size={24} color="#065f46" />
            <Text style={styles.menuTextActive}>Home</Text>
          </TouchableOpacity>

          {/* Add Family Members */}
          <TouchableOpacity style={styles.menuItem} onPress={() => {
            router.back();
            setTimeout(() => router.push('/family-members' as any), 100);
          }}>
            <MaterialIcons name="group-add" size={24} color="#475569" />
            <Text style={styles.menuText}>Add Family Members</Text>
          </TouchableOpacity>

          {/* My Medication */}
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {
              router.back();
              setTimeout(() => router.push('/medications' as any), 100);
            }}
          >
            <MaterialIcons name="local-pharmacy" size={24} color="#475569" />
            <Text style={styles.menuText}>My Medication</Text>
          </TouchableOpacity>

          {/* Settings */}
          <TouchableOpacity style={styles.menuItem} onPress={() => router.back()}>
            <MaterialIcons name="settings" size={24} color="#475569" />
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Drawer Footer */}
        <View style={styles.drawerFooter}>
          <TouchableOpacity 
            style={styles.signOutButton}
            onPress={() => router.replace('/login')}
          >
            <MaterialIcons name="logout" size={20} color="#475569" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },
  drawer: {
    width: width * 0.8,
    maxWidth: 320,
    height: '100%',
    backgroundColor: '#f8fafc', // slate-50
    borderTopRightRadius: 40,
    borderBottomRightRadius: 40,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
    justifyContent: 'space-between',
  },
  drawerHeader: {
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandTitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 24,
    fontWeight: '700',
    color: '#064e3b', // emerald-900
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  menuList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 4,
  },
  menuText: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 16,
  },
  menuItemActive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 4,
    backgroundColor: '#d1fae5', // emerald-100
  },
  menuTextActive: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 14,
    fontWeight: '600',
    color: '#065f46', // emerald-800
    marginLeft: 16,
  },
  drawerFooter: {
    padding: 24,
    backgroundColor: 'rgba(241, 245, 249, 0.5)', // slate-100/50
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0', // slate-200
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  signOutText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginLeft: 12,
  },
});
