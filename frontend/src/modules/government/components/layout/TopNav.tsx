import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { Dropdown, MenuItem, MenuDivider } from '@/components/navigation/Dropdown'
import { TOP_NAV, TOP_NAV_MORE, type TopNavItem } from '@/constants'
import { cn } from '@/utils/cn'

/**
 * TopNav — the global module navigation bar (row 2 of the header).
 * Config-driven from TOP_NAV / TOP_NAV_MORE: each entry links to its module
 * page; Project Management opens a dropdown (All Projects / Create Project);
 * system modules live under "More". Active state is pathname-derived, so the
 * module stays highlighted even deep inside a project workspace.
 */
export function TopNav({
  showProjectNavToggle,
  onOpenProjectNav,
}: {
  /** Only true on project/approval workspace routes (mobile drawer toggle). */
  showProjectNavToggle: boolean
  onOpenProjectNav: () => void
}) {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const isActive = (item: Pick<TopNavItem, 'match'>) =>
    item.match.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  const badge = (n?: number) =>
    n ? (
      <span className="inline-flex min-w-4 items-center justify-center rounded-badge bg-danger px-1 text-[10px] font-bold tabular-nums text-white">
        {n}
      </span>
    ) : null

  const itemClasses = (active: boolean) =>
    cn(
      'inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-control px-2.5 text-body-small transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary xl:px-3',
      active
        ? 'bg-primary-soft font-semibold text-primary-strong'
        : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
    )

  return (
    <nav aria-label="Primary" className="flex h-11 items-center gap-1 border-t border-border px-2 md:px-3 lg:justify-center">
      {/* Contextual (project/approval) sidebar toggle — mobile only */}
      {showProjectNavToggle && (
        <button
          type="button"
          onClick={onOpenProjectNav}
          aria-label={t('nav.projectWorkspace')}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-border text-fg-muted hover:bg-surface-2 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary lg:hidden"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">segment</span>
        </button>
      )}

      {/* Desktop items — centered */}
      <div className="hidden items-center justify-center gap-0.5 lg:flex">
        {TOP_NAV.map((item) => {
          const active = isActive(item)
          const children = item.children
          if (!children) {
            return (
              <Link key={item.id} to={item.to} aria-current={active ? 'page' : undefined} className={itemClasses(active)}>
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{item.icon}</span>
                {t(item.shortKey ?? item.labelKey)}
                {badge(item.badge)}
              </Link>
            )
          }
          return (
            <Dropdown
              key={item.id}
              menuLabel={t(item.shortKey ?? item.labelKey)}
              align="start"
              width="w-96"
              trigger={({ toggle: tg, id }) => (
                <button
                  type="button"
                  onClick={tg}
                  aria-haspopup="menu"
                  aria-labelledby={id}
                  aria-expanded={undefined}
                  aria-current={active ? 'page' : undefined}
                  className={cn(itemClasses(active), 'justify-between')}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{item.icon}</span>
                    {t(item.shortKey ?? item.labelKey)}
                    {badge(item.badge)}
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-fg-subtle" aria-hidden="true">expand_more</span>
                </button>
              )}
            >
              {(close) => (
                <>
                  {children.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        close()
                        navigate(c.to)
                      }}
                      className="flex w-full items-start gap-3 rounded-control px-3 py-2.5 text-left transition-colors duration-fast hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <span className="material-symbols-outlined mt-0.5 text-[20px] text-primary" aria-hidden="true">{c.icon}</span>
                      <span className="min-w-0">
                        <span className="block text-label text-fg">{t(c.labelKey)}</span>
                        <span className="block text-caption text-fg-subtle">{c.description}</span>
                      </span>
                    </button>
                  ))}
                </>
              )}
            </Dropdown>
          )
        })}

        {/* System overflow */}
        <Dropdown
          menuLabel={t('nav.top.more')}
          align="end"
          width="w-80"
          trigger={({ toggle: tg, id }) => (
            <button
              type="button"
              onClick={tg}
              aria-haspopup="menu"
              aria-labelledby={id}
              className={cn(itemClasses(false), 'justify-between')}
            >
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">apps</span>
                {t('nav.top.more')}
              </span>
              <span className="material-symbols-outlined text-[16px] text-fg-subtle" aria-hidden="true">expand_more</span>
            </button>
          )}
        >
          {(close) => (
            <>
              {TOP_NAV_MORE.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    close()
                    navigate(c.to)
                  }}
                  className="flex w-full items-start gap-3 rounded-control px-3 py-2.5 text-left transition-colors duration-fast hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <span className="material-symbols-outlined mt-0.5 text-[20px] text-primary" aria-hidden="true">{c.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-label text-fg">{t(c.labelKey)}</span>
                    <span className="block text-caption text-fg-subtle">{c.description}</span>
                  </span>
                </button>
              ))}
              <MenuDivider />
              <MenuItem icon="settings" onClick={() => { close(); navigate('/government/settings') }}>
                {t('nav.settings')}
              </MenuItem>
            </>
          )}
        </Dropdown>
      </div>

      {/* Mobile: horizontally scrollable module chips */}
      <div className="flex flex-1 items-center gap-1 overflow-x-auto lg:hidden" role="presentation">
        {TOP_NAV.map((item) => {
          const active = isActive(item)
          const to = item.children ? item.children[0].to : item.to
          return (
            <Link key={item.id} to={to} aria-current={active ? 'page' : undefined} className={itemClasses(active)}>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{item.icon}</span>
              {t(item.shortKey ?? item.labelKey)}
              {badge(item.badge)}
            </Link>
          )
        })}
        <span className="h-6 w-px shrink-0 bg-border" aria-hidden="true" />
        {TOP_NAV_MORE.map((c) => (
          <Link key={c.id} to={c.to} className={cn(itemClasses(false), 'shrink-0')}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{c.icon}</span>
            {t(c.labelKey)}
          </Link>
        ))}
      </div>
    </nav>
  )
}
