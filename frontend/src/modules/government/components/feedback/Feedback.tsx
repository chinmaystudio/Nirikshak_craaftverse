import { cn } from '@/utils/cn'
import { useI18n } from '@/context/I18nContext'

interface EmptyStateProps {
  icon?: string
  titleKey?: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon = 'folder_off',
  titleKey = 'common.noItems',
  description,
  action,
  className,
}: EmptyStateProps) {
  const { t } = useI18n()
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 py-12 text-center', className)}>
      <span className="material-symbols-outlined text-[40px] text-fg-subtle" aria-hidden="true">
        {icon}
      </span>
      <p className="text-label text-fg-muted">{t(titleKey)}</p>
      {description && <p className="max-w-sm text-body-small text-fg-subtle">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/** Skeleton shimmer row for loading tables/cards. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-control bg-surface-3', className)} aria-hidden="true" />
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2 p-4" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}

/** Spinner + label for route-level loading. */
export function LoadingBlock({ labelKey = 'common.loading' }: { labelKey?: string }) {
  const { t } = useI18n()
  return (
    <div className="flex items-center justify-center gap-3 py-16" role="status">
      <span
        className="material-symbols-outlined animate-spin text-[28px] text-primary"
        aria-hidden="true"
        style={{ animationDuration: '1.4s' }}
      >
        progress_activity
      </span>
      <span className="text-body text-fg-muted">{t(labelKey)}</span>
    </div>
  )
}
