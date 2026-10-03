import { useState, type FormEvent } from "react";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { useNavigate } from "@/app/router";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/useToast";
import { register } from "@/services/auth/authService";
import { isValidMobile, isValidEmail } from "@/utils/validation";
import { ROUTES } from "@/constants/routes";
import { WARDS } from "@/constants/issueCategories";
import { LANGUAGES, LANGUAGE_ORDER } from "@/constants/i18n";
import type { Language } from "@/types/user";

export function RegisterPage(): JSX.Element {
  const navigate = useNavigate();
  const auth = useAuth();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [language, setLanguage] = useState<Language>(auth.lang);
  const [ward, setWard] = useState<string>(WARDS[0]);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 3) {
      setError("Enter your full name (minimum 3 characters).");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!isValidMobile(mobile)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!consent) {
      setError("Please accept the Terms of Service and Privacy Policy to continue.");
      return;
    }

    setBusy(true);
    try {
      const user = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        mobile: mobile.trim(),
        preferredLanguage: language,
        city: "Pune",
        ward,
      });

      toast(`Registration complete. Welcome to NIRIKSHAK, ${user.name.split(" ")[0]}.`, "success");
      navigate(ROUTES.HOME);
    } catch (err: any) {
      console.error("Citizen registration error:", err);
      setError(err.message || "Registration failed. Please check your information.");
    } finally {
      setBusy(false);
    }
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
              <Icon name="how_to_reg" className="text-[28px]" />
            </div>
            <h2 className="text-headline-md font-headline-md font-bold text-surface-container-lowest">New Citizen Registration</h2>
            <p className="text-body-sm font-body-sm text-on-primary-container leading-relaxed">
              Create your verified citizen account to report public infrastructure issues, monitor contractors, and audit civic fund allocations with full transparency.
            </p>
          </div>
          <div className="space-y-3 pt-6 border-t border-outline-variant/30 text-label-sm font-label-sm text-on-primary-container">
            {["Truthful reporting under PI Disclosure guidelines", "Identity never published on community pages", "Ward-level accountability from day one"].map(
              (line) => (
                <div key={line} className="flex items-center gap-2">
                  <Icon name="check_circle" className="text-[16px] text-secondary" />
                  <span>{line}</span>
                </div>
              )
            )}
          </div>
        </div>

        <div className="md:col-span-7 p-6 md:p-8">
          <div className="flex border-b border-outline-variant mb-6">
            <a href={ROUTES.LOGIN} className="flex-1 pb-3 text-center text-headline-sm text-on-surface-variant hover:text-primary">
              Citizen Login
            </a>
            <a href={ROUTES.REGISTER} className="flex-1 pb-3 text-center text-headline-sm font-bold text-primary border-b-2 border-secondary">
              New Registration
            </a>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-body-sm flex items-start gap-2">
              <Icon name="error" className="text-[18px] flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="reg-name" className="block text-label-md font-label-md text-primary mb-1">
                Full Name <span className="text-error">*</span>
              </label>
              <input
                id="reg-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-outline-variant rounded focus:ring-2 focus:ring-primary-container focus:border-transparent text-body-md"
                placeholder="Aarav Deshmukh"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-email" className="block text-label-md font-label-md text-primary mb-1">
                  Email Address <span className="text-error">*</span>
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded focus:ring-2 focus:ring-primary-container focus:border-transparent text-body-md"
                  placeholder="name@example.in"
                />
              </div>

              <div>
                <label htmlFor="reg-mobile" className="block text-label-md font-label-md text-primary mb-1">
                  Mobile Number <span className="text-error">*</span>
                </label>
                <input
                  id="reg-mobile"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded focus:ring-2 focus:ring-primary-container focus:border-transparent text-body-md font-mono"
                  placeholder="9876543210"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-password" className="block text-label-md font-label-md text-primary mb-1">
                  Password <span className="text-error">*</span>
                </label>
                <input
                  id="reg-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded focus:ring-2 focus:ring-primary-container focus:border-transparent text-body-md"
                  placeholder="Min 8 characters"
                />
              </div>

              <div>
                <label htmlFor="reg-confirm-password" className="block text-label-md font-label-md text-primary mb-1">
                  Confirm Password <span className="text-error">*</span>
                </label>
                <input
                  id="reg-confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded focus:ring-2 focus:ring-primary-container focus:border-transparent text-body-md"
                  placeholder="Re-enter password"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-ward" className="block text-label-md font-label-md text-primary mb-1">
                  Pune Administrative Ward
                </label>
                <select
                  id="reg-ward"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant rounded text-body-md bg-surface-container-lowest"
                >
                  {WARDS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="reg-lang" className="block text-label-md font-label-md text-primary mb-1">
                  Preferred Interface Language
                </label>
                <select
                  id="reg-lang"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="w-full px-3 py-2 border border-outline-variant rounded text-body-md bg-surface-container-lowest"
                >
                  {LANGUAGE_ORDER.map((code) => (
                    <option key={code} value={code}>
                      {LANGUAGES[code]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-start gap-2 pt-1 text-body-sm text-on-surface-variant cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 rounded text-primary"
              />
              <span>
                I agree to the <a href="#/terms" className="text-secondary font-bold underline">Terms of Public Disclosure</a> and confirm that submitted reports are truthful to the best of my knowledge.
              </span>
            </label>

            <Button className="w-full cursor-pointer" icon="arrow_forward" size="lg" loading={busy} type="submit">
              Complete Citizen Registration
            </Button>
          </form>

          <div className="text-center pt-4 text-body-sm text-on-surface-variant">
            Already have an account?{" "}
            <a href={ROUTES.LOGIN} className="text-secondary font-bold hover:underline">
              Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
