import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'sanarch_auth_token';
const USER_KEY = 'sanarch_user_data';

export async function saveToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error('[Storage] Failed to save token:', error);
  }
}

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('[Storage] Failed to get token:', error);
    return null;
  }
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('[Storage] Failed to clear token:', error);
  }
}

export async function saveUserData(user: object): Promise<void> {
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('[Storage] Failed to save user data:', error);
  }
}

export async function getUserData(): Promise<object | null> {
  try {
    const data = await SecureStore.getItemAsync(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('[Storage] Failed to get user data:', error);
    return null;
  }
}

export async function clearUserData(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (error) {
    console.error('[Storage] Failed to clear user data:', error);
  }
}
