import { useMemo, useState } from 'react';
import {
  Map, ShieldAlert, TrendingUp, Landmark, Banknote, ListChecks, CalendarClock,
  AlertTriangle, ArrowRight, BarChart2, CheckCircle, Clock, FileSignature, Wrench,
  Eye, Zap, Sparkles,
} from 'lucide-react';
import { Link } from '../lib/router';
import { useStore } from '../lib/store';
import { KPISection, Card, SectionTitle, Pills, RiskBadge, StatusBadge, ProgressBar, AIInsight } from '../components/ui';
import type { KPIItem } from '../components/ui';
import { DataTable } from '../components/DataTable';
import { StackedBar, HBars, GroupedBars } from '../components/charts';
import { CONTRACTOR, pendingForProject } from '../lib/data';
import type { Project } from '../lib/data';
import { useAuth } from '@/core/auth/useAuth';
import { cls, cr, fmtDate, fmtDateCompact, daysUntil, daysLeftLabel, money } from '../lib/utils';

const FILTERS = ['All', 'Active', 'At Risk', 'Delayed', 'Completed'];

export default function Dashboard() {
  const { projects, invoices, unread } = useStore();
  const { session } = useAuth();
  const [filter, setFilter] = useState('All');
  const [expandedHealth, setExpandedHealth] = useState(false);

  const active = projects.filter((p) => p.status !== 'Completed');
  const atRisk = projects.filter((p) => p.status === 'At Risk' || p.status === 'Delayed');
  const overall = projects.length > 0 ? Math.round(projects.reduce((s, p) => s + (p.progress || 0), 0) / projects.length) : 0;
  const totalValue = projects.reduce((s, p) => s + (p.value || 0), 0);
  const received = projects.reduce((s, p) => s + (p.received || 0), 0);
  const pendingAmt = invoices
    .filter((i) => ['Submitted', 'Under Verification', 'Approved'].includes(i.status))
    .reduce((s, i) => s + (i.amount || 0), 0);
  const upcomingInspections = projects.flatMap((p) => (p.upcoming || []).map((u) => ({ ...u, projectId: p.id, projectName: p.name })));

  const kpis: KPIItem[] = [
    { label: 'Active Projects', value: String(active.length), sub: '+1 this quarter', icon: Map, iconClass: 'text-blue-600' },
    { label: 'Projects at Risk', value: String(atRisk.length), sub: `${atRisk.length} critical`, icon: ShieldAlert, iconClass: 'text-red-500' },
    { label: 'Overall Progress', value: `${overall}%`, sub: 'portfolio average', icon: TrendingUp, iconClass: 'text-slate-400' },
    { label: 'Total Contract Value', value: cr(totalValue), icon: Landmark, iconClass: 'text-blue-600' },
    { label: 'Amount Received', value: cr(received), sub: totalValue > 0 ? `${Math.round((received / totalValue) * 100)}% of value` : '0% of value', icon: Banknote, iconClass: 'text-green-600' },
    { label: 'Pending Payments', value: money(pendingAmt), sub: `${invoices.filter((i) => ['Submitted', 'Under Verification', 'Approved'].includes(i.status)).length} bills in process`, icon: Banknote, iconClass: 'text-amber-500' },
    { label: 'Upcoming Inspections', value: String(upcomingInspections.length), sub: upcomingInspections[0]?.date ? `Next: ${fmtDate(upcomingInspections[0].date)}` : 'Scheduled', icon: CalendarClock, iconClass: 'text-amber-500' },
    { label: 'Pending Actions', value: String(unread), sub: unread ? 'from notifications' : 'No pending notifications', icon: ListChecks, iconClass: 'text-amber-500', onClick: () => document.getElementById('action-center')?.scrollIntoView({ behavior: 'smooth' }) },
  ];
  const assignedProject = active[0] ?? projects[0];
  const displayName = session?.profile?.full_name || session?.organization?.name || 'Contractor user';
  const organization = session?.organization?.name || 'Organization not available';

  const filtered = projects.filter((p) => {
    if (filter === 'All') return true;
    if (filter === 'Active') return p.status === 'Active';
    if (filter === 'At Risk') return p.status === 'At Risk';
    if (filter === 'Delayed') return p.status === 'Delayed';
    return p.status === 'Completed';
  });

  return (
    <div className="p-4 lg:p-6 lg:py-8 max-w-[1600px] mx-auto space-y-6">
      {/* Greeting */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl lg:text-3xl text-slate-800 tracking-tight font-bold dark:text-slate-100">
            Good Morning, {displayName}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium dark:text-slate-400">
            {organization} • {session?.role?.replace(/_/g, ' ') || 'Role not available'} • Supabase assignment data
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-2 lg:mt-0">
          <Link to={assignedProject ? `/projects/${assignedProject.id}/update` : '/projects'}>
            <button className="btn btn-primary">
              <FileSignature className="w-4 h-4" />
              Submit Progress Update
            </button>
          </Link>
          <Link to="/tenders">
            <button className="btn btn-secondary">
              <Eye className="w-4 h-4" />
              Browse Tenders
            </button>
          </Link>
        </div>
      </div>

      <KPISection items={kpis} />

      {/* Overview row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 flex flex-col">
          <SectionTitle icon={BarChart2} title="Contractor Project Overview" right={<Link to="/projects" className="link text-sm flex items-center gap-1">All projects <ArrowRight className="w-4 h-4" /></Link>} />
          <p className="text-sm text-slate-700 leading-relaxed mb-6 dark:text-slate-300">
            Portfolio of {active.length} active works worth <strong>{cr(active.reduce((s, p) => s + (p.value || 0), 0))}</strong> in execution this FY.
            <strong> {atRisk.length} works</strong> need attention and <strong>{invoices.filter((i) => ['Submitted', 'Under Verification', 'Approved'].includes(i.status)).length} bills</strong> are pending with government offices.
          </p>
          <StackedBar
            segments={[
              { label: 'On Track', value: projects.filter((p) => p.status === 'Active').length, color: 'bg-blue-700' },
              { label: 'At Risk', value: projects.filter((p) => p.status === 'At Risk').length, color: 'bg-amber-600' },
              { label: 'Delayed', value: projects.filter((p) => p.status === 'Delayed').length, color: 'bg-red-600' },
              { label: 'Completed', value: projects.filter((p) => p.status === 'Completed').length, color: 'bg-green-600' },
            ]}
          />
          <div className="flex flex-wrap gap-y-2 gap-x-4 text-[11px] font-medium text-slate-700 mt-4 mb-6 dark:text-slate-300">
            <Legend color="bg-blue-700" label="On Track" />
            <Legend color="bg-amber-600" label="At Risk" />
            <Legend color="bg-red-600" label="Delayed" />
            <Legend color="bg-green-600" label="Completed" />
          </div>
          <div className="mt-auto border-t border-slate-100 pt-4 dark:border-slate-800">
            <p className="text-xs text-slate-500 font-medium leading-relaxed dark:text-slate-400">
              Figures are indicative and subject to departmental verification. Received amount excludes bills under verification.
            </p>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2 flex flex-col">
          <SectionTitle
            icon={ShieldAlert}
            title="My Project Health"
            right={
              projects.length > 5 ? (
                <button
                  type="button"
                  onClick={() => setExpandedHealth(!expandedHealth)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
                >
                  {expandedHealth ? 'Show Top 5' : `Expand All (${projects.length})`}
                </button>
              ) : undefined
            }
          />
          <div className={cls(expandedHealth && 'max-h-[460px] overflow-y-auto pr-2 custom-scrollbar')}>
            <HBars
              items={(expandedHealth ? projects : projects.slice(0, 5)).map((p) => {
                const score = p.health?.score ?? Math.round(p.progress || 60);
                return {
                  label: p.name,
                  value: score,
                  num: score,
                  color: score >= 75 ? 'bg-green-600' : score >= 55 ? 'bg-amber-500' : 'bg-red-600',
                };
              })}
              showNum
              labelWidth="w-48 sm:w-64"
            />
          </div>
          {projects.length > 5 && (
            <div className="mt-3 flex justify-center border-t border-slate-100 dark:border-slate-800 pt-2.5">
              <button
                type="button"
                onClick={() => setExpandedHealth(!expandedHealth)}
                className="text-xs font-semibold px-3 py-1 rounded border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                {expandedHealth ? 'Collapse to Top 5' : `Expand All ${projects.length} Projects`}
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="p-4 rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 flex items-center justify-between">
              <div className="flex flex-col w-full">
                <span className="text-xs text-slate-600 mb-4 font-medium dark:text-slate-400">Project Pipeline</span>
                <div className="flex items-center gap-6">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center relative shrink-0"
                    style={{ background: 'conic-gradient(#1d4ed8 0% 50%, #d97706 50% 66.7%, #dc2626 66.7% 83.3%, #16a34a 83.3% 100%)' }}
                    role="img"
                    aria-label="Project pipeline donut chart"
                  >
                    <div className="w-[72px] h-[72px] bg-white dark:bg-slate-900 rounded-full flex flex-col items-center justify-center absolute">
                      <span className="font-bold text-xl text-slate-800 leading-tight dark:text-slate-100">{projects.length}</span>
                      <span className="text-[10px] text-slate-500 font-medium">Total</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <LegendRow color="bg-blue-700" label="On Track" value={projects.filter((p) => p.status === 'Active').length} />
                    <LegendRow color="bg-amber-600" label="At Risk" value={projects.filter((p) => p.status === 'At Risk').length} />
                    <LegendRow color="bg-red-600" label="Delayed" value={projects.filter((p) => p.status === 'Delayed').length} />
                    <LegendRow color="bg-green-600" label="Completed" value={projects.filter((p) => p.status === 'Completed').length} />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 flex flex-col">
              <span className="text-xs text-slate-600 mb-4 font-medium dark:text-slate-400">Amount Received vs Total Contract Value</span>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 bg-slate-200 h-2.5 rounded-full overflow-hidden dark:bg-slate-800">
                  <div className="bg-green-600 h-full rounded-full transition-all" style={{ width: `${(received / totalValue) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{Math.round((received / totalValue) * 100)}%</span>
              </div>
              <div className="flex justify-between items-end mt-auto">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-medium mb-0.5 dark:text-slate-400">Total Contract Value</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{cr(totalValue)}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-slate-500 font-medium mb-0.5 dark:text-slate-400">Amount Received</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{cr(received)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* My Projects Overview */}
      <Card>
        <div className="p-5 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <SectionTitle icon={Map} title="My Projects Overview" className="mb-0" />
          <Pills options={FILTERS} value={filter} onChange={setFilter} />
        </div>
        <div className="px-5 pb-5">
        <DataTable
          columns={[
            {
              key: 'name',
              label: 'Project',
              sortVal: (p) => p.name,
              render: (p: Project) => (
                <div className="max-w-[200px]">
                  <Link to={`/projects/${p.id}/details`} className="text-sm font-bold text-slate-800 hover:text-blue-700 leading-snug dark:text-slate-100 dark:hover:text-blue-400">
                    {p.name}
                  </Link>
                  <p className="text-[11px] text-slate-500 font-medium dark:text-slate-400">{p.code}</p>
                </div>
              ),
            },
            { key: 'dept', label: 'Department', sortVal: (p) => p.department, render: (p: Project) => <span className="text-xs font-semibold block max-w-[140px] truncate" title={p.department}>{p.department}</span> },
            { key: 'loc', label: 'Location', sortVal: (p) => p.location, render: (p: Project) => <span className="text-xs font-semibold whitespace-nowrap">{p.location}</span> },
            {
              key: 'prog',
              label: 'Progress',
              sortVal: (p) => p.progress,
              render: (p: Project) => (
                <div className="flex items-center gap-2">
                  <ProgressBar value={p.progress} marker={p.planned} height="h-2.5" className="w-14" />
                  <span className="text-xs font-bold tabular-nums">{p.progress}%</span>
                </div>
              ),
            },
            { key: 'status', label: 'Status', sortVal: (p) => p.status, render: (p: Project) => <StatusBadge status={p.status} /> },
            { key: 'deadline', label: 'Deadline', sortVal: (p) => p.deadline, render: (p: Project) => (
              <div className="whitespace-nowrap">
                <p className="text-xs font-semibold">{fmtDateCompact(p.deadline)}</p>
                <p className={cls('text-[10px] font-bold', daysUntil(p.deadline) < 0 && p.status !== 'Completed' ? 'text-red-600' : 'text-slate-500')}>{p.status === 'Completed' ? 'Delivered' : daysLeftLabel(p.deadline)}</p>
              </div>
            ) },
            { key: 'risk', label: 'Risk', sortVal: (p) => p.risk, render: (p: Project) => <RiskBadge risk={p.risk} /> },
            {
              key: 'action',
              label: 'Action',
              render: (p: Project) => (
                <Link to={`/projects/${p.id}/details`} className="btn btn-secondary btn-sm">
                  View
                </Link>
              ),
            },
          ]}
          rows={filtered.map((p) => ({ ...p, id: p.id }))}
        />
        </div>
      </Card>

      {/* Progress overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <SectionTitle icon={TrendingUp} title="Progress Overview — Planned vs Actual" />
          <GroupedBars
            labels={projects.filter((p) => p.status !== 'Completed').map((p) => p.deptAbbr)}
            series={[
              { name: 'Planned %', color: 'bg-slate-300', values: projects.filter((p) => p.status !== 'Completed').map((p) => p.planned) },
              { name: 'Actual %', color: 'bg-blue-700', values: projects.filter((p) => p.status !== 'Completed').map((p) => p.progress) },
            ]}
          />
          <p className="text-[11px] text-slate-500 mt-3 font-medium dark:text-slate-400">
            Rural Bridge Construction shows the largest variance (−18%); Pune Road Development remains within recovery range.
          </p>
        </Card>

        <Card className="p-5">
          <SectionTitle icon={Banknote} title="Financial Overview" />
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: 'Contract Value', value: cr(totalValue), cls: 'text-slate-800 dark:text-slate-100' },
              { label: 'Amount Received', value: cr(received), cls: 'text-green-700 dark:text-green-400' },
              { label: 'Amount Spent', value: cr(projects.reduce((s, p) => s + p.spent, 0)), cls: 'text-blue-800 dark:text-blue-300' },
              { label: 'Amount Pending', value: money(pendingAmt), cls: 'text-amber-700 dark:text-amber-400' },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{s.label}</p>
                <p className={cls('font-display font-bold text-lg tracking-tight mt-1', s.cls)}>{s.value}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2.5">Received as % of contract value</p>
          <HBars
            items={projects
              .filter((p) => p.status !== 'Completed')
              .map((p) => ({ label: p.name, value: Math.round((p.received / p.value) * 100), color: 'bg-green-600' }))}
          />
        </Card>
      </div>

      {/* Demonstration-only alerts are never shown in production. */}
      {(import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.VITE_USE_MOCK_API === 'true') ? <Card className="p-5">
        <SectionTitle icon={Sparkles} title="AI Alerts" right={<Link to="/ai-assist" className="link text-sm flex items-center gap-1">Ask AI Assist <ArrowRight className="w-4 h-4" /></Link>} />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <AlertItem
            tone="red"
            icon={AlertTriangle}
            title="Project is behind schedule"
            body="Rural Bridge Construction is 18% behind planned progress. Girder-launch crane unconfirmed. Recovery plan due 16 Sep."
            link="/projects/p5/ai-analysis"
            linkLabel="View AI analysis"
          />
          <AlertItem
            tone="amber"
            icon={Clock}
            title="Payment awaiting approval"
            body="INV-2026-0179 (₹2.12 Cr) under verification since 24 Aug — beyond the 21-day SLA. Written follow-up recommended."
            link="/projects/p1/bills"
            linkLabel="View bill status"
          />
          <AlertItem
            tone="amber"
            icon={AlertTriangle}
            title="Missing document"
            body="Bid for NH-548C Satara lacks Experience Certificate and Equipment Ownership Proof. Readiness at 78%."
            link="/tenders/t1/bid/ai-assist"
            linkLabel="Open AI Bid Assist"
          />
          <AlertItem
            tone="blue"
            icon={CalendarClock}
            title="Upcoming inspection"
            body="Structural Work Zone 1 inspection on 15 Sep 2026, 10:30 hrs by Er. Anil Deshmukh (EE, PWD Pune)."
            link="/projects/p1/inspection"
            linkLabel="Prepare checklist"
          />
          <AlertItem
            tone="amber"
            icon={Wrench}
            title="Resource shortage"
            body="District Hospital Expansion: skilled mason & MEP technician strength 12 below peak requirement from 20 Sep."
            link="/projects/p3/resources"
            linkLabel="Manage resources"
          />
          <AlertItem
            tone="amber"
            icon={AlertTriangle}
            title="Compliance issue"
            body="CAR Insurance Certificate expires 22 Sep 2026 on Pune Road Development. DG emission test due 30 Sep on Hospital project."
            link="/projects/p1/inspection"
            linkLabel="View compliance"
          />
        </div>
      </Card> : null}

      {/* Action Center */}
      {(import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.VITE_USE_MOCK_API === 'true') ? <ActionCenter /> : null}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cls('w-2.5 h-2.5 rounded-sm', color)} />
      {label}
    </div>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2 text-slate-700 font-medium dark:text-slate-300">
        <div className={cls('w-2.5 h-2.5 rounded-sm', color)} />
        {label}
      </div>
      <span className="font-bold text-slate-800 dark:text-slate-200">{value}</span>
    </div>
  );
}

