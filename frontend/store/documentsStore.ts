import { create } from 'zustand';
import { getFirestore, collection, query, where, onSnapshot } from '@react-native-firebase/firestore';
import { useAuthStore } from './authStore';
import { listDocuments } from '../services/api';

// Must match backend expires_in=3600. Client derives expires_at = Date.now() + this.
export const PRESIGNED_URL_TTL_MS = 60 * 60 * 1000; // 1 hour
// Re-fetch the URL if less than this much time remains on the cached URL.
const URL_EXPIRY_BUFFER_MS = 2 * 60 * 1000; // 2 minutes

export interface DocumentRecord {
  document_id: string;
  document_title: string;
  document_label: string;
  status: 'uploading' | 'uploaded' | 'queued' | 'processing' | 'review_required' | 'ready' | 'failed';
  processing_progress: number;
  processing_stage: string;
  file_type: string;
  b2_file_url?: string;
  /** Unix-ms timestamp after which b2_file_url should be considered expired. */
  b2_url_expires_at?: number;
  thumbnail_url?: string;
  extracted_data?: Record<string, any>;
  condition_terms_raw?: string[];
  condition_groups?: string[];
  summary?: string;
  created_at: string;
  updated_at: string;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  fileName: string | null;
  error: string | null;
  successDocumentId: string | null;
}

interface DocumentsState {
  documents: DocumentRecord[];
  isLoading: boolean;
  uploadState: UploadState;

  // Document actions
  setDocuments: (documents: DocumentRecord[]) => void;
  addDocument: (document: DocumentRecord) => void;
  updateDocument: (document_id: string, updates: Partial<DocumentRecord>) => void;
  removeDocument: (document_id: string) => void;

  // Upload actions
  setUploadProgress: (progress: number) => void;
  setUploadSuccess: (document_id: string) => void;
  setUploadError: (error: string) => void;
  resetUploadState: () => void;

  /**
   * Write a fresh b2_file_url and its expiry into the store for a given document.
   * Call this whenever a new presigned URL is received from the backend.
   */
  cacheB2Url: (document_id: string, url: string, expiresAt: number) => void;

  /**
   * Returns the cached b2_file_url for a document if it has more than
   * URL_EXPIRY_BUFFER_MS remaining, otherwise returns null.
   */
  getValidB2Url: (document_id: string) => string | null;

  // Async
  fetchDocuments: () => Promise<void>;
  unsubscribeDocuments: () => void;
}

let documentsUnsubscribe: (() => void) | null = null;

