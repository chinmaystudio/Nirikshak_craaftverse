import { useState } from "react";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { useNavigate } from "@/app/router";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { toast } from "@/hooks/useToast";
import { loginWithEmail, loginWithGoogle } from "@/services/auth/authService";
import { ROUTES } from "@/constants/routes";

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const auth = useAuth();
  const next = new URLSearchParams(window.location.search).get("next");
  const decodedNext = next ? decodeURIComponent(next) : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const { t } = useT();

  const isDev = !import.meta.env.PROD || import.meta.env.VITE_SHOW_DEMO_CREDENTIALS === "true";

  const handleLogin = async (e?: React.FormEvent): Promise<void> => {
    if (e) e.preventDefault();
    if (!email.trim() || !password) {
      toast("Please enter your registered email and password.", "error");
      return;
    }

    setBusy(true);
    setErrorMsg(null);

    try {
      const res = await loginWithEmail(email.trim(), password, decodedNext);
      toast(`Welcome, ${res.user.name.split(" ")[0]}. Secure login successful.`, "success");
      navigate(res.next ?? ROUTES.HOME);
    } catch (err: any) {
      console.error("Citizen login error:", err);
      const msg = err.message || "Invalid credentials. Please verify your email and password.";
      setErrorMsg(msg);
      toast(msg, "error");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleLogin = async (): Promise<void> => {
    setBusy(true);
    setErrorMsg(null);
    try {
      await loginWithGoogle(decodedNext ?? "/user/home");
    } catch (err: any) {
      console.error("Citizen Google login error:", err);
      setErrorMsg(err.message || "Google authentication failed. Please ensure Google provider is enabled.");
      setBusy(false);
    }
  };

  const fillDemo = (): void => {
    setEmail("citizen.test@nirikshak.local");
    setPassword("NirikshakCitizen#2026");
    setErrorMsg(null);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <button onClick={() => navigate(ROUTES.HOME)} className="inline-flex items-center gap-1.5 text-label-md text-primary hover:text-secondary mb-4 font-semibold cursor-pointer">
        <Icon name="arrow_back" className="text-[18px]" /> Back to portal
      </button>
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12">
        <div className="md:col-span-5 bg-primary-container p-8 text-on-primary flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-on-secondary">
              <Icon name="fingerprint" className="text-[28px]" />
            </div>
            <h2 className="text-headline-md font-headline-md font-bold text-surface-container-lowest">Civic Oversight Identity Gateway</h2>
            <p className="text-body-md text-on-primary-container leading-relaxed">
              Login with your verified citizen credentials to report issues, track complaints and participate in ward-level public infrastructure audits with full transparency.
            </p>
          </div>

          <div className="space-y-3 pt-6 border-t border-outline-variant/30">
            {[
              { icon: "security", title: "Supabase Auth Security", sub: "Enterprise cryptographic session management" },
              { icon: "verified", title: "Direct Public Audit", sub: "Verify official physical progress directly" },
              { icon: "location_city", title: "Ward-Level Tracking", sub: "Geo-fenced infrastructure grievance logging" }
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <Icon name={f.icon} className="text-secondary text-[20px] mt-0.5" />
                <div>
                  <div className="text-label-md font-bold text-surface-container-lowest">{f.title}</div>
                  <div className="text-label-sm text-on-primary-container">{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-7 p-6 md:p-8">
          <div className="flex border-b border-outline-variant mb-6">
            <a href={ROUTES.LOGIN} className="flex-1 pb-3 text-center text-headline-sm font-bold text-primary border-b-2 border-secondary">
              Citizen Login
            </a>
            <a href={ROUTES.REGISTER} className="flex-1 pb-3 text-center text-headline-sm text-on-surface-variant hover:text-primary">
              New Registration
            </a>
          </div>

          {errorMsg && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-body-sm flex items-start gap-2">
              <Icon name="error" className="text-[18px] flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-label-md font-label-md text-primary mb-1">
                Citizen Email Address <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-outline-variant rounded focus:ring-2 focus:ring-primary-container focus:border-transparent text-body-md"
                  placeholder="citizen@example.in"
                  autoComplete="email"
                />
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[20px]">mail</span>
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-label-md font-label-md text-primary mb-1">
                Password <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-outline-variant rounded focus:ring-2 focus:ring-primary-container focus:border-transparent text-body-md"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[20px]">lock</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-body-sm text-on-surface-variant cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-primary" /> Remember this session
              </label>
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="text-label-sm text-secondary font-bold hover:underline"
              >
                Help &amp; Support
              </button>
            </div>

            <Button className="w-full cursor-pointer" icon="login" size="lg" loading={busy} type="submit">
              Sign In to Citizen Portal
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-outline-variant" />
            </div>
            <div className="relative flex justify-center text-label-sm uppercase">
              <span className="bg-surface-container-lowest px-2 text-on-surface-variant font-semibold">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={busy}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded border border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-primary text-label-md font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Sign In with Google</span>
          </button>

          {isDev && (
            <div className="mt-5 rounded-lg border border-outline-variant bg-surface-container p-3.5 text-xs text-on-surface-variant">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-primary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Demo Citizen Credentials (Dev Only)
                </span>
                <button
                  type="button"
                  onClick={fillDemo}
                  className="text-[11px] font-semibold text-secondary hover:underline bg-secondary/10 px-2 py-0.5 rounded cursor-pointer"
                >
                  Fill Demo
                </button>
              </div>
              <div className="font-mono text-[11px] space-y-0.5">
                <div>Email: <span className="text-primary font-bold">citizen.test@nirikshak.local</span></div>
                <div>Pass: <span className="text-primary font-bold">NirikshakCitizen#2026</span></div>
                <div>Profile: Aarav Deshmukh (Pune Citizen)</div>
              </div>
            </div>
          )}

          <div className="text-center pt-4 text-body-sm text-on-surface-variant">
            Don't have an account yet?{" "}
            <a href={ROUTES.REGISTER} className="text-secondary font-bold hover:underline">
              Register as Citizen
            </a>
          </div>
        </div>
      </div>

      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Help & Support">
        <div className="p-5 text-body-md text-on-surface-variant leading-relaxed">
          Toll-free citizen helpdesk: <strong className="text-primary">1800-11-2026</strong> (Mon–Sat, 9 AM–9 PM). Email:
          support@nirikshak.gov.in. For login assistance or credentials recovery, contact municipal nodal support.
        </div>
        <div className="px-5 pb-5">
          <Button className="w-full" onClick={() => setHelpOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>
      <span className="hidden">{t("cta.login")}</span>
    </div>
  );
}
