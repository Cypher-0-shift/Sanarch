export const BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export const ENDPOINTS = {
  // Auth
  VERIFY_FIREBASE: '/auth/verify-firebase',
  
  // Users
  CREATE_USER: '/users/create',
  GET_ME: '/users/me',
  UPDATE_ME: '/users/me',
  DELETE_ME: '/users/me',
  
  // Patients (dependents)
  GET_PATIENTS: '/patients',
  CREATE_PATIENT: '/patients',
  
  // Timeline
  GET_TIMELINE: (patientId: string) => `/timeline/${patientId}`,
  
  // Documents (v1 API)
  UPLOAD_DOCUMENT: '/api/v1/documents/upload',
  LIST_DOCUMENTS: '/api/v1/documents',
  GET_DOCUMENT: (id: string) => `/api/v1/documents/${id}`,
  DELETE_DOCUMENT: (id: string) => `/api/v1/documents/${id}`,
  PDF_CONVERT: '/api/v1/documents/pdf/convert',
  SUMMARIZE_DOCUMENT: (id: string) => `/api/v1/documents/${id}/summarize`,
  RETRY_DOCUMENT: (id: string) => `/api/v1/documents/${id}/retry`,
  DOCUMENT_STATUS: (id: string) => `/api/v1/documents/${id}`,
  CONFIRM_DOCUMENT: (id: string) => `/api/v1/documents/${id}/confirm`,
  
  // Search
  SEARCH: '/search',
  
  // Sharing
  GENERATE_SHARE_TOKEN: '/sharing/generate',
  ACCESS_SHARE: (token: string) => `/sharing/access/${token}`,

  // Profiles (SANARCH ID)
  GET_PROFILE: (id: string) => `/profiles/${id}`,
  CREATE_PRIMARY_PROFILE: '/profiles/primary',
  CREATE_DEPENDENT_PROFILE: '/profiles/dependent',
  GET_FAMILY_PROFILES: (id: string) => `/profiles/${id}/family`,
  GET_PROFILE_QR: (id: string) => `/profiles/${id}/qr`,

  DOCTOR_VIEW: (token: string) => `/doctor-view/${token}`,
} as const;
