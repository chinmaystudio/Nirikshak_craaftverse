import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { ApprovalItem, Project } from '@/types'
import { approvalsApi, projectsApi } from '@/api'
import { useApiData } from '@/hooks/useApiData'

/**
 * Approval workspace data context — everything inside the approval workspace
 * is scoped to the selected approval request (register → select → workspace
 * architecture, mirroring the project workspace).
 */
export interface ApprovalWorkspaceValue {
  approvalId: string
  /** undefined while loading, null when no approval matches the id. */
  approval: ApprovalItem | null | undefined
  /** The project this approval belongs to (undefined = loading, null = none). */
  project: Project | null | undefined
  /** Other approval requests on the same project (excludes the current one). */
  relatedApprovals: ApprovalItem[]
}

const ApprovalWorkspaceContext = createContext<ApprovalWorkspaceValue | null>(null)

export function ApprovalWorkspaceProvider({
  approvalId,
  children,
}: {
  approvalId: string
  children: ReactNode
}) {
  const { data: approval, loading } = useApiData(() => approvalsApi.get(approvalId), [approvalId])
  const projectId = approval?.projectId
  const { data: project, loading: projectLoading } = useApiData(
    () => (projectId ? projectsApi.get(projectId) : Promise.resolve(undefined)),
    [projectId],
  )
  const { data: approvalsAll } = useApiData(() => approvalsApi.all(), [])

  const value = useMemo<ApprovalWorkspaceValue>(
    () => ({
      approvalId,
      approval: loading ? undefined : (approval ?? null),
      project: !projectId ? null : projectLoading ? undefined : (project ?? null),
      relatedApprovals: (approvalsAll ?? []).filter(
        (a) => a.projectId && a.projectId === projectId && a.id !== approvalId,
      ),
    }),
    [approvalId, approval, loading, project, projectLoading, projectId, approvalsAll],
  )

  return <ApprovalWorkspaceContext.Provider value={value}>{children}</ApprovalWorkspaceContext.Provider>
}

export function useApprovalWorkspace(): ApprovalWorkspaceValue {
  const ctx = useContext(ApprovalWorkspaceContext)
  if (!ctx) throw new Error('useApprovalWorkspace must be used within ApprovalWorkspaceProvider')
  return ctx
}
