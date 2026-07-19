import { create } from 'zustand';
import { firebaseDb } from '../config/firebase';
import * as Notifications from 'expo-notifications';
import { uploadDocument } from '../services/api';
import { useDocumentsStore } from './documentsStore';
import { DocumentRecord } from './documentsStore';

// Configure notifications for local delivery when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface UploadTask {
  uri: string;
  name: string;
  mimeType: string;
  category: string;
  title: string;
  notes?: string;
}

interface UploadState {
  isUploading: boolean;
  documentId: string | null;
  processingStage: string;
  progress: number;
  isFailed: boolean;
  uploadError: string | null;

  startUpload: (tasks: UploadTask[]) => Promise<void>;
  
  reset: () => void;
  _unsubscribe: (() => void) | null;
}

export const useUploadStore = create<UploadState>((set, get) => ({
  isUploading: false,
  documentId: null,
  processingStage: 'uploading',
  progress: 0,
  isFailed: false,
  uploadError: null,
  _unsubscribe: null,

  reset: () => {
    const { _unsubscribe } = get();
    if (_unsubscribe) _unsubscribe();
    set({
      isUploading: false,
      documentId: null,
      processingStage: 'uploading',
      progress: 0,
      isFailed: false,
      uploadError: null,
      _unsubscribe: null,
    });
  },

  startUpload: async (tasks) => {
    get().reset();
    if (tasks.length === 0) return;

    set({ isUploading: true, processingStage: 'uploading', progress: 10 });

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      if (existingStatus !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }

      // Process sequentially
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const isLast = i === tasks.length - 1;
        
        set({ processingStage: `uploading (${i + 1}/${tasks.length})`, progress: 10 });
        
        try {
          const response = await uploadDocument(task.uri, task.name, task.mimeType, task.category, 1);
          const docId = response.document_id;
          
          if (isLast) {
            // For the last one, we attach the listener to show processing UI
            set({ documentId: docId, progress: 30, processingStage: 'queued' });

            if (firebaseDb) {
              const unsubscribe = firebaseDb
                .collection('documents')
                .doc(docId)
                .onSnapshot(
                  (snapshot) => {
                    if (snapshot.exists()) {
                      const data = snapshot.data();
                      if (!data) return;

                      const stage = data.processing_stage || 'queued';
                      const status = data.status || 'queued';
                      const currentProgress = data.processing_progress || 30;

                      set({ 
                        processingStage: stage,
                        progress: currentProgress,
                        isFailed: status === 'failed'
                      });

                      if (status === 'ready' || status === 'failed') {
                        get()._unsubscribe?.();
                        set({ _unsubscribe: null, isUploading: false });
                        
                        Notifications.scheduleNotificationAsync({
                          content: {
                            title: status === 'ready' ? 'Upload Complete' : 'Processing Failed',
                            body: status === 'ready' 
                              ? `All ${tasks.length} documents are ready to view.`
                              : `Some documents failed to process.`,
                          },
                          trigger: null,
                        });
                        
                        useDocumentsStore.getState().fetchDocuments();
                      }
                    }
                  },
                  (error) => console.error(error)
                );
              set({ _unsubscribe: unsubscribe });
            }
          } else {
            // Not the last one - just wait for upload to finish, then we move to next.
            // We don't block the UI waiting for processing of all, just uploading.
            // The backend handles the rest.
          }
        } catch (taskErr) {
          console.error('Failed to upload task', task, taskErr);
          if (isLast) throw taskErr;
        }
      }
    } catch (e: any) {
      console.error('UploadStore startUpload failed:', e);
      set({ isFailed: true, uploadError: e.message || 'Upload failed', isUploading: false });
      throw e;
    }
  },
}));
