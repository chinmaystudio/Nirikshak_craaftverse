import { cls } from '../lib/utils';

const LEGEND_COLORS: Record<string, string> = {
  'bg-blue-700': '#1d4ed8',
  'bg-blue-900': '#1e3a8a',
  'bg-blue-400': '#60a5fa',
  'bg-green-600': '#16a34a',
  'bg-amber-600': '#d97706',
  'bg-red-600': '#dc2626',
  'bg-slate-300': '#cbd5e1',
  'bg-slate-400': '#94a3b8',
};

export function ChartLegend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
      {items.map((l) => (
        <div key={l.label} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
          <span
            className={cls('w-2.5 h-2.5 rounded-sm inline-block', l.color)}
            style={l.color.startsWith('bg-') ? undefined : { background: l.color }}
          />
          {l.label}
        </div>
      ))}
    </div>
  );
}

export function LineChart({
  labels,
  series,
  height = 200,
  yMax,
  yFmt,
  area = false,
}: {
  labels: string[];
  series: { name: string; color: string; values: number[]; dashed?: boolean }[];
  height?: number;
  yMax?: number;
  yFmt?: (n: number) => string;
  area?: boolean;
}) {
  const W = 620;
  const H = height;
  const padL = 44;
  const padR = 10;
  const padT = 12;
  const padB = 24;
  const iw = W - padL - padR;
  const ih = H - padT - padB;
  const rawMax = yMax ?? Math.max(1, ...series.flatMap((s) => s.values));
  const max = rawMax * 1.15;
  const x = (i: number) => padL + iw * (labels.length === 1 ? 0.5 : i / (labels.length - 1));
  const y = (v: number) => padT + ih - (ih * v) / max;
  const ticks = 4;
  const hex = (c: string) => LEGEND_COLORS[c] ?? c;
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full block" style={{ height }} role="img" aria-label="Line chart">
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const v = (max * i) / ticks;
          return (
            <g key={i}>
              <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="var(--ch-grid)" strokeWidth="1" />
              <text x={padL - 6} y={y(v) + 3} textAnchor="end" fontSize="10" fill="var(--ch-text)">
                {yFmt ? yFmt(v) : Math.round(v)}
              </text>
            </g>
          );
        })}
        {series.map((s, si) => (
          <g key={si}>
            {area && (
              <polygon
                points={`${x(0)},${y(0)} ${s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} ${x(s.values.length - 1)},${y(0)}`}
                fill={hex(s.color)}
                opacity="0.08"
              />
            )}
            <polyline
              fill="none"
              stroke={hex(s.color)}
              strokeWidth="2"
              strokeDasharray={s.dashed ? '5 4' : undefined}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
            />
            {!s.dashed &&
              s.values.map((v, i) => (
                <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="var(--ch-dot)" stroke={hex(s.color)} strokeWidth="2" />
              ))}
          </g>
        ))}
        {labels.map((l, i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--ch-text)">
            {l}
          </text>
        ))}
      </svg>
      <ChartLegend items={series.map((s) => ({ label: s.name, color: s.color }))} />
    </div>
  );
}

export function BarChart({
  labels,
  values,
  color = 'bg-blue-700',
  height = 200,
  yFmt,
  suffix = '',
}: {
  labels: string[];
  values: number[];
  color?: string;
  height?: number;
  yFmt?: (n: number) => string;
  suffix?: string;
}) {
  const W = 620;
  const H = height;
  const padL = 44;
  const padR = 10;
  const padT = 16;
  const padB = 24;
  const iw = W - padL - padR;
  const ih = H - padT - padB;
  const max = Math.max(1, ...values) * 1.15;
  const step = iw / values.length;
  const bw = Math.min(34, step * 0.55);
  const y = (v: number) => padT + ih - (ih * v) / max;
  const ticks = 4;
  const fill = LEGEND_COLORS[color] ?? '#1d4ed8';
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full block" style={{ height }} role="img" aria-label="Bar chart">
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const v = (max * i) / ticks;
          return (
            <g key={i}>
              <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="var(--ch-grid)" strokeWidth="1" />
              <text x={padL - 6} y={y(v) + 3} textAnchor="end" fontSize="10" fill="var(--ch-text)">
                {yFmt ? yFmt(v) : Math.round(v)}
              </text>
            </g>
          );
        })}
        {values.map((v, i) => {
          const cx = padL + step * i + step / 2;
          return (
            <g key={i}>
              <rect x={cx - bw / 2} y={y(v)} width={bw} height={Math.max(2, padT + ih - y(v))} rx="2" fill={fill} />
              <text x={cx} y={y(v) - 5} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--ch-text)">
                {yFmt ? yFmt(v) : v}
                {suffix}
              </text>
            </g>
          );
        })}
        {labels.map((l, i) => (
          <text key={i} x={padL + step * i + step / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--ch-text)">
            {l}
          </text>
        ))}
      </svg>
    </div>
  );
}

