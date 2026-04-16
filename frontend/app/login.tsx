import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isFormValid = email.trim().length > 0 && password.trim().length > 0;

  const handleLogin = () => {
    if (isFormValid) {
      router.replace('/setup-profile');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      {/* Background Decorations */}
      <View style={[styles.bgBlob, styles.bgBlobTop]} />
      <View style={[styles.bgBlob, styles.bgBlobBottom]} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* Brand Identity */}
          <View style={styles.brandSection}>
            <View style={styles.logoRow}>
              <Image 
                source={require('../assets/images/applogo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.brandName}>Sanarch</Text>
            </View>
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.welcomeSubtitle}>Sign in to continue your health journey</Text>
          </View>

          {/* Form Canvas */}
          <View style={styles.formCanvas}>
            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput 
                style={styles.textInput}
                placeholder="name@example.com"
                placeholderTextColor="#abadae"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password */}
            <View style={[styles.inputContainer, { marginTop: 24 }]}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.inputLabel}>Password</Text>
                <TouchableOpacity>
                  <Text style={styles.forgotPassword}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <TextInput 
                style={styles.textInput}
                placeholder="••••••••"
                placeholderTextColor="#abadae"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Login Button */}
            <TouchableOpacity 
              style={[styles.loginButtonContainer, !isFormValid && { opacity: 0.5 }]} 
              onPress={handleLogin} 
              activeOpacity={0.8}
              disabled={!isFormValid}
            >
              <LinearGradient
                colors={['#006a35', '#006946']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButton}
              >
                <Text style={styles.loginButtonText}>Sign In</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#cdffd4" />
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerTextContainer}>
                <Text style={styles.dividerText}>OR SIGN IN WITH</Text>
              </View>
            </View>

            {/* Social Logins */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialButton}>
                <Image 
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHT3egGcsod6ARCnO-i42RD8RpEdFK5r-tb9YgN3-PhWF-NnWH7K-ct0nEj2W3fFnznMmp65sC9GA7Y8_Pt_fb-Qqt269wbQzMivLxdN9ixBAQeFgTYhlcm0LnuH11TVA2ee4_7PCsUCWaSqN0d5Mpys9LvjSlpGdPjPtdrzTaC_4FIi8SmRRTA9iwA0OA6XK0ImuM0zTkjZeLF0Es3yjgQf5wn7tCb4x5vHEUvEauwl-BuFdH5VPWx6Z862nvMgiG0p0mGPQ_' }}
                  style={styles.googleIcon}
                />
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <FontAwesome5 name="apple" size={20} color="#2c2f30" style={{ marginRight: 8 }} />
                <Text style={styles.socialText}>Apple</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Up CTA */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>
              Don't have an account? <Text style={styles.signupLink} onPress={() => router.push('/setup-profile')}>Sign Up</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7f8',
  },
  bgBlob: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.3,
  },
  bgBlobTop: {
    top: '-10%',
    left: '-10%',
    width: 300,
    height: 300,
    backgroundColor: '#6bfe9c',
  },
  bgBlobBottom: {
    bottom: '-5%',
    right: '-5%',
    width: 250,
    height: 250,
    backgroundColor: '#72fbbd',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: 52,
    height: 52,
    marginRight: 8,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#006a35',
    letterSpacing: -1,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2c2f30',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#595c5d',
  },
  formCanvas: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 32,
    shadowColor: '#006a35',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.04,
    shadowRadius: 50,
    elevation: 5,
  },
  inputContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c2f30',
    marginBottom: 8,
    marginLeft: 4,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  forgotPassword: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006a35',
  },
  textInput: {
    width: '100%',
    height: 56,
    backgroundColor: '#eef1f2',
    borderRadius: 12,
    paddingHorizontal: 20,
    color: '#2c2f30',
    fontSize: 16,
  },
  loginButtonContainer: {
    width: '100%',
    marginTop: 32,
    borderRadius: 9999,
    shadowColor: '#006a35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  loginButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#cdffd4',
    marginRight: 8,
  },
  dividerContainer: {
    marginTop: 32,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(171, 173, 174, 0.2)',
  },
  dividerTextContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#abadae',
    letterSpacing: 2,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialButton: {
    flexDirection: 'row',
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(171, 173, 174, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  socialText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c2f30',
  },
  signupContainer: {
    flexDirection: 'row',
    marginTop: 40,
    alignItems: 'center',
  },
  signupText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#595c5d',
  },
  signupLink: {
    fontSize: 16,
    fontWeight: '700',
    color: '#006a35',
  },
});
