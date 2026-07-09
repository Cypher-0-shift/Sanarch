// store/documentsStore.ts
import { create } from 'zustand';
import apiClient from '../services/api';

export interface DocumentRecord {
  document_id: string;
  document_title: string;
  document_label: string;
  status: 'uploading' | 'uploaded' | 'queued' | 'processing' | 'review_required' | 'ready' | 'failed';
  processing_progress: number;
  processing_stage: string;
  file_type: string;
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
}

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

  fetchDocuments: async () => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get('/api/v1/documents');
      const docs: DocumentRecord[] = response.data.documents ?? [];
      // Sort newest first
      docs.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
      set({ documents: docs, isLoading: false });
    } catch (error) {
      console.error('[DocumentsStore] fetchDocuments failed:', error);
      set({ isLoading: false });
    }
  },
}));
