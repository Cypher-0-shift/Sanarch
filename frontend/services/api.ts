import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { BASE_URL, ENDPOINTS } from '../constants/api';
import { getToken, clearToken } from './storage';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { logger } from '../utils/logger';

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token and check network
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Check network connectivity
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      return Promise.reject(new Error('No internet connection. Please check your network.'));
    }

    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle 401, 429, and other errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      await clearToken();
      
      // Dynamically import stores to avoid circular dependencies
      const { useAuthStore } = await import('../store/authStore');
      const { useProfileStore } = await import('../store/profileStore');
      
      useAuthStore.getState().logout();
      useProfileStore.getState().clearProfile();
      
      // Navigate to login (safe to call from anywhere)
      router.replace('/auth/login');
    }
    
    if (error.response?.status === 429) {
      // Rate limiting - show alert but don't navigate
      Alert.alert(
        'Too Many Requests',
        'You are making requests too quickly. Please wait a moment and try again.'
      );
    }
    
    const USER_FACING_ERRORS: Record<number, string> = {
      400: 'Invalid request. Please check your input.',
      401: 'Session expired. Please log in again.',
      403: 'You do not have permission to do this.',
      404: 'The requested item was not found.',
      429: 'Too many requests. Please wait a moment.',
      500: 'Something went wrong on our end. Please try again.',
      503: 'Service temporarily unavailable. Please try again.',
    };
    
    const userMessage = USER_FACING_ERRORS[error.response?.status] 
      ?? 'An unexpected error occurred.';
    
    if (__DEV__ && error.response?.data?.detail) {
      logger.error('Server error:', error.response.data.detail);
    }
    
    error.message = userMessage;

    return Promise.reject(error);
  },
);

export default apiClient;

// ---------------------------------------------------------------------------
// Typed helper wrappers
// ---------------------------------------------------------------------------

const pendingRequests = new Map<string, Promise<any>>();

export async function get<T>(url: string): Promise<T> {
  if (pendingRequests.has(url)) {
    return pendingRequests.get(url) as Promise<T>;
  }
  
  const promise = (async () => {
    try {
      const response = await apiClient.get<T>(url);
      return response.data;
    } catch (error) {
      logger.error(`[API] GET ${url} failed:`, error);
      throw error;
    } finally {
      pendingRequests.delete(url);
    }
  })();
  
  pendingRequests.set(url, promise);
  return promise;
}

export async function post<T>(url: string, data?: unknown): Promise<T> {
  try {
    const response = await apiClient.post<T>(url, data);
    return response.data;
  } catch (error) {
    logger.error(`[API] POST ${url} failed:`, error);
    throw error;
  }
}

