import type { Department } from '@/types'

/**
 * Static reference data for NIRIKSHAK.
 * All values are realistic Indian government conventions (demo data, no backend).
 */

export const APP_NAME = 'NIRIKSHAK'
export const APP_TAGLINE = 'Transparent Projects • Stronger India'
export const APP_VERSION = '2.4.1'
export const FOOTER_TEXT =
  'System Status: All Ministry Nodes Operational | NIC Gov Cloud Hosted'

export const DEMO_BANNER_KEY = 'common.demoBanner'

/* ---------- Departments (demo master list) ---------- */
export const DEPARTMENTS: Department[] = [
  { id: 'pwd', code: 'PWD', name: 'Public Works Department', nameHi: 'लोक निर्माण विभाग', nameMr: 'लोकमार्ग निर्माण विभाग' },
  { id: 'wrd', code: 'WRD', name: 'Water Resources Department', nameHi: 'जल संसाधन विभाग', nameMr: 'जलसंधारण विभाग' },
  { id: 'uid', code: 'UID', name: 'Urban Development Department', nameHi: 'शहरी विकास विभाग', nameMr: 'नगरविकास विभाग' },
  { id: 'rhd', code: 'RHD', name: 'Rural Development Department', nameHi: 'ग्रामीण विकास विभाग', nameMr: 'ग्रामीण विकास विभाग' },
  { id: 'phed', code: 'PHED', name: 'Public Health Engineering Department', nameHi: 'जन स्वास्थ्य अभियांत्रिकी विभाग', nameMr: 'सार्वजनिक आरोग्य अभियांत्रिकी विभाग' },
  { id: 'med', code: 'MED', name: 'Maharashtra Energy Department', nameHi: 'ऊर्जा विभाग', nameMr: 'ऊर्जा विभाग' },
]

export const DISTRICTS = [
  'Pune', 'Mumbai City', 'Mumbai Suburban', 'Nagpur', 'Nashik', 'Thane',
  'Aurangabad', 'Solapur', 'Kolhapur', 'Amravati', 'Yavatmal', 'Nanded',
  'Jalgaon', 'Ahmednagar', 'Satara', 'Sangli', 'Ratnagiri', 'Chandrapur',
]

export const DIVISIONS = ['Konkan', 'Pune', 'Nashik', 'Chhatrapati Sambhajinagar', 'Amravati', 'Nagpur']

export const PROJECT_CATEGORIES = [
  'Roads & Highways', 'Water Supply', 'Irrigation', 'Buildings',
  'Urban Infrastructure', 'Bridges', 'Sanitation & Sewerage', 'Energy',
]

/* ---------- Funding sources (typical GoM shared patterns) ---------- */
export const FUNDING_SOURCES = [
  'State Budget (Plan)',
  'CSS — Central Share',
  'Jal Jeevan Mission',
  'AMRUT 2.0',
  'Finance Commission Grant',
  'NABARD RIDF',
  'HUDCO Loan',
  'HUDCO Loan (Interior Parts)',
]

/* ---------- Document categories (spec: 8 fixed) ---------- */
export const DOCUMENT_CATEGORIES = [
  'Administrative Approval',
  'Technical Approval',
  'Work Order',
  'Tender Document',
  'Contract Agreement',
  'Inspection Report',
  'Financial Record',
  'Site Photograph',
] as const

/* ---------- Alert categories (spec: 8 fixed) ---------- */
export const ALERT_CATEGORIES = [
  'SLA Breach',
  'Fund Disbursal',
  'Tender Activity',
  'Quality Flag',
  'Geo-Inspection',
  'Litigation Update',
  'Grievance Escalation',
  'System & Sync',
] as const

/* ---------- Report types (spec: 8 fixed) ---------- */
export const REPORT_TYPES = [
  'Project Status Report',
  'Financial Utilization Report',
  'Physical Progress Report',
  'Contractor Performance Report',
  'Audit Compliance Report',
  'Grievance Redressal Report',
  'Tender & Procurement Report',
  'Executive Summary',
] as const

/* ---------- Government navigation (two-layer, config-driven) ----------
 * 1. TOP_NAV — global modules in the main top navigation bar.
 * 2. buildWorkspaceNav / buildApprovalNav — contextual sidebars shown only
 *    inside /government/projects/:id/* and /government/approvals/:id/*.
 * The contextual sidebar is derived from the current route — never a stale
 * boolean — so it disappears automatically when project context is exited.
 */

