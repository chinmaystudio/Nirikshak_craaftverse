import { useEffect } from 'react';
import { usePath, navigate, match, Link } from './lib/router';
import { StoreProvider } from './lib/store';
import Layout from './components/Layout';
import { useAuth } from '@/core/auth/useAuth';
import { CONTRACTOR_ROLES } from '@/core/auth/auth.types';
import { AccessDeniedPage } from '@/core/auth/AccessDeniedPage';

import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Performance from './pages/Performance';
import CalendarPage from './pages/CalendarPage';
import AIAssist from './pages/AIAssist';
import Notifications from './pages/Notifications';
import Tenders from './pages/Tenders';
import TenderDetails from './pages/TenderDetails';
import BidSubmission from './pages/BidSubmission';
import BidAIAssist from './pages/BidAIAssist';
import ProjectLayout from './pages/project/ProjectLayout';

import ContractorLoginPage from './pages/auth/ContractorLoginPage';
import ContractorRegisterPage from './pages/auth/ContractorRegisterPage';
import ContractorForgotPasswordPage from './pages/auth/ContractorForgotPasswordPage';
import ContractorResetPasswordPage from './pages/auth/ContractorResetPasswordPage';

const PROJECT_SECTIONS = ['details', 'resources', 'finance', 'ai-guide', 'bills', 'analytics', 'inspection', 'update', 'ai-analysis', 'ai-completion', 'communication'];

function Router() {
  const path = usePath();
  const { session, role, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (path === '/' || path === '' || path === '/contractor' || path === '/contractor/' || path === 'contractor') {
      navigate('/dashboard');
    }
  }, [path]);

  const activePath = (path === '/' || path === '' || path === '/contractor' || path === '/contractor/' || path === 'contractor') ? '/dashboard' : path;

  // Public Contractor Auth Routes
  if (activePath === '/login' || activePath.endsWith('/login')) {
    return <ContractorLoginPage />;
  }
  if (activePath === '/register' || activePath.endsWith('/register')) {
    return <ContractorRegisterPage />;
  }
  if (activePath === '/forgot-password' || activePath.endsWith('/forgot-password')) {
    return <ContractorForgotPasswordPage />;
  }
  if (activePath === '/reset-password' || activePath.endsWith('/reset-password')) {
    return <ContractorResetPasswordPage />;
  }

  // Authentication & Role clearance check
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-3 border-blue-600 border-t-transparent animate-spin" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Validating contractor clearance…
        </span>
      </div>
    );
  }

  if (!isAuthenticated || !session) {
    return <ContractorLoginPage />;
  }

  if (!role || !(CONTRACTOR_ROLES as readonly string[]).includes(role)) {
    return <AccessDeniedPage currentRole={role} allowedRoles={CONTRACTOR_ROLES} pendingApproval={session.pendingApproval} />;
  }

  // Tender routes
  let m = match('/tenders/:tenderId/bid/ai-assist', activePath);
  if (m) return <Layout><BidAIAssist tenderId={m.tenderId} /></Layout>;
  m = match('/tenders/:tenderId/bid', activePath);
  if (m) return <Layout><BidSubmission tenderId={m.tenderId} /></Layout>;
  m = match('/tenders/:tenderId', activePath);
  if (m) return <Layout><TenderDetails tenderId={m.tenderId} /></Layout>;
  m = match('/tenders', activePath);
  if (m) return <Layout><Tenders /></Layout>;

  // Project workspace routes
  m = match('/projects/:projectId/:section', activePath);
  if (m && PROJECT_SECTIONS.includes(m.section)) {
    return <Layout><ProjectLayout projectId={m.projectId} section={m.section} /></Layout>;
  }
  m = match('/projects/:projectId', activePath);
  if (m) return <Layout><ProjectLayout projectId={m.projectId} section="details" /></Layout>;
  m = match('/projects', activePath);
  if (m) return <Layout><Projects /></Layout>;

  // Top-level routes
  switch (activePath) {
    case '/dashboard':
      return <Layout><Dashboard /></Layout>;
    case '/performance':
      return <Layout><Performance /></Layout>;
    case '/calendar':
      return <Layout><CalendarPage /></Layout>;
    case '/ai-assist':
      return <Layout><AIAssist /></Layout>;
    case '/notifications':
      return <Layout><Notifications /></Layout>;
  }

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto pt-16 text-center">
        <p className="font-display font-extrabold text-6xl text-slate-200 dark:text-slate-800">404</p>
        <h1 className="font-display font-bold text-2xl text-slate-800 mt-2 dark:text-slate-100">Page not found</h1>
        <p className="text-sm text-slate-500 mt-2 dark:text-slate-400">
          The page <code className="font-mono text-xs bg-slate-100 rounded px-1.5 py-0.5 dark:bg-slate-800">{path}</code> does not exist in the Contractor Portal.
        </p>
        <div className="flex justify-center gap-2.5 mt-6">
          <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
          <Link to="/projects" className="btn btn-secondary">My Projects</Link>
        </div>
      </div>
    </Layout>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Router />
    </StoreProvider>
  );
}
