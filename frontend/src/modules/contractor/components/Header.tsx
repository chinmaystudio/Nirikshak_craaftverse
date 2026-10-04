import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, Moon, Sun, Bell, ChevronDown, Contrast, Accessibility, Menu, Check,
  FileText, ArrowRight, Circle, LogOut,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { Link, navigate } from '../lib/router';
import { cls } from '../lib/utils';
import Logo from './Logo';
import { Avatar, Dropdown } from './ui';
import { useAuth } from '@/core/auth/useAuth';
import { RealtimeStatusIndicator } from '@/core/realtime/RealtimeStatusIndicator';


const LANGS = ['English', 'मराठी', 'हिंदी'];

export default function Header({ onMenu }: { onMenu: () => void }) {
  const { theme, toggleTheme, fontScale, stepFont, a11y, toggleA11y, lang, setLang, notifications, unread, markRead, projects } = useStore();
  const { session, signOut } = useAuth();
  const contractorName = session?.profile?.full_name || session?.organization?.name || 'Contractor user';
  const contractorOrg = session?.organization?.name || 'Organization not available';
  const contractorId = session?.organization?.id ? `ORG-${session.organization.id.slice(0, 8).toUpperCase()}` : 'Organization ID not available';
  const searchRef = useRef<HTMLInputElement>(null);

  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'SELECT') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const recent = notifications.slice(0, 5);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const r: { label: string; sub: string; to: string }[] = [];
    r.push({ label: 'Dashboard', sub: 'Page', to: '/dashboard' });
    r.push({ label: 'My Projects', sub: 'Page', to: '/projects' });
    r.push({ label: 'My Performance', sub: 'Page', to: '/performance' });
    r.push({ label: 'Tender Management', sub: 'Page', to: '/tenders' });
    r.push({ label: 'AI Assist', sub: 'Page', to: '/ai-assist' });
    r.push({ label: 'Calendar', sub: 'Page', to: '/calendar' });
    r.push({ label: 'Notifications', sub: 'Page', to: '/notifications' });
    return r
      .filter((x) => x.label.toLowerCase().includes(term))
      .concat(
        projects
          .map((project) => ({ label: project.name, sub: project.code || 'Project', to: `/projects/${project.id}/details` }))
          .filter((e) => e.label.toLowerCase().includes(term) || e.sub.toLowerCase().includes(term))
      )
      .slice(0, 8);
  }, [q, projects]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800">
      <div className="h-full w-full px-4 lg:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <button
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={onMenu}
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/dashboard">
            <Logo />
          </Link>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-2xl mx-auto px-4 hidden md:block relative">
          <div
            className={cls(
              'relative w-full flex items-center bg-slate-50 rounded-md px-3 py-2 border shadow-sm transition-all dark:bg-slate-800',
              focused
                ? 'bg-white ring-2 ring-blue-500/20 border-blue-500 dark:bg-slate-800'
                : 'border-slate-200 dark:border-slate-700'
            )}
          >
            <Search className="text-slate-400 w-4 h-4 mr-2 shrink-0" />
            <input
              ref={searchRef}
              className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-200"
              placeholder="Search projects, tenders, pages…"
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => window.setTimeout(() => setFocused(false), 150)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && results[0]) {
                  navigate(results[0].to);
                  setQ('');
                }
              }}
            />
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-400 font-bold border border-slate-200 shrink-0 shadow-sm dark:bg-slate-900 dark:border-slate-700">/</kbd>
          </div>
          {focused && results.length > 0 && (
            <div className="card absolute left-4 right-4 top-full mt-1.5 shadow-lg z-[60] py-1.5 max-h-[380px] overflow-y-auto">
              {results.map((r) => (
                <button
                  key={r.to + r.label}
                  className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
                  onClick={() => {
                    navigate(r.to);
                    setQ('');
                  }}
                >
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{r.label}</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{r.sub}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          <RealtimeStatusIndicator className="hidden text-slate-500 xl:inline-flex" />
          <div className="hidden sm:flex items-center bg-slate-50 rounded-md p-1 border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
            <button className="px-2 py-1 text-xs font-bold text-slate-600 hover:bg-white rounded hover:shadow-sm transition-all cursor-pointer dark:text-slate-300 dark:hover:bg-slate-700" onClick={() => stepFont(-1)} aria-label="Decrease text size" disabled={fontScale <= 0.875}>
              A-
            </button>
            <button className="px-2 py-1 text-xs font-bold text-slate-600 hover:bg-white rounded hover:shadow-sm transition-all cursor-pointer dark:text-slate-300 dark:hover:bg-slate-700" onClick={() => stepFont(1)} aria-label="Increase text size" disabled={fontScale >= 1.25}>
              A+
            </button>
          </div>

          <button
            className={cls('hidden md:flex w-8 h-8 items-center justify-center rounded-full transition-colors', a11y.hc ? 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800')}
            onClick={() => toggleA11y('hc')}
            aria-label="Toggle high contrast"
            aria-pressed={a11y.hc}
            title="High contrast"
          >
            <Contrast className="w-4 h-4" />
          </button>

          <Dropdown
            width="w-72"
            buttonClass={cls('w-8 h-8 flex items-center justify-center rounded-full transition-colors', a11y.hc || a11y.rm || a11y.ul ? 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800')}
            button={<Accessibility className="w-4 h-4" />}
          >
            {() => (
              <div className="py-2" role="menu" aria-label="Accessibility options">
                <p className="px-4 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Accessibility Controls</p>
                {([
                  { k: 'hc' as const, label: 'High contrast' },
                  { k: 'rm' as const, label: 'Reduce motion' },
                  { k: 'ul' as const, label: 'Underline links' },
                ]).map((o) => (
                  <button key={o.k} className="w-full flex items-center justify-between px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer" onClick={() => toggleA11y(o.k)} role="menuitemcheckbox" aria-checked={a11y[o.k]}>
                    {o.label}
                    <span className={cls('w-4 h-4 rounded border flex items-center justify-center', a11y[o.k] ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600')}>
                      {a11y[o.k] && <Check className="w-3 h-3 text-white" />}
                    </span>
                  </button>
                ))}
                <div className="mt-1.5 pt-1.5 border-t border-slate-100 px-4 py-2 dark:border-slate-800">
                  <p className="text-[10px] text-slate-400">Keyboard: <kbd className="font-bold">/</kbd> search · <kbd className="font-bold">Esc</kbd> close</p>
                </div>
              </div>
            )}
          </Dropdown>

          <Dropdown
            width="w-44"
            buttonClass="hidden sm:flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-slate-100 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:bg-slate-800"
            button={
              <>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{lang}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </>
            }
          >
            {(close) => (
              <div className="py-1.5" role="menu" aria-label="Select language">
                {LANGS.map((l) => (
                  <button
                    key={l}
                    className={cls('w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer', l === lang ? 'font-bold text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200')}
                    onClick={() => {
                      setLang(l);
                      close();
                    }}
                    role="menuitem"
                  >
                    {l}
                    {l === lang && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
                <p className="px-4 pt-1.5 pb-1 text-[10px] text-slate-400">Documents continue in English</p>
              </div>
            )}
          </Dropdown>

          <button
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <Dropdown
            width="w-[380px]"
            buttonClass="relative w-8 h-8 flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer dark:text-slate-300 dark:hover:bg-slate-800"
            button={
              <>
                <Bell className="w-4 h-4" />
                {unread > 0 && <span className="absolute top-1 right-1.5 min-w-2 h-2 px-0.5 bg-red-600 rounded-full border-2 border-white dark:border-slate-900" aria-label={`${unread} unread notifications`} />}
              </>
            }
          >
            {(close) => (
              <div className="py-2" role="menu" aria-label="Recent notifications">
                <div className="flex items-center justify-between px-4 pb-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Notifications</p>
                  {unread > 0 && <span className="text-[10px] font-bold text-red-600">{unread} unread</span>}
                </div>
                {recent.map((n) => (
                  <Link
                    key={n.id}
                    to={n.link ?? '/notifications'}
                    onClick={() => {
                      markRead(n.id);
                      close();
                    }}
                    className="block px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={cls('text-[13px] leading-snug', n.read ? 'text-slate-600 dark:text-slate-300 font-medium' : 'text-slate-800 font-bold dark:text-slate-100')}>{n.title}</p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5 dark:text-slate-400">{n.project ?? n.category}</p>
                      </div>
                      {!n.read && <Circle className="w-2 h-2 fill-blue-600 text-blue-600 shrink-0 mt-1.5" />}
                    </div>
                  </Link>
                ))}
                <div className="px-4 pt-2 border-t border-slate-100 mt-1 dark:border-slate-800">
                  <Link to="/notifications" onClick={close} className="flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400">
                    View all <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </Dropdown>

          <Dropdown
            width="w-64"
            buttonClass="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200 ml-1 cursor-pointer dark:border-slate-800"
            button={
              <>
                <Avatar name={contractorName} />
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </>
            }
          >
            {() => (
              <div className="py-2" role="menu" aria-label="Contractor account">
                <div className="px-4 pb-2.5">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{contractorName}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 dark:text-slate-400">{contractorOrg}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{contractorId}</p>
                  <span className="inline-flex mt-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300">
                    {session?.role ? session.role.replace(/_/g, ' ').toUpperCase() : 'ROLE NOT AVAILABLE'}
                  </span>
                </div>
                {[
                  { label: 'My Performance', to: '/performance', icon: FileText },
                  { label: 'Tender Management', to: '/tenders', icon: FileText },
                  { label: 'Notifications', to: '/notifications', icon: Bell },
                ].map((i) => (
                  <Link key={i.to} to={i.to} className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
                    <i.icon className="w-4 h-4 text-slate-400" />
                    {i.label}
                  </Link>
                ))}
                <div className="border-t border-slate-100 my-1 pt-1 dark:border-slate-800">
                  <button
                    onClick={async () => {
                      await signOut();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 text-left cursor-pointer transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-500" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </Dropdown>

          <div className="lg:hidden">
            <Avatar name={contractorName} />
          </div>
        </div>
      </div>
    </header>
  );
}
