import { useState } from 'react';
import { BarChart3, TrendingUp, IndianRupee, Users } from 'lucide-react';
import { Card, SectionTitle, Pills, StatusBadge } from '../../components/ui';
import { GroupedBars, LineChart, HBars, Donut, BarChart } from '../../components/charts';
import type { Project } from '../../lib/data';
import { cls, fmtDate, money } from '../../lib/utils';

const VIEWS = ['Progress', 'Financial', 'Resource'];

export default function Analytics({ project }: { project: Project }) {
  const [view, setView] = useState('Progress');

  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  const step = project.planned / 6;
  const actualStep = project.progress / 6;
  const plannedSeries = months.map((_, i) => Math.round(Math.min(100, (i + 1) * step * 1.05)));
  const actualSeries = months.map((_, i) => Math.round(Math.min(project.progress, (i + 1) * actualStep * (i < 2 ? 1.05 : i === 3 ? 0.8 : 1))));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300">
          <BarChart3 className="w-5 h-5" />
          <h3 className="font-bold text-[15px]">Project Analytics — {project.name}</h3>
        </div>
        <Pills options={VIEWS} value={view} onChange={setView} />
      </div>

      {view === 'Progress' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <SectionTitle icon={TrendingUp} title="Planned vs Actual Progress" />
            <GroupedBars
              labels={months}
              series={[
                { name: 'Planned %', color: 'bg-slate-300', values: plannedSeries },
                { name: 'Actual %', color: 'bg-blue-700', values: actualSeries },
              ]}
            />
            <p className="text-[11px] text-slate-500 mt-3 font-medium dark:text-slate-400">
              Variance {project.progress - project.planned > 0 ? '+' : ''}{project.progress - project.planned}% as of {fmtDate(project.lastUpdate)}.
            </p>
          </Card>

          <Card className="p-5">
            <SectionTitle icon={TrendingUp} title="Milestone Completion" />
            <HBars
              items={project.milestones.map((m) => ({
                label: m.name,
                value: m.state === 'done' ? 100 : m.progress ?? (m.state === 'current' ? Math.round(project.progress * 0.9) : 0),
                color: m.state === 'done' ? 'bg-green-600' : m.state === 'current' ? 'bg-blue-700' : 'bg-slate-300',
              }))}
            />
          </Card>

          <Card className="p-5">
            <SectionTitle icon={TrendingUp} title="Delay Trend (cumulative days)" />
            <LineChart
              labels={months}
              series={[
                { name: 'Delay days', color: 'bg-red-600', values: months.map((_, i) => Math.max(0, plannedSeries[i] - actualSeries[i])) },
                { name: 'Rain-affected days', color: 'bg-amber-600', values: months.map((_, i) => (i === 3 || i === 4 ? 9 : i === 2 ? 3 : 0)) },
              ]}
            />
          </Card>

          <Card className="overflow-hidden">
            <div className="p-5 pb-3">
              <SectionTitle title="Progress History" className="mb-0" />
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Progress</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((m, i) => (
                    <tr key={m}>
                      <td className="text-xs font-bold">2026-{String(i + 4).padStart(2, '0')}-05</td>
                      <td className="text-xs font-bold tabular-nums">{actualSeries[i]}%</td>
                      <td className="text-xs">{i === 3 ? 'Monsoon interruption — 9 days lost' : i === 4 ? 'Rectification cycle completed' : 'As per programme'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {view === 'Financial' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <SectionTitle icon={IndianRupee} title="Budget vs Expenditure by Head" />
            <GroupedBars
              labels={project.expenses.map((e) => e.label.split(' ')[0])}
              series={[
                { name: 'Budget ₹ Cr', color: 'bg-slate-300', values: project.expenses.map((e) => e.budget) },
                { name: 'Spent ₹ Cr', color: 'bg-blue-700', values: project.expenses.map((e) => e.spent) },
              ]}
              yFmt={(n) => n.toFixed(1)}
            />
          </Card>

          <Card className="overflow-hidden">
            <div className="p-5 pb-3">
              <SectionTitle title="Cost Variance" className="mb-0" />
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Head</th>
                    <th>Budget</th>
                    <th>Spent</th>
                    <th>Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {project.expenses.map((e) => {
                    const v = e.budget - e.spent;
                    return (
                      <tr key={e.label}>
                        <td className="font-bold text-slate-800 dark:text-slate-100">{e.label}</td>
                        <td className="text-xs tabular-nums font-semibold">₹ {e.budget.toFixed(2)} Cr</td>
                        <td className="text-xs tabular-nums font-semibold">₹ {e.spent.toFixed(2)} Cr</td>
                        <td>
                          <span className={cls('text-xs font-bold tabular-nums', v < 0 ? 'text-red-600' : 'text-green-700 dark:text-green-400')}>
                            ₹ {v.toFixed(2)} Cr {v < 0 ? 'over' : 'left'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5 lg:col-span-2">
            <SectionTitle icon={IndianRupee} title="Payment History (₹ Lakh received per month)" />
            <BarChart
              labels={['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']}
              values={[412, 385, 220, 245, 238, 310]}
              yFmt={(n) => `${Math.round(n / 100) / 10}Cr`}
              height={200}
            />
            <p className="text-[11px] text-slate-500 mt-3 font-medium dark:text-slate-400">
              Received ₹ {project.received.toFixed(2)} Cr of ₹ {project.value.toFixed(2)} Cr contract value. Pending verification affects the Aug–Sep receipts.
            </p>
          </Card>
        </div>
      )}

      {view === 'Resource' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <SectionTitle icon={Users} title="Worker Utilization by Trade" />
            <HBars
              items={[
                { label: 'Masons', value: 91, color: 'bg-blue-700' },
                { label: 'Bar Benders', value: 86, color: 'bg-blue-700' },
                { label: 'Carpenters', value: 78, color: 'bg-amber-500' },
                { label: 'Operators', value: 94, color: 'bg-blue-700' },
                { label: 'General Labour', value: 88, color: 'bg-blue-700' },
              ]}
            />
            <p className="text-[11px] text-slate-500 mt-4 font-medium dark:text-slate-400">Utilization = deployed person-days ÷ available person-days for the last 30 days.</p>
          </Card>

          <Card className="p-5">
            <SectionTitle icon={Users} title="Equipment Utilization" />
            <HBars
              items={[
                { label: 'Excavators', value: 100, color: 'bg-green-600' },
                { label: 'Rollers', value: 100, color: 'bg-green-600' },
                { label: 'Batching Plant', value: 87, color: 'bg-green-600' },
                { label: 'Transit Mixers', value: 80, color: 'bg-amber-500' },
                { label: 'Survey Equipment', value: 50, color: 'bg-slate-400' },
              ]}
            />
          </Card>

          <Card className="p-5">
            <SectionTitle icon={Users} title="Material Consumption Mix" />
            <div className="flex items-center gap-6 flex-wrap">
              <Donut
                segments={[
                  { value: 42, color: 'bg-blue-700', label: 'Cement & Concrete' },
                  { value: 24, color: 'bg-blue-400', label: 'Bitumen' },
                  { value: 18, color: 'bg-green-600', label: 'Steel' },
                  { value: 10, color: 'bg-amber-600', label: 'Aggregate' },
                  { value: 6, color: 'bg-slate-400', label: 'Other' },
                ]}
                center={{ big: '92%', small: 'of plan' }}
              />
              <div className="flex flex-col gap-2 text-xs">
                {[
                  { label: 'Cement & Concrete', color: 'bg-blue-700' },
                  { label: 'Bitumen', color: 'bg-blue-400' },
                  { label: 'Steel', color: 'bg-green-600' },
                  { label: 'Aggregate', color: 'bg-amber-600' },
                  { label: 'Other', color: 'bg-slate-400' },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-2 text-slate-700 font-medium dark:text-slate-300">
                    <span className={cls('w-2.5 h-2.5 rounded-sm', l.color)} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="p-5 pb-3">
              <SectionTitle title="Material Efficiency Notes" className="mb-0" />
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Consumption vs Plan</th>
                    <th>Signal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-bold text-slate-800 dark:text-slate-100">Bitumen VG-30</td>
                    <td className="text-xs font-semibold tabular-nums">101% of stage plan</td>
                    <td><StatusBadge status="Low Stock" /></td>
                  </tr>
                  <tr>
                    <td className="font-bold text-slate-800 dark:text-slate-100">Cement OPC 53</td>
                    <td className="text-xs font-semibold tabular-nums">94% of stage plan</td>
                    <td><StatusBadge status="Low Stock" /></td>
                  </tr>
                  <tr>
                    <td className="font-bold text-slate-800 dark:text-slate-100">TMT Steel</td>
                    <td className="text-xs font-semibold tabular-nums">86% of stage plan</td>
                    <td><StatusBadge status="Available" /></td>
                  </tr>
                  <tr>
                    <td className="font-bold text-slate-800 dark:text-slate-100">Aggregate</td>
                    <td className="text-xs font-semibold tabular-nums">96% of stage plan</td>
                    <td><StatusBadge status="Available" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="p-4 text-[11px] text-slate-500 dark:text-slate-400">
              Consumption above plan with pending procurement is flagged. Monthly wastage audit keeps the variance under 2%.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
