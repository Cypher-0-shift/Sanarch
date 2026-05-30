export type LoadState = 'idle' | 'loading' | 'success' | 'error';

export interface UserPlaceholder {
  id: string | null;
  sanarch_id: string | null;
  full_name: string | null;
  phone_number: string | null;
  email: string | null;
  date_of_birth?: string | null;
  height_cm?: string | null;
  weight_kg?: string | null;
  is_active?: boolean;
}

export interface MedicalEventPlaceholder {
  id: string;
  condition: string;
  date_start: string;
  date_end: string | null;
  hospital: string;
  doctor: string;
  document_count: number;
  label: 'lab_report' | 'prescription' | 'hospital_summary' | 'scan';
  documents: Array<{ id: string; type: string; label: string }>;
}

export const EMPTY_USER: UserPlaceholder = {
  id: null,
  sanarch_id: null,
  full_name: null,
  phone_number: null,
  email: null,
};

// These are the placeholder texts shown before data loads.
// They are clearly marked as "—" or descriptive loading text,
// never fake real-looking data.
export const PLACEHOLDER_TEXTS = {
  userName: 'Loading...',
  sanarchId: '— — —',
  phone: 'Not set',
  email: 'Not set',
  address: 'Not set',
  noRecords: 'No records yet',
  noDocuments: 'No documents',
} as const;
