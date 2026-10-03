import { useMemo, useState } from 'react'
import { useI18n } from '@/context/I18nContext'
import { Panel } from '@/components/ui/Card'
import { Select, TextField } from '@/components/ui/Fields'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/tables/DataTable'
import { formatDate, formatFileSizeKb } from '@/utils/format'
import { ACCESS_LEVEL } from '@/utils/status'
import type { DocumentItem } from '@/types'
import { documentsApi } from '@/api'
import { useApiData, useDebounced } from '@/hooks/useApiData'
import { DOCUMENT_CATEGORIES } from '@/constants'

const CATEGORY_ICONS: Record<string, string> = {
  'Administrative Approval': 'approval',
  'Technical Approval': 'architecture',
  'Work Order': 'assignment',
  'Tender Document': 'gavel',
  'Contract Agreement': 'handshake',
  'Inspection Report': 'fact_check',
  'Financial Record': 'payments',
  'Site Photograph': 'photo_camera',
}

/**
 * DocumentsPage — Documents & Archives: the spec's 8 categories with
 * access-level gating (Public / Internal / Restricted) and version tracking.
 */
export function DocumentsPage() {
  const { t } = useI18n()
  const { data: documents, loading } = useApiData(() => documentsApi.all(), [])
  const [category, setCategory] = useState('')
  const [access, setAccess] = useState('')
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search)

  const rows = useMemo(
    () =>
      (documents ?? []).filter((d) => {
        if (category && d.category !== category) return false
        if (access && d.accessLevel !== access) return false
        if (debounced && !`${d.id} ${d.name}`.toLowerCase().includes(debounced.toLowerCase())) return false
        return true
      }),
    [documents, category, access, debounced],
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-heading-1 text-fg">{t('nav.documents')}</h1>
        <p className="mt-1 text-body-small text-fg-muted">
          Central archive across {DOCUMENT_CATEGORIES.length} categories with signed copies and access control (mock data).
        </p>
      </div>

      <Panel title={t('common.filters')} icon="filter_list" bodyClassName="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TextField label={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} startIcon="search" />
          <Select
            label={t('common.category')}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[{ value: '', label: t('common.all') }, ...DOCUMENT_CATEGORIES.map((c) => ({ value: c, label: c }))]}
          />
          <Select
            label="Access level"
            value={access}
            onChange={(e) => setAccess(e.target.value)}
            options={[
              { value: '', label: t('common.all') },
              ...Object.keys(ACCESS_LEVEL).map((k) => ({ value: k, label: t(ACCESS_LEVEL[k as keyof typeof ACCESS_LEVEL].key) })),
            ]}
          />
        </div>
      </Panel>

      <Panel title={`Documents (${rows.length})`} icon="folder_open" bodyClassName="p-0">
        {loading ? <div className="p-8 text-center text-body-small text-fg-muted">{t('common.loading')}</div> : (
          <DataTable<DocumentItem>
            minWidth={1080}
            rows={rows}
            rowKey={(d) => d.id}
            columns={[
              { key: 'id', header: 'Doc ID', isRowHeader: true, render: (d) => <span className="nk-mono-id text-fg-muted">{d.id}</span> },
              { key: 'name', header: 'Name', render: (d) => (
                <span className="flex max-w-72 items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
                    {CATEGORY_ICONS[d.category] ?? 'description'}
                  </span>
                  <span className="truncate" title={d.name}>{d.name}</span>
                </span>
              ) },
              { key: 'category', header: t('common.category'), render: (d) => <Badge tone="neutral">{d.category}</Badge> },
              { key: 'access', header: 'Access', render: (d) => <StatusBadge descriptor={ACCESS_LEVEL[d.accessLevel]} size="sm" /> },
              { key: 'project', header: t('common.project'), render: (d) => d.projectId ? <span className="nk-mono-id text-fg-muted">{d.projectId}</span> : '—' },
              { key: 'version', header: 'Ver.', cellClassName: 'tabular-nums', render: (d) => `v${d.version}` },
              { key: 'size', header: 'Size', cellClassName: 'tabular-nums', render: (d) => formatFileSizeKb(d.fileSizeKb) },
              { key: 'uploaded', header: 'Uploaded', cellClassName: 'tabular-nums', render: (d) => formatDate(d.uploadedOn) },
              { key: 'signed', header: 'Signed By', render: (d) => (d.signedBy ? <span className="text-caption">{d.signedBy}</span> : '—') },
            ]}
            rowActions={() => (
              <Button variant="outline" size="sm" icon="download" aria-label="Demo download — file is mock data">
                Demo
              </Button>
            )}
          />
        )}
      </Panel>
      <p className="text-caption text-fg-subtle">
        {t('common.mockDataNote')} Downloads are disabled in this demonstration build.
      </p>
    </div>
  )
}
