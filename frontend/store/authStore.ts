import { create } from 'zustand';
import { MOCK_USER, type MockUser } from '../constants/mock';

interface AuthState {
  user: MockUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: MockUser | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: MockUser, token: string) => void;
  logout: () => void;
  devLogin: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user) => set({ user }),

  setToken: (token) => set({ token }),

  setLoading: (isLoading) => set({ isLoading }),

  login: (user, token) =>
    set({ user, token, isAuthenticated: true, isLoading: false }),

  logout: () =>
    set({ user: null, token: null, isAuthenticated: false, isLoading: false }),

  devLogin: () =>
    set({
      user: MOCK_USER,
      token: 'dev-mode-token',
      isAuthenticated: true,
      isLoading: false,
    }),
}));
