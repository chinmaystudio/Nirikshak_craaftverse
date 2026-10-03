import { useEffect, useState } from 'react';
import { CalendarClock, Sparkles, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, SectionTitle, Loading, ProgressBar } from '../../components/ui';
import { Link } from '../../lib/router';
import { HBars, StepFlow } from '../../components/charts';
import type { Project } from '../../lib/data';
import { cls, fmtDate, daysUntil } from '../../lib/utils';

export default function AICompletion({ project }: { project: Project }) {
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 1000);
    return () => window.clearTimeout(t);
  }, [project.id, nonce]);

  const f = project.forecast;
  const early = f.earlyDays >= 0;
  const total = Math.max(1, daysUntil(project.start) * -1 + daysUntil(f.predicted) * -1 + Math.abs(daysUntil(project.start)));
  const elapsedPct = Math.min(100, Math.round(((daysUntil(project.start) * -1) / (daysUntil(project.start) * -1 + daysUntil(project.deadline))) * 100));

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-bold text-[15px]">AI Forecast — {project.name}</h3>
        </div>
        <button className="btn btn-secondary btn-sm w-max" onClick={() => { setNonce((n) => n + 1); }}>
          <RefreshCw className="w-3.5 h-3.5" />
          Recalculate Forecast
        </button>
      </div>

      {loading ? (
        <Card className="p-6">
          <Loading label="AI forecasting completion from progress, productivity and resource data…" />
        </Card>
      ) : (
        <>
          {/* Forecast headline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5" /> Original Deadline
              </p>
              <p className="font-display font-bold text-xl text-slate-800 mt-2 dark:text-slate-100">{fmtDate(project.deadline)}</p>
              <p className="text-[11px] text-slate-500 font-semibold mt-1">Contract completion date</p>
            </Card>
            <Card className="p-5 border-blue-200 dark:border-blue-900">
              <p className="text-[10px] uppercase tracking-wider font-bold text-blue-800 flex items-center gap-1.5 dark:text-blue-300">
                <Sparkles className="w-3.5 h-3.5" /> Current Predicted Completion
              </p>
              <p className="font-display font-bold text-xl text-blue-800 mt-2 dark:text-blue-300">{fmtDate(f.predicted)}</p>
              <p className="text-[11px] text-slate-500 font-semibold mt-1">AI confidence {f.confidence}%</p>
            </Card>
            <Card className={cls('p-5', early ? 'border-green-200 dark:border-green-900' : 'border-red-200 dark:border-red-900')}>
              <p className={cls('text-[10px] uppercase tracking-wider font-bold flex items-center gap-1.5', early ? 'text-green-700 dark:text-green-400' : 'text-red-600')}>
                {early ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                {early ? 'Potential Early Completion' : 'Projected Delay'}
              </p>
              <p className={cls('font-display font-bold text-xl mt-2', early ? 'text-green-700 dark:text-green-400' : 'text-red-600')}>
                {early ? `${f.earlyDays} Days Earlier` : `${Math.abs(f.earlyDays)} Days Late`}
              </p>
              <p className="text-[11px] text-slate-500 font-semibold mt-1">If recommended actions are taken</p>
            </Card>
          </div>

          {/* Intelligent timeline */}
          <Card className="p-5">
            <SectionTitle icon={CalendarClock} title="Intelligent Timeline" />
            <div className="mb-6">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                <span>Start {fmtDate(project.start)}</span>
                <span>Deadline {fmtDate(project.deadline)}</span>
                <span className={early ? 'text-green-700 dark:text-green-400' : 'text-red-600'}>Predicted {fmtDate(f.predicted)}</span>
              </div>
              <div className="relative h-8">
                <div className="absolute top-3 left-0 right-0 h-2 bg-slate-100 rounded-sm dark:bg-slate-800" />
                <div className={cls('absolute top-3 left-0 h-2 rounded-sm', early ? 'bg-green-600' : 'bg-red-500')} style={{ width: `${elapsedPct}%` }} />
                <div className="absolute top-1.5 w-4 h-4 rounded-full bg-blue-700 border-2 border-white shadow dark:border-slate-900" style={{ left: `calc(${elapsedPct}% - 8px)` }} title={`Today: ${project.progress}% complete`} />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium dark:text-slate-400">
                {project.progress}% complete • {Math.round(elapsedPct)}% of contract duration elapsed
              </p>
            </div>
            <div className="space-y-3.5">
              {project.milestones.filter((m) => m.state !== 'done').map((m) => {
                const isCurrent = m.state === 'current';
                const predictedDate = isCurrent ? fmtDate(f.predicted) : fmtDate(m.date);
                return (
                  <div key={m.name} className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className={cls('text-sm font-semibold w-56 shrink-0', isCurrent ? 'text-blue-800 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400')}>
                      {isCurrent ? '● ' : '○ '}{m.name}
                    </span>
                    <ProgressBar value={isCurrent ? m.progress ?? project.progress : 0} height="h-2.5" className="flex-1" color={isCurrent ? 'bg-blue-800 dark:bg-blue-600' : 'bg-slate-300'} />
                    <span className="text-xs font-bold text-slate-700 w-28 text-right dark:text-slate-300">{predictedDate}</span>
                  </div>
                );
              })}
              {project.milestones.every((m) => m.state === 'done') && (
                <p className="text-sm text-slate-500 font-medium">All milestones completed — project handed over {fmtDate(project.deadline)}.</p>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Why */}
            <Card className="p-5">
              <SectionTitle icon={Sparkles} title="Why this forecast?" />
              <HBars
                items={f.factors.map((x) => ({
                  label: x.label,
                  value: x.value,
                  color: x.value >= 70 ? 'bg-green-600' : x.value >= 45 ? 'bg-amber-500' : 'bg-red-600',
                }))}
              />
              <ul className="mt-5 space-y-2">
                {f.factors.map((x) => (
                  <li key={x.label} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-700 mt-1.5 shrink-0 dark:bg-blue-400" />
                    <span><strong className="text-slate-800 dark:text-slate-200">{x.label}:</strong> {x.detail}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Recommended actions */}
            <div className="space-y-6">
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-900 dark:bg-blue-950/30">
                <div className="flex items-center gap-2 mb-2.5">
                  <Sparkles className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">AI Recommended Actions</span>
                </div>
                <ol className="space-y-3">
                  {f.actions.map((a, i) => (
                    <li key={a.label} className="flex items-start gap-3">
                      <span className="text-[10px] font-bold text-blue-700 bg-white border border-blue-200 rounded-md px-1.5 py-0.5 mt-0.5 dark:bg-slate-900 dark:border-blue-900 dark:text-blue-400">
                        {i + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-800 flex-1 dark:text-slate-200">{a.label}</span>
                      <span className="text-xs font-bold text-green-700 dark:text-green-400 whitespace-nowrap">{a.impact}</span>
                    </li>
                  ))}
                </ol>
                <div className="border-t border-blue-200 pt-3 mt-4 dark:border-blue-900">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Potential recovery: {Math.max(4, f.earlyDays >= 0 ? 7 : 4)}–{Math.max(11, Math.abs(f.earlyDays))} days
                  </p>
                </div>
              </div>

              <StepFlow
                steps={[
                  { label: 'Actions Taken', state: 'current' },
                  { label: 'Productivity Re-check', state: 'pending' },
                  { label: 'Forecast Updated', state: 'pending' },
                  { label: 'Early Completion', state: early ? 'done' : 'pending', note: early ? fmtDate(f.predicted) : undefined },
                ]}
              />
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 dark:text-amber-300">Important — AI Estimate</p>
            <p className="text-xs text-amber-900 leading-relaxed dark:text-amber-200">
              This completion date is an <strong>AI estimate</strong> based on current site data, productivity history and resource
              availability — it is <strong>not a guaranteed completion date</strong> and does not modify the contractual deadline of {fmtDate(project.deadline)}. Update your progress reports to keep the forecast accurate.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2.5">
            <Link to={`/projects/${project.id}/update`} className="btn btn-primary btn-sm">Update Progress Data</Link>
            <Link to={`/projects/${project.id}/ai-analysis`} className="btn btn-secondary btn-sm">View Risk Analysis</Link>
          </div>
        </>
      )}
    </div>
  );
}
