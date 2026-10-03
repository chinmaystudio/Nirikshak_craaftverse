import { useEffect, useState } from 'react';
import { Link } from '../lib/router';
import { cls } from '../lib/utils';
import { ProgressBar } from './ui';
import type { Project } from '../lib/data';
import {
  LayoutList, Users, Wallet, Sparkles, Receipt, BarChart3, ShieldCheck, FileUp,
  Activity, CalendarClock, MessagesSquare,
} from 'lucide-react';

export const PROJECT_SECTIONS = [
  { key: 'details', label: 'Project Details', icon: LayoutList },
  { key: 'resources', label: 'Resource Management', icon: Users },
  { key: 'finance', label: 'Finance & Payments', icon: Wallet },
  { key: 'ai-guide', label: 'AI Guide', icon: Sparkles },
  { key: 'bills', label: 'Bills & Invoices', icon: Receipt },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'inspection', label: 'Inspection & Compliance', icon: ShieldCheck },
  { key: 'update', label: 'Report Update', icon: FileUp },
  { key: 'ai-analysis', label: 'AI Project Analysis', icon: Activity },
  { key: 'ai-completion', label: 'AI Completion Prediction', icon: CalendarClock },
  { key: 'communication', label: 'Government Communication', icon: MessagesSquare },
];

export default function ProjectSidebar({ project, path }: { project: Project; path: string }) {
  const base = `/projects/${project.id}`;
  const [drawer, setDrawer] = useState(false);

  useEffect(() => setDrawer(false), [path]);

  const nav = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800">
        <Link to="/projects" className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-blue-700 dark:text-slate-400">
          ← My Projects
        </Link>
        <p className="text-sm font-bold text-slate-800 mt-2 leading-snug dark:text-slate-100">{project.name}</p>
        <p className="text-[10px] text-slate-500 font-semibold mt-0.5 dark:text-slate-400">{project.code}</p>
        <div className="flex items-center gap-2 mt-2.5">
          <ProgressBar value={project.progress} height="h-2" className="flex-1" />
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{project.progress}%</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Project workspace navigation">
        <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Workspace</p>
        <div className="flex flex-col gap-0.5">
          {PROJECT_SECTIONS.map((s) => {
            const to = `${base}/${s.key}`;
            const active = path === to;
            return (
              <Link key={s.key} to={to} onClick={() => setDrawer(false)} className="contents">
                <span className={cls('nav-item py-[7px]', active && 'nav-item-active')}>
                  {active && <span className="absolute left-0 top-1 bottom-1 w-1 rounded-full bg-blue-600 dark:bg-blue-500" aria-hidden />}
                  <s.icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 truncate text-[13px]">{s.label}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="border-t border-slate-200 p-3 flex flex-col gap-2 dark:border-slate-800">
        <Link to={`${base}/update`} onClick={() => setDrawer(false)}>
          <button className="btn btn-primary btn-sm w-full">Update Progress</button>
        </Link>
        <Link to={`${base}/communication`} onClick={() => setDrawer(false)}>
          <button className="btn btn-secondary btn-sm w-full">Contact Government</button>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed top-28 bottom-0 left-0 w-64 hidden lg:block border-r border-slate-200 bg-white z-30 dark:bg-sidebar dark:border-slate-800">
        {nav}
      </aside>

      {/* Mobile drawer */}
      <div className={cls('fixed inset-0 z-[60] lg:hidden', drawer ? '' : 'pointer-events-none')} aria-hidden={!drawer}>
        <div className={cls('absolute inset-0 bg-slate-900/50 transition-opacity', drawer ? 'opacity-100' : 'opacity-0')} onClick={() => setDrawer(false)} />
        <aside
          className={cls('absolute top-0 bottom-0 left-0 w-72 bg-white dark:bg-sidebar dark:border-slate-800 shadow-xl transition-transform duration-200 overflow-y-auto', drawer ? 'translate-x-0' : '-translate-x-full')}
          role="dialog"
          aria-label="Project workspace menu"
        >
          {nav}
        </aside>
      </div>

      {/* Floating workspace menu button (mobile) */}
      <button
        className="lg:hidden fixed bottom-4 left-4 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-blue-700 text-white text-xs font-bold shadow-lg cursor-pointer"
        onClick={() => setDrawer(true)}
        aria-label="Open project workspace menu"
      >
        ☰ Workspace
      </button>
    </>
  );
}
