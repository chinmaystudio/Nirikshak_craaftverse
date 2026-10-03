import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TextField } from '@/components/ui/Fields';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AuthService } from '@/core/auth/auth.service';

export function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('Public Works Department (PWD)');
  const [designation, setDesignation] = useState('');
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
      await AuthService.registerGovernment({
        fullName: fullName.trim(),
        officialEmail: officialEmail.trim(),
        employeeId: employeeId.trim(),
        department: department.trim(),
        designation: designation.trim(),
        state: state.trim(),
        district: district.trim(),
        password,
      });
      setSubmitted(true);
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMsg(err.message || 'Registration failed. Please check your details.');
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <Card className="p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-accent-tint text-accent flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-[28px]">verified_user</span>
        </div>
        <h1 className="text-heading-2 text-fg">Clearance Request Submitted</h1>
        <p className="mt-2 text-body-small text-fg-muted max-w-sm mx-auto">
          Your government registration for <strong className="text-fg">{officialEmail}</strong> has been logged.
        </p>
        <div className="mt-4 rounded-control border border-warning-border bg-warning-tint p-3 text-caption text-warning-strong text-left">
          <div className="font-semibold flex items-center gap-1.5 mb-1">
            <span className="material-symbols-outlined text-[16px]">hourglass_top</span>
            Status: PENDING REVIEW
          </div>
          <p>
            In accordance with Government of India and Nirikshak security protocols, self-registration does not automatically grant privileged administrative access. An authorized department administrator will verify your Employee ID and activate your portal credentials.
          </p>
        </div>
        <div className="mt-6">
          <Link
            to="/government/login"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-control text-body-small font-semibold hover:bg-primary-strong transition-colors"
          >
            Return to Government Sign In
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h1 className="text-heading-2 text-fg">Officer Registration</h1>
      <p className="mt-1 text-body-small text-fg-muted">
        Apply for official NIRIKSHAK government monitoring clearance
      </p>

      {errorMsg && (
        <div className="mt-4 rounded-control border border-danger-border bg-danger-tint p-3 text-body-small text-danger-strong flex items-start gap-2">
          <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3.5">
        <TextField
          label="Full Official Name"
          required
          placeholder="Er. Rajesh Patil"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            label="Official Govt Email"
            type="email"
            required
            placeholder="officer@pwd.gov.in"
            value={officialEmail}
            onChange={(e) => setOfficialEmail(e.target.value)}
          />
          <TextField
            label="Employee ID / Service No."
            required
            placeholder="PWD-MH-2024-8841"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-body-small font-medium text-fg">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="h-10 px-3 rounded-control border border-border bg-canvas text-fg text-body-small focus:border-primary focus:outline-none"
            >
              <option value="Public Works Department (PWD)">Public Works Department (PWD)</option>
              <option value="Pune Municipal Corporation (PMC)">Pune Municipal Corporation (PMC)</option>
              <option value="PMRDA Infrastructure Cell">PMRDA Infrastructure Cell</option>
              <option value="Irrigation & Water Resources">Irrigation & Water Resources</option>
              <option value="Maharashtra Metro Rail Corp (MahaMetro)">MahaMetro</option>
            </select>
          </div>
          <TextField
            label="Designation / Post"
            required
            placeholder="Executive Engineer"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            label="State"
            required
            value={state}
            onChange={(e) => setState(e.target.value)}
          />
          <TextField
            label="District / Division"
            required
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            label="Portal Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            label="Confirm Password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <div className="mt-2">
          <Button type="submit" size="lg" block icon="how_to_reg" disabled={busy}>
            {busy ? 'Submitting Application...' : 'Submit Verification Request'}
          </Button>
        </div>
      </form>

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-body-small">
        <span className="text-fg-muted">Already cleared?</span>
        <Link to="/government/login" className="font-medium text-primary-strong hover:underline">
          Sign In
        </Link>
      </div>
    </Card>
  );
}
