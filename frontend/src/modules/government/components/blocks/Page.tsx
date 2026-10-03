import { useState } from 'react'
import { cn } from '@/utils/cn'
import { useI18n } from '@/context/I18nContext'
import { TextField, Select } from '@/components/ui/Fields'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/modals/Modal'
import { Panel } from '@/components/ui/Card'
import { KpiCard } from '@/components/charts/KpiCard'

/**
 * Shared workspace page blocks — the consistent module scaffold:
 * [Page title + description + actions] → [KPI row] → [filter bar] → content.
 * Purely presentational; every module composes these so spacing and
 * hierarchy stay identical across the project workspace.
 */

/** Page title, one-line description and primary/secondary action row. */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h1 className="text-heading-1 text-fg">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-body-small text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** Consistent KPI grid — 4-up on desktop, 2-up tablet, 1-up mobile. */
export function KpiRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4', className)}>{children}</div>
  )
}

export interface FilterSelect {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}

/**
 * Compact one-row filter bar: search + up to 3 selects + Clear. Advanced
 * filters slot in as children (rendered on a second row if given).
 */
export function FilterBar({
  search,
  onSearch,
  searchPlaceholder,
  selects = [],
  onClear,
  children,
  className,
}: {
  search: string
  onSearch: (v: string) => void
  searchPlaceholder?: string
  selects?: FilterSelect[]
  onClear?: () => void
  children?: React.ReactNode
  className?: string
}) {
  const { t } = useI18n()
  const dirty = search !== '' || selects.some((s) => s.value !== '')
  return (
    <Panel className={className} title="Filters" icon="filter_list" bodyClassName="p-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-52 flex-1">
          <TextField
            label={t('common.search')}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            startIcon="search"
            placeholder={searchPlaceholder}
          />
        </div>
        {selects.map((s) => (
          <div key={s.label} className="min-w-40">
            <Select label={s.label} value={s.value} onChange={(e) => s.onChange(e.target.value)} options={s.options} />
          </div>
        ))}
        {onClear && (
          <Button variant="ghost" size="sm" icon="filter_alt_off" disabled={!dirty} onClick={onClear}>
            {t('common.clear')}
          </Button>
        )}
      </div>
      {children && <div className="mt-3 border-t border-border pt-3">{children}</div>}
    </Panel>
  )
}

/** Confirmation for dangerous/state-changing demo actions. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  danger = false,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}) {
  const { t } = useI18n()
  return (
    <Modal open={open} onClose={onClose} title={title} titleIcon={danger ? 'warning' : 'task_alt'} size="sm">
      <p className="text-body text-fg-muted">{message}</p>
      <div className="mt-4 flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button
          variant={danger ? 'danger' : 'primary'}
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmLabel ?? t('common.confirm')}
        </Button>
      </div>
    </Modal>
  )
}

/** Small labelled figure for drawer/detail density. */
export function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-fg-subtle">{label}</dt>
      <dd className="text-fg">{value}</dd>
    </div>
  )
}

export { KpiCard }
