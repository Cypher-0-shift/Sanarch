import { create } from 'zustand';
import { EMPTY_USER, type UserPlaceholder } from '../constants/placeholders';

interface AuthState {
  user: UserPlaceholder;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: UserPlaceholder) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: UserPlaceholder, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: EMPTY_USER,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user) => set({ user }),

  setToken: (token) => set({ token }),

  setLoading: (isLoading) => set({ isLoading }),

  login: (user, token) =>
    set({ user, token, isAuthenticated: true, isLoading: false }),

  logout: () =>
    set({ user: EMPTY_USER, token: null, isAuthenticated: false, isLoading: false }),
}));
