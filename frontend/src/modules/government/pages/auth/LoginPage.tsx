import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '@/context/I18nContext';
import { useToast } from '@/context/ToastContext';
import { TextField, Checkbox } from '@/components/ui/Fields';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AuthService } from '@/core/auth/auth.service';

export function LoginPage() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isDev = !import.meta.env.PROD || import.meta.env.VITE_SHOW_DEMO_CREDENTIALS === 'true';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your official email and password.');
      return;
    }

    setBusy(true);
    setErrorMsg(null);
    try {
      const session = await AuthService.signIn(email.trim(), password);
      showToast(`Welcome back, ${session.profile?.full_name || 'Officer'}!`, 'success');
      navigate('/government/dashboard');
    } catch (err: any) {
      console.error('Government login error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
      showToast(err.message || 'Login failed', 'danger');
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleLogin() {
    setBusy(true);
    setErrorMsg(null);
    try {
      await AuthService.signInWithGoogle('/government/dashboard');
    } catch (err: any) {
      console.error('Google login error:', err);
      setErrorMsg(err.message || 'Google authentication failed. Please ensure Google provider is enabled.');
      setBusy(false);
    }
  }

  function fillDemo() {
    setEmail('government@gmail.com');
    setPassword('government');
    setErrorMsg(null);
  }

  return (
    <Card className="p-6">
      <h1 className="text-heading-1 text-fg">{t('auth.welcome')}</h1>
      <p className="mt-1 text-body-small text-fg-muted">Official NIRIKSHAK Government Infrastructure Portal</p>

      {errorMsg && (
        <div className="mt-4 rounded-control border border-danger-border bg-danger-tint p-3 text-body-small text-danger-strong flex items-start gap-2">
          <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4" noValidate={false}>
        <TextField
          label="Official Email"
          type="email"
          required
          startIcon="mail"
          placeholder="government@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
        />
        <TextField
          label={t('auth.password')}
          type="password"
          required
          startIcon="lock"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <div className="flex items-center justify-between">
          <Checkbox label="Remember me" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <Link
            to="/government/forgot-password"
            className="rounded-[2px] text-body-small text-primary-strong hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            {t('auth.forgotPassword')}
          </Link>
        </div>
        <Button type="submit" size="lg" block icon="login" disabled={busy}>
          {busy ? t('common.loading') : 'Sign In to Portal'}
        </Button>
      </form>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-caption uppercase">
          <span className="bg-surface px-2 text-fg-muted font-semibold">Or continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={busy}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-control border border-border bg-surface hover:bg-surface-2 text-fg text-body-small font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        <span>Sign In with Google</span>
      </button>

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-body-small">
        <span className="text-fg-muted">New government official?</span>
        <Link
          to="/government/register"
          className="font-medium text-primary-strong hover:underline"
        >
          Register for Clearance
        </Link>
      </div>

      {isDev && (
        <div className="mt-5 rounded-control border border-border bg-surface-2 p-3 text-caption text-fg-muted">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-fg flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-accent">verified_user</span>
              Master Government Login
            </span>
            <button
              type="button"
              onClick={fillDemo}
              className="text-[11px] font-semibold text-primary-strong hover:underline cursor-pointer bg-primary-tint px-2 py-0.5 rounded"
            >
              Fill Master Login
            </button>
          </div>
          <div className="font-mono text-[11px] text-fg-subtle space-y-0.5">
            <div>Email: <span className="text-fg font-bold">government@gmail.com</span></div>
            <div>Password: <span className="text-fg font-bold">government</span></div>
            <div>Authority: <span className="text-fg">Master Authority Admin (Approves all registration requests)</span></div>
          </div>
        </div>
      )}
    </Card>
  );
}
