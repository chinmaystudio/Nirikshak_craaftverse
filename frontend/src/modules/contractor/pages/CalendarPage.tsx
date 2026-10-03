import { useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader, Card, SectionTitle } from '../components/ui';
import { CALENDAR_EVENTS } from '../lib/data';
import { Link, navigate } from '../lib/router';
import { cls, fmtDate, NOW } from '../lib/utils';
import type { EventType } from '../lib/data';

const FILTERS: { key: string; label: string; types: EventType[] }[] = [
  { key: 'All', label: 'All', types: ['Project', 'Inspection', 'Payment', 'Tender', 'Government', 'Compliance'] },
  { key: 'Projects', label: 'Projects', types: ['Project'] },
  { key: 'Inspections', label: 'Inspections', types: ['Inspection'] },
  { key: 'Payments', label: 'Payments', types: ['Payment'] },
  { key: 'Tenders', label: 'Tenders', types: ['Tender'] },
  { key: 'Government', label: 'Government', types: ['Government'] },
];

const TYPE_DOT: Record<EventType, string> = {
  Project: 'bg-blue-700',
  Inspection: 'bg-amber-500',
  Payment: 'bg-green-600',
  Tender: 'bg-blue-900',
  Government: 'bg-red-600',
  Compliance: 'bg-purple-600',
};

const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarPage() {
  const [filter, setFilter] = useState('All');
  const [month, setMonth] = useState(8); // Sep (0-indexed)
  const [year, setYear] = useState(2026);
  const [selected, setSelected] = useState('2026-09-11');

  const types = FILTERS.find((f) => f.key === filter)?.types ?? FILTERS[0].types;
  const events = useMemo(() => CALENDAR_EVENTS.filter((e) => types.includes(e.type)), [filter]);

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const arr: { date: string | null; day: number | null }[] = [];
    for (let i = 0; i < startOffset; i++) arr.push({ date: null, day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      arr.push({ date: ds, day: d });
    }
    while (arr.length % 7 !== 0) arr.push({ date: null, day: null });
    return arr;
  }, [month, year]);

  const todayStr = `${NOW.getFullYear()}-${String(NOW.getMonth() + 1).padStart(2, '0')}-${String(NOW.getDate()).padStart(2, '0')}`;
  const selectedEvents = events.filter((e) => e.date === selected);
  const upcoming = [...events].filter((e) => e.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 7);

  const prev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const next = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  return (
    <div className="p-4 lg:p-6 lg:py-8 max-w-[1600px] mx-auto space-y-5">
      <PageHeader title="Calendar" subtitle="Milestones, inspections, payments, tender deadlines and government meetings" />

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={cls('pill', filter === f.key ? 'pill-active' : 'pill-idle')}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
        <Card>
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            <button className="btn btn-ghost btn-sm" onClick={prev} aria-label="Previous month">
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300">
              <Calendar className="w-5 h-5" />
              <h3 className="font-bold text-[15px]">{MONTHS[month]} {year}</h3>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={next} aria-label="Next month">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800">
              {WD.map((d) => (
                <div key={d} className="bg-slate-50 dark:bg-slate-800/60 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {d}
                </div>
              ))}
              {cells.map((c, i) => {
                const evs = c.date ? events.filter((e) => e.date === c.date) : [];
                const isToday = c.date === todayStr;
                const isSel = c.date === selected;
                return (
                  <button
                    key={i}
                    disabled={!c.date}
                    onClick={() => c.date && setSelected(c.date)}
                    className={cls(
                      'bg-white dark:bg-slate-900 min-h-[86px] p-2 text-left align-top transition-colors',
                      c.date ? 'hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer' : 'cursor-default',
                      isSel && 'ring-2 ring-inset ring-blue-600',
                      isToday && 'bg-blue-50/60 dark:bg-blue-950/30'
                    )}
                    aria-label={c.date ? `${fmtDate(c.date)} — ${evs.length} events` : undefined}
                  >
                    {c.day && (
                      <>
                        <span className={cls('text-[11px] font-bold', isToday ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300')}>{c.day}</span>
                        {isToday && <span className="ml-1 text-[9px] font-bold uppercase text-blue-700 dark:text-blue-400">Today</span>}
                        <div className="mt-1 flex flex-col gap-1">
                          {evs.slice(0, 2).map((e) => (
                            <span key={e.title} className="flex items-center gap-1 min-w-0">
                              <span className={cls('w-1.5 h-1.5 rounded-full shrink-0', TYPE_DOT[e.type])} />
                              <span className="text-[9px] font-semibold text-slate-600 truncate dark:text-slate-400">{e.title.replace(/\s*\(p\d\)/, '').replace(/—.*$/, '')}</span>
                            </span>
                          ))}
                          {evs.length > 2 && <span className="text-[9px] font-bold text-slate-400">+{evs.length - 2} more</span>}
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-4 pb-4">
            {(Object.keys(TYPE_DOT) as EventType[]).map((t) => (
              <div key={t} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                <span className={cls('w-2.5 h-2.5 rounded-full', TYPE_DOT[t])} />
                {t}
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <SectionTitle icon={Calendar} title={`Selected — ${fmtDate(selected)}`} />
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-slate-500 font-medium py-6 text-center dark:text-slate-400">No events scheduled on this date.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {selectedEvents.map((e) => (
                  <button
                    key={e.title}
                    className="text-left rounded-lg border border-slate-200 p-3.5 hover:border-blue-300 transition-colors cursor-pointer dark:border-slate-700"
                    onClick={() => e.link && navigate(e.link)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cls('w-2 h-2 rounded-full', TYPE_DOT[e.type])} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{e.type}</span>
                      {e.time && <span className="text-[10px] font-bold text-slate-500">• {e.time} IST</span>}
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{e.title}</p>
                    {e.link && <span className="link text-xs mt-1 inline-block">Open related page →</span>}
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <SectionTitle icon={Calendar} title="Upcoming" />
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {upcoming.map((e) => (
                <Link key={e.title} to={e.link ?? '/calendar'} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 hover:opacity-80">
                  <div className="w-10 shrink-0 text-center">
                    <p className="text-[10px] font-bold uppercase text-slate-400">{MONTHS[Number(e.date.slice(5, 7)) - 1].slice(0, 3)}</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{Number(e.date.slice(8, 10))}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate dark:text-slate-200">{e.title}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{e.type}{e.time ? ` • ${e.time}` : ''}</p>
                  </div>
                  <span className={cls('w-2 h-2 rounded-full shrink-0', TYPE_DOT[e.type])} />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
