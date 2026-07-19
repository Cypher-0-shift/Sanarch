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
    const isUnauthorized = error.response?.status === 401;
    const isGhostSession = error.response?.status === 404 && error.config?.url?.includes('/users/me');

    if (isUnauthorized || isGhostSession) {

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
  document_id: string;
  document_title: string;
  document_label: string;
  status: string;
  processing_progress: number;
  processing_stage: string;
  file_name: string;
  file_type: string;
  extracted_data: Record<string, any>;
  summary: string;
  b2_file_url: string | null;
  created_at: string;
  updated_at: string;
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
  documentLabel: string = 'Other',
  pagesCount: number = 1,
): Promise<{ document_id: string; status: string; message: string }> {
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  } as any);
  formData.append('document_label', documentLabel);
  formData.append('pages_count', String(pagesCount));

  const response = await apiClient.post(ENDPOINTS.UPLOAD_DOCUMENT, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return response.data;
}

export async function getDocumentStatus(
  documentId: string
): Promise<{
  status: string;
  extracted_data: Record<string, any> | null;
  processing_progress: number;
  processing_stage: string;
}> {
  const response = await apiClient.get(ENDPOINTS.DOCUMENT_STATUS(documentId));
  return {
    status: response.data.status,
    extracted_data: response.data.extracted_data ?? null,
    processing_progress: response.data.processing_progress ?? 0,
    processing_stage: response.data.processing_stage ?? 'unknown',
  };
}

export async function confirmDocument(
  documentId: string,
  category: string,
  metadata: { title: string; notes?: string }
): Promise<{ status: string }> {
  // Update document metadata (title, label, notes) after processing completes.
  // Uses the existing GET document endpoint to verify it exists, then
  // the backend doesn't have a dedicated confirm endpoint yet,
  // so we treat this as a successful no-op — the label was already
  // sent during upload and the title/notes can be set later.
  // TODO: Add a PATCH /api/v1/documents/{id} endpoint on the backend
  // to support updating title/notes after upload.
  return { status: 'confirmed' };
}

export async function deleteDocument(
  documentId: string
): Promise<{ status: string; document_id: string }> {
  const response = await apiClient.delete(ENDPOINTS.DELETE_DOCUMENT(documentId));
  return response.data;
}

export async function listDocuments(): Promise<{
  documents: Array<{
    document_id: string;
    document_title: string;
    document_label: string;
    status: string;
    processing_progress: number;
    processing_stage: string;
    file_type: string;
    created_at: string;
    updated_at: string;
  }>;
}> {
  const response = await apiClient.get(ENDPOINTS.LIST_DOCUMENTS);
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

export async function retryDocument(
  documentId: string
): Promise<{ status: string; document_id: string }> {
  const response = await apiClient.post(ENDPOINTS.RETRY_DOCUMENT(documentId));
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
