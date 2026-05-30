import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import apiClient from './api';
import { saveToken, clearToken, saveUserData, clearUserData, getToken } from './storage';
import { ENDPOINTS } from '../constants/api';
import { logger } from '../utils/logger';

let confirmResult: FirebaseAuthTypes.ConfirmationResult | null = null;

export async function sendOTP(phoneNumber: string): Promise<void> {
  // phoneNumber must be E.164 format: +919876543210
  try {
    confirmResult = await auth().signInWithPhoneNumber(phoneNumber);
  } catch (error: any) {
    logger.error('[Auth] sendOTP failed:', error);
    // Map Firebase error codes to user-friendly messages
    if (error.code === 'auth/invalid-phone-number') {
      throw new Error('Invalid phone number format.');
    }
    if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many attempts. Please try again later.');
    }
    throw new Error('Failed to send OTP. Check your number and try again.');
  }
}

export async function verifyOTP(otp: string): Promise<{ firebase_token: string; is_new_user: boolean }> {
  if (!confirmResult) {
    throw new Error('No OTP session. Please request a new code.');
  }

  try {
    const credential = await confirmResult.confirm(otp);
    if (!credential?.user) throw new Error('Verification failed.');

    // Get Firebase ID token
    const firebaseToken = await credential.user.getIdToken();

    // Save token to SecureStore immediately
    await saveToken(firebaseToken);

    // Verify with backend — determines is_new_user
    const response = await apiClient.post(ENDPOINTS.VERIFY_FIREBASE, {
      firebase_token: firebaseToken,
    });

    return {
      firebase_token: firebaseToken,
      is_new_user: response.data.is_new_user,
    };
  } catch (error: any) {
    logger.error('[Auth] verifyOTP failed:', error);
    if (error.code === 'auth/invalid-verification-code') {
      throw new Error('Incorrect OTP. Please try again.');
    }
    if (error.code === 'auth/code-expired') {
      throw new Error('OTP has expired. Please request a new code.');
    }
    throw error;
  }
}

export async function getFirebaseToken(): Promise<string> {
  // Always get a fresh token from Firebase (auto-refreshes if needed)
  const currentUser = auth().currentUser;
  if (!currentUser) {
    // Fall back to stored token for dev mode
    const stored = await getToken();
    if (stored) return stored;
    throw new Error('Not authenticated');
  }

  const token = await currentUser.getIdToken(false); // false = use cached if valid
  await saveToken(token); // keep SecureStore in sync
  return token;
}

export async function setupTokenRefresh(): Promise<void> {
  // Firebase automatically handles token refresh.
  // This listener saves the fresh token to SecureStore whenever it changes.
  auth().onIdTokenChanged(async (user) => {
    if (user) {
      const token = await user.getIdToken();
      await saveToken(token);
      // Update axios default header
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      await clearToken();
      delete apiClient.defaults.headers.common['Authorization'];
    }
  });
}

export async function logout(): Promise<void> {
  try {
    await auth().signOut();
    await clearToken();
    await clearUserData();
    confirmResult = null;
  } catch (error) {
    logger.error('[Auth] logout failed:', error);
    throw error;
  }
}

export async function devModeLogin(): Promise<void> {
  // Dev mode bypass — stores a fake token and skips Firebase
  await saveToken('dev-mode-token');
}