export interface NavNode {
  /** Stable id — drives expand/collapse state and aria wiring. */
  id: string
  /** Translated label (i18n key) — used for structural nodes. */
  labelKey?: string
  /** Plain English label — leaf outline items (translations pending). */
  label?: string
  /** Material Symbols ligature */
  icon?: string
  /** Route the node links to; groups may both link and expand. */
  to?: string
  /** Badge count shown beside the label */
  badge?: number
  badgeTone?: 'neutral' | 'secondary'
  children?: NavNode[]
}

/** Leaf outline items that all point at one module route. */
function leaves(prefix: string, to: string, labels: string[]): NavNode[] {
  return labels.map((label, i) => ({ id: `${prefix}-${i}`, label, to }))
}

/* ---------- Global top navigation ---------- */

export interface TopNavItem {
  id: string
  labelKey: string
  /** Compact label for the top bar (falls back to labelKey). */
  shortKey?: string
  icon: string
  to: string
  /** Pathname prefixes that mark this module active (incl. project workspaces). */
  match: string[]
  badge?: number
  /** Dropdown links; when absent the item navigates directly. */
  children?: { id: string; labelKey: string; to: string; icon: string; description: string }[]
}

export const TOP_NAV: TopNavItem[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard', shortKey: 'nav.top.dashboard', icon: 'dashboard', to: '/government/dashboard', match: ['/government/dashboard'] },
  {
    id: 'project-management',
    labelKey: 'nav.projectManagement',
    shortKey: 'nav.top.projects',
    icon: 'map',
    to: '/government/projects',
    match: ['/government/projects'],
    children: [
      { id: 'all-projects', labelKey: 'nav.allProjects', to: '/government/projects', icon: 'list_alt', description: 'Search by Project ID, filter and open project workspaces' },
      { id: 'project-creation', labelKey: 'nav.projectCreation', to: '/government/projects/create', icon: 'post_add', description: 'Sanction a new project — 8-step planning wizard' },
    ],
  },
  { id: 'complaints', labelKey: 'nav.complaintsTracking', shortKey: 'nav.top.complaints', icon: 'report_problem', to: '/government/complaints', match: ['/government/complaints'] },
  { id: 'approvals', labelKey: 'nav.approvalWorkflow', shortKey: 'nav.top.approvals', icon: 'rule', to: '/government/approvals', match: ['/government/approvals'] },
  { id: 'alerts', labelKey: 'nav.alertsNotifications', shortKey: 'nav.top.alerts', icon: 'crisis_alert', to: '/government/alerts', match: ['/government/alerts'] },
  { id: 'documents', labelKey: 'nav.documents', shortKey: 'nav.top.documents', icon: 'folder_shared', to: '/government/documents', match: ['/government/documents'] },
  { id: 'access-requests', labelKey: 'nav.accessRequests', shortKey: 'nav.top.accessRequests', icon: 'how_to_reg', to: '/government/access-requests', match: ['/government/access-requests'] },
  { id: 'audit', labelKey: 'nav.audit', shortKey: 'nav.top.audit', icon: 'content_paste_search', to: '/government/audit', match: ['/government/audit'] },
  { id: 'ai-insights', labelKey: 'nav.aiInsights', shortKey: 'nav.top.ai', icon: 'auto_awesome', to: '/government/ai-insights', match: ['/government/ai-insights'] },
]

/** Overflow group at the end of the top navigation. */
export const TOP_NAV_MORE: { id: string; labelKey: string; to: string; icon: string; description: string }[] = [
  { id: 'more-access-requests', labelKey: 'nav.accessRequests', to: '/government/access-requests', icon: 'how_to_reg', description: 'Review Government & Contractor access requests' },
  { id: 'more-reports', labelKey: 'nav.reports', to: '/government/reports', icon: 'analytics', description: 'Cross-project analytics and exports' },
  { id: 'more-citizen', labelKey: 'nav.citizenPortal', to: '/user', icon: 'public', description: 'Public transparency portal' },
  { id: 'more-settings', labelKey: 'nav.settings', to: '/government/settings', icon: 'manage_accounts', description: 'Roles, permissions and preferences' },
]

/**
 * Project workspace sidebar — every module below is scoped to the selected
 * project. Leaf items deep-link to section anchors within module pages.
 */