function AlertItem({
  icon: Icon,
  tone,
  title,
  body,
  link,
  linkLabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: 'red' | 'amber' | 'blue' | 'green';
  title: string;
  body: string;
  link: string;
  linkLabel: string;
}) {
  const toneCls =
    tone === 'red'
      ? 'border-l-red-500'
      : tone === 'amber'
      ? 'border-l-amber-500'
      : tone === 'blue'
      ? 'border-l-blue-600'
      : 'border-l-green-600';
  return (
    <div className={cls('rounded-lg border border-slate-200 border-l-4 bg-white p-4 dark:bg-slate-900 dark:border-slate-700', toneCls)}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={cls('w-4 h-4', tone === 'red' ? 'text-red-600' : tone === 'amber' ? 'text-amber-600' : tone === 'blue' ? 'text-blue-700' : 'text-green-600')} />
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</p>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed dark:text-slate-400">{body}</p>
      <Link to={link} className="link text-xs inline-flex items-center gap-1 mt-2.5">
        {linkLabel} <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

function ActionCenter() {
  const { projects } = useStore();
  const p5 = projects.find((p) => p.id === 'p5') || projects[4] || projects[0] || ({ id: 'p5', name: 'Rural Bridge Construction' } as Project);
  const p1 = projects.find((p) => p.id === 'p1') || projects[0] || ({ id: 'p1', name: 'Pune Road Development' } as Project);
  return (
    <Card className="p-5" >
      <div id="action-center" />
      <SectionTitle icon={Zap} title="Contractor Action Center" right={<Link to="/notifications" className="link text-sm">View all</Link>} />
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        <ActionRow
          tone="red"
          icon={AlertTriangle}
          title="Respond to show-cause notice"
          project={p5?.name ?? 'Rural Bridge Construction'}
          due="Due 16 Sep 2026"
          to={`/projects/${p5?.id ?? 'p5'}/communication`}
          cta="Respond now"
        />
        <ActionRow
          tone="red"
          icon={FileSignature}
          title="Submit progress update"
          project="Rural Bridge Construction — last update 12 Jul 2026"
          due="Overdue 61 days"
          to={`/projects/${p5?.id ?? 'p5'}/update`}
          cta="Submit update"
        />
        <ActionRow
          tone="amber"
          icon={AlertTriangle}
          title="Insurance document expires in 12 days"
          project="Pune Road Development — CAR Policy"
          due="22 Sep 2026"
          to={`/projects/${p1?.id ?? 'p1'}/inspection`}
          cta="Renew"
        />
        <ActionRow
          tone="green"
          icon={CheckCircle}
          title="Payment approved"
          project="Pune Road Development — INV-2026-0184"
          due="₹ 42.5 Lakh"
          to={`/projects/${p1?.id ?? 'p1'}/finance`}
          cta="Track payment"
        />
        <ActionRow
          tone="amber"
          icon={Clock}
          title="Tender submission deadline"
          project="NH-548C Satara (₹42.30 Cr) — bid readiness 78%"
          due="28 Sep 2026"
          to="/tenders/t1/bid"
          cta="Continue bid"
        />
        <ActionRow
          tone="blue"
          icon={CalendarClock}
          title="Upcoming inspection"
          project="Pune Road Development — Structural Work Zone 1"
          due="15 Sep 2026, 10:30"
          to={`/projects/${p1?.id ?? 'p1'}/inspection`}
          cta="Prepare"
        />
      </div>
      <div className="mt-4">
        <AIInsight dense title="AI Priority Note">
          <p>
            Two urgent items concern Rural Bridge Construction. Completing the recovery plan and show-cause response today
            reduces escalation risk under contract clause 18 by an estimated 70%.
          </p>
        </AIInsight>
      </div>
    </Card>
  );
}

function ActionRow({
  icon: Icon,
  tone,
  title,
  project,
  due,
  to,
  cta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: 'red' | 'amber' | 'green' | 'blue';
  title: string;
  project: string;
  due: string;
  to: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-3.5 first:pt-0 last:pb-0">
      <span
        className={cls(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
          tone === 'red' ? 'bg-red-50 text-red-600 dark:bg-red-950/60' : tone === 'amber' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60' : tone === 'green' ? 'bg-green-50 text-green-600 dark:bg-green-950/60' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60'
        )}
      >
        <Icon className="w-4 h-4" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">{project}</p>
      </div>
      <span className="text-xs font-bold text-slate-500 whitespace-nowrap dark:text-slate-400">{due}</span>
      <Link to={to} className="btn btn-secondary btn-sm shrink-0">
        {cta}
      </Link>
    </div>
  );
}
