'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('access_token');
    if (token && !store.student) {
      store.fetchStudent();
    }
  }, [store.student]);

  return {
    ...store,
    isLoading: store.isLoading || !store._hasHydrated,
  };
}
