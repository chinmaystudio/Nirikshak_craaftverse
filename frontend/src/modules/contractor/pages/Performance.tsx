import { Gauge, Star, History, MessageSquareQuote } from 'lucide-react';
import { PageHeader, Card, SectionTitle, StatusBadge } from '../components/ui';
import { ProgressRing, HBars, LineChart } from '../components/charts';
import { PERFORMANCE } from '../lib/data';
import { cr } from '../lib/utils';
import { useAuth } from '@/core/auth/useAuth';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.VITE_USE_MOCK_API === 'true';

export default function Performance() {
  const p = PERFORMANCE;
  const { session } = useAuth();
  if (!DEMO_MODE) {
    return (
      <div className="p-4 lg:p-6 lg:py-8 max-w-[1600px] mx-auto space-y-6">
        <PageHeader title="My Performance" subtitle={session?.organization?.name || 'Organization not available'} />
        <Card className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          No verified performance records are available yet.
        </Card>
      </div>
    );
  }
  return (
    <div className="p-4 lg:p-6 lg:py-8 max-w-[1600px] mx-auto space-y-6">
      <PageHeader
        title="My Performance"
        subtitle={`${session?.organization?.name || 'Organization not available'} • Government evaluation, quality records and citizen feedback`}
      />

      {/* Score hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 flex flex-col items-center justify-center text-center">
          <ProgressRing value={p.score} size={150} label={`${p.score} / 100`} sub="Performance Score" color="var(--ch-green)" />
          <p className="font-display font-bold text-lg text-slate-800 mt-4 dark:text-slate-100">Grade {(p.grade || '').split(/[—\-]/)[0]?.trim() || 'A'}</p>
          <p className="text-xs text-slate-500 font-semibold mt-1 dark:text-slate-400">{(p.grade || '').split(/[—\-]/)[1]?.trim() || 'Reliable Partner'}</p>
          <p className="text-[11px] text-slate-500 mt-3 dark:text-slate-400">{p.percentile}</p>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <SectionTitle icon={Gauge} title="Score Breakdown" />
          <HBars
            items={p.breakdown.map((b, i) => ({
              label: b.label,
              value: b.value,
              color: ['bg-green-600', 'bg-blue-700', 'bg-amber-500', 'bg-blue-900', 'bg-blue-400'][i],
            }))}
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            {p.stats.map((s) => (
              <div key={s.label} className="rounded-lg border border-slate-200 p-3.5 dark:border-slate-700">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{s.label}</p>
                <p className="font-display font-bold text-xl text-slate-800 mt-1 dark:text-slate-100">{s.value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 dark:text-slate-400">{s.sub}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <SectionTitle icon={History} title="Performance Trend — FY 2026-27" right={<span className="text-[11px] text-slate-500 font-medium">Government median benchmark shown dashed</span>} />
          <LineChart
            labels={p.trend.labels}
            series={[
              { name: 'My Score', color: 'bg-blue-700', values: p.trend.values },
              { name: 'Govt. Median', color: 'bg-slate-400', values: p.trend.benchmark, dashed: true },
            ]}
            yMax={100}
            height={220}
          />
        </Card>

        <Card className="p-5">
          <SectionTitle icon={Star} title="Citizen Feedback" />
          <div className="flex flex-col gap-4">
            {p.feedback.map((f) => (
              <div key={f.source} className="rounded-lg border border-slate-200 p-3.5 dark:border-slate-700">
                <div className="flex items-center gap-0.5 mb-2" aria-label={`${f.stars} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.floor(f.stars) ? 'fill-amber-400 text-amber-400' : i - 0.5 === f.stars ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                  ))}
                  <span className="text-[11px] font-bold text-slate-500 ml-1.5">{f.stars} / 5</span>
                </div>
                <div className="flex gap-2">
                  <MessageSquareQuote className="w-4 h-4 text-slate-300 shrink-0 mt-0.5 dark:text-slate-600" />
                  <div>
                    <p className="text-xs text-slate-700 leading-relaxed dark:text-slate-300">“{f.quote}”</p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1.5">{f.source}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Historical performance */}
      <Card className="overflow-hidden">
        <div className="p-5 pb-4 flex items-center gap-2 text-blue-900 dark:text-blue-300">
          <History className="w-5 h-5" />
          <h3 className="font-bold text-[15px]">Previous Project Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Department</th>
                <th>Value</th>
                <th>Year</th>
                <th>Delay</th>
                <th>Quality Score</th>
                <th>Government Rating</th>
              </tr>
            </thead>
            <tbody>
              {p.history.map((h) => (
                <tr key={h.name}>
                  <td className="font-bold text-slate-800 dark:text-slate-100">{h.name}</td>
                  <td className="text-xs font-semibold">{h.dept}</td>
                  <td className="text-xs tabular-nums font-semibold">{cr(h.value)}</td>
                  <td className="text-xs">{h.year}</td>
                  <td>
                    <span className={`text-xs font-bold ${h.delay === 0 ? 'text-green-700 dark:text-green-400' : h.delay <= 7 ? 'text-amber-700 dark:text-amber-400' : 'text-red-600'}`}>
                      {h.delay === 0 ? 'On time' : `${h.delay} days`}
                    </span>
                  </td>
                  <td className="text-xs font-bold tabular-nums">{h.quality}%</td>
                  <td>
                    <StatusBadge status={h.rating === 'A' ? 'Completed' : h.rating === 'A-' ? 'Approved' : 'Changes Requested'} />
                    <span className="text-[11px] font-bold ml-1.5 text-slate-600 dark:text-slate-300">{h.rating}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 font-medium dark:text-slate-400">
            Ratings are compiled from department completion evaluations. Quality score reflects defect density at handover and DLP observations.
          </p>
        </div>
      </Card>
    </div>
  );
}
