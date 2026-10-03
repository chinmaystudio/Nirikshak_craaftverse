import React, { useState } from 'react';
import { X, ShieldCheck, Lock, ArrowRight, Building, HardHat, CheckCircle2, AlertCircle } from 'lucide-react';
import { AuthService } from '@/core/auth/auth.service';

interface OfficialLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: 'officer' | 'contractor';
}

export const OfficialLoginModal: React.FC<OfficialLoginModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'officer'
}) => {
  if (!isOpen) return null;

  const [role, setRole] = useState<'officer' | 'contractor'>(initialRole);
  const [officerId, setOfficerId] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fillDemoCredentials = () => {
    if (role === 'officer') {
      setOfficerId('government@gmail.com');
      setPassword('government');
    } else {
      setOfficerId('contractor.test@nirikshak.local');
      setPassword('NirikshakContractor#2026');
    }
    setErrorMsg(null);
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const redirect = role === 'officer' ? '/government/dashboard' : '/contractor/dashboard';
      await AuthService.signInWithGoogle(redirect);
    } catch (err: any) {
      console.error('Modal Google login error:', err);
      setErrorMsg(err.message || 'Google authentication failed.');
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerId.trim() || !password) {
      setErrorMsg('Please enter both your registered ID/email and security password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await AuthService.signIn(officerId.trim(), password);
      setLoginSuccess(true);
      setTimeout(() => {
        onClose();
        if (role === 'officer') {
          window.location.href = '/government/dashboard';
        } else {
          window.location.href = '/contractor/dashboard';
        }
      }, 700);
    } catch (err: any) {
      console.error('Portal login error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="official-login-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="official-login-modal-container"
        className="bg-white backdrop-blur-2xl w-full max-w-lg rounded-3xl shadow-2xl border border-black/10 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-neutral-900"
      >
        <div className="bg-amber-500/10 border-b border-black/10 p-6 sm:p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 border border-black/10 text-neutral-900 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
            aria-label="Close login dialog"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-900 text-[11px] font-bold uppercase tracking-wider mb-3 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Authorized Portal Sign-In</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-black">
            Official NIRIKSHAK Portal
          </h2>
          <p className="text-xs text-neutral-800 font-medium mt-1">
            Secure multi-factor authentication for public project governance.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {loginSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-700 border border-emerald-400/40 rounded-full mx-auto flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-black font-display">
                Authentication Confirmed
              </h3>
              <p className="text-xs text-neutral-800 font-medium max-w-sm mx-auto">
                Welcome back. Loading your encrypted project governance workspace.
              </p>
              <button
                onClick={() => {
                  setLoginSuccess(false);
                  onClose();
                  if (role === 'officer') {
                    window.location.href = '/government/dashboard';
                  } else {
                    window.location.href = '/contractor/dashboard';
                  }
                }}
                className="px-6 py-2.5 rounded-full bg-[#eefc55] border border-[#d6e838] text-neutral-950 text-xs font-bold shadow-md hover:bg-[#e2f23e] cursor-pointer"
              >
                {role === 'officer' ? 'Enter Government Portal' : 'Enter Contractor Portal'}
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-black/5 rounded-2xl border border-black/10">
                <button
                  type="button"
                  id="tab-role-officer"
                  onClick={() => { setRole('officer'); setErrorMsg(null); }}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    role === 'officer'
                      ? 'bg-[#eefc55] text-neutral-950 shadow-md border border-[#d6e838]'
                      : 'text-neutral-700 hover:text-black'
                  }`}
                >
                  <Building className="w-4 h-4 text-amber-600" />
                  <span>Government Officer</span>
                </button>

                <button
                  type="button"
                  id="tab-role-contractor"
                  onClick={() => { setRole('contractor'); setErrorMsg(null); }}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    role === 'contractor'
                      ? 'bg-[#eefc55] text-neutral-950 shadow-md border border-[#d6e838]'
                      : 'text-neutral-700 hover:text-black'
                  }`}
                >
                  <HardHat className="w-4 h-4 text-amber-600" />
                  <span>Contractor</span>
                </button>
              </div>

              {/* Demo auto-fill banner */}
              <div className="mb-4 p-2.5 bg-amber-500/10 border border-amber-300 rounded-xl flex items-center justify-between gap-2">
                <div className="text-[11px] text-amber-950">
                  <span className="font-bold">Test Credentials: </span>
                  <span className="font-mono">{role === 'officer' ? 'government@gmail.com / government' : 'contractor.test@nirikshak.local / NirikshakContractor#2026'}</span>
                </div>
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="px-2.5 py-1 text-[11px] font-bold bg-[#eefc55] hover:bg-[#e2f23e] border border-[#d6e838] text-neutral-900 rounded-lg shadow-2xs cursor-pointer whitespace-nowrap"
                >
                  Fill Demo
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1.5">
                    {role === 'officer' ? 'Officer Gov.in Email / Parichay ID' : 'Contractor Portal ID / Email'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={role === 'officer' ? 'government@gmail.com' : 'contractor.test@nirikshak.local'}
                    value={officerId}
                    onChange={(e) => setOfficerId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-black/15 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-neutral-900 placeholder-neutral-400 font-medium shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1.5">
                    Security Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-black/15 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-neutral-900 placeholder-neutral-400 font-medium shadow-xs"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-800 font-medium py-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-amber-600" />
                    <span>Hardware token verified</span>
                  </label>
                  <a
                    href={role === 'officer' ? '/government/login' : '/contractor/login'}
                    className="text-amber-800 font-bold hover:underline"
                  >
                    Open Full {role === 'officer' ? 'Officer' : 'Contractor'} Login →
                  </a>
                </div>

                <button
                  type="submit"
                  id="btn-portal-login-submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-full bg-[#eefc55] hover:bg-[#e2f23e] border border-[#d6e838] text-neutral-950 font-bold text-sm tracking-wide transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating with Supabase...</span>
                    </>
                  ) : (
                    <>
                      <span>{role === 'officer' ? 'Officer Sign In' : 'Contractor Sign In'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-black/10" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase">
                  <span className="bg-white px-2 text-neutral-500 font-semibold">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-black/15 bg-white hover:bg-neutral-50 text-neutral-800 text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Sign In with Google</span>
              </button>

              <div className="mt-6 pt-5 border-t border-black/10 text-center">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-800">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Authorized access only.</span>
                </div>
                <p className="text-[11px] text-neutral-700 mt-1 font-medium">
                  This system is restricted to authorized Government of India officers and vetted contractors. Unauthorized attempts are punishable under the Information Technology Act.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
