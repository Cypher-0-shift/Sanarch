/**
 * SECURITY NOTE: All sensitive data uses expo-secure-store (Keychain/Keystore).
 * Never use AsyncStorage for tokens or health data.
 * expo-secure-store encrypts on iOS (Keychain) and Android (Keystore).
 */
import * as SecureStore from 'expo-secure-store';
import { logger } from '../utils/logger';

const TOKEN_KEY = 'sanarch_auth_token';
const USER_KEY = 'sanarch_user_data';

export async function saveToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    logger.error('[Storage] Failed to save token:', error);
  }
}

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    logger.error('[Storage] Failed to get token:', error);
    return null;
  }
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    logger.error('[Storage] Failed to clear token:', error);
  }
}

export async function saveUserData(user: object): Promise<void> {
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } catch (error) {
    logger.error('[Storage] Failed to save user data:', error);
  }
}

export async function getUserData(): Promise<object | null> {
  try {
    const data = await SecureStore.getItemAsync(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('[Storage] Failed to get user data:', error);
    return null;
  }
}

export async function clearUserData(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (error) {
    logger.error('[Storage] Failed to clear user data:', error);
  }
}

const RECENT_SEARCHES_KEY = 'sanarch_recent_searches';

export async function getRecentSearches(): Promise<string[]> {
  try {
    const data = await SecureStore.getItemAsync(RECENT_SEARCHES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    logger.error('[Storage] Failed to get recent searches:', error);
    return [];
  }
}

export async function saveRecentSearch(query: string): Promise<void> {
  if (!query.trim() || query.length < 2) return;
  try {
    const searches = await getRecentSearches();
    const newSearches = [query.trim(), ...searches.filter(q => q.toLowerCase() !== query.trim().toLowerCase())].slice(0, 10);
    await SecureStore.setItemAsync(RECENT_SEARCHES_KEY, JSON.stringify(newSearches));
  } catch (error) {
    logger.error('[Storage] Failed to save recent search:', error);
  }
}

export async function clearRecentSearches(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(RECENT_SEARCHES_KEY);
  } catch (error) {
    logger.error('[Storage] Failed to clear recent searches:', error);
  }
}
