import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../core/auth/AuthProvider';

const GovernmentModule = React.lazy(() => import('../modules/government/App'));
const ContractorModule = React.lazy(() => import('../modules/contractor/App'));
const UserModule = React.lazy(() => import('../modules/user/app/App').then((m) => ({ default: m.App })));

class RootErrorBoundary extends React.Component<
  { portal: string; children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { portal: string; children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[NIRIKSHAK ${this.props.portal} Portal Error]`, error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center text-2xl font-bold mb-4">
            ⚠️
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">NIRIKSHAK System Notice</h1>
          <p className="text-sm text-slate-400 max-w-md mb-4 leading-relaxed">
            The <span className="text-blue-400 font-semibold uppercase">{this.props.portal}</span> portal encountered an issue while loading.
          </p>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-amber-400 max-w-xl mb-6 overflow-auto text-left shadow-inner">
            {this.state.error.message || String(this.state.error)}
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => {
                this.setState({ error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              Reload Page
            </button>
            <a
              href="/"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-semibold transition-colors"
            >
              Citizen Overview
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function normalizeLegacyLocation(): void {
  // CRITICAL: Do NOT alter hash if it contains Supabase Auth OAuth tokens or error callbacks!
  if (
    window.location.hash.includes('access_token=') ||
    window.location.hash.includes('refresh_token=') ||
    window.location.hash.includes('error=') ||
    window.location.hash.includes('error_description=')
  ) {
    return;
  }

  const rawHash = window.location.hash;
  // If not a routing hash, preserve standard anchor scrolling (e.g. #hero, #how-it-works)
  if (!rawHash || (!rawHash.startsWith('#/') && !rawHash.startsWith('#contractor/') && !rawHash.startsWith('#government/') && !rawHash.startsWith('#user/'))) {
    return;
  }

  const pathname = window.location.pathname.replace(/\\/g, '/');
  const hash = rawHash.replace(/^#\/?/, '');
  if (!hash) return;

  let target: string | null = null;
  if (pathname.startsWith('/contractor')) target = `/contractor/${hash}`;
  else if (pathname.startsWith('/government')) target = `/government/${hash}`;
  else if (hash.startsWith('contractor/')) target = `/${hash}`;
  else if (hash.startsWith('government/')) target = `/${hash}`;
  else if (hash.startsWith('user/')) target = `/${hash}`;
  else target = `/user/${hash}`;

  const normalized = target.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/user';
  window.history.replaceState(null, '', `${normalized}${window.location.search}`);
}

normalizeLegacyLocation();

function detectPortal(): 'government' | 'contractor' | 'user' {
  const p = window.location.pathname.toLowerCase().replace(/\\/g, '/');
  if (p === '/reset-password') return 'government';
  if (p === '/government' || p.startsWith('/government/')) return 'government';
  if (p === '/contractor' || p.startsWith('/contractor/')) return 'contractor';
  return 'user';
}

export function App() {
  const [currentPortal, setCurrentPortal] = useState<'government' | 'contractor' | 'user'>(detectPortal);

  useEffect(() => {
    const handleLocation = () => {
      const nextPortal = detectPortal();
      setCurrentPortal(nextPortal);
      // Clean up dark mode from previous portal
      document.documentElement.classList.remove('dark');
      document.body.className = `portal-root portal-root-${nextPortal}`;
    };

    // Initialize body class
    document.body.className = `portal-root portal-root-${detectPortal()}`;

    window.addEventListener('popstate', handleLocation);
    window.addEventListener('hashchange', handleLocation);
    return () => {
      window.removeEventListener('popstate', handleLocation);
      window.removeEventListener('hashchange', handleLocation);
    };
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <React.Suspense
          fallback={
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-xs font-bold tracking-widest uppercase text-slate-500">Loading NIRIKSHAK...</p>
            </div>
          }
        >
          {currentPortal === 'government' && (
            <div className="portal-government min-h-screen">
              <RootErrorBoundary portal="Government">
                <GovernmentModule />
              </RootErrorBoundary>
            </div>
          )}
          {currentPortal === 'contractor' && (
            <div className="portal-contractor min-h-screen">
              <RootErrorBoundary portal="Contractor">
                <ContractorModule />
              </RootErrorBoundary>
            </div>
          )}
          {currentPortal === 'user' && (
            <div className="portal-citizen min-h-screen">
              <RootErrorBoundary portal="Citizen">
                <UserModule />
              </RootErrorBoundary>
            </div>
          )}
        </React.Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
