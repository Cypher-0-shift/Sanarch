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

export type MockUser = {
  id: string;
  sanarch_id: string;
  full_name: string;
  phone: string;
  email: string;
  address: string;
};

export const MOCK_RECORDS: MedicalEvent[] = [
  {
    id: 'rec-001',
    condition: 'Complete Blood Count (CBC)',
    date_start: '2025-11-14T00:00:00.000Z',
    date_end: null,
    hospital: 'City Diagnostic Lab',
    doctor: 'Dr. Emily Stone',
    document_count: 2,
    label: 'lab_report',
    documents: [
      { id: 'doc-001a', type: 'pdf', label: 'CBC Report' },
      { id: 'doc-001b', type: 'image', label: 'Lab Receipt' },
    ],
  },
  {
    id: 'rec-002',
    condition: 'Prescription — Amoxicillin 500mg, Paracetamol 650mg',
    date_start: '2025-11-10T00:00:00.000Z',
    date_end: null,
    hospital: 'Apollo Clinic, Chennai',
    doctor: 'Dr. Rajan Iyer',
    document_count: 1,
    label: 'prescription',
    documents: [
      { id: 'doc-002a', type: 'image', label: 'Prescription Sheet' },
    ],
  },
  {
    id: 'rec-003',
    condition: 'Chest X-Ray — PA View',
    date_start: '2025-10-22T00:00:00.000Z',
    date_end: null,
    hospital: 'Fortis Radiology Centre',
    doctor: 'Dr. Priya Nair',
    document_count: 3,
    label: 'scan',
    documents: [
      { id: 'doc-003a', type: 'image', label: 'X-Ray Image' },
      { id: 'doc-003b', type: 'pdf', label: 'Radiologist Report' },
      { id: 'doc-003c', type: 'image', label: 'Referral Letter' },
    ],
  },
  {
    id: 'rec-004',
    condition: 'Discharge Summary — Appendectomy',
    date_start: '2025-09-05T00:00:00.000Z',
    date_end: '2025-09-08T00:00:00.000Z',
    hospital: 'Kauvery Hospital, Chennai',
    doctor: 'Dr. Suresh Kumar',
    document_count: 4,
    label: 'hospital_summary',
    documents: [
      { id: 'doc-004a', type: 'pdf', label: 'Discharge Summary' },
      { id: 'doc-004b', type: 'pdf', label: 'Operative Notes' },
      { id: 'doc-004c', type: 'image', label: 'Wound Photo' },
      { id: 'doc-004d', type: 'pdf', label: 'Medications at Discharge' },
    ],
  },
  {
    id: 'rec-005',
    condition: 'Lipid Profile — Cholesterol, LDL, HDL, Triglycerides',
    date_start: '2025-08-18T00:00:00.000Z',
    date_end: null,
    hospital: 'SRL Diagnostics',
    doctor: 'Dr. Meena Krishnan',
    document_count: 1,
    label: 'lab_report',
    documents: [
      { id: 'doc-005a', type: 'pdf', label: 'Lipid Panel Report' },
    ],
  },
];
