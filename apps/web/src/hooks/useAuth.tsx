'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { apiClient } from '@/lib/api-client';

const ADMIN_ROLES = ['super_admin', 'admin', 'pharmacist', 'warehouse', 'sales'];

function setSessionCookie(roles: string[]) {
  const isAdmin = roles.some((r) => ADMIN_ROLES.includes(r));
  document.cookie = `session_type=${isAdmin ? 'admin' : 'customer'};path=/;max-age=${60 * 60 * 24 * 7};SameSite=Lax`;
}

function clearSessionCookie() {
  document.cookie = 'session_type=;path=/;max-age=0';
}

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
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ requiresTwoFactor?: boolean; tempToken?: string; user?: User }>;
  verify2fa: (tempToken: string, code: string) => Promise<{ user?: User }>;
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
      setSessionCookie(data.roles || []);
    } catch {
      setUser(null);
      localStorage.removeItem('accessToken');
      clearSessionCookie();
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
    setSessionCookie(data.user?.roles || []);

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
    return { user: data.user ? { ...data.user, roles: data.user.roles || [] } : undefined };
  }, [refreshUser]);

  const verify2fa = useCallback(async (tempToken: string, code: string) => {
    const { data } = await apiClient.post('/auth/verify-2fa', { tempToken, code });
    localStorage.setItem('accessToken', data.accessToken);
    setSessionCookie(data.user?.roles || []);
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
    return { user: data.user ? { ...data.user, roles: data.user.roles || [] } : undefined };
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
    clearSessionCookie();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: !!user && user.roles?.some((r) => ADMIN_ROLES.includes(r)),
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
