import { useMemo, useState } from 'react'
import { cn } from '@/utils/cn'
import { useI18n } from '@/context/I18nContext'
import { Button } from '@/components/ui/Button'

/**
 * DataTable — generic themed table with the Stitch conventions: header row in
 * surface-2 with uppercase 12px labels, horizontal scroll wrapper with
 * min-width, and per-row action slot. Keyboard accessible.
 *
 * Workspace additions (opt-in): column sorting, pagination with a footer,
 * and a sticky header for long tables. All default off — existing pages are
 * unaffected.
 */
export interface DataColumn<T> {
  key: string
  header: string
  render: (row: T) => React.ReactNode
  /** Extra classes on the cell (widths, alignment). */
  cellClassName?: string
  headerClassName?: string
  /** Mark the row-identity column for screen-reader ordering. */
  isRowHeader?: boolean
  /** Enable click-to-sort on this column. */
  sortable?: boolean
  /** Extract the comparable value (defaults to nothing — required when sortable). */
  sortValue?: (row: T) => string | number
}

type SortDir = 'asc' | 'desc'

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowActions,
  onRowClick,
  minWidth = 900,
  emptyState,
  className,
  caption,
  paginated = false,
  pageSize = 8,
  stickyHeader = false,
  initialSort,
}: {
  columns: DataColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  rowActions?: (row: T) => React.ReactNode
  onRowClick?: (row: T) => void
  minWidth?: number
  emptyState?: React.ReactNode
  className?: string
  caption?: string
  /** Show footer pagination (10/page default). */
  paginated?: boolean
  pageSize?: number
  /** Keep the header row visible while the table scrolls vertically. */
  stickyHeader?: boolean
  initialSort?: { key: string; dir: SortDir }
}) {
  const { t } = useI18n()
  const [sort, setSort] = useState<{ key: string; dir: SortDir } | null>(initialSort ?? null)
  const [page, setPage] = useState(1)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return rows
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const va = col.sortValue!(a)
      const vb = col.sortValue!(b)
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb)) * dir
    })
  }, [rows, sort, columns])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = paginated ? sorted.slice((safePage - 1) * pageSize, safePage * pageSize) : sorted

  const toggleSort = (key: string) =>
    setSort((prev) =>
      prev?.key === key ? (prev.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' },
    )

  if (rows.length === 0 && emptyState) {
    return <>{emptyState}</>
  }

  return (
    <div className={className}>
      <div className={cn('overflow-x-auto', stickyHeader && 'max-h-[520px] overflow-y-auto')}>
        <table className="w-full border-collapse text-body" style={{ minWidth }}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className={cn(stickyHeader && 'sticky top-0 z-sticky')}>
            <tr className="nk-table-header">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={sort?.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={cn('border-b border-border px-3 text-left first:pl-4 last:pr-4', c.headerClassName)}
                >
                  {c.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className={cn(
                        'inline-flex items-center gap-1 uppercase tracking-[0.05em] hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
                        sort?.key === c.key && 'text-primary-strong',
                      )}
                    >
                      {c.header}
                      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                        {sort?.key === c.key ? (sort.dir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                      </span>
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
              {rowActions && (
                <th scope="col" className="border-b border-border px-3 text-right">
                  <span className="sr-only">{t('common.actions')}</span>
                  {t('common.actions')}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paged.map((row) => (
              <tr
                key={rowKey(row)}
                className={cn(
                  'border-b border-border transition-colors duration-fast last:border-0 hover:bg-surface-2',
                  onRowClick && 'cursor-pointer',
                )}
                {...(onRowClick ? { onClick: () => onRowClick(row) } : {})}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      'px-3 py-2.5 align-middle first:pl-4 last:pr-4',
                      c.isRowHeader && 'font-medium text-fg',
                      c.cellClassName,
                    )}
                  >
                    {c.isRowHeader ? <span className="font-medium text-fg">{c.render(row)}</span> : c.render(row)}
                  </td>
                ))}
                {rowActions && <td className="px-3 py-2 text-right">{rowActions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {paginated && sorted.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2.5 text-caption text-fg-muted">
          <span className="tabular-nums">
            {t('common.showing')} {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, sorted.length)} {t('common.of')} {sorted.length}
          </span>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
              {t('common.back')}
            </Button>
            <span className="tabular-nums px-1">
              {safePage} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>
              {t('common.next')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Compact "View Project" row action used across list pages (Stitch pattern). */
export function ViewRowButton({ onClick, label }: { onClick: () => void; label?: string }) {
  const { t } = useI18n()
  return (
    <Button variant="outline" size="sm" onClick={onClick} className="!min-h-7 !px-2.5">
      {label ?? t('common.viewProject')}
    </Button>
  )
}
