'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { apiClient } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  phone?: string;
  isVerified: boolean;
  roles: string[];
  abilities: Array<{ action: string; subject: string }>;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ requiresTwoFactor?: boolean; tempToken?: string }>;
  verify2fa: (tempToken: string, code: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUser(null);
        return;
      }
      const { data } = await apiClient.get('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
      localStorage.removeItem('accessToken');
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await apiClient.post('/auth/login', { email, password });

    if (data.requiresTwoFactor) {
      return { requiresTwoFactor: true, tempToken: data.tempToken };
    }

    localStorage.setItem('accessToken', data.accessToken);

    // Set user immediately from login response
    if (data.user) {
      setUser({
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        avatarUrl: data.user.avatarUrl || undefined,
        phone: data.user.phone || undefined,
        isVerified: data.user.isVerified ?? false,
        roles: data.user.roles || [],
        abilities: data.user.abilities || [],
      });
    }

    // Then try to get full profile (has abilities etc.) — non-blocking
    refreshUser().catch(() => {});
    return {};
  }, [refreshUser]);

  const verify2fa = useCallback(async (tempToken: string, code: string) => {
    const { data } = await apiClient.post('/auth/verify-2fa', { tempToken, code });
    localStorage.setItem('accessToken', data.accessToken);
    if (data.user) {
      setUser({
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        avatarUrl: data.user.avatarUrl || undefined,
        phone: data.user.phone || undefined,
        isVerified: data.user.isVerified ?? false,
        roles: data.user.roles || [],
        abilities: data.user.abilities || [],
      });
    }
    refreshUser().catch(() => {});
  }, [refreshUser]);

  const register = useCallback(async (registerData: { email: string; password: string; firstName: string; lastName: string; phone?: string }) => {
    await apiClient.post('/auth/register', registerData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem('accessToken');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        verify2fa,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
