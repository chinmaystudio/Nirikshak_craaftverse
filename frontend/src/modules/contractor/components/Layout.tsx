import { useEffect, useRef, useState } from 'react';
import { usePath, match } from '../lib/router';
import Header from './Header';
import Navbar, { MobileNavDrawer } from './Navbar';
import { Toasts } from './ui';
import { useStore } from '../lib/store';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const path = usePath();
  const { toasts, dismissToast } = useStore();
  const mainRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setNavOpen(false);
    if (mainRef.current) mainRef.current.scrollTop = 0;
    window.scrollTo({ top: 0 });
  }, [path]);

  // Close the mobile nav when navigating into a project workspace section
  useEffect(() => {
    const m = match('/projects/:projectId/:section', path);
    if (m) setNavOpen(false);
  }, [path]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 dark:bg-[#0b1120] dark:text-slate-100">
      <Header onMenu={() => setNavOpen(true)} />
      <Navbar />
      <MobileNavDrawer open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="pt-16 lg:pt-28">
        <main ref={mainRef} className="min-h-[calc(100vh-7rem)]">
          {children}
        </main>
        <footer className="border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <p className="text-[11px] text-slate-600 font-bold dark:text-slate-300">
                NIRIKSHAK — Government Project Monitoring &amp; Accountability Platform
              </p>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wide mt-0.5 dark:text-slate-500">
                TRANSPARENT PROJECTS • STRONGER INDIA — Contractor Portal
              </p>
            </div>
            {(import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.VITE_USE_MOCK_API === 'true') ? (
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                © 2026 Government of Maharashtra • Demonstration environment, data is illustrative
              </p>
            ) : null}
          </div>
        </footer>
      </div>
      <Toasts items={toasts} onDismiss={dismissToast} />
    </div>
  );
}
