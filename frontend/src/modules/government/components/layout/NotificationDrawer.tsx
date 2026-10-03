import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Drawer } from '@/components/modals/Modal'
import { useNotifications } from '@/context/NotificationsContext'
import { useI18n } from '@/context/I18nContext'
import { Badge, CountBadge } from '@/components/ui/Badge'
import { IconButton } from '@/components/ui/Button'
import { EmptyState } from '@/components/feedback/Feedback'
import { ALERT_SEVERITY } from '@/utils/status'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatRelative, formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'

/**
 * NotificationDrawer — right-side panel opened from the header bell.
 * Lists alerts with severity badges (icon+text+tint), mark-read actions and
 * deep links to the source project.
 */
export function NotificationDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { alerts, unreadCount, markRead, markAllRead } = useNotifications()
  const { t } = useI18n()
  const [filterUnread, setFilterUnread] = useState(false)

  const list = filterUnread ? alerts.filter((a) => !a.read) : alerts

  return (
    <Drawer open={open} onClose={onClose} title={t('nav.alerts')} titleIcon="notifications">
      <div className="flex items-center justify-between gap-2 border-b border-border p-3">
        <span className="inline-flex items-center gap-2 text-caption text-fg-muted">
          {t('common.total')}: <span className="tabular-nums text-fg">{alerts.length}</span>
          <CountBadge count={unreadCount} tone="secondary" />
        </span>
        <div className="flex items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-caption text-fg-muted">
            <input
              type="checkbox"
              checked={filterUnread}
              onChange={(e) => setFilterUnread(e.target.checked)}
              className="h-3.5 w-3.5 accent-primary"
            />
            Unread
          </label>
          <button
            type="button"
            onClick={markAllRead}
            className="rounded-[2px] text-caption text-primary-strong hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            Mark all read
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState icon="notifications_off" titleKey="common.noItems" />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {list.map((a) => (
            <li key={a.id} className={cn('p-3', !a.read && 'bg-primary-soft/40')}>
              <div className="mb-1 flex items-start justify-between gap-2">
                <Badge tone="neutral" dot>
                  {a.category}
                </Badge>
                <StatusBadge descriptor={ALERT_SEVERITY[a.severity]} size="sm" />
              </div>
              <p className="text-label text-fg">{a.title}</p>
              <p className="mt-0.5 text-body-small text-fg-muted">{a.body}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-fg-subtle">
                <span title={formatDate(a.timestamp)}>{formatRelative(a.timestamp)}</span>
                <span className="nk-mono-id">{a.id}</span>
                {a.projectId && (
                  <Link
                    to={`/government/projects/${a.projectId}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-0.5 rounded-[2px] text-primary-strong hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    {a.projectId}
                    <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                      arrow_forward
                    </span>
                  </Link>
                )}
                {!a.read && (
                  <IconButton icon="done_all" label="Mark read" size="sm" onClick={() => markRead(a.id)} />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  )
}

/** Bell trigger used by GovernmentHeader. */
export function NotificationBellButton({ onClick }: { onClick: () => void }) {
  const { unreadCount } = useNotifications()
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-control text-fg-muted transition-colors duration-fast hover:bg-surface-2 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
        notifications
      </span>
      {unreadCount > 0 && (
        <span
          className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-badge bg-danger px-0.5 text-[10px] font-bold tabular-nums text-white"
          aria-hidden="true"
        >
          {unreadCount}
        </span>
      )}
    </button>
  )
}
