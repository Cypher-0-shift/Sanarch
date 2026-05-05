export const BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export const ENDPOINTS = {
  SEND_OTP: '/auth/send-otp',
  VERIFY_OTP: '/auth/verify-otp',
  CREATE_USER: '/users/create',
  ME: '/users/me',
  UPLOAD_DOCUMENT: '/documents/upload',
  DOCUMENT_STATUS: (id: string) => `/documents/${id}/status`,
  CONFIRM_DOCUMENT: (id: string) => `/documents/${id}/confirm`,
  RECORDS: '/records',
  TIMELINE: (patientId: string) => `/timeline/${patientId}`,
  GENERATE_SHARE_TOKEN: '/sharing/generate-token',
} as const;
