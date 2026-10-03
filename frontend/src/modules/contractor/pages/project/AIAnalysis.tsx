import { useEffect, useState } from 'react';
import { Activity, RefreshCw, CheckCircle2, CircleAlert, XCircle, AlertTriangle } from 'lucide-react';
import { Card, SectionTitle, StatusBadge, Loading } from '../../components/ui';
import { Link } from '../../lib/router';
import { ProgressRing, HBars } from '../../components/charts';
import type { Project } from '../../lib/data';
import { cls } from '../../lib/utils';

export default function AIAnalysis({ project }: { project: Project }) {
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 950);
    return () => window.clearTimeout(t);
  }, [project.id, nonce]);

  const overallColor = project.health.overall === 'GOOD' ? 'var(--ch-green)' : project.health.overall === 'FAIR' ? 'var(--ch-amber)' : 'var(--ch-red)';

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300">
          <Activity className="w-5 h-5" />
          <h3 className="font-bold text-[15px]">AI Project Health — {project.name}</h3>
        </div>
        <button className="btn btn-secondary btn-sm w-max" onClick={() => setNonce((n) => n + 1)}>
          <RefreshCw className="w-3.5 h-3.5" />
          Re-run Analysis
        </button>
      </div>

      {loading ? (
        <Card className="p-6">
          <Loading label="AI analyzing project health across 5 dimensions…" />
        </Card>
      ) : (
        <>
          {/* Health panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 flex flex-col items-center justify-center text-center">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-3">Overall Health</p>
              <ProgressRing value={project.health.score} size={140} color={overallColor} label={project.health.overall} sub={`${project.health.score}/100`} />
              <p className="text-xs text-slate-500 mt-4 font-medium dark:text-slate-400">
                Composite of progress, schedule, budget, resources and compliance indicators.
              </p>
            </Card>
            <Card className="p-5 lg:col-span-2">
              <SectionTitle icon={Activity} title="Dimension Scores" />
              <HBars
                items={project.health.scores.map((s) => ({
                  label: s.label,
                  value: s.value,
                  color: s.value >= 75 ? 'bg-green-600' : s.value >= 55 ? 'bg-amber-500' : 'bg-red-600',
                }))}
              />
              <div className="flex flex-wrap gap-2 mt-5">
                {project.health.risks.map((r) => (
                  <StatusBadge key={r.area} status={r.level} />
                ))}
              </div>
            </Card>
          </div>

          {/* Risk cards */}
          {project.health.risks.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">No active risks detected</p>
              <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">This project is closed and all dimensions are nominal.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {project.health.risks.map((r) => (
                <Card key={r.area} className="p-5">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {r.level === 'High' ? (
                        <XCircle className="w-5 h-5 text-red-600" />
                      ) : r.level === 'Medium' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{r.area}</h4>
                    </div>
                    <StatusBadge status={r.level} />
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed dark:text-slate-300">{r.explanation}</p>

                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mt-4 mb-2">Evidence</p>
                  <ul className="space-y-1.5">
                    {r.evidence.map((e) => (
                      <li key={e} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                        {e}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/60 p-3 dark:border-blue-900 dark:bg-blue-950/30">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-blue-800 mb-1 dark:text-blue-300">Recommended Action</p>
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed dark:text-slate-300">{r.action}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-2.5">
            <Link to={`/projects/${project.id}/ai-completion`} className="btn btn-secondary btn-sm">AI Completion Prediction</Link>
            <Link to={`/projects/${project.id}/ai-guide`} className="btn btn-secondary btn-sm">Ask AI Guide</Link>
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            Risk analysis is generated from project registers (progress, bills, inspections, resources, compliance). It is advisory and does not replace contractual reporting.
          </p>
        </>
      )}
    </div>
  );
}
