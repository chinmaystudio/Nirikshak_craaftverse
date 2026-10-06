import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useParams, useLocation } from 'react-router-dom'
import { GovernmentLayout } from '@/layouts/GovernmentLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { NotFoundPage, ErrorPage } from '@/pages/errors/ErrorPages'
import { LoadingBlock } from '@/components/feedback/Feedback'

/* ---------- Auth screens (code-split) ---------- */
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const OtpVerificationPage = lazy(() => import('@/pages/auth/OtpVerificationPage').then((m) => ({ default: m.OtpVerificationPage })))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })))
const TwoFactorPage = lazy(() => import('@/pages/auth/TwoFactorPage').then((m) => ({ default: m.TwoFactorPage })))
const SelectDepartmentPage = lazy(() => import('@/pages/auth/SelectDepartmentPage').then((m) => ({ default: m.SelectDepartmentPage })))
const SelectRolePage = lazy(() => import('@/pages/auth/SelectRolePage').then((m) => ({ default: m.SelectRolePage })))

import { RoleGuard } from '@/core/auth/RoleGuard'
import { GOVERNMENT_ROLES } from '@/core/auth/auth.types'


/* ---------- Government global screens (code-split) ---------- */
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const ProjectsListPage = lazy(() => import('@/pages/projects/ProjectsListPage').then((m) => ({ default: m.ProjectsListPage })))
const PlanningPage = lazy(() => import('@/pages/planning/PlanningPage').then((m) => ({ default: m.PlanningPage })))
const GrievancesPage = lazy(() => import('@/pages/grievances/GrievancesPage').then((m) => ({ default: m.GrievancesPage })))
const ApprovalsPage = lazy(() => import('@/pages/approvals/ApprovalsPage').then((m) => ({ default: m.ApprovalsPage })))
const AlertsPage = lazy(() => import('@/pages/alerts/AlertsPage').then((m) => ({ default: m.AlertsPage })))
const DocumentsPage = lazy(() => import('@/pages/documents/DocumentsPage').then((m) => ({ default: m.DocumentsPage })))
const AuditPage = lazy(() => import('@/pages/audit/AuditPage').then((m) => ({ default: m.AuditPage })))
const AiInsightsPage = lazy(() => import('@/pages/ai-insights/AiInsightsPage').then((m) => ({ default: m.AiInsightsPage })))
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })))
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const AccessRequestsPage = lazy(() => import('@/pages/access-requests/AccessRequestsPage').then((m) => ({ default: m.AccessRequestsPage })))

/* ---------- Approval workspace (code-split; all modules request-scoped) ---------- */
const ApprovalWorkspaceLayout = lazy(() => import('@/pages/approval/ApprovalWorkspaceLayout').then((m) => ({ default: m.ApprovalWorkspaceLayout })))
const ApprovalOverviewPage = lazy(() => import('@/pages/approval/ApprovalOverviewPage').then((m) => ({ default: m.ApprovalOverviewPage })))
const ApprovalWorkflowPage = lazy(() => import('@/pages/approval/ApprovalWorkflowPage').then((m) => ({ default: m.ApprovalWorkflowPage })))
const ApprovalHistoryPage = lazy(() => import('@/pages/approval/ApprovalHistoryPage').then((m) => ({ default: m.ApprovalHistoryPage })))
const ApprovalProjectPage = lazy(() => import('@/pages/approval/ApprovalProjectPage').then((m) => ({ default: m.ApprovalProjectPage })))

