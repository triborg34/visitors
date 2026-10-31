import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiRequestError } from '../lib/api';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const response = await api.get<User>('/api/auth/me');
        return response.data;
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 401) return null;
        throw error;
      }
    },
    retry: false,
    staleTime: 60_000,
  });

  const login = useCallback(
    async (username: string, password: string) => {
      const response = await api.post<{ user: User; csrfToken: string }>('/api/auth/login', {
        username,
        password,
      });
      queryClient.setQueryData(['auth', 'me'], response.data.user);
      return response.data.user;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.clear();
    }
  }, [queryClient]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: data ?? null,
      isLoading,
      isAuthenticated: Boolean(data),
      isAdmin: data?.role === 'ADMIN',
      login,
      logout,
      refresh,
    }),
    [data, isLoading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth باید داخل AuthProvider استفاده شود.');
  return context;
}