export function buildWorkspaceNav(projectId: string): NavNode[] {
  const base = `/government/projects/${projectId}`
  const p = (section = '') => base + section
  return [
    { id: 'ws-overview', labelKey: 'common.overview', icon: 'dashboard', to: p('') },
    {
      id: 'ws-budget',
      labelKey: 'nav.finance',
      icon: 'account_balance',
      to: p('/budget'),
      children: [
        { id: 'wsb-alloc', label: 'Budget allocation', to: p('/budget#allocation') },
        { id: 'wsb-sanctioned', label: 'Sanctioned amount', to: p('/budget#allocation') },
        { id: 'wsb-revised', label: 'Revised cost', to: p('/budget#allocation') },
        { id: 'wsb-release', label: 'Fund release tracking', to: p('/budget#fund-release') },
        { id: 'wsb-expenditure', label: 'Expenditure tracking', to: p('/budget#allocation') },
        { id: 'wsb-utilization', label: 'Budget utilization', to: p('/budget#allocation') },
        { id: 'wsb-overrun', label: 'Cost-overrun tracking', to: p('/budget#cost-overrun') },
        {
          id: 'wsb-payments',
          labelKey: 'nav.paymentBillMgmt',
          icon: 'receipt_long',
          to: p('/budget#payments'),
          children: [
            { id: 'wsb-bill-sub', label: 'Bill submission', to: p('/budget#payments') },
            { id: 'wsb-bill-ver', label: 'Bill verification', to: p('/budget#payments') },
            { id: 'wsb-bill-app', label: 'Payment approval', to: p('/budget#payments') },
            { id: 'wsb-bill-track', label: 'Payment tracking', to: p('/budget#payments') },
            { id: 'wsb-bill-dup', label: 'Duplicate/abnormal bill detection', to: p('/budget#duplicates') },
          ],
        },
      ],
    },
    {
      id: 'ws-tenders',
      labelKey: 'nav.tenderManagement',
      icon: 'gavel',
      to: p('/tenders'),
      children: [
        { id: 'wst-creation', label: 'Tender creation', to: p('/tenders#tenders') },
        { id: 'wst-publication', label: 'Tender publication', to: p('/tenders#tenders') },
        { id: 'wst-bids', label: 'Bid submission', to: p('/tenders#tenders') },
        { id: 'wst-tech', label: 'Technical evaluation', to: p('/tenders#comparison') },
        { id: 'wst-fin', label: 'Financial evaluation', to: p('/tenders#comparison') },
        { id: 'wst-comparison', label: 'Bid comparison', to: p('/tenders#comparison') },
        { id: 'wst-approval', label: 'Tender approval', to: p('/tenders#award') },
        { id: 'wst-history', label: 'Tender history', to: p('/tenders#tenders') },
      ],
    },
    {
      id: 'ws-work',
      labelKey: 'nav.workContractManagement',
      icon: 'construction',
      to: p('/execution'),
      children: [
        {
          id: 'wsw-execution',
          labelKey: 'nav.projectExecution',
          icon: 'engineering',
          to: p('/execution#execution'),
          children: leaves('wsw-ex', p('/execution#execution'), [
            'Work-progress tracking',
            'Site updates',
            'Geo-tagged evidence',
            'Time-stamped photographs',
            'Planned vs actual progress',
          ]),
        },
        {
          id: 'wsw-people',
          labelKey: 'nav.peopleSettlement',
          icon: 'groups',
          to: p('/execution#people'),
          children: [
            ...leaves('wsw-pp', p('/execution#people'), [
              'Labour/workforce records',
              'Contractor workforce tracking',
              'Wage/payment settlement',
              'Workforce-related issues',
            ]),
            { id: 'wsw-pp-mig', labelKey: 'nav.migrationSettlement', to: p('/execution#people') },
          ],
        },
        {
          id: 'wsw-litigation',
          labelKey: 'nav.litigationManagement',
          icon: 'policy',
          to: p('/execution#litigation'),
          children: leaves('wsw-lit', p('/execution#litigation'), [
            'Dispute tracking',
            'Legal case records',
            'Contractor disputes',
            'Notices & legal documents',
            'Case status & deadlines',
          ]),
        },
        {
          id: 'wsw-ai-reports',
          labelKey: 'nav.aiMonitoringReports',
          icon: 'monitoring',
          to: p('/execution#ai-monitoring'),
          children: leaves('wsw-ai', p('/execution#ai-monitoring'), [
            'Automated progress reports',
            'Delay prediction',
            'Cost-overrun prediction',
            'Project health score',
            'Risk detection',
            'AI-generated summaries',
          ]),
        },
        {
          id: 'wsw-milestones',
          labelKey: 'nav.milestoneManagement',
          icon: 'fact_check',
          to: p('/milestones'),
          children: leaves('wsw-ms', p('/milestones'), [
            'Milestone creation',
            'Deadline tracking',
            'Completion verification',
            'Milestone approval',
            'Milestone-based payments',
          ]),
        },
      ],
    },
    {
      id: 'ws-complaints',
      labelKey: 'nav.complaintsTracking',
      icon: 'report_problem',
      to: p('/complaints'),
      children: leaves('wsg', p('/complaints'), [
        'Citizen complaint management',
        'Complaint categorization',
        'Location-based complaints',
        'Assign complaint to officer',
        'Evidence submission',
        'Resolution tracking',
        'Escalation',
        'Citizen feedback',
        'Complaint analytics',
      ]),
    },
    {
      id: 'ws-approvals',
      labelKey: 'nav.approvalWorkflow',
      icon: 'rule',
      to: p('/approvals'),
      children: leaves('wsa', p('/approvals'), [
        'Project approvals',
        'Budget approvals',
        'Tender approvals',
        'Contractor approvals',
        'Work approvals',
        'Milestone approvals',
        'Bill/payment approvals',
        'Multi-level approval workflow',
        'Digital signatures',
        'Approval history',
      ]),
    },
    {
      id: 'ws-alerts',
      labelKey: 'nav.alertsNotifications',
      icon: 'crisis_alert',
      to: p('/alerts'),
      children: leaves('wsal', p('/alerts'), [
        'Project delay alerts',
        'Budget-overrun alerts',
        'Missed milestone alerts',
        'Pending approval alerts',
        'Payment alerts',
        'Contract expiry alerts',
        'Complaint escalation alerts',
        'Quality-risk alerts',
        'Fraud/anomaly alerts',
        'AI-generated critical alerts',
      ]),
    },
    {
      id: 'ws-documents',
      labelKey: 'nav.documents',
      icon: 'folder_shared',
      to: p('/documents'),
      children: leaves('wsd', p('/documents'), [
        'DPR & project documents',
        'Tender documents',
        'Contracts',
        'Work orders',
        'Bills & invoices',
        'Inspection reports',
        'Legal documents',
        'Completion certificates',
        'Digital document repository',
        'Version control',
        'Document access permissions',
      ]),
    },
    {
      id: 'ws-audit',
      labelKey: 'nav.audit',
      icon: 'content_paste_search',
      to: p('/audit'),
      children: leaves('wsau', p('/audit'), [
        'Financial audit',
        'Project audit',
        'Contractor audit',
        'Tender audit',
        'Payment audit',
        'Inspection audit',
        'Complete activity logs',
        'User/action tracking',
        'Document history',
        'Approval history',
        'Tamper-resistant audit trail',
      ]),
    },
    {
      id: 'ws-ai-insights',
      labelKey: 'nav.aiInsights',
      icon: 'auto_awesome',
      to: p('/ai-insights'),
      children: [
        { id: 'wsai-cost', label: 'Cost-overrun report', to: p('/ai-insights#cost-overrun') },
        { id: 'wsai-env', label: 'Environmental report', to: p('/ai-insights#environmental') },
        { id: 'wsai-delay', label: 'Delay prediction & report', to: p('/ai-insights#delay') },
        { id: 'wsai-risk', label: 'Project risk prediction', to: p('/ai-insights#risk') },
        { id: 'wsai-health', label: 'Project health score', to: p('/ai-insights#overview') },
        { id: 'wsai-anomalies', label: 'Fraud & anomaly detection', to: p('/ai-insights#overview') },
        { id: 'wsai-recs', label: 'Gemini AI recommendations', to: p('/ai-insights#overview') },
      ],
    },
  ]
}

