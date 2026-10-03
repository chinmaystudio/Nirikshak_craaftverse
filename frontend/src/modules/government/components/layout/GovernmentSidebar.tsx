import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { buildWorkspaceNav, buildApprovalNav, type NavNode } from '@/constants'
// Nav chrome only needs record lookups; importing via '@/api' would pull the
// whole mock-API + demo-dataset barrel into the eager bundle.
import { projectsApi } from '@/api'
import { findApproval } from '@/data/approvals'
import { useApiData } from '@/hooks/useApiData'
import { useI18n } from '@/context/I18nContext'
import { cn } from '@/utils/cn'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Progress } from '@/components/ui/Progress'
import { PROJECT_STATUS, APPROVAL_STATUS, PRIORITY } from '@/utils/status'

/** True when any node in the subtree links to this pathname (ignoring query/hash). */
function subtreeMatches(node: NavNode, pathname: string): boolean {
  if (node.to && node.to.split(/[?#]/)[0] === pathname) return true
  return node.children?.some((c) => subtreeMatches(c, pathname)) ?? false
}

/** Ids of groups that must be open for the current pathname to be visible. */
function collectExpandIds(nodes: NavNode[], pathname: string): string[] {
  const ids = new Set<string>()
  const walk = (list: NavNode[], trail: string[]) => {
    for (const n of list) {
      if (subtreeMatches(n, pathname)) {
        for (const id of trail) ids.add(id)
        if (n.children) ids.add(n.id)
      }
      if (n.children) walk(n.children, [...trail, n.id])
    }
  }
  walk(nodes, [])
  return [...ids]
}

/** Count of leaf nodes per exact link target (drives unique-leaf highlighting). */
function countLeafTargets(nodes: NavNode[], counts: Map<string, number> = new Map()): Map<string, number> {
  for (const n of nodes) {
    if (n.children?.length) countLeafTargets(n.children, counts)
    else if (n.to) counts.set(n.to, (counts.get(n.to) ?? 0) + 1)
  }
  return counts
}

function badge(node: NavNode) {
  if (node.badge == null || node.badge <= 0) return null
  return (
    <span
      className={cn(
        'inline-flex min-w-5 shrink-0 items-center justify-center rounded-badge border px-1 py-0.5 text-[11px] tabular-nums',
        node.badgeTone === 'secondary'
          ? 'border-primary-border bg-primary-soft text-primary-strong'
          : 'border-border bg-surface-2 text-fg-muted',
      )}
    >
      {node.badge}
    </span>
  )
}

const Chevron = ({ open }: { open: boolean }) => (
  <span
    className={cn(
      'material-symbols-outlined shrink-0 text-[18px] text-fg-subtle transition-transform duration-fast',
      open && 'rotate-180',
    )}
    aria-hidden="true"
  >
    expand_more
  </span>
)

function NavNodeItem({
  node,
  depth,
  expanded,
  onToggle,
  onNavigate,
  leafTargetCounts,
  pathname,
  search,
  hash,
}: {
  node: NavNode
  depth: number
  expanded: Set<string>
  onToggle: (id: string) => void
  onNavigate?: () => void
  leafTargetCounts: Map<string, number>
  pathname: string
  search: string
  hash: string
}) {
  const { t } = useI18n()
  const label = node.labelKey ? t(node.labelKey) : (node.label ?? '')
  const hasChildren = !!node.children?.length
  const open = expanded.has(node.id)
  const panelId = `nav-panel-${node.id}`
  const rowPad = depth === 0 ? 'pl-4' : 'pl-2'

  /* Leaf — deep links highlight on exact location match; plain links only
     highlight when they are the sole leaf for that target. */
  if (!hasChildren) {
    const isDeep = !!node.to && /[?#]/.test(node.to)
    const active =
      !!node.to &&
      (isDeep
        ? pathname + search + hash === node.to && (leafTargetCounts.get(node.to) ?? 0) === 1
        : pathname === node.to.split(/[?#]/)[0] && (leafTargetCounts.get(node.to) ?? 0) === 1)
    return (
      <li>
        <Link
          to={node.to!}
          onClick={onNavigate}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'relative flex min-h-8 items-center gap-2 py-1.5 pr-2 text-caption transition-colors duration-fast',
            rowPad,
            active
              ? 'bg-primary-soft font-semibold text-primary-strong'
              : 'text-fg-muted hover:bg-hover hover:text-fg',
            'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
          )}
        >
          <span className={cn('h-1 w-1 shrink-0 rounded-full', active ? 'bg-primary' : 'bg-fg-subtle')} aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">{label}</span>
          {badge(node)}
        </Link>
      </li>
    )
  }

  /* Group — expands/collapses; may also link to its module route. */
  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      'relative flex min-h-10 flex-1 items-center gap-3 py-2 pr-1 text-body-small transition-colors duration-fast',
      rowPad,
      isActive
        ? 'bg-primary-soft font-semibold text-primary-strong'
        : 'text-fg-muted hover:bg-hover hover:text-fg',
      'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
    )

  const icon = node.icon && (
    <span className="material-symbols-outlined shrink-0 text-[20px]" aria-hidden="true">
      {node.icon}
    </span>
  )

  return (
    <li>
      {node.to ? (
        <div className="flex items-center pr-2.5">
          <NavLink to={node.to} onClick={onNavigate} className={linkClasses}>
            {({ isActive }) => (
              <>
                {isActive && depth === 0 && (
                  <span className="absolute inset-y-0 left-0 w-1 rounded-r bg-primary" aria-hidden="true" />
                )}
                {icon}
                <span className="min-w-0 flex-1 truncate">{label}</span>
                {badge(node)}
              </>
            )}
          </NavLink>
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={`${open ? 'Collapse' : 'Expand'} ${label}`}
            className={cn(
              'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-control text-fg-muted transition-colors duration-fast hover:bg-hover hover:text-fg',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
            )}
          >
            <Chevron open={open} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onToggle(node.id)}
          aria-expanded={open}
          aria-controls={panelId}
          className={cn(
            'flex min-h-10 w-full items-center gap-3 py-2 pr-2.5 text-body-small font-semibold text-fg transition-colors duration-fast hover:bg-hover',
            rowPad,
            'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
          )}
        >
          {icon}
          <span className="min-w-0 flex-1 truncate text-left">{label}</span>
          <Chevron open={open} />
        </button>
      )}
      {open && (
        <ul id={panelId} className="ml-5 border-l border-border py-0.5">
          {node.children!.map((child) => (
            <NavNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              onNavigate={onNavigate}
              leafTargetCounts={leafTargetCounts}
              pathname={pathname}
              search={search}
              hash={hash}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

/**
 * ProjectContextSidebar — contextual navigation that exists ONLY while a
 * project or approval workspace route is active:
 *   /government/projects/:id/*  → project module tree
 *   /government/approvals/:id/* → approval module tree
 * The match has NO end anchor: the sidebar stays mounted on every module
 * route (…/budget, …/tenders, …/audit, …) and unmounts the moment the route
 * leaves the workspace (back to All Projects). Global routes render nothing.
 */
export function GovernmentSidebar({
  open,
  onClose,
  onNavigate,
}: {
  /** Mobile drawer state (ignored when no contextual route is active). */
  open: boolean
  onClose: () => void
  onNavigate?: () => void
}) {
  const { t } = useI18n()
  const location = useLocation()
  const { pathname, search, hash } = location

  const projectId = /^\/government\/projects\/([^/]+)/.exec(pathname)?.[1]
  const inProject = !!projectId && projectId !== 'create'
  const approvalId = /^\/government\/approvals\/([^/]+)/.exec(pathname)?.[1]

  const { data: project } = useApiData(
    () => inProject ? projectsApi.get(projectId!) : Promise.resolve(undefined),
    [projectId],
  )
  const { data: approval } = useApiData(
    () => Promise.resolve(approvalId ? findApproval(approvalId) : undefined),
    [approvalId],
  )

  const tree = useMemo(() => {
    if (inProject) return buildWorkspaceNav(projectId!)
    if (approvalId) return buildApprovalNav(approvalId)
    return null
  }, [inProject, projectId, approvalId])

  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(tree ? collectExpandIds(tree, pathname) : []),
  )

  // Keep the branch to the current route open as the user navigates.
  useEffect(() => {
    if (!tree) return
    const ids = collectExpandIds(tree, pathname)
    if (ids.length === 0) return
    setExpanded((prev) => {
      let changed = false
      const next = new Set(prev)
      for (const id of ids) {
        if (!next.has(id)) {
          next.add(id)
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [tree, pathname])

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const leafTargetCounts = useMemo(() => (tree ? countLeafTargets(tree) : new Map<string, number>()), [tree])

  // ROUTE RULE: no contextual route → no sidebar, in every state.
  if (!tree) return null

  const backTo = inProject ? '/government/projects' : '/government/approvals'
  const backLabel = inProject ? t('nav.backToProjects') : t('nav.backToApprovals')

  return (
    <>
      {/* Scrim (mobile) */}
      {open && (
        <div className="fixed inset-0 top-header-total z-sidebar bg-[var(--scrim)] lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <nav
        aria-label={inProject ? 'Project sections' : 'Approval sections'}
        className={cn(
          'fixed left-0 top-header-total z-sidebar flex h-[calc(100vh-var(--header-total))] w-sidebar flex-col overflow-y-auto border-r border-border bg-surface transition-transform duration-base',
          // Mobile: off-canvas unless open; Desktop: visible while context lasts
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="border-b border-border">
          <Link
            to={backTo}
            onClick={onNavigate}
            className="flex min-h-9 items-center gap-2 px-4 text-caption text-primary-strong transition-colors duration-fast hover:bg-hover focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_back</span>
            {backLabel}
          </Link>

          {inProject && project && (
            <div className="px-4 pb-3 pt-2">
              <p className="nk-mono-id text-fg-muted">{project.id}</p>
              <p className="mt-0.5 line-clamp-2 text-body-small font-semibold text-fg">{project.name}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <StatusBadge descriptor={PROJECT_STATUS[project.status]} size="sm" />
                <span className="tabular-nums text-caption text-fg-muted">{project.physicalProgressPct}%</span>
              </div>
              <Progress
                value={project.physicalProgressPct}
                label={`${project.name} progress`}
                size="sm"
                className="mt-1.5"
                showValue={false}
              />
            </div>
          )}

          {!inProject && approval && (
            <div className="px-4 pb-3 pt-2">
              <p className="nk-mono-id text-fg-muted">{approval.id}</p>
              <p className="mt-0.5 line-clamp-2 text-body-small font-semibold text-fg">{approval.type}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge descriptor={APPROVAL_STATUS[approval.status]} size="sm" />
                <StatusBadge descriptor={PRIORITY[approval.priority]} size="sm" />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 py-2">
          <ul>
            {tree.map((node) => (
              <NavNodeItem
                key={node.id}
                node={node}
                depth={0}
                expanded={expanded}
                onToggle={toggle}
                onNavigate={onNavigate}
                leafTargetCounts={leafTargetCounts}
                pathname={pathname}
                search={search}
                hash={hash}
              />
            ))}
          </ul>
        </div>

        <div className="border-t border-border p-3 text-[11px] text-fg-subtle">
          <p className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
            {t('common.footerSystemStatus')}
          </p>
        </div>
      </nav>
    </>
  )
}
