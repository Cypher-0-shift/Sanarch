export type MedicalEventLabel = 'lab_report' | 'prescription' | 'hospital_summary' | 'scan';

export interface DocumentItem {
  id: string;
  type: string;
  label: string;
}

export interface MedicalEvent {
  id: string;
  condition: string;
  date_start: string;
  date_end: string | null;
  hospital: string;
  doctor: string;
  document_count: number;
  label: MedicalEventLabel;
  documents: DocumentItem[];
}

export const MOCK_USER = {
  id: 'usr_001',
  sanarch_id: 'SAN-847291',
  full_name: 'Alex Johnson',
  phone: '+91 98765 43210',
  email: 'alex.j@sanarch.io',
  address: '124 Green Valley, Tech Park, Bangalore',
} as const;

export type MockUser = typeof MOCK_USER;

export const MOCK_MEDICAL_EVENTS: MedicalEvent[] = [
  {
    id: 'evt_001',
    condition: 'Blood Test - CBC',
    date_start: '2026-01-15',
    date_end: null,
    hospital: 'City General Hospital',
    doctor: 'Dr. Rajesh Kapoor',
    document_count: 1,
    label: 'lab_report',
    documents: [
      { id: 'doc_001', type: 'pdf', label: 'CBC Full Report' },
    ],
  },
  {
    id: 'evt_002',
    condition: 'MRI Scan - Brain',
    date_start: '2025-12-20',
    date_end: null,
    hospital: 'Neurological Center',
    doctor: 'Dr. Meena Iyer',
    document_count: 1,
    label: 'scan',
    documents: [
      { id: 'doc_002', type: 'dicom', label: 'Brain MRI Scan' },
    ],
  },
  {
    id: 'evt_003',
    condition: 'Post-Op Prescription',
    date_start: '2025-12-10',
    date_end: '2025-12-24',
    hospital: 'Apollo Hospitals',
    doctor: 'Dr. Sarah Williams',
    document_count: 1,
    label: 'prescription',
    documents: [
      { id: 'doc_003', type: 'pdf', label: 'Post-Operative Medication' },
    ],
  },
  {
    id: 'evt_004',
    condition: 'Chest X-Ray',
    date_start: '2025-11-05',
    date_end: null,
    hospital: 'Wellness Clinic',
    doctor: 'Dr. Arjun Nair',
    document_count: 1,
    label: 'scan',
    documents: [
      { id: 'doc_004', type: 'image', label: 'Chest X-Ray Film' },
    ],
  },
];
