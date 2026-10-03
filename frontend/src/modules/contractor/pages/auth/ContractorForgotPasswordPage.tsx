import { useState } from 'react';
import { supabase } from '@/core/supabase/client';

export default function ContractorForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setBusy(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      // For user privacy/demo, show confirmation message
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center p-4"
      style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}
    >
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <img
            src="/logo/nirikshak-logo.png"
            alt="NIRIKSHAK"
            className="h-12 w-auto object-contain"
            width={1937}
            height={532}
          />
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Transparent Projects • Stronger India
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-sm">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-display">
            Reset Contractor Password
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Enter your registered contractor email to receive reset instructions
          </p>

          {sent ? (
            <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
              <p className="font-semibold mb-1">Check your inbox</p>
              <p className="text-[11px] text-emerald-800">
                If an active contractor account is associated with{' '}
                <span className="text-slate-900 font-mono font-bold">{email}</span>, a secure password reset link has been dispatched.
              </p>
              <div className="mt-4">
                <a
                  href="/contractor/login"
                  className="inline-block text-xs font-semibold text-[#1e40af] hover:underline"
                >
                  Back to Sign In
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
              {errorMsg && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] text-red-600 shrink-0 mt-0.5">
                    error
                  </span>
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Corporate Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span
                    className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[19px] text-slate-400"
                    aria-hidden="true"
                  >
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="contractor@infra.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e40af] focus:border-[#1e40af] transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#1e40af] text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1d4ed8] disabled:opacity-50 cursor-pointer"
              >
                {busy ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Sending Reset Instructions...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    <span>Send Password Reset Link</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <a
                  href="/contractor/login"
                  className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Return to Login
                </a>
              </div>
            </form>
          )}
        </div>

        {/* Institutional Note */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Official Infrastructure Monitoring &amp; Verification Network • Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}
