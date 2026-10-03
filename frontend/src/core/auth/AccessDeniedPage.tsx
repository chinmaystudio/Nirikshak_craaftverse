import { ShieldAlert, ArrowLeft, Home, Clock, Building2, Briefcase, LogOut } from 'lucide-react';
import type { AppRole } from './auth.types';
import { useAuthContext } from './AuthProvider';

export function AccessDeniedPage({
  currentRole,
  allowedRoles,
  pendingApproval,
}: {
  currentRole: AppRole | null;
  allowedRoles: AppRole[];
  pendingApproval?: {
    type: 'government' | 'contractor';
    status: string;
    details?: any;
  } | null;
}) {
  const { signOut } = useAuthContext();

  const getPortalHome = (role: AppRole | null) => {
    if (role && (role.startsWith('government') || role === 'chief_engineer' || role === 'project_officer' || role === 'auditor')) {
      return '/government/dashboard';
    }
    if (role && role.startsWith('contractor')) {
      return '/contractor/dashboard';
    }
    return '/';
  };

  // Dedicated Pending Government Approval Screen (Requirements 16, 35, 36)
  if (pendingApproval?.type === 'government') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl border border-amber-500/30 p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Building2 className="w-3.5 h-3.5" />
              STATUS: PENDING APPROVAL
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Government access request pending approval.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Your official Government access request has been submitted to the Authority. An authorized Government Administrator must review and approve your credentials before your account is linked to the shared Government organization.
            </p>
          </div>

          {pendingApproval.details && (
            <div className="bg-slate-900/60 rounded-xl p-4 text-left border border-slate-700/50 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Department:</span>
                <span className="text-slate-200 font-medium">{pendingApproval.details.department || 'Infrastructure'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Designation:</span>
                <span className="text-slate-200 font-medium">{pendingApproval.details.designation || 'Officer'}</span>
              </div>
              {pendingApproval.details.employee_id && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Employee ID:</span>
                  <span className="text-slate-200 font-mono">{pendingApproval.details.employee_id}</span>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => signOut()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out / Switch Account
            </button>
            <a
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 font-medium text-xs transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              Return to Citizen Portal
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Dedicated Pending Contractor Verification Screen (Requirements 16, 35, 36)
  if (pendingApproval?.type === 'contractor') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl border border-amber-500/30 p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Briefcase className="w-3.5 h-3.5" />
              STATUS: VERIFICATION PENDING
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Contractor verification pending.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Your contractor organization verification is pending administrator review. Once verified and linked to your company, you will be able to access your company's isolated contractor dashboard, tenders, and contracts.
            </p>
          </div>

          {pendingApproval.details && (
            <div className="bg-slate-900/60 rounded-xl p-4 text-left border border-slate-700/50 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Company:</span>
                <span className="text-slate-200 font-medium">{pendingApproval.details.company_name || 'Registered Company'}</span>
              </div>
              {pendingApproval.details.gstin && (
                <div className="flex justify-between">
                  <span className="text-slate-400">GSTIN:</span>
                  <span className="text-slate-200 font-mono">{pendingApproval.details.gstin}</span>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => signOut()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out / Switch Account
            </button>
            <a
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 font-medium text-xs transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              Return to Citizen Portal
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Access Restricted
          </h2>
          <p className="text-xs uppercase tracking-wider font-semibold text-red-600 dark:text-red-400">
            Role Authorization Required
          </p>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Your current authenticated profile is registered as{' '}
          <strong className="font-bold text-slate-800 dark:text-slate-200">
            {currentRole || 'Citizen / Unassigned'}
          </strong>
          . This portal requires one of the following official authorizations:
        </p>

        <div className="flex flex-wrap justify-center gap-1.5 py-2">
          {allowedRoles.map((r) => (
            <span
              key={r}
              className="text-[11px] font-semibold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            >
              {r.replace(/_/g, ' ')}
            </span>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-2">
          <a
            href={getPortalHome(currentRole)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Home className="w-4 h-4" />
            My Authorized Portal
          </a>
          <button
            onClick={() => signOut()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
