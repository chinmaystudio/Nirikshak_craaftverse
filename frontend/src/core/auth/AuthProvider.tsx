import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import type { AppRole, AppSession } from './auth.types';
import { AuthService } from './auth.service';
import { realtimeService } from '@/core/realtime/realtime.service';

interface AuthContextValue {
  session: AppSession | null;
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AppSession>;
  loginWithGoogle: (redirectTo?: string) => Promise<void>;
  signInWithGoogle: (redirectTo?: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    metadata?: Record<string, any>;
  }) => Promise<any>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AppSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    try {
      setLoading(true);
      const user = await AuthService.getCurrentUser();
      if (user) {
        const appSession = await AuthService.resolveUserSession(user);
        setSession(appSession);
      } else {
        setSession(null);
      }
      setError(null);
    } catch (err: any) {
      console.warn('Could not restore auth session:', err);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();

    const { data: authListener } = AuthService.onAuthStateChange(async (rawSession) => {
      if (rawSession?.user) {
        const appSession = await AuthService.resolveUserSession(rawSession.user);
        setSession(appSession);
      } else {
        setSession(null);
      }
      setLoading(false);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const appSession = await AuthService.signIn(email, password);
      setSession(appSession);
      return appSession;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async (redirectTo?: string) => {
    setError(null);
    try {
      await AuthService.signInWithGoogle(redirectTo);
    } catch (err: any) {
      setError(err.message || 'Google sign in failed');
      throw err;
    }
  }, []);

  const register = useCallback(async (payload: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    metadata?: Record<string, any>;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await AuthService.signUp(payload);
      if (res.user && res.session) {
        const appSession = await AuthService.resolveUserSession(res.user);
        setSession(appSession);
      }
      return res;
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      // Disconnect all Supabase Realtime subscriptions to prevent leaking data
      realtimeService.cleanupAll();

      // Sign out from Supabase Auth
      await AuthService.signOut();
      setSession(null);

      // Clear any session-specific storage and cached private state (Rules 32, 96)
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
      }
    } catch (err: any) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      role: session?.role || null,
      loading,
      error,
      isAuthenticated: Boolean(session?.user),
      login,
      loginWithGoogle,
      signInWithGoogle: loginWithGoogle,
      register,
      logout,
      signOut: logout,
      refreshSession,
    }),
    [session, loading, error, login, loginWithGoogle, register, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return ctx;
}