/* ---------- Project workspace (code-split; all modules project-scoped) ---------- */
const ProjectWorkspaceLayout = lazy(() => import('@/pages/project/ProjectWorkspaceLayout').then((m) => ({ default: m.ProjectWorkspaceLayout })))
const WorkspaceOverviewPage = lazy(() => import('@/pages/project/WorkspaceOverviewPage').then((m) => ({ default: m.WorkspaceOverviewPage })))
const WorkspaceBudgetPage = lazy(() => import('@/pages/project/WorkspaceBudgetPage').then((m) => ({ default: m.WorkspaceBudgetPage })))
const WorkspaceTendersPage = lazy(() => import('@/pages/project/WorkspaceTendersPage').then((m) => ({ default: m.WorkspaceTendersPage })))
const WorkspaceContractorEvalPage = lazy(() => import('@/pages/project/WorkspaceContractorEvalPage').then((m) => ({ default: m.WorkspaceContractorEvalPage })))
const WorkspaceContractorsPage = lazy(() => import('@/pages/project/WorkspaceContractorsPage').then((m) => ({ default: m.WorkspaceContractorsPage })))
const WorkspaceExecutionPage = lazy(() => import('@/pages/project/WorkspaceExecutionPage').then((m) => ({ default: m.WorkspaceExecutionPage })))
const WorkspaceMilestonesPage = lazy(() => import('@/pages/project/WorkspaceMilestonesPage').then((m) => ({ default: m.WorkspaceMilestonesPage })))
const WorkspaceComplaintsPage = lazy(() => import('@/pages/project/WorkspaceComplaintsPage').then((m) => ({ default: m.WorkspaceComplaintsPage })))
const WorkspaceApprovalsPage = lazy(() => import('@/pages/project/WorkspaceApprovalsPage').then((m) => ({ default: m.WorkspaceApprovalsPage })))
const WorkspaceAlertsPage = lazy(() => import('@/pages/project/WorkspaceAlertsPage').then((m) => ({ default: m.WorkspaceAlertsPage })))
const WorkspaceDocumentsPage = lazy(() => import('@/pages/project/WorkspaceDocumentsPage').then((m) => ({ default: m.WorkspaceDocumentsPage })))
const WorkspaceAuditPage = lazy(() => import('@/pages/project/WorkspaceAuditPage').then((m) => ({ default: m.WorkspaceAuditPage })))
const WorkspaceAiInsightsPage = lazy(() => import('@/pages/project/WorkspaceAiInsightsPage').then((m) => ({ default: m.WorkspaceAiInsightsPage })))

/** Old /projects/:id?tab=… bookmarks land on the matching workspace module. */
const TAB_TO_SUFFIX: Record<string, string> = {
  overview: '',
  timeline: '',
  financials: '/budget',
  milestones: '/milestones',
  workOrder: '/execution',
  inspections: '/execution',
  litigation: '/execution#litigation',
  contractor: '/contractors',
  grievances: '/complaints',
  approvals: '/approvals',
  documents: '/documents',
  aiInsights: '/ai-insights',
  auditTrail: '/audit',
}

function LegacyProjectRedirect() {
  const { id = '' } = useParams()
  const { search, hash } = useLocation()
  const tab = new URLSearchParams(search).get('tab') ?? ''
  const suffix = TAB_TO_SUFFIX[tab]
  return <Navigate to={`/government/projects/${id}${suffix ?? ''}${hash}`} replace />
}

/**
 * Route map. Government routes live under /government; the project workspace
 * is nested under /government/projects/:id with one path per module so the
 * selected project stays in the URL. Citizen routes are public; auth screens
 * are standalone.
 */
