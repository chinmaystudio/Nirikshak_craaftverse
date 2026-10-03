import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { Panel } from '@/components/ui/Card'
import { Select, TextField } from '@/components/ui/Fields'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Progress } from '@/components/ui/Progress'
import { DataTable } from '@/components/tables/DataTable'
import { EmptyState } from '@/components/feedback/Feedback'
import { Button } from '@/components/ui/Button'
import { formatCr, formatDate } from '@/utils/format'
import { PROJECT_STATUS } from '@/utils/status'
import type { Project } from '@/types'
import { projectsApi } from '@/api'
import { useApiData, useDebounced } from '@/hooks/useApiData'
import { DEPARTMENTS, DISTRICTS, PROJECT_CATEGORIES } from '@/constants'
import { cn } from '@/utils/cn'

/**
 * ProjectsListPage — master registry: search + filters (department, district,
 * category, status) + list/grid view toggle (Stitch directory pattern).
 */
export function ProjectsListPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { data: projects, loading } = useApiData(() => projectsApi.all(), [])
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const debounced = useDebounced(search)
  const [dept, setDept] = useState('')
  const [district, setDistrict] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [view, setView] = useState<'list' | 'grid'>('list')

  const rows = useMemo(() => {
    let r = projects ?? []
    const s = debounced.trim().toLowerCase()
    // Search matches Project ID, project name, location (district) and category.
    if (s)
      r = r.filter(
        (p) =>
          (p.id || '').toLowerCase().includes(s) ||
          (p.name || '').toLowerCase().includes(s) ||
          (p.district || '').toLowerCase().includes(s) ||
          (p.category || '').toLowerCase().includes(s),
      )
    if (dept) r = r.filter((p) => (p.department || '') === dept)
    if (district) r = r.filter((p) => (p.district || '') === district)
    if (category) r = r.filter((p) => (p.category || '') === category)
    if (status) r = r.filter((p) => p.status === status)
    return r
  }, [projects, debounced, dept, district, category, status])

  const clearAll = () => {
    setSearch(''); setDept(''); setDistrict(''); setCategory(''); setStatus('')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-heading-1 text-fg">{t('nav.projects')}</h1>
          <p className="mt-1 text-body-small text-fg-muted">
            Master registry of sanctioned works available to your account.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-control border border-border-strong" role="group" aria-label="View mode">
            {(['list', 'grid'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={cn(
                  'inline-flex h-9 w-10 items-center justify-center rounded-control text-fg-muted hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
                  view === v && 'bg-primary-soft text-primary-strong',
                )}
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  {v === 'list' ? 'view_list' : 'grid_view'}
                </span>
              </button>
            ))}
          </div>
          <Button variant="primary" icon="add" onClick={() => navigate('/government/projects/create')}>
            {t('dash.sanctionNewProject')}
          </Button>
        </div>
      </div>

      <Panel title={t('common.filters')} icon="filter_list" bodyClassName="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-1">
            <TextField label={t('common.search')} placeholder={t('dash.keywordPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} startIcon="search" />
          </div>
          <Select
            label={t('common.department')}
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            options={[{ value: '', label: t('common.all') }, ...DEPARTMENTS.map((d) => ({ value: d.name, label: d.name }))]}
          />
          <Select
            label={t('common.district')}
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            options={[{ value: '', label: t('common.all') }, ...DISTRICTS.map((d) => ({ value: d, label: d }))]}
          />
          <Select
            label={t('common.category')}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[{ value: '', label: t('common.all') }, ...PROJECT_CATEGORIES.map((c) => ({ value: c, label: c }))]}
          />
          <Select
            label={t('common.status')}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: '', label: t('common.all') },
              ...Object.entries(PROJECT_STATUS).map(([k, d]) => ({ value: k, label: t(d.key) })),
            ]}
          />
        </div>
      </Panel>

      {view === 'list' ? (
        <Panel title={`${t('common.project')} (${rows.length})`} icon="map" bodyClassName="p-0">
          {loading ? (
            <div className="p-8 text-center text-body-small text-fg-muted">{t('common.loading')}</div>
          ) : (
            <DataTable<Project>
              minWidth={1000}
              rows={rows}
              rowKey={(p) => p.id}
              paginated={true}
              pageSize={15}
              columns={[
                { key: 'id', header: 'ID', isRowHeader: true, render: (p) => <span className="nk-mono-id text-fg-muted">{p.id}</span> },
                { key: 'name', header: 'Project', render: (p) => <span className="block max-w-80 truncate font-medium text-fg" title={p.name}>{p.name}</span> },
                { key: 'district', header: t('common.district'), render: (p) => p.district },
                { key: 'status', header: t('common.status'), render: (p) => <StatusBadge descriptor={PROJECT_STATUS[p.status]} /> },
                { key: 'amount', header: 'Sanctioned', cellClassName: 'tabular-nums', render: (p) => formatCr(p.sanctionedAmountCr) },
                { key: 'phys', header: t('common.physicalProgress'), render: (p) => <Progress value={p.physicalProgressPct} label={`Physical progress of ${p.id}`} size="sm" className="min-w-32" /> },
                { key: 'eoc', header: 'Completion', render: (p) => formatDate(p.expectedCompletion) },
              ]}
              rowActions={(p) => (
                <Button variant="primary" size="sm" onClick={() => navigate(`/government/projects/${p.id}`)}>
                  {t('common.viewProject')}
                </Button>
              )}
              emptyState={
                <EmptyState
                  icon="search_off"
                  description={t('common.noResults')}
                  action={
                    <Button variant="outline" size="sm" onClick={clearAll}>
                      {t('common.clearFilters')}
                    </Button>
                  }
                />
              }
            />
          )}
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => navigate(`/government/projects/${p.id}`)}
              className="nk-card flex flex-col gap-3 p-4 text-left transition-colors duration-fast hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="nk-mono-id text-fg-muted">{p.id}</span>
                <StatusBadge descriptor={PROJECT_STATUS[p.status]} size="sm" />
              </div>
              <p className="line-clamp-2 min-h-10 text-label text-fg">{p.name}</p>
              <p className="text-caption text-fg-subtle">
                {(p.department || 'Public Works').replace(/ Department$/i, '')} • {p.district || 'Pune'}
              </p>
              <Progress value={p.physicalProgressPct} label={`Physical progress of ${p.id}`} size="sm" />
              <div className="flex items-center justify-between border-t border-border pt-2 text-caption">
                <span className="tabular-nums text-fg-muted">{formatCr(p.sanctionedAmountCr)}</span>
                <span className="text-fg-subtle">{formatDate(p.expectedCompletion)}</span>
              </div>
            </button>
          ))}
          {rows.length === 0 && (
            <div className="nk-card col-span-full">
              <EmptyState icon="search_off" description={t('common.noResults')} action={<Button variant="outline" size="sm" onClick={clearAll}>{t('common.clearFilters')}</Button>} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
