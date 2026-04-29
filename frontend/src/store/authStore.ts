import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Student, AuthTokens, LoginCredentials } from '@/types/auth';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';

interface AuthState {
  student: Student | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;

  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  fetchStudent: () => Promise<void>;
  clearError: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      student: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _hasHydrated: false,

      login: async (credentials) => {
        try {
          set({ isLoading: true, error: null });

          const { data: tokens } = await api.post<AuthTokens>(endpoints.auth.login, credentials);
          localStorage.setItem('access_token', tokens.access_token);

          const { data: student } = await api.get<Student>(endpoints.auth.me);

          set({ student, tokens, isAuthenticated: true, isLoading: false, error: null });
        } catch (error: any) {
          const msg = error.response?.data?.detail || 'Falha ao fazer login. Verifique suas credenciais.';
          set({ student: null, tokens: null, isAuthenticated: false, isLoading: false, error: msg });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('access_token');
        set({ student: null, tokens: null, isAuthenticated: false, error: null });
        if (typeof window !== 'undefined') window.location.href = '/login';
      },

      fetchStudent: async () => {
        try {
          set({ isLoading: true });
          const { data: student } = await api.get<Student>(endpoints.auth.me);
          set({ student, isAuthenticated: true, isLoading: false });
        } catch {
          set({ student: null, isAuthenticated: false, isLoading: false });
          get().logout();
        }
      },

      clearError: () => set({ error: null }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'wedu-auth',
      partialize: (s) => ({ student: s.student, tokens: s.tokens, isAuthenticated: s.isAuthenticated }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
);
