import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from './AuthProvider';
import type { AppRole } from './auth.types';
import { AccessDeniedPage } from './AccessDeniedPage';

export function RoleGuard({
  children,
  allowedRoles,
  loginPath,
}: {
  children: ReactNode;
  allowedRoles: readonly AppRole[] | AppRole[];
  loginPath?: string;
}) {
  const { session, role, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-8 bg-slate-900 text-slate-100">
        <div className="w-8 h-8 rounded-full border-3 border-blue-500 border-t-transparent animate-spin" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Validating clearance permissions…
        </span>
      </div>
    );
  }

  // If user has no session, redirect to the portal-specific login path if specified
  if (!session) {
    if (loginPath) {
      return <Navigate to={loginPath} replace />;
    }
    return <AccessDeniedPage currentRole={null} allowedRoles={allowedRoles} />;
  }

  // If user is authenticated but role is mismatched, show Access Denied or Pending screen
  if (!role || !allowedRoles.includes(role)) {
    return (
      <AccessDeniedPage
        currentRole={role}
        allowedRoles={allowedRoles}
        pendingApproval={session?.pendingApproval}
      />
    );
  }

  return <>{children}</>;
}
