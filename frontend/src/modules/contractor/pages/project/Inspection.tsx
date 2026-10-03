import { ShieldCheck, CalendarClock, CheckCircle2, CircleAlert, History, RefreshCw, FileCheck2 } from 'lucide-react';
import { Card, SectionTitle, StatusBadge, EmptyState, ConfirmModal } from '../../components/ui';
import { ProgressRing } from '../../components/charts';
import { useStore } from '../../lib/store';
import type { Project } from '../../lib/data';
import { useState } from 'react';
import { fmtDate } from '../../lib/utils';

export default function Inspection({ project }: { project: Project }) {
  const { toast } = useStore();
  const [prepFor, setPrepFor] = useState<string | null>(null);
  const [renewOpen, setRenewOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Upcoming inspections */}
      <Card className="p-5">
        <SectionTitle icon={CalendarClock} title={`Upcoming Inspections (${project.upcoming.length})`} />
        {project.upcoming.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No inspections scheduled" msg="Inspections appear here when the department schedules a site visit." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.upcoming.map((u, i) => (
              <div key={i} className="rounded-lg border border-slate-200 p-4 flex gap-4 dark:border-slate-700">
                <div className="text-center shrink-0 w-14">
                  <p className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-400">{fmtDate(u.date).slice(3, 6)}</p>
                  <p className="font-display font-bold text-2xl text-slate-800 leading-none dark:text-slate-100">{u.date.slice(8, 10)}</p>
                  {u.time && <p className="text-[10px] font-bold text-slate-500 mt-1">{u.time}</p>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{u.stage}</p>
                  <p className="text-xs text-slate-500 font-semibold mt-1 dark:text-slate-400">{u.inspector}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{u.designation}</p>
                  <div className="flex gap-2 mt-3">
                    <button className="btn btn-secondary btn-sm" onClick={() => setPrepFor(u.stage)}>
                      Prepare Checklist
                    </button>
                    <StatusBadge status="Scheduled" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Completed inspections */}
      <Card className="overflow-hidden">
        <div className="p-5 pb-4 flex items-center gap-2 text-blue-900 dark:text-blue-300">
          <History className="w-5 h-5" />
          <h3 className="font-bold text-[15px]">Completed Inspections ({project.history.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Stage</th>
                <th>Inspector</th>
                <th>Result</th>
                <th>Remarks</th>
                <th>Corrective Action</th>
              </tr>
            </thead>
            <tbody>
              {project.history.map((h, i) => (
                <tr key={i}>
                  <td className="text-xs font-bold whitespace-nowrap">{fmtDate(h.date)}</td>
                  <td className="text-xs font-semibold">{h.stage}</td>
                  <td>
                    <p className="text-xs font-bold">{h.inspector}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{h.designation}</p>
                  </td>
                  <td><StatusBadge status={h.result} /></td>
                  <td className="text-xs max-w-[260px]">{h.remarks}</td>
                  <td className="text-xs max-w-[200px]">{h.corrective ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 flex flex-col items-center text-center">
          <SectionTitle icon={ShieldCheck} title="Overall Compliance" />
          <ProgressRing value={project.complianceScore} size={140} color={project.complianceScore >= 90 ? 'var(--ch-green)' : 'var(--ch-amber)'} label={`${project.complianceScore}%`} sub="compliant" />
          <p className="text-xs text-slate-500 mt-4 font-medium dark:text-slate-400">
            {project.complianceScore >= 90
              ? 'Strong compliance posture. Address the single pending item to reach full compliance.'
              : 'Compliance gaps detected — clear pending items before the next inspection window.'}
          </p>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <SectionTitle icon={FileCheck2} title="Compliance Checklist" />
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {project.compliance.map((c) => (
              <div key={c.name} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
                {c.status === 'ok' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <CircleAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{c.name}</p>
                    {c.status === 'ok' ? (
                      <StatusBadge status="Approved" />
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => setRenewOpen(true)}>
                        <RefreshCw className="w-3 h-3" />
                        Take Action
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">{c.note}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Checklist modal */}
      <ConfirmModal
        open={prepFor !== null}
        onClose={() => setPrepFor(null)}
        onConfirm={() => toast('success', 'Checklist generated', `A preparation checklist for “${prepFor}” has been shared with your site team.`)}
        title="Generate inspection checklist?"
        message={`A preparation checklist for “${prepFor}” will be generated from the tender specifications and past inspection remarks, and shared with your site team.`}
        confirmLabel="Generate"
      />

      <ConfirmModal
        open={renewOpen}
        onClose={() => setRenewOpen(false)}
        onConfirm={() => toast('success', 'Renewal initiated', 'The renewal application has been drafted and assigned to your compliance officer.')}
        title="Initiate corrective action?"
        message="The compliance task will be assigned with a due date before the next inspection. You can track the status here."
        confirmLabel="Assign Task"
      />
    </div>
  );
}
