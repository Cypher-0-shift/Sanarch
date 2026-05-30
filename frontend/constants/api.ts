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
  
  // Documents
  UPLOAD_DOCUMENT: '/documents/upload',
  GET_DOCUMENT: (id: string) => `/documents/${id}`,
  GET_DOCUMENT_STATUS: (id: string) => `/documents/${id}/status`,
  CONFIRM_DOCUMENT: (id: string) => `/documents/${id}/confirm`,
  PDF_CONVERT: '/documents/pdf/convert',
  LIST_DOCUMENTS: '/documents/',
  
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
  SUMMARIZE_DOCUMENT: (id: string) => `/documents/${id}/summarize`,
} as const;
