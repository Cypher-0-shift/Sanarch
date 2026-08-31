// hooks/useDocumentListener.ts
/**
 * Real-time document progress listener using Firestore onSnapshot.
 *
 * Attaches Firestore listeners to all in-progress documents.
 * Updates the Zustand store instantly when Firestore data changes.
 * Listeners are cleaned up automatically when documents finish or on unmount.
 *
 * Called once from AppListeners in app/_layout.tsx so listeners
 * survive navigation changes, tab switches, and app backgrounding.
 */
import { getFirestore, doc, onSnapshot } from '@react-native-firebase/firestore';
import { useEffect } from 'react';
import { useDocumentsStore } from '../store/documentsStore';

/**
 * Attach a single Firestore onSnapshot listener for one document.
 * Standalone hook — safe for individual use where needed.
 */
export function useDocumentListener(documentId: string) {
  const updateDocument = useDocumentsStore((s) => s.updateDocument);

  useEffect(() => {
    if (!documentId) return;

    const db = getFirestore();
    const docRef = doc(db, 'documents', documentId);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists) return;
        const data = snapshot.data();
        if (!data) return;

        updateDocument(documentId, {
          status: data.status,
          processing_progress: data.processing_progress,
          processing_stage: data.processing_stage,
          document_title: data.document_title,
          updated_at: data.updated_at,
        });
      },
      (error) => {
        console.error('onSnapshot error for', documentId, error);
      }
    );

    return () => unsubscribe();
  }, [documentId]);
}

/**
 * Attach onSnapshot listeners for ALL in-progress documents.
 *
 * Uses a single useEffect with a stable key derived from active IDs.
 * The effect only re-runs when the set of active documents changes.
 * Accesses updateDocument via getState() to avoid stale closures.
 */
export function useActiveDocumentListeners() {
  const documents = useDocumentsStore((s) => s.documents);

  const activeIds = documents
    .filter((d) => d.status !== 'ready' && d.status !== 'failed')
    .map((d) => d.document_id);

  // Stable string key so the effect only re-runs when the
  // set of active IDs actually changes
  const activeIdsKey = activeIds.join(',');

  useEffect(() => {
    if (activeIds.length === 0) return;

    const db = getFirestore();
    const updateDocument = useDocumentsStore.getState().updateDocument;

    const unsubscribes = activeIds.map((documentId) => {
      const docRef = doc(db, 'documents', documentId);
      return onSnapshot(
        docRef,
        (snapshot) => {
          if (!snapshot.exists) return;
          const data = snapshot.data();
          if (!data) return;

          updateDocument(documentId, {
            status: data.status,
            processing_progress: data.processing_progress,
            processing_stage: data.processing_stage,
            document_title: data.document_title,
            extracted_data: data.extracted_data,
            summary: data.summary,
            updated_at: data.updated_at,
          });
        },
        (error) => {
          console.error('onSnapshot error for', documentId, error);
        }
      );
    });

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [activeIdsKey]);
}
