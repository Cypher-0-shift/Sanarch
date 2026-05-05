import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { BASE_URL } from '../constants/api';
import { getToken, clearToken } from './storage';

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle 401
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearToken();
      // Do not auto-navigate — screens handle auth redirects
    }
    return Promise.reject(error);
  },
);

export default apiClient;

// ---------------------------------------------------------------------------
// Typed helper wrappers
// ---------------------------------------------------------------------------

export async function get<T>(url: string): Promise<T> {
  try {
    const response = await apiClient.get<T>(url);
    return response.data;
  } catch (error) {
    console.error(`[API] GET ${url} failed:`, error);
    throw error;
  }
}

export async function post<T>(url: string, data?: unknown): Promise<T> {
  try {
    const response = await apiClient.post<T>(url, data);
    return response.data;
  } catch (error) {
    console.error(`[API] POST ${url} failed:`, error);
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
    console.error(`[API] POST-FORM ${url} failed:`, error);
    throw error;
  }
}