export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Routes>
        <Route path="/" element={<Navigate to="/government/dashboard" replace />} />

        {/* Auth suite */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/government/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/government/register" element={<RegisterPage />} />
          <Route path="/otp-verification" element={<OtpVerificationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/government/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/government/reset-password" element={<ResetPasswordPage />} />
          <Route path="/2fa" element={<TwoFactorPage />} />
          <Route path="/select-department" element={<SelectDepartmentPage />} />
          <Route path="/select-role" element={<SelectRolePage />} />
        </Route>

        {/* Government (officer) suite */}
        <Route
          path="/government"
          element={
            <RoleGuard allowedRoles={GOVERNMENT_ROLES} loginPath="/government/login">
              <GovernmentLayout />
            </RoleGuard>
          }
        >
          <Route index element={<Navigate to="/government/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          {/* Project register + creation (global) */}
          <Route path="projects" element={<ProjectsListPage />} />
          <Route path="projects/create" element={<PlanningPage />} />

          {/* Project workspace — every module scoped to :id */}
          <Route path="projects/:id" element={<ProjectWorkspaceLayout />}>
            <Route index element={<WorkspaceOverviewPage />} />
            <Route path="budget" element={<WorkspaceBudgetPage />} />
            <Route path="tenders" element={<WorkspaceTendersPage />} />
            <Route path="contractor-evaluation" element={<WorkspaceContractorEvalPage />} />
            <Route path="contractors" element={<WorkspaceContractorsPage />} />
            <Route path="execution" element={<WorkspaceExecutionPage />} />
            <Route path="milestones" element={<WorkspaceMilestonesPage />} />
            <Route path="complaints" element={<WorkspaceComplaintsPage />} />
            <Route path="approvals" element={<WorkspaceApprovalsPage />} />
            <Route path="alerts" element={<WorkspaceAlertsPage />} />
            <Route path="documents" element={<WorkspaceDocumentsPage />} />
            <Route path="audit" element={<WorkspaceAuditPage />} />
            <Route path="ai-insights" element={<WorkspaceAiInsightsPage />} />
          </Route>

          {/* Cross-project oversight modules (global) */}
          <Route path="complaints" element={<GrievancesPage />} />
          <Route path="approvals" element={<ApprovalsPage />} />

          {/* Approval workspace — every module scoped to the selected request */}
          <Route path="approvals/:id" element={<ApprovalWorkspaceLayout />}>
            <Route index element={<ApprovalOverviewPage />} />
            <Route path="workflow" element={<ApprovalWorkflowPage />} />
            <Route path="history" element={<ApprovalHistoryPage />} />
            <Route path="project" element={<ApprovalProjectPage />} />
          </Route>

          <Route path="alerts" element={<AlertsPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="ai-insights" element={<AiInsightsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="access-requests" element={<AccessRequestsPage />} />
        </Route>

        {/* Legacy (pre-workspace) paths → new prefixed / workspace routes */}
        <Route path="/access-requests" element={<Navigate to="/government/access-requests" replace />} />
        <Route path="/dashboard" element={<Navigate to="/government/dashboard" replace />} />
        <Route path="/projects" element={<Navigate to="/government/projects" replace />} />
        <Route path="/projects/create" element={<Navigate to="/government/projects/create" replace />} />
        <Route path="/projects/:id" element={<LegacyProjectRedirect />} />
        <Route path="/planning" element={<Navigate to="/government/projects/create" replace />} />
        <Route path="/finance" element={<Navigate to="/government/projects" replace />} />
        <Route path="/tenders" element={<Navigate to="/government/projects" replace />} />
        <Route path="/tenders/:id" element={<Navigate to="/government/projects" replace />} />
        <Route path="/contractors" element={<Navigate to="/government/projects" replace />} />
        <Route path="/work-orders" element={<Navigate to="/government/projects" replace />} />
        <Route path="/milestones" element={<Navigate to="/government/projects" replace />} />
        <Route path="/approvals" element={<Navigate to="/government/approvals" replace />} />
        <Route path="/grievances" element={<Navigate to="/government/complaints" replace />} />
        <Route path="/litigation" element={<Navigate to="/government/projects" replace />} />
        <Route path="/documents" element={<Navigate to="/government/documents" replace />} />
        <Route path="/alerts" element={<Navigate to="/government/alerts" replace />} />
        <Route path="/audit" element={<Navigate to="/government/audit" replace />} />
        <Route path="/ai-insights" element={<Navigate to="/government/ai-insights" replace />} />
        <Route path="/reports" element={<Navigate to="/government/reports" replace />} />
        <Route path="/settings" element={<Navigate to="/government/settings" replace />} />

        {/* Deprecated Government-module citizen routes now use the canonical portal. */}
        <Route path="/citizen" element={<Navigate to="/user" replace />} />
        <Route path="/citizen/projects" element={<Navigate to="/user/projects" replace />} />
        <Route path="/citizen/projects/:id" element={<LegacyCitizenProjectRedirect />} />
        <Route path="/citizen/nearby" element={<Navigate to="/user/projects" replace />} />
        <Route path="/citizen/grievance" element={<Navigate to="/user/report" replace />} />
        <Route path="/citizen/track" element={<Navigate to="/user/complaints" replace />} />

        <Route path="*" element={<NotFoundPage />} />
        <Route path="/error" element={<ErrorPage />} />
      </Routes>
    </Suspense>
  )
}

function LegacyCitizenProjectRedirect() {
  const { id = '' } = useParams()
  return <Navigate to={`/user/projects/${encodeURIComponent(id)}`} replace />
}