/* ---------- Mock API switch (spec: clearly label demo data) ---------- */
export const USE_MOCK_API =
  (import.meta.env.VITE_USE_MOCK_API ?? 'true') !== 'false'

/**
 * Approval workspace sidebar — mirrors the project workspace: every section
 * below is scoped to the selected approval request.
 */
export function buildApprovalNav(approvalId: string): NavNode[] {
  const base = `/government/approvals/${approvalId}`
  const p = (section = '') => base + section
  return [
    { id: 'aw-overview', labelKey: 'common.overview', icon: 'dashboard', to: p('') },
    {
      id: 'aw-workflow',
      labelKey: 'nav.workflow',
      icon: 'account_tree',
      to: p('/workflow'),
      children: leaves('aww', p('/workflow'), [
        'Multi-level approval workflow',
        'Digital signatures',
        'Pending decision',
        'Officer assignment',
      ]),
    },
    {
      id: 'aw-history',
      labelKey: 'nav.approvalHistory',
      icon: 'history',
      to: p('/history'),
      children: leaves('awh', p('/history'), [
        'Complete action log',
        'Actor & role tracking',
        'Timestamped remarks',
        'Tamper-resistant trail',
      ]),
    },
    {
      id: 'aw-project',
      labelKey: 'nav.linkedProject',
      icon: 'map',
      to: p('/project'),
      children: leaves('awp', p('/project'), [
        'Project workspace link',
        'Related approvals',
      ]),
    },
  ]
}
