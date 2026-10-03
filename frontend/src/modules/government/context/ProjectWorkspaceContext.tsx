import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type {
  Project,
  WorkOrder,
  InspectionRecord,
  LitigationCase,
  Grievance,
  DocumentItem,
  ApprovalItem,
  AiInsight,
  AuditFinding,
  AlertItem,
  Tender,
  BillItem,
} from '@/types'
import {
  projectsApi,
  workApi,
  litigationApi,
  grievancesApi,
  documentsApi,
  approvalsApi,
  insightsApi,
  auditApi,
  alertsApi,
  tendersApi,
  financeApi,
} from '@/api'
import { useApiData } from '@/hooks/useApiData'

/**
 * Project workspace data context — every module dataset is filtered to the
 * selected project here, once, so no workspace page can accidentally render
 * cross-project data (project-context architecture rule).
 */
export interface ProjectWorkspaceValue {
  projectId: string
  /** undefined while loading, null when no project matches the id. */
  project: Project | null | undefined
  workOrder: WorkOrder | undefined
  inspections: InspectionRecord[]
  litigation: LitigationCase[]
  grievances: Grievance[]
  documents: DocumentItem[]
  approvals: ApprovalItem[]
  insights: AiInsight[]
  findings: AuditFinding[]
  alerts: AlertItem[]
  tenders: Tender[]
  bills: BillItem[]
}

const ProjectWorkspaceContext = createContext<ProjectWorkspaceValue | null>(null)

export function ProjectWorkspaceProvider({
  projectId,
  children,
}: {
  projectId: string
  children: ReactNode
}) {
  const { data: project, loading } = useApiData(() => projectsApi.get(projectId), [projectId])

  const { data: workOrders } = useApiData(() => workApi.workOrders(), [])
  const { data: inspectionsAll } = useApiData(() => workApi.inspections(), [])
  const { data: litigationAll } = useApiData(() => litigationApi.all(), [])
  const { data: grievancesAll } = useApiData(() => grievancesApi.all(), [])
  const { data: documentsAll } = useApiData(() => documentsApi.all(), [])
  const { data: approvalsAll } = useApiData(() => approvalsApi.all(), [])
  const { data: insightsAll } = useApiData(() => insightsApi.all(), [])
  const { data: findingsAll } = useApiData(() => auditApi.findings(), [])
  const { data: alertsAll } = useApiData(() => alertsApi.list(), [])
  const { data: tendersAll } = useApiData(() => tendersApi.all(), [])
  const { data: billsAll } = useApiData(() => financeApi.bills(), [])

  const value = useMemo<ProjectWorkspaceValue>(() => {
    const id = projectId
    return {
      projectId: id,
      project: loading ? undefined : (project ?? null),
      workOrder: workOrders?.find((w) => w.projectId === id),
      inspections: (inspectionsAll ?? []).filter((x) => x.projectId === id),
      litigation: (litigationAll ?? []).filter((x) => x.projectId === id),
      grievances: (grievancesAll ?? []).filter((x) => x.projectId === id),
      documents: (documentsAll ?? []).filter((x) => x.projectId === id),
      approvals: (approvalsAll ?? []).filter((x) => x.projectId === id),
      insights: (insightsAll ?? []).filter((x) => (x.relatedProjectIds ?? []).includes(id)),
      findings: (findingsAll ?? []).filter((x) => x.projectId === id),
      alerts: (alertsAll ?? []).filter((x) => x.projectId === id),
      tenders: (tendersAll ?? []).filter((x) => x.projectId === id),
      bills: (billsAll ?? []).filter((x) => x.projectId === id),
    }
  }, [projectId, project, loading, workOrders, inspectionsAll, litigationAll, grievancesAll, documentsAll, approvalsAll, insightsAll, findingsAll, alertsAll, tendersAll, billsAll])

  return <ProjectWorkspaceContext.Provider value={value}>{children}</ProjectWorkspaceContext.Provider>
}

export function useProjectWorkspace(): ProjectWorkspaceValue {
  const ctx = useContext(ProjectWorkspaceContext)
  if (!ctx) throw new Error('useProjectWorkspace must be used within ProjectWorkspaceProvider')
  return ctx
}
