import { useMemo, useState } from 'react';
import { Folders, Download } from 'lucide-react';
import { Link } from '../lib/router';
import { useStore } from '../lib/store';
import { PageHeader, Card, StatusBadge, RiskBadge, ProgressBar, Select, SearchInput } from '../components/ui';
import { DataTable } from '../components/DataTable';
import { CONTRACTOR } from '../lib/data';
import type { Project } from '../lib/data';
import { useAuth } from '@/core/auth/useAuth';
import { cr, daysLeftLabel, daysUntil, downloadCSV, fmtDate, fmtDateCompact } from '../lib/utils';

export default function Projects() {
  const { projects, toast } = useStore();
  const { session } = useAuth();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All Statuses');
  const [risk, setRisk] = useState('All Risks');
  const [sort, setSort] = useState('Deadline');

  const filtered = useMemo(() => {
    let rows = projects.filter((p) => {
      const term = q.trim().toLowerCase();
      if (term && !((p.name || '').toLowerCase().includes(term) || (p.code || '').toLowerCase().includes(term) || (p.location || '').toLowerCase().includes(term))) return false;
      if (status !== 'All Statuses' && p.status !== status) return false;
      if (risk !== 'All Risks' && p.risk !== risk) return false;
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sort) {
        case 'Progress': return (b.progress || 0) - (a.progress || 0);
        case 'Contract Value': return (b.value || 0) - (a.value || 0);
        case 'Project Name': return (a.name || '').localeCompare(b.name || '');
        default: return (a.deadline || '').localeCompare(b.deadline || '');
      }
    });
    return rows;
  }, [projects, q, status, risk, sort]);

  const exportCSV = () => {
    downloadCSV(
      'nirikshak-my-projects.csv',
      ['Project ID', 'Project', 'Department', 'Location', 'Contract Value (Cr)', 'Progress %', 'Status', 'Risk', 'Start', 'Deadline'],
      filtered.map((p) => [p.code || '', p.name || '', p.department || '', p.location || '', p.value || 0, p.progress || 0, p.status || '', p.risk || '', fmtDate(p.start), fmtDate(p.deadline)])
    );
    toast('success', 'Export ready', 'nirikshak-my-projects.csv downloaded.');
  };

  return (
    <div className="p-4 lg:p-6 lg:py-8 max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        title="My Projects"
        subtitle={`${projects.length} assigned contracts • ${projects.filter((p) => p.status !== 'Completed').length} in execution • ${session?.organization?.name || 'Organization not available'}`}
        actions={
          <button className="btn btn-secondary" onClick={exportCSV}>
            <Download className="w-4 h-4" />
            Export
          </button>
        }
      />

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <SearchInput value={q} onChange={setQ} placeholder="Search project, ID or location…" />
          <Select
            value={status}
            onChange={setStatus}
            options={['All Statuses', 'Active', 'At Risk', 'Delayed', 'Completed'].map((v) => ({ value: v, label: v }))}
          />
          <Select
            value={risk}
            onChange={setRisk}
            options={['All Risks', 'Low', 'Medium', 'High'].map((v) => ({ value: v, label: v }))}
          />
          <Select
            value={sort}
            onChange={setSort}
            options={['Deadline', 'Progress', 'Contract Value', 'Project Name'].map((v) => ({ value: v, label: `Sort: ${v}` }))}
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-5 pb-4 flex items-center gap-2 text-blue-900 dark:text-blue-300">
          <Folders className="w-5 h-5" />
          <h3 className="font-bold text-[15px]">Project Register ({filtered.length})</h3>
        </div>
        <DataTable
          columns={[
            {
              key: 'name',
              label: 'Project',
              sortVal: (p: Project) => p.name,
              render: (p: Project) => (
                <div className="max-w-[230px]">
                  <p className="text-sm font-bold text-slate-800 leading-snug dark:text-slate-100">{p.name}</p>
                  <p className="text-[11px] text-slate-500 font-medium dark:text-slate-400">{p.code} • {p.department}</p>
                </div>
              ),
            },
            { key: 'loc', label: 'Location', sortVal: (p: Project) => p.location, render: (p: Project) => <span className="text-xs font-semibold whitespace-nowrap">{p.location}</span> },
            { key: 'value', label: 'Value', sortVal: (p: Project) => p.value, render: (p: Project) => <span className="text-xs font-bold tabular-nums whitespace-nowrap">{cr(p.value)}</span> },
            {
              key: 'progress',
              label: 'Progress',
              sortVal: (p: Project) => p.progress,
              render: (p: Project) => (
                <div className="flex items-center gap-2">
                  <ProgressBar value={p.progress} marker={p.planned} height="h-2.5" className="w-14" />
                  <span className="text-xs font-bold tabular-nums">{p.progress}%</span>
                </div>
              ),
            },
            {
              key: 'deadline',
              label: 'Timeline',
              sortVal: (p: Project) => p.deadline,
              render: (p: Project) => (
                <div className="whitespace-nowrap">
                  <p className="text-xs font-semibold">
                    {fmtDateCompact(p.start)} <span className="text-slate-400">→</span> {fmtDateCompact(p.deadline)}
                  </p>
                  <p className={`text-[10px] font-bold ${daysUntil(p.deadline) < 0 && p.status !== 'Completed' ? 'text-red-600' : 'text-slate-500 dark:text-slate-400'}`}>
                    {p.status === 'Completed' ? 'Delivered' : daysLeftLabel(p.deadline)}
                  </p>
                </div>
              ),
            },
            {
              key: 'status',
              label: 'Status / Risk',
              sortVal: (p: Project) => p.status,
              render: (p: Project) => (
                <div className="flex flex-col items-start gap-1">
                  <StatusBadge status={p.status} />
                  <RiskBadge risk={p.risk} />
                </div>
              ),
            },
            {
              key: 'last',
              label: 'Updated',
              sortVal: (p: Project) => p.lastUpdate,
              render: (p: Project) => (
                <div className="max-w-[150px]" title={`${fmtDate(p.lastUpdate)} — ${p.lastUpdateNote}`}>
                  <p className="text-xs font-semibold whitespace-nowrap">{fmtDateCompact(p.lastUpdate)}</p>
                  <p className="text-[10px] text-slate-500 truncate dark:text-slate-400">{p.lastUpdateNote}</p>
                </div>
              ),
            },
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
          rows={filtered}
          empty={<p className="text-sm text-slate-500 py-10 text-center font-medium">No projects match your filters. Adjust search, status or risk filters.</p>}
        />
      </Card>
    </div>
  );
}
