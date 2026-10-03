import { useMemo, useState } from 'react';
import { Bell, CheckCheck, ArrowRight, Circle } from 'lucide-react';
import { PageHeader, Card, EmptyState, Pills } from '../components/ui';
import { useStore } from '../lib/store';
import { Link } from '../lib/router';
import { cls, timeAgo } from '../lib/utils';
import type { NotifCategory } from '../lib/data';

const CATS: (NotifCategory | 'All')[] = ['All', 'Project', 'Tender', 'Finance', 'Inspection', 'Government', 'Compliance', 'AI Alerts'];

const CAT_ICON: Record<NotifCategory, { bg: string; fg: string }> = {
  Project: { bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/60 dark:border-blue-900', fg: 'text-blue-700 dark:text-blue-400' },
  Tender: { bg: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/60 dark:border-indigo-900', fg: 'text-indigo-700 dark:text-indigo-300' },
  Finance: { bg: 'bg-green-50 border-green-200 dark:bg-green-950/60 dark:border-green-900', fg: 'text-green-700 dark:text-green-400' },
  Inspection: { bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/60 dark:border-amber-900', fg: 'text-amber-700 dark:text-amber-400' },
  Government: { bg: 'bg-red-50 border-red-200 dark:bg-red-950/60 dark:border-red-900', fg: 'text-red-600' },
  Compliance: { bg: 'bg-purple-50 border-purple-200 dark:bg-purple-950/60 dark:border-purple-900', fg: 'text-purple-700 dark:text-purple-300' },
  'AI Alerts': { bg: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-950/60 dark:border-cyan-900', fg: 'text-cyan-700 dark:text-cyan-300' },
};

export default function Notifications() {
  const { notifications, markRead, markAllRead, unread, toast } = useStore();
  const [cat, setCat] = useState<string>('All');

  const filtered = useMemo(
    () => notifications.filter((n) => cat === 'All' || n.category === cat).sort((a, b) => Number(a.read) - Number(b.read) || b.time.localeCompare(a.time)),
    [notifications, cat]
  );

  const counts = useMemo(() => {
    const m: Record<string, number> = { All: notifications.length };
    for (const n of notifications) m[n.category] = (m[n.category] ?? 0) + 1;
    return m;
  }, [notifications]);

  return (
    <div className="p-4 lg:p-6 lg:py-8 max-w-[1100px] mx-auto space-y-5">
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread of ${notifications.length} — project, tender, finance, inspection, government, compliance and AI alerts`}
        actions={
          <button
            className="btn btn-secondary"
            onClick={() => {
              markAllRead();
              toast('success', 'All notifications marked as read');
            }}
            disabled={unread === 0}
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {CATS.map((c) => (
          <button key={c} className={cls('pill', cat === c ? 'pill-active' : 'pill-idle')} onClick={() => setCat(c)}>
            {c}
            {counts[c] !== undefined && <span className="ml-1.5 opacity-70">{counts[c]}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-6">
          <EmptyState icon={Bell} title="No notifications" msg="You have no notifications in this category. New alerts will appear here as work progresses." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((n) => {
              const icon = CAT_ICON[n.category];
              return (
                <li key={n.id} className={cls('flex gap-4 px-5 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50', !n.read && 'bg-blue-50/40 dark:bg-blue-950/20')}>
                  <div className={cls('w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 mt-0.5', icon.bg)}>
                    <Bell className={cls('w-5 h-5', icon.fg)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={cls('text-sm leading-snug', n.read ? 'font-semibold text-slate-700 dark:text-slate-300' : 'font-bold text-slate-900 dark:text-slate-100')}>
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed dark:text-slate-400">{n.body}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                          {n.project && <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{n.project}</span>}
                          {n.amount && <span className="text-[11px] font-bold text-green-700 dark:text-green-400">{n.amount}</span>}
                          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{n.category}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{timeAgo(n.time)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {!n.read && (
                          <>
                            <Circle className="w-2.5 h-2.5 fill-blue-600 text-blue-600" aria-label="Unread" />
                            <button className="link text-[11px]" onClick={() => markRead(n.id)}>
                              Mark as read
                            </button>
                          </>
                        )}
                        {n.link && (
                          <Link to={n.link} className="btn btn-secondary btn-sm whitespace-nowrap">
                            View <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
