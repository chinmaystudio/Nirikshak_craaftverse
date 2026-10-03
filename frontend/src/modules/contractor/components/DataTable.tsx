import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cls } from '../lib/utils';
import { EmptyState } from './ui';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  sortVal?: (row: T) => string | number;
  className?: string;
  thClass?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  empty,
  minWidth = '',
  initialSort,
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
  minWidth?: string;
  initialSort?: { key: string; dir: 1 | -1 };
}) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(initialSort ?? null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortVal) return rows;
    return [...rows].sort((a, b) => {
      const va = col.sortVal!(a);
      const vb = col.sortVal!(b);
      if (va < vb) return -1 * sort.dir;
      if (va > vb) return 1 * sort.dir;
      return 0;
    });
  }, [rows, sort, columns]);

  if (rows.length === 0) {
    return <>{empty ?? <EmptyState title="No records found" msg="Try adjusting your filters or search query." />}</>;
  }

  return (
    <div className="overflow-x-auto -mx-px">
      <table className={cls('data-table', minWidth)}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={cls(c.thClass, c.sortVal && 'cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200')}
                onClick={
                  c.sortVal
                    ? () =>
                        setSort((s) =>
                          s?.key === c.key ? { key: c.key, dir: s.dir === 1 ? -1 : 1 } : { key: c.key, dir: 1 }
                        )
                    : undefined
                }
                aria-sort={sort?.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {c.label}
                  {c.sortVal && <ChevronDown className={cls('w-3 h-3 transition-transform', sort?.key === c.key ? (sort.dir === 1 ? 'rotate-180' : '') : 'opacity-0')} />}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={row.id}
              className={cls('transition-colors', onRowClick && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60')}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((c) => (
                <td key={c.key} className={c.className}>
                  {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
