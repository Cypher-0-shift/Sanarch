import { post } from './api';
import { saveToken, clearToken, saveUserData, clearUserData } from './storage';
import { ENDPOINTS } from '../constants/api';
import { MOCK_USER } from '../constants/mock';

export async function sendOTP(phoneNumber: string): Promise<void> {
  try {
    await post(ENDPOINTS.SEND_OTP, { phone: phoneNumber });
  } catch (error) {
    console.error('[Auth] sendOTP failed:', error);
    throw error;
  }
}

export async function verifyOTP(
  phoneNumber: string,
  otp: string,
): Promise<{ access_token: string; is_new_user: boolean }> {
  try {
    const data = await post<{ access_token: string; is_new_user: boolean }>(
      ENDPOINTS.VERIFY_OTP,
      { phone: phoneNumber, otp },
    );
    await saveToken(data.access_token);
    return data;
  } catch (error) {
    console.error('[Auth] verifyOTP failed:', error);
    throw error;
  }
}

export async function logout(): Promise<void> {
  try {
    await clearToken();
    await clearUserData();
  } catch (error) {
    console.error('[Auth] logout failed:', error);
    throw error;
  }
}

export async function devModeLogin(): Promise<void> {
  try {
    await saveToken('dev-mode-token');
    await saveUserData(MOCK_USER);
  } catch (error) {
    console.error('[Auth] devModeLogin failed:', error);
    throw error;
  }
}
