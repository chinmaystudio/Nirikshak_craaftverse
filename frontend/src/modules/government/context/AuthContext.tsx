import { createContext, useCallback, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Officer } from '@/types';
import { useAuth as useCoreAuth } from '@/core/auth/useAuth';
import { AuthService } from '@/core/auth/auth.service';

export type AuthScreen = 'password' | 'otp' | '2fa' | 'select-role' | 'select-department';

interface AuthContextValue {
  officer: Officer | null;
  isAuthenticated: boolean;
  login: (officerOrEmail: any, password?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { session, isAuthenticated, signOut } = useCoreAuth();

  const officer: Officer | null = useMemo(() => {
    if (!session || !isAuthenticated) return null;

    const roleName = session.role === 'government_admin'
      ? 'Government Administrator'
      : session.role === 'chief_engineer'
      ? 'Chief Engineer'
      : session.role === 'project_officer'
      ? 'Project Officer'
      : session.role.replace(/_/g, ' ').toUpperCase();

    return {
      id: session.user.id,
      name: session.profile?.full_name || session.user.email?.split('@')[0] || 'Government Officer',
      designation: roleName,
      department: session.organization?.name || 'Pune Infrastructure Monitoring Authority',
      employeeNo: (session.user.user_metadata?.employee_id as string) || `GOV-${session.user.id.slice(0, 6).toUpperCase()}`,
      roles: [session.role],
    };
  }, [session, isAuthenticated]);

  const login = useCallback(async (officerOrEmail: any, password?: string) => {
    if (typeof officerOrEmail === 'string' && password) {
      await AuthService.signIn(officerOrEmail, password);
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const value = useMemo(
    () => ({ officer, isAuthenticated: officer !== null, login, logout }),
    [officer, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
