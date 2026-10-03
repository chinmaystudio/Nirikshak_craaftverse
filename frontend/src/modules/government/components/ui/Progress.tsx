import { cn } from '@/utils/cn'

/** Progress bar with visible percentage text (progress never implied by bar alone). */
export function Progress({
  value,
  label,
  tone = 'primary',
  showValue = true,
  className,
  size = 'md',
}: {
  value: number
  /** Accessible name for the bar. */
  label: string
  tone?: 'primary' | 'success' | 'warning' | 'danger'
  showValue?: boolean
  className?: string
  size?: 'sm' | 'md'
}) {
  const clamped = Math.max(0, Math.min(100, value))
  const barColor =
    tone === 'success'
      ? 'bg-success'
      : tone === 'warning'
        ? 'bg-warning'
        : tone === 'danger'
          ? 'bg-danger'
          : 'bg-primary'
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className={cn(
          'w-full overflow-hidden rounded-badge bg-surface-3',
          size === 'sm' ? 'h-1.5' : 'h-2.5',
        )}
      >
        <div className={cn('h-full rounded-badge transition-[width] duration-slow', barColor)} style={{ width: `${clamped}%` }} />
      </div>
      {showValue && (
        <span className="shrink-0 text-caption tabular-nums text-fg-muted">{clamped.toFixed(1)}%</span>
      )}
    </div>
  )
}

/** Dual physical/financial progress pair, the dashboard KPI pattern. */
export function DualProgress({
  physical,
  financial,
  className,
}: {
  physical: number
  financial: number
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center gap-2">
        <span className="w-16 shrink-0 text-caption text-fg-subtle">Physical</span>
        <Progress value={physical} label="Physical progress" tone="primary" size="sm" />
      </div>
      <div className="flex items-center gap-2">
        <span className="w-16 shrink-0 text-caption text-fg-subtle">Financial</span>
        <Progress value={financial} label="Financial progress" tone="success" size="sm" />
      </div>
    </div>
  )
}
