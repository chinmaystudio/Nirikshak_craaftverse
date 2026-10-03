import type { ApprovalItem } from '@/types'

/**
 * Demo approvals register (mock data) — split into its own module so the
 * sidebar/nav can look up a single record without loading the whole dataset
 * barrel. Every item carries a full audit trail (spec: audit trail on every
 * action).
 */
export const APPROVALS: ApprovalItem[] = [
  {
    id: 'APR-2026-0411',
    type: 'Technical Sanction (Amended)',
    projectId: 'NIR-PWD-2026-0142',
    projectName: 'Widening of Pune–Solapur Section (NH-9) — Package C-4',
    submittedBy: 'Executive Engineer, Pune (Rural)',
    submittedOn: '2026-02-03',
    amountCr: 52.0,
    status: 'pending',
    slaDueDate: '2026-02-13',
    assignedTo: 'Shri R. K. Verma, IAS',
    priority: 'urgent',
    auditTrail: [
      { timestamp: '2026-02-03T11:20:00+05:30', actor: 'Er. S. D. Kulkarni', role: 'Executive Engineer', action: 'Submitted', remarks: 'Amended TS for VUP at Ch 44+100 (railway crossing).' },
      { timestamp: '2026-02-04T09:05:00+05:30', actor: 'Er. M. P. Joshi', role: 'Superintending Engineer', action: 'Forwarded', remarks: 'Checked against SSR 2025-26 rates.' },
    ],
  },
  {
    id: 'APR-2026-0412',
    type: 'Fund Release (Tranche 4)',
    projectId: 'NIR-WRD-2026-0089',
    projectName: 'Bhima Basin Lift Irrigation Scheme — Phase II',
    submittedBy: 'Controller of Accounts, WRD',
    submittedOn: '2026-02-05',
    amountCr: 88.0,
    status: 'pending',
    slaDueDate: '2026-02-15',
    assignedTo: 'Smt. A. N. Deshmukh, IAS',
    priority: 'high',
    auditTrail: [
      { timestamp: '2026-02-05T14:45:00+05:30', actor: 'Shri P. V. Rane', role: 'Controller of Accounts', action: 'Submitted', remarks: 'UC for Tranche 3 accepted by PAO.' },
    ],
  },
  {
    id: 'APR-2026-0413',
    type: 'Administrative Approval',
    projectId: 'NIR-UID-2026-0071',
    projectName: 'Solid Waste Processing Facility, Aurangabad',
    submittedBy: 'Municipal Commissioner, C. Sambhajinagar',
    submittedOn: '2026-01-28',
    amountCr: 48.0,
    status: 'approved',
    slaDueDate: '2026-02-07',
    assignedTo: 'Shri R. K. Verma, IAS',
    priority: 'medium',
    auditTrail: [
      { timestamp: '2026-01-28T10:10:00+05:30', actor: 'Shri D. M. Kale', role: 'Municipal Commissioner', action: 'Submitted', remarks: 'SBM 2.0 sanctioned component.' },
      { timestamp: '2026-02-02T16:30:00+05:30', actor: 'Smt. A. N. Deshmukh, IAS', role: 'Secretary, UDD', action: 'Approved', remarks: 'AA granted. Technical sanction to follow.' },
    ],
  },
  {
    id: 'APR-2026-0414',
    type: 'Extension of Time (EOT) — Level 2',
    projectId: 'NIR-PWD-2026-0205',
    projectName: 'Reconstruction of Wardha Bridge on SH-248',
    submittedBy: 'Executive Engineer, Wardha',
    submittedOn: '2026-02-01',
    status: 'clarification',
    slaDueDate: '2026-02-11',
    assignedTo: 'Er. M. P. Joshi',
    priority: 'high',
    auditTrail: [
      { timestamp: '2026-02-01T12:00:00+05:30', actor: 'Er. V. B. Wagh', role: 'Executive Engineer', action: 'Submitted', remarks: '41-day slippage, flood events cited.' },
      { timestamp: '2026-02-06T09:40:00+05:30', actor: 'Er. M. P. Joshi', role: 'Superintending Engineer', action: 'Clarification Sought', remarks: 'Submit revised hydrology note & bar chart.' },
    ],
  },
  {
    id: 'APR-2026-0415',
    type: 'Contractor Settlement (Final Bill)',
    projectId: 'NIR-RHD-2025-0930',
    projectName: 'PMGSY — Amravati Batch III',
    submittedBy: 'Executive Engineer, Amravati (Rural)',
    submittedOn: '2026-01-22',
    amountCr: 3.62,
    status: 'returned',
    slaDueDate: '2026-02-12',
    assignedTo: 'Er. S. D. Kulkarni',
    priority: 'medium',
    auditTrail: [
      { timestamp: '2026-01-22T15:15:00+05:30', actor: 'Er. H. T. More', role: 'Executive Engineer', action: 'Submitted', remarks: 'Final bill with MB entries 214–229.' },
      { timestamp: '2026-01-30T11:25:00+05:30', actor: 'Shri P. V. Rane', role: 'Controller of Accounts', action: 'Returned', remarks: 'Deduct DBW cost for chainage 3+400 as per DL conditions.' },
    ],
  },
  {
    id: 'APR-2026-0416',
    type: 'Work Order Acceptance',
    projectId: 'NIR-UID-2026-0311',
    projectName: 'Integrated Command & Control Centre, Nashik',
    submittedBy: 'Apex Constr. Consortium',
    submittedOn: '2026-01-12',
    amountCr: 142.2,
    status: 'approved',
    slaDueDate: '2026-01-22',
    assignedTo: 'Smt. A. N. Deshmukh, IAS',
    priority: 'low',
    auditTrail: [
      { timestamp: '2026-01-12T09:00:00+05:30', actor: 'Apex Constr. Consortium', role: 'Contractor', action: 'Submitted', remarks: 'Acceptance of WO conditions.' },
      { timestamp: '2026-01-14T17:05:00+05:30', actor: 'Smt. A. N. Deshmukh, IAS', role: 'Secretary, UDD', action: 'Approved', remarks: 'Recorded. Mobilization advance as per clause.' },
    ],
  },
  {
    id: 'APR-2026-0417',
    type: 'Rejected — Rate Re-validation',
    projectId: 'NIR-MED-2025-0455',
    projectName: 'Fed-Grid Substation & Feeder Augmentation, Nanded',
    submittedBy: 'Executive Engineer, Nanded (O&M)',
    submittedOn: '2026-01-18',
    amountCr: 9.6,
    status: 'rejected',
    slaDueDate: '2026-01-28',
    assignedTo: 'Shri R. K. Verma, IAS',
    priority: 'low',
    auditTrail: [
      { timestamp: '2026-01-18T13:30:00+05:30', actor: 'Er. K. B. Pawar', role: 'Executive Engineer', action: 'Submitted', remarks: 'Re-validation of market rates post-COVID escalation.' },
      { timestamp: '2026-01-25T10:50:00+05:30', actor: 'Shri R. K. Verma, IAS', role: 'Chief Engineer', action: 'Rejected', remarks: 'Resubmit with current-quarter NSS rate analysis.' },
    ],
  },
]

/** Quick lookup by ID (case-sensitive as rendered). */
export function findApproval(id: string): ApprovalItem | undefined {
  return APPROVALS.find((a) => a.id === id)
}
