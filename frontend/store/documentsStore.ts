// store/documentsStore.ts
import { create } from 'zustand';
import { firebaseDb } from '../config/firebase';
import { useAuthStore } from './authStore';

export interface DocumentRecord {
  document_id: string;
  document_title: string;
  document_label: string;
  status: 'uploading' | 'uploaded' | 'queued' | 'processing' | 'review_required' | 'ready' | 'failed';
  processing_progress: number;
  processing_stage: string;
  file_type: string;
  b2_file_url?: string;
  extracted_data?: Record<string, any>;
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
    
    get().unsubscribeDocuments();
    
    documentsUnsubscribe = firebaseDb
      .collection('documents')
      .where('owner_id', '==', userId)
      .onSnapshot(
        (snapshot: any) => {
          const docs: DocumentRecord[] = [];
          snapshot.forEach((doc: any) => {
            const data = doc.data();
            if (data.hidden_from_list === true) return; // Filter client-side
            
            docs.push({
              document_id: doc.id,
              document_title: data.document_title || '',
              document_label: data.document_label || '',
              status: data.status || 'unknown',
              processing_progress: data.processing_progress || 0,
              processing_stage: data.processing_stage || 'unknown',
              file_type: data.file_type || '',
              b2_file_url: data.b2_file_url,
              extracted_data: data.extracted_data || {},
              summary: data.summary || '',
              created_at: data.created_at?.toDate?.()?.toISOString() || '',
              updated_at: data.updated_at?.toDate?.()?.toISOString() || '',
            });
          });
          docs.sort((a, b) => b.created_at.localeCompare(a.created_at));
          set({ documents: docs, isLoading: false });
        },
        (error: any) => {
          console.error('[DocumentsStore] onSnapshot failed:', error);
          set({ isLoading: false });
        }
      );
  },
}));
