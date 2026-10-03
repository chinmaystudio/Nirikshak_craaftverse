import { useState } from 'react';
import { AuthService } from '@/core/auth/auth.service';

export default function ContractorRegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [registrationCin, setRegistrationCin] = useState('');
  const [gstin, setGstin] = useState('');
  const [contractorClass, setContractorClass] = useState('Class 1 (Unlimited)');
  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('Pune');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setBusy(true);
    setErrorMsg(null);

    try {
      await AuthService.registerContractor({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        companyName: companyName.trim(),
        registrationCin: registrationCin.trim(),
        gstin: gstin.trim(),
        contractorClass,
        state: state.trim(),
        district: district.trim(),
        password,
      });
      setSubmitted(true);
    } catch (err: any) {
      console.error('Contractor registration error:', err);
      setErrorMsg(err.message || 'Onboarding registration failed. Please review your company info.');
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center p-4"
        style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}
      >
        <div className="w-full max-w-md">
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

          <div className="rounded-xl border border-slate-200/90 bg-white p-6 sm:p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <span className="material-symbols-outlined text-[28px]">verified</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
              Onboarding Application Submitted
            </h1>
            <p className="mt-2 text-xs text-slate-600">
              Your contractor registration for <strong className="text-slate-900">{companyName}</strong> has been received and logged in the NIRIKSHAK vendor registry.
            </p>
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 text-left space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <span className="material-symbols-outlined text-[16px]">hourglass_top</span>
                <span>Status: PENDING VERIFICATION</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                In accordance with government procurement compliance guidelines, contractor privileges (bidding on tenders, receiving contract awards, submitting progress claims) require physical document and GSTIN cross-verification by the Public Works Department authority.
              </p>
            </div>
            <div className="mt-6">
              <a
                href="/contractor/login"
                className="inline-flex items-center justify-center w-full h-10 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                Return to Contractor Login
              </a>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            Official Infrastructure Monitoring &amp; Verification Network • Authorized Personnel Only
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center p-4 py-12"
      style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}
    >
      <div className="w-full max-w-xl">
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

        <div className="rounded-xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-display">
            Contractor Onboarding
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Official NIRIKSHAK Contractor Execution Portal • Vendor Registration
          </p>

          {errorMsg && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-red-600 shrink-0 mt-0.5">
                error
              </span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Agency Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sahyadri Infra Projects Ltd"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Authorized Person Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Shinde"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Email</label>
                <input
                  type="email"
                  required
                  placeholder="tenders@sahyadriinfra.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone (+91)</label>
                <input
                  type="tel"
                  required
                  placeholder="9822000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">CIN / Registration No.</label>
                <input
                  type="text"
                  required
                  placeholder="U45200MH2015PTC123456"
                  value={registrationCin}
                  onChange={(e) => setRegistrationCin(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN</label>
                <input
                  type="text"
                  required
                  placeholder="27AABCS1429B1Z8"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contractor Class</label>
                <select
                  value={contractorClass}
                  onChange={(e) => setContractorClass(e.target.value)}
                  className="w-full h-10 px-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:border-blue-500 focus:outline-none"
                >
                  <option value="Class 1 (Unlimited)">Class 1 (Unlimited)</option>
                  <option value="Class 2 (Up to ₹50 Cr)">Class 2 (Up to ₹50 Cr)</option>
                  <option value="Class 3 (Up to ₹15 Cr)">Class 3 (Up to ₹15 Cr)</option>
                  <option value="Class 4 (Up to ₹5 Cr)">Class 4 (Up to ₹5 Cr)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#1e40af] text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1d4ed8] disabled:opacity-50 cursor-pointer"
            >
              {busy ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Submitting Enrolment Application...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                  <span>Submit Contractor Enrolment</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-xs sm:text-sm">
            <span className="text-slate-500">Already registered?</span>
            <a href="/contractor/login" className="font-semibold text-[#1e40af] hover:text-[#1d4ed8] hover:underline">
              Sign In to Portal
            </a>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Official Infrastructure Monitoring &amp; Verification Network • Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}