export async function postForm<T>(url: string, formData: FormData): Promise<T> {
  try {
    const response = await apiClient.post<T>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    logger.error(`[API] POST-FORM ${url} failed:`, error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// User and Patient Creation APIs
// ---------------------------------------------------------------------------

export async function createUser(data: {
  firebase_token: string;
  full_name: string;
  date_of_birth?: string;
  height_cm?: string;
  weight_kg?: string;
  email?: string;
}): Promise<{
  id: string;
  sanarch_id: string;
  phone_number: string;
  full_name: string;
  email: string | null;
  date_of_birth: string | null;
  height_cm: string | null;
  weight_kg: string | null;
}> {
  const response = await apiClient.post(ENDPOINTS.CREATE_USER, data);
  return response.data;
}

export async function createPatient(data: {
  name: string;
  relation: string;
  date_of_birth?: string;
  height_cm?: string;
  weight_kg?: string;
}): Promise<{
  id: string;
  sanarch_id: string;
  name: string;
  relation: string;
}> {
  const response = await apiClient.post(ENDPOINTS.CREATE_PATIENT, data);
  return response.data;
}

let cachedUser: any = null;
let cacheTimestamp = 0;
const USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getMe(): Promise<{
  id: string;
  sanarch_id: string;
  phone_number: string;
  full_name: string;
  email: string | null;
  date_of_birth: string | null;
  height_cm: string | null;
  weight_kg: string | null;
}> {
  const now = Date.now();
  if (cachedUser && (now - cacheTimestamp) < USER_CACHE_TTL) {
    return cachedUser;
  }
  const data = await get<any>(ENDPOINTS.GET_ME);
  cachedUser = data;
  cacheTimestamp = now;
  return data;
}

export function clearUserCache() {
  cachedUser = null;
  cacheTimestamp = 0;
}

// ---------------------------------------------------------------------------
// Timeline and Search APIs
// ---------------------------------------------------------------------------

export interface TimelineEvent {
  id: string;
  condition: string;
  date_start: string;
  date_end: string | null;
  hospital: string | null;
  doctor: string | null;
  document_count: number;
  label: 'lab_report' | 'prescription' | 'hospital_summary' | 'scan';
  documents: Array<{ id: string; type: string; label: string }>;
}

export async function getTimeline(
  patientId: string,
  limit = 20,
  offset = 0
): Promise<{ events: TimelineEvent[]; total: number }> {
  const response = await apiClient.get(`${ENDPOINTS.GET_TIMELINE(patientId)}?limit=${limit}&offset=${offset}`);
  return response.data;
}

export async function searchRecords(query: string): Promise<{
  results: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    date: string;
  }>;
}> {
  const response = await apiClient.get(`${ENDPOINTS.SEARCH}?q=${encodeURIComponent(query)}`);
  return response.data;
}

export async function getDocument(documentId: string): Promise<{
  id: string;
  original_filename: string;
  status: string;
  label: string | null;
  mime_type: string;
  uploaded_at: string;
  extracted_fields?: Record<string, string>;
  download_url?: string;
}> {
  const response = await apiClient.get(ENDPOINTS.GET_DOCUMENT(documentId));
  return response.data;
}

// ---------------------------------------------------------------------------
// Document Upload APIs
// ---------------------------------------------------------------------------

export async function uploadDocument(
  fileUri: string,
  fileName: string,
  mimeType: string,
  patientId?: string
): Promise<{ document_id: string; status: string }> {
  // React Native FormData — do NOT use fetch blob approach
  // RN's FormData handles file URIs natively
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  } as any);

  if (patientId) {
    formData.append('patient_id', patientId);
  }

  const response = await apiClient.post(ENDPOINTS.UPLOAD_DOCUMENT, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000, // 60s timeout for large files
  });
  return response.data;
}

export async function getDocumentStatus(documentId: string): Promise<{
  document_id: string;
  status: 'uploading' | 'processing' | 'complete' | 'failed';
  extracted_data?: any;
}> {
  const response = await apiClient.get(ENDPOINTS.GET_DOCUMENT_STATUS(documentId), {
    timeout: 10000,
  });
  return response.data;
}

export async function confirmDocument(
  documentId: string,
  label: string,
  extractedData?: any
): Promise<{ status: string; document_id: string }> {
  const response = await apiClient.post(ENDPOINTS.CONFIRM_DOCUMENT(documentId), {
    extracted_data: extractedData ?? {},
    label,
  });
  return response.data;
}

export async function summarizeDocument(documentId: string): Promise<{
  document_id: string;
  headline: string;
  summary: string;
  key_points: string[];
  flag: 'normal' | 'attention' | 'urgent';
  flag_reason: string | null;
  cached: boolean;
}> {
  const response = await apiClient.post(ENDPOINTS.SUMMARIZE_DOCUMENT(documentId));
  return response.data;
}

// ---------------------------------------------------------------------------
// Profile and Settings APIs
// ---------------------------------------------------------------------------

export async function updateMe(data: {
  full_name?: string;
  email?: string;
  date_of_birth?: string;
  height_cm?: string;
  weight_kg?: string;
}): Promise<any> {
  const response = await apiClient.put(ENDPOINTS.UPDATE_ME, data);
  return response.data;
}

export async function deleteMe(): Promise<void> {
  await apiClient.delete(ENDPOINTS.DELETE_ME);
}

export async function getPatients(): Promise<Array<{
  id: string;
  sanarch_id: string;
  name: string;
  relation: string;
  date_of_birth: string | null;
  height_cm: string | null;
  weight_kg: string | null;
  is_active: boolean;
}>> {
  const response = await apiClient.get(ENDPOINTS.GET_PATIENTS);
  return response.data;
}

// ---------------------------------------------------------------------------
// Sharing APIs
// ---------------------------------------------------------------------------

export async function generateShareToken(data: {
  patient_id: string;
  expires_in_hours: number;
}): Promise<{ token: string; expires_at: string }> {
  const response = await apiClient.post(ENDPOINTS.GENERATE_SHARE_TOKEN, data);
  return response.data;
}
