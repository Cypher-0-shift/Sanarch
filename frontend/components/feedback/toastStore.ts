/**
 * toastStore — DESIGN.md Phase 1
 *
 * Tiny Zustand store for the imperative Toast API.
 * Components call toast.show(...) from anywhere without prop-drilling.
 *
 * Usage:
 *   import { toast } from '../feedback/toastStore';
 *   toast.show({ message: 'Saved', type: 'success' });
 *   toast.show({ message: 'Failed', type: 'error', duration: 5000 });
 */

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id:        string;
  message:   string;
  type:      ToastType;
  /** Auto-dismiss duration in ms. Default: 3500. */
  duration?: number;
  /** Optional secondary action */
  action?:   { label: string; onPress: () => void };
}

interface ToastState {
  toasts:    ToastMessage[];
  show:      (params: Omit<ToastMessage, 'id'>) => void;
  dismiss:   (id: string) => void;
  dismissAll: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  show: (params) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({
      toasts: [...state.toasts.slice(-2), { ...params, id }], // max 3 toasts
    }));
  },

  dismiss: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  dismissAll: () => set({ toasts: [] }),
}));

/**
 * Imperative API — import this singleton anywhere in the app.
 * Does NOT require React context.
 */
export const toast = {
  show:    (params: Omit<ToastMessage, 'id'>) => useToastStore.getState().show(params),
  dismiss: (id: string)                        => useToastStore.getState().dismiss(id),
  success: (message: string, opts?: Partial<Omit<ToastMessage, 'id' | 'message' | 'type'>>) =>
    useToastStore.getState().show({ message, type: 'success', ...opts }),
  error: (message: string, opts?: Partial<Omit<ToastMessage, 'id' | 'message' | 'type'>>) =>
    useToastStore.getState().show({ message, type: 'error', duration: 5000, ...opts }),
  warning: (message: string, opts?: Partial<Omit<ToastMessage, 'id' | 'message' | 'type'>>) =>
    useToastStore.getState().show({ message, type: 'warning', ...opts }),
  info: (message: string, opts?: Partial<Omit<ToastMessage, 'id' | 'message' | 'type'>>) =>
    useToastStore.getState().show({ message, type: 'info', ...opts }),
};
