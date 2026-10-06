import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '@/core/supabase/client';
import { navigate } from '../../lib/router';

export default function ContractorResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [ready, setReady] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError || !data.session) {
        setError('This reset link is invalid or expired. Request a new contractor reset link.');
      } else {
        setReady(true);
      }
    });
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await supabase.auth.signOut();
    setComplete(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-slate-900">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Reset Contractor Password</h1>
        {complete ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-emerald-700">Password updated successfully.</p>
            <button className="w-full rounded-lg bg-blue-700 px-4 py-2 text-white" onClick={() => navigate('/login')}>
              Go to Contractor Sign-In
            </button>
          </div>
        ) : (
          <form className="mt-5 space-y-4" onSubmit={submit}>
            {!ready && !error && <p className="text-sm text-slate-500">Validating reset link…</p>}
            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {ready && <>
              <input className="h-11 w-full rounded-lg border p-3" type="password" minLength={8} required placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
              <input className="h-11 w-full rounded-lg border p-3" type="password" minLength={8} required placeholder="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
              <button className="w-full rounded-lg bg-blue-700 px-4 py-2 text-white" type="submit">Update Password</button>
            </>}
          </form>
        )}
      </div>
    </div>
  );
}
