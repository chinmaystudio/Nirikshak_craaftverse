import { LayoutDashboard, Folders, Gauge, Calendar, Sparkles, Bell, Gavel } from 'lucide-react';
import { isActive, Link, usePath } from '../lib/router';
import { cls } from '../lib/utils';
import { useStore } from '../lib/store';
import { CONTRACTOR } from '../lib/data';
import { Avatar } from './ui';
import Logo from './Logo';
import { useAuth } from '@/core/auth/useAuth';

const NAV = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Tenders', to: '/tenders', icon: Gavel },
  { label: 'My Projects', to: '/projects', icon: Folders },
  { label: 'Progress & Reports', to: '/projects', icon: Folders },
  { label: 'Calendar', to: '/calendar', icon: Calendar },
  { label: 'Performance', to: '/performance', icon: Gauge },
  { label: 'Notifications', to: '/notifications', icon: Bell },
  { label: 'AI Assist', to: '/ai-assist', icon: Sparkles },
];

export default function Navbar() {
  const path = usePath();
  const { unread } = useStore();

  return (
    <nav className="fixed top-16 left-0 right-0 z-40 hidden h-12 bg-white border-b border-slate-200 shadow-sm dark:bg-sidebar dark:border-slate-800 lg:block" aria-label="Primary navigation">
      <div className="h-full w-full px-4 lg:px-6 flex items-center">
        <div className="flex-1" />
        <div className="flex items-center h-full gap-1 overflow-x-auto shrink-0 whitespace-nowrap">
          {NAV.map((item) => {
            const active = isActive(path, item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cls(
                  'flex items-center gap-1.5 h-full px-3 border-b-2 transition-colors shrink-0',
                  active
                    ? 'border-blue-600 text-blue-700 bg-blue-50/50 dark:border-blue-500 dark:text-blue-400 dark:bg-blue-950/30'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
                )}
              >
                <item.icon className="w-4 h-4" />
                <span className={cls('text-sm', active ? 'font-semibold' : 'font-medium')}>{item.label}</span>
                {item.label === 'Notifications' && unread > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold shadow-sm">{unread}</span>
                )}
              </Link>
            );
          })}
        </div>
        <div className="flex-1" />
      </div>
    </nav>
  );
}

export function MobileNavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const path = usePath();
  const { unread } = useStore();
  const { session } = useAuth();
  const accountName = session?.organization?.name || session?.profile?.full_name || 'Contractor account';

  return (
    <div className={cls('fixed inset-0 z-[60] lg:hidden', open ? '' : 'pointer-events-none')} aria-hidden={!open}>
      <div className={cls('absolute inset-0 bg-slate-900/50 transition-opacity', open ? 'opacity-100' : 'opacity-0')} onClick={onClose} />
        <aside
          className={cls('absolute top-0 bottom-0 left-0 w-72 bg-white dark:bg-sidebar dark:border-slate-800 shadow-xl transition-transform duration-200 flex flex-col', open ? 'translate-x-0' : '-translate-x-full')}
          role="dialog"
          aria-label="Navigation menu"
        >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <Link to="/dashboard" onClick={onClose}>
            <Logo />
          </Link>
          <button onClick={onClose} className="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close menu">
            <span className="text-xl leading-none">&times;</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pt-4">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Main</p>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} onClick={onClose} className="contents">
                <span className={cls('nav-item', isActive(path, item.to) && 'nav-item-active')}>
                  {isActive(path, item.to) && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-blue-600 dark:bg-blue-500" aria-hidden />}
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.label === 'Notifications' && unread > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold shadow-sm">{unread}</span>
                  )}
                </span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <Link to="/performance" onClick={onClose} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors dark:hover:bg-slate-800">
            <Avatar name={accountName} className="w-9 h-9" />
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-slate-800 truncate dark:text-slate-100">{accountName}</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5 dark:text-slate-400">{session?.role?.replace(/_/g, ' ') || 'Role not available'}</p>
            </div>
          </Link>
        </div>
      </aside>
    </div>
  );
}