export function GroupedBars({
  labels,
  series,
  height = 220,
  yFmt,
}: {
  labels: string[];
  series: { name: string; color: string; values: number[] }[];
  height?: number;
  yFmt?: (n: number) => string;
}) {
  const W = 620;
  const H = height;
  const padL = 44;
  const padR = 10;
  const padT = 16;
  const padB = 24;
  const iw = W - padL - padR;
  const ih = H - padT - padB;
  const max = Math.max(1, ...series.flatMap((s) => s.values)) * 1.15;
  const step = iw / labels.length;
  const groupW = Math.min(72, step * 0.7);
  const bw = groupW / series.length - 4;
  const y = (v: number) => padT + ih - (ih * v) / max;
  const ticks = 4;
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full block" style={{ height }} role="img" aria-label="Grouped bar chart">
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const v = (max * i) / ticks;
          return (
            <g key={i}>
              <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="var(--ch-grid)" strokeWidth="1" />
              <text x={padL - 6} y={y(v) + 3} textAnchor="end" fontSize="10" fill="var(--ch-text)">
                {yFmt ? yFmt(v) : Math.round(v)}
              </text>
            </g>
          );
        })}
        {labels.map((l, i) => {
          const base = padL + step * i + (step - groupW) / 2;
          return (
            <g key={i}>
              {series.map((s, si) => (
                <rect
                  key={si}
                  x={base + si * (bw + 4)}
                  y={y(s.values[i])}
                  width={Math.max(6, bw)}
                  height={Math.max(2, padT + ih - y(s.values[i]))}
                  rx="2"
                  fill={LEGEND_COLORS[s.color] ?? s.color}
                />
              ))}
              <text x={padL + step * i + step / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--ch-text)">
                {l}
              </text>
            </g>
          );
        })}
      </svg>
      <ChartLegend items={series.map((s) => ({ label: s.name, color: s.color }))} />
    </div>
  );
}

export function Donut({
  segments,
  size = 112,
  hole = 72,
  center,
}: {
  segments: { value: number; color: string; label: string }[];
  size?: number;
  hole?: number;
  center?: { big: string; small: string };
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const stops = segments
    .map((s) => {
      const from = (acc / total) * 100;
      acc += s.value;
      const to = (acc / total) * 100;
      const c = LEGEND_COLORS[s.color] ?? s.color;
      return `${c} ${from}% ${to}%`;
    })
    .join(', ');
  return (
    <div
      className="rounded-full flex items-center justify-center relative shrink-0"
      style={{ width: size, height: size, background: `conic-gradient(${stops})` }}
      role="img"
      aria-label="Donut chart"
    >
      <div
        className="rounded-full flex flex-col items-center justify-center absolute bg-white dark:bg-slate-900"
        style={{ width: hole, height: hole }}
      >
        {center && (
          <>
            <span className="font-bold text-xl text-slate-800 dark:text-slate-100 leading-tight">{center.big}</span>
            <span className="text-[10px] text-slate-500 font-medium">{center.small}</span>
          </>
        )}
      </div>
    </div>
  );
}

export function ProgressRing({
  value,
  size = 128,
  max = 100,
  color = 'var(--ch-blue)',
  label,
  sub,
}: {
  value: number;
  size?: number;
  max?: number;
  color?: string;
  label?: string;
  sub?: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const hole = size - 26;
  return (
    <div
      className="rounded-full flex items-center justify-center relative shrink-0"
      style={{ width: size, height: size, background: `conic-gradient(${color} 0% ${pct}%, var(--ch-track) ${pct}% 100%)` }}
      role="img"
      aria-label={`Progress ${Math.round(pct)}%`}
    >
      <div className="rounded-full flex flex-col items-center justify-center absolute bg-white dark:bg-slate-900" style={{ width: hole, height: hole }}>
        {label && <span className="font-display font-bold text-slate-800 dark:text-slate-100 leading-tight">{label}</span>}
        {sub && <span className="text-[10px] text-slate-500 font-medium">{sub}</span>}
      </div>
    </div>
  );
}

export function HBars({
  items,
  max = 100,
  showValue = true,
  showNum = false,
  labelWidth = 'w-48 sm:w-60',
}: {
  items: { label: string; value: number; num?: string | number; color?: string }[];
  max?: number;
  showValue?: boolean;
  showNum?: boolean;
  labelWidth?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-4 text-sm group">
          <span className={cls('shrink-0 truncate text-slate-700 font-medium dark:text-slate-300 transition-colors group-hover:text-slate-900 dark:group-hover:text-white', labelWidth)} title={it.label}>
            {it.label}
          </span>
          <div className="flex-1 bg-slate-100 h-3.5 rounded-sm overflow-hidden dark:bg-slate-800">
            <div
              className={cls('h-full rounded-sm transition-all', it.color ?? 'bg-blue-800')}
              style={{ width: `${Math.min(100, (it.value / max) * 100)}%` }}
            />
          </div>
          {showNum && <span className="w-8 text-right font-bold text-slate-700 dark:text-slate-200">{it.num ?? it.value}</span>}
          {showValue && (
            <span className="w-12 text-right font-bold text-slate-700 dark:text-slate-200 tabular-nums">{Math.round(it.value)}%</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function StackedBar({ segments }: { segments: { value: number; color: string; label: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="flex h-3.5 w-full rounded-sm overflow-hidden">
      {segments.map((s) => (
        <div
          key={s.label}
          className={cls('h-full', s.color)}
          style={{ width: `${(s.value / total) * 100}%` }}
          title={`${s.label}: ${s.value}`}
        />
      ))}
    </div>
  );
}

export function StepFlow({
  steps,
}: {
  steps: { label: string; state: 'done' | 'current' | 'pending'; note?: string }[];
}) {
  return (
    <div className="flex flex-wrap items-stretch gap-2">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-2">
          <div
            className={cls(
              'rounded-md border px-3 py-2 min-w-[130px]',
              s.state === 'done' &&
                'border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/50 dark:text-green-300',
              s.state === 'current' && 'border-blue-600 bg-blue-600 text-white shadow-sm',
              s.state === 'pending' && 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
            )}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold leading-tight">
              {s.state === 'done' ? (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span className="text-[10px] font-bold opacity-80">{i + 1}</span>
              )}
              {s.label}
            </div>
            {s.note && <div className="text-[10px] mt-0.5 opacity-80 font-medium">{s.note}</div>}
          </div>
          {i < steps.length - 1 && <span className="text-slate-300 dark:text-slate-600">→</span>}
        </div>
      ))}
    </div>
  );
}