const INITIAL_UPLOAD_STATE: UploadState = {
  isUploading: false,
  progress: 0,
  fileName: null,
  error: null,
  successDocumentId: null,
};

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  documents: [],
  isLoading: false,
  uploadState: { ...INITIAL_UPLOAD_STATE },

  setDocuments: (documents) => set({ documents }),

  addDocument: (document) =>
    set((state) => ({
      documents: [document, ...state.documents],
    })),

  updateDocument: (document_id, updates) =>
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.document_id === document_id ? { ...doc, ...updates } : doc
      ),
    })),

  removeDocument: (document_id) =>
    set((state) => ({
      documents: state.documents.filter((doc) => doc.document_id !== document_id),
    })),

  setUploadProgress: (progress) =>
    set((state) => ({
      uploadState: { ...state.uploadState, progress, isUploading: true },
    })),

  setUploadSuccess: (document_id) =>
    set((state) => ({
      uploadState: {
        ...state.uploadState,
        isUploading: false,
        progress: 100,
        successDocumentId: document_id,
        error: null,
      },
    })),

  setUploadError: (error) =>
    set((state) => ({
      uploadState: {
        ...state.uploadState,
        isUploading: false,
        error,
      },
    })),

  resetUploadState: () =>
    set({ uploadState: { ...INITIAL_UPLOAD_STATE } }),

  cacheB2Url: (document_id, url, expiresAt) =>
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.document_id === document_id
          ? { ...doc, b2_file_url: url, b2_url_expires_at: expiresAt }
          : doc
      ),
    })),

  getValidB2Url: (document_id) => {
    const doc = get().documents.find((d) => d.document_id === document_id);
    if (!doc?.b2_file_url || !doc.b2_url_expires_at) return null;
    const isValid = Date.now() < doc.b2_url_expires_at - URL_EXPIRY_BUFFER_MS;
    return isValid ? doc.b2_file_url : null;
  },

  unsubscribeDocuments: () => {
    if (documentsUnsubscribe) {
      documentsUnsubscribe();
      documentsUnsubscribe = null;
    }
  },

  fetchDocuments: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    
    set({ isLoading: true });

    // 1. Fetch via REST API first (fast & reliable regardless of Firestore client auth rules)
    try {
      const res = await listDocuments();
      if (res?.documents && Array.isArray(res.documents)) {
        const mapped: DocumentRecord[] = res.documents.map((d: any) => ({
          document_id: d.document_id,
          document_title: d.document_title || '',
          document_label: d.document_label || '',
          status: d.status || 'unknown',
          processing_progress: d.processing_progress || 0,
          processing_stage: d.processing_stage || 'unknown',
          file_type: d.file_type || '',
          // listDocuments returns the stale upload-time URL — do NOT set expires_at
          // since we don't know when it was generated. Only getDocument regenerates
          // a URL we can trust for expiry tracking.
          b2_file_url: d.b2_file_url,
          b2_url_expires_at: undefined,
          thumbnail_url: d.thumbnail_url,
          extracted_data: d.extracted_data || {},
          condition_terms_raw: d.condition_terms_raw || [],
          condition_groups: d.condition_groups || [],
          summary: d.summary || '',
          created_at: d.created_at || '',
          updated_at: d.updated_at || '',
        }));
        set({ documents: mapped, isLoading: false });
      }
    } catch (apiErr) {
      console.warn('[DocumentsStore] REST listDocuments error:', apiErr);
    }
    
    get().unsubscribeDocuments();
    
    try {
      const db = getFirestore();
      const q = query(collection(db, 'documents'), where('owner_id', '==', userId));
      
      documentsUnsubscribe = onSnapshot(
        q,
        (snapshot: any) => {
          const docs: DocumentRecord[] = [];
          snapshot.forEach((docSnap: any) => {
            const data = docSnap.data();
            if (data.hidden_from_list === true) return; // Filter client-side

            // Preserve any cached URL+expiry that was written by a getDocument call
            // so the onSnapshot refresh doesn't overwrite a fresh URL with the stale
            // upload-time value stored in Firestore.
            const existing = get().documents.find((d) => d.document_id === docSnap.id);
            
            docs.push({
              document_id: docSnap.id,
              document_title: data.document_title || '',
              document_label: data.document_label || '',
              status: data.status || 'unknown',
              processing_progress: data.processing_progress || 0,
              processing_stage: data.processing_stage || 'unknown',
              file_type: data.file_type || '',
              b2_file_url: existing?.b2_url_expires_at ? existing.b2_file_url : data.b2_file_url,
              b2_url_expires_at: existing?.b2_url_expires_at,
              thumbnail_url: data.thumbnail_url ?? existing?.thumbnail_url,
              extracted_data: data.extracted_data || {},
              condition_terms_raw: data.condition_terms_raw || [],
              condition_groups: data.condition_groups || [],
              summary: data.summary || '',
              created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at || '',
              updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at || '',
            });
          });
          docs.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
          set({ documents: docs, isLoading: false });
        },
        (error: any) => {
          console.warn('[DocumentsStore] onSnapshot notice:', error?.message || error);
          set({ isLoading: false });
        }
      );
    } catch (fsErr) {
      console.warn('[DocumentsStore] Firestore setup notice:', fsErr);
      set({ isLoading: false });
    }
  },
}));
