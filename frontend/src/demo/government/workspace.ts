import type { BillItem } from '@/types'

/**
 * Workspace demo datasets — the operational detail behind each project module.
 * Every dataset is keyed by project ID and keeps the figures consistent with
 * the project register (data/projects.ts): for NIR-PWD-2026-0142 the budget
 * heads sum to the ₹52.0 Cr sanction and utilization sums to ₹31.2 Cr.
 */

/* ---------- Budget heads (allocation / revision / utilization) ---------- */
export interface BudgetHead {
  id: string
  head: string
  originalCr: number
  revisedCr?: number
  utilizedCr: number
}

export const BUDGET_HEADS: Record<string, BudgetHead[]> = {
  'NIR-PWD-2026-0142': [
    { id: 'BH-0142-01', head: 'Earthwork & subgrade', originalCr: 14.5, utilizedCr: 12.9 },
    { id: 'BH-0142-02', head: 'GSB & WMM layers', originalCr: 8.2, revisedCr: 8.6, utilizedCr: 6.4 },
    { id: 'BH-0142-03', head: 'M35 CC pavement — lane 1', originalCr: 16.8, utilizedCr: 8.1 },
    { id: 'BH-0142-04', head: 'Vehicular underpass (Ch 44+100)', originalCr: 7.4, revisedCr: 7.8, utilizedCr: 3.2 },
    { id: 'BH-0142-05', head: 'Drainage, signage & safety', originalCr: 5.1, utilizedCr: 0.6 },
  ],
  'NIR-WRD-2026-0089': [
    { id: 'BH-0089-01', head: 'Intake structure & channel', originalCr: 186.0, utilizedCr: 178.4 },
    { id: 'BH-0089-02', head: 'Pump house civil works', originalCr: 224.0, revisedCr: 236.5, utilizedCr: 158.2 },
    { id: 'BH-0089-03', head: 'Pumping machinery (4×6.3 MW)', originalCr: 318.0, utilizedCr: 176.5 },
    { id: 'BH-0089-04', head: 'Rising main (41 km)', originalCr: 168.0, utilizedCr: 74.1 },
    { id: 'BH-0089-05', head: 'Distribution network', originalCr: 66.0, utilizedCr: 25.2 },
  ],
  'NIR-UID-2026-0311': [
    { id: 'BH-0311-01', head: 'ICCC building & fit-out', originalCr: 42.0, utilizedCr: 21.4 },
    { id: 'BH-0311-02', head: 'Surveillance hardware (1,240 cam)', originalCr: 38.4, utilizedCr: 15.8 },
    { id: 'BH-0311-03', head: 'Adaptive signals (62 junctions)', originalCr: 31.0, utilizedCr: 12.1 },
    { id: 'BH-0311-04', head: 'Fibre backbone (148 km)', originalCr: 30.8, utilizedCr: 9.3 },
  ],
  'NIR-PHED-2026-0117': [
    { id: 'BH-0117-01', head: 'ESR construction (2 clusters)', originalCr: 22.4, utilizedCr: 20.1 },
    { id: 'BH-0117-02', head: 'Rising main (214 km)', originalCr: 30.2, utilizedCr: 18.9 },
    { id: 'BH-0117-03', head: 'Intra-village distribution', originalCr: 24.6, utilizedCr: 11.7 },
    { id: 'BH-0117-04', head: 'Household connections & metering', originalCr: 11.2, utilizedCr: 2.2 },
  ],
  'NIR-PWD-2026-0205': [
    { id: 'BH-0205-01', head: 'River training & coffer dam', originalCr: 9.8, utilizedCr: 9.2 },
    { id: 'BH-0205-02', head: 'Foundation piles (spans 1–6)', originalCr: 22.4, utilizedCr: 8.6 },
    { id: 'BH-0205-03', head: 'Piers & pier caps', originalCr: 14.2, utilizedCr: 2.4 },
    { id: 'BH-0205-04', head: 'Girder casting & launching', originalCr: 18.4, utilizedCr: 1.3 },
  ],
}

/* ---------- Monthly planned vs actual expenditure (₹ Cr) ---------- */
export interface MonthlySpend {
  month: string
  plannedCr: number
  actualCr: number
}

export const MONTHLY_SPEND: Record<string, MonthlySpend[]> = {
  'NIR-PWD-2026-0142': [
    { month: 'Jul 25', plannedCr: 3.2, actualCr: 2.1 },
    { month: 'Aug 25', plannedCr: 3.6, actualCr: 2.8 },
    { month: 'Sep 25', plannedCr: 4.4, actualCr: 3.9 },
    { month: 'Oct 25', plannedCr: 5.0, actualCr: 4.8 },
    { month: 'Nov 25', plannedCr: 5.4, actualCr: 5.6 },
    { month: 'Dec 25', plannedCr: 5.6, actualCr: 6.0 },
    { month: 'Jan 26', plannedCr: 5.8, actualCr: 6.0 },
  ],
  'NIR-WRD-2026-0089': [
    { month: 'Aug 25', plannedCr: 42.0, actualCr: 38.4 },
    { month: 'Sep 25', plannedCr: 46.0, actualCr: 41.2 },
    { month: 'Oct 25', plannedCr: 52.0, actualCr: 48.6 },
    { month: 'Nov 25', plannedCr: 58.0, actualCr: 55.1 },
    { month: 'Dec 25', plannedCr: 60.0, actualCr: 58.9 },
    { month: 'Jan 26', plannedCr: 62.0, actualCr: 60.4 },
  ],
  'NIR-UID-2026-0311': [
    { month: 'Sep 25', plannedCr: 8.4, actualCr: 7.9 },
    { month: 'Oct 25', plannedCr: 9.2, actualCr: 8.6 },
    { month: 'Nov 25', plannedCr: 9.8, actualCr: 9.4 },
    { month: 'Dec 25', plannedCr: 10.4, actualCr: 10.8 },
    { month: 'Jan 26', plannedCr: 10.6, actualCr: 11.2 },
  ],
  'NIR-PHED-2026-0117': [
    { month: 'Sep 25', plannedCr: 6.8, actualCr: 6.4 },
    { month: 'Oct 25', plannedCr: 7.2, actualCr: 7.0 },
    { month: 'Nov 25', plannedCr: 7.6, actualCr: 7.4 },
    { month: 'Dec 25', plannedCr: 7.8, actualCr: 7.9 },
    { month: 'Jan 26', plannedCr: 8.0, actualCr: 8.1 },
  ],
  'NIR-PWD-2026-0205': [
    { month: 'Nov 25', plannedCr: 4.2, actualCr: 3.8 },
    { month: 'Dec 25', plannedCr: 5.0, actualCr: 4.4 },
    { month: 'Jan 26', plannedCr: 5.4, actualCr: 4.1 },
  ],
}

/* ---------- Site progress updates (geo-tagged, officer-verifiable) ---------- */
export interface ProgressUpdate {
  id: string
  projectId: string
  date: string
  location: string
  activity: string
  progressPct: number
  officer: string
  contractor: string
  geoTag: { lat: number; lng: number }
  photos: number
  status: 'verified' | 'pending' | 'rejected'
  verificationNote?: string
}

export const PROGRESS_UPDATES: ProgressUpdate[] = [
  { id: 'PU-2026-0118', projectId: 'NIR-PWD-2026-0142', date: '2026-02-09', location: 'Ch 44+100 — VUP site', activity: 'VUP box casting — deck slab pour (M40)', progressPct: 22, officer: 'Er. A. S. Shaikh', contractor: 'ABC Infrastructure Pvt. Ltd.', geoTag: { lat: 18.372, lng: 74.812 }, photos: 14, status: 'pending' },
  { id: 'PU-2026-0112', projectId: 'NIR-PWD-2026-0142', date: '2026-02-06', location: 'Ch 43+800 — haul segment', activity: 'Bituminous haul-road repair completed', progressPct: 100, officer: 'Er. A. S. Shaikh', contractor: 'ABC Infrastructure Pvt. Ltd.', geoTag: { lat: 18.379, lng: 74.821 }, photos: 9, status: 'verified', verificationNote: 'Verified against drone orthomosaic — 09 Feb.' },
  { id: 'PU-2026-0104', projectId: 'NIR-PWD-2026-0142', date: '2026-02-03', location: 'Ch 44+320', activity: 'CC pavement lane 1 — 180 m cast (day 4)', progressPct: 30, officer: 'Er. V. B. Wagh', contractor: 'ABC Infrastructure Pvt. Ltd.', geoTag: { lat: 18.376, lng: 74.818 }, photos: 22, status: 'verified', verificationNote: 'Core test 38.4 MPa recorded (INS-2026-0231).' },
  { id: 'PU-2026-0096', projectId: 'NIR-PWD-2026-0142', date: '2026-01-30', location: 'Ch 42+600 — 43+200', activity: 'Earthwork layer 3 graded and compacted', progressPct: 78, officer: 'Er. A. S. Shaikh', contractor: 'ABC Infrastructure Pvt. Ltd.', geoTag: { lat: 18.365, lng: 74.804 }, photos: 11, status: 'verified', verificationNote: 'Field density 98.6% MDD.' },
  { id: 'PU-2026-0090', projectId: 'NIR-PWD-2026-0142', date: '2026-01-27', location: 'Ch 45+100 — drainage cross', activity: 'RCC Hume pipe line laid (48 m)', progressPct: 55, officer: 'Er. V. B. Wagh', contractor: 'ABC Infrastructure Pvt. Ltd.', geoTag: { lat: 18.381, lng: 74.826 }, photos: 6, status: 'rejected', verificationNote: 'Geo-tag offset 38 m from claimed chainage; re-submission requested.' },
  { id: 'PU-2026-0121', projectId: 'NIR-WRD-2026-0089', date: '2026-02-08', location: 'Pump house 2 — draft tube', activity: 'Draft tube concreting — block 3', progressPct: 64, officer: 'Er. R. G. Patil', contractor: 'Shivaay Watertech Ltd.', geoTag: { lat: 17.66, lng: 75.91 }, photos: 8, status: 'verified' },
  { id: 'PU-2026-0119', projectId: 'NIR-UID-2026-0311', date: '2026-02-08', location: 'Junction J-24, Nashik', activity: 'Adaptive signal controller installed & commissioned', progressPct: 41, officer: 'Er. A. R. Bhosale', contractor: 'Apex Constr. Consortium', geoTag: { lat: 19.99, lng: 73.79 }, photos: 7, status: 'pending' },
  { id: 'PU-2026-0116', projectId: 'NIR-PHED-2026-0117', date: '2026-02-07', location: 'Yavatmal — rising main km 96', activity: 'DI pipe laying (1.2 km) with bedding', progressPct: 74, officer: 'Er. H. T. More', contractor: 'M/s Sahyadri Infra', geoTag: { lat: 20.39, lng: 78.13 }, photos: 12, status: 'verified' },
  { id: 'PU-2026-0115', projectId: 'NIR-PWD-2026-0205', date: '2026-02-08', location: 'Span 3–4 — pile cap', activity: 'Pile bore logging — crosshole sonic test', progressPct: 41, officer: 'Er. M. P. Joshi', contractor: 'Kalyani Buildcon', geoTag: { lat: 20.74, lng: 78.6 }, photos: 16, status: 'verified', verificationNote: 'CSL results under third-party review (AUD-2026-014).' },
]

/* ---------- People settlement (PAP register) ---------- */
export interface Settlement {
  id: string
  projectId: string
  beneficiary: string
  category: 'Land' | 'Structure' | 'Tree crop' | 'Labour' | 'Shop'
  location: string
  entitlementCr: number
  paidCr: number
  verification: 'verified' | 'pending' | 'disputed'
  status: 'paid' | 'part_paid' | 'pending' | 'disputed'
}

export const SETTLEMENTS: Settlement[] = [
  { id: 'PAP-0142-018', projectId: 'NIR-PWD-2026-0142', beneficiary: 'S***a D***e (masked)', category: 'Land', location: 'Ch 43+100 — Phataki village', entitlementCr: 0.42, paidCr: 0.42, verification: 'verified', status: 'paid' },
  { id: 'PAP-0142-021', projectId: 'NIR-PWD-2026-0142', beneficiary: 'R****l S***a (masked)', category: 'Structure', location: 'Ch 44+050 — roadside shed', entitlementCr: 0.28, paidCr: 0.28, verification: 'verified', status: 'paid' },
  { id: 'PAP-0142-026', projectId: 'NIR-PWD-2026-0142', beneficiary: 'V*******o G***h (masked)', category: 'Tree crop', location: 'Ch 44+300 — mango orchard (18 trees)', entitlementCr: 0.11, paidCr: 0.06, verification: 'verified', status: 'part_paid' },
  { id: 'PAP-0142-031', projectId: 'NIR-PWD-2026-0142', beneficiary: 'A***h K***r (masked)', category: 'Shop', location: 'Ch 42+900 — kirana store frontage', entitlementCr: 0.35, paidCr: 0, verification: 'disputed', status: 'disputed' },
  { id: 'PAP-0142-034', projectId: 'NIR-PWD-2026-0142', beneficiary: 'M***a P***l (masked)', category: 'Land', location: 'Ch 45+200 — dry crop land', entitlementCr: 0.19, paidCr: 0, verification: 'pending', status: 'pending' },
  { id: 'PAP-0142-038', projectId: 'NIR-PWD-2026-0142', beneficiary: 'S****a D***e (masked)', category: 'Labour', location: 'Haul road — registered carters', entitlementCr: 0.06, paidCr: 0.06, verification: 'verified', status: 'paid' },
  { id: 'PAP-0089-041', projectId: 'NIR-WRD-2026-0089', beneficiary: 'L***r family trust (masked)', category: 'Land', location: 'Command area — Malshiras', entitlementCr: 1.85, paidCr: 1.85, verification: 'verified', status: 'paid' },
  { id: 'PAP-0089-047', projectId: 'NIR-WRD-2026-0089', beneficiary: 'D***e wadi households (12)', category: 'Structure', location: 'Rising main km 22', entitlementCr: 0.94, paidCr: 0.4, verification: 'pending', status: 'part_paid' },
  { id: 'PAP-0205-009', projectId: 'NIR-PWD-2026-0205', beneficiary: 'G***h farm holding (masked)', category: 'Land', location: 'Left bank approach', entitlementCr: 0.66, paidCr: 0, verification: 'pending', status: 'pending' },
]

/* ---------- Migration / relocation settlement ---------- */
export interface MigrationCase {
  id: string
  projectId: string
  person: string
  originalLocation: string
  newLocation: string
  relocationStatus: 'completed' | 'in_progress' | 'pending'
  compensationCr: number
  rehabilitation: string
  pendingAction: string
}

export const MIGRATIONS: MigrationCase[] = [
  { id: 'MIG-0142-03', projectId: 'NIR-PWD-2026-0142', person: 'K***r household (7 members)', originalLocation: 'Ch 44+050 roadside settlement', newLocation: 'Phataki rehab block, Plot 12', relocationStatus: 'completed', compensationCr: 0.41, rehabilitation: 'Shop frontage re-allotted in rehab market.', pendingAction: 'None — record closed.' },
  { id: 'MIG-0142-05', projectId: 'NIR-PWD-2026-0142', person: 'P***l household (5 members)', originalLocation: 'Ch 45+200 field hut', newLocation: 'Awaiting plot allotment', relocationStatus: 'in_progress', compensationCr: 0.22, rehabilitation: 'Transit rent being paid monthly.', pendingAction: 'Plot handover by IRB cell — due 28 Feb 2026.' },
  { id: 'MIG-0089-07', projectId: 'NIR-WRD-2026-0089', person: 'D***e wadi cluster (12 families)', originalLocation: 'Rising main km 22', newLocation: 'Malshiras gaothan extension', relocationStatus: 'in_progress', compensationCr: 1.12, rehabilitation: 'Well + land leveling sanctioned.', pendingAction: 'Compensation balance ₹ 0.54 Cr pending DC approval.' },
]

/* ---------- Litigation hearings ---------- */
export interface Hearing {
  caseId: string
  date: string
  purpose: string
  outcome: string
}

export const HEARINGS: Hearing[] = [
  { caseId: 'LIT-2026-018', date: '2025-11-20', purpose: 'Statement of claims — direction', outcome: 'Tribunal directed claimant to file SoC by 15 Jan 2026.' },
  { caseId: 'LIT-2026-018', date: '2026-01-16', purpose: 'SoC filing & scrutiny', outcome: 'SoC filed (₹ 2.4 Cr). Dept reply due before 15 Mar 2026.' },
  { caseId: 'LIT-2026-018', date: '2026-03-15', purpose: 'Next hearing — reply & framing of issues', outcome: 'Scheduled.' },
  { caseId: 'LIT-2026-014', date: '2025-12-12', purpose: 'Compensation valuation reference', outcome: 'Court appointed amicus valuer.' },
  { caseId: 'LIT-2026-014', date: '2026-01-24', purpose: 'Valuer report taken on record', outcome: 'Report favors claimants partially; dept to respond by 20 Feb.' },
  { caseId: 'LIT-2026-014', date: '2026-02-28', purpose: 'Next hearing — dept response', outcome: 'Scheduled.' },
  { caseId: 'LIT-2025-041', date: '2026-01-09', purpose: 'Interim stay — continuation', outcome: 'Stay continued; alternative alignment study ordered.' },
  { caseId: 'LIT-2025-041', date: '2026-02-24', purpose: 'Alignment study review', outcome: 'Scheduled.' },
]

/* ---------- Milestone verification / payment linkage ---------- */
export interface MilestoneMeta {
  milestoneId: string
  verification: 'verified' | 'pending' | 'rejected' | 'not_due'
  verifiedBy?: string
  paymentLinked: boolean
  paymentRef?: string
  deliverables: string[]
}

export const MILESTONE_META: Record<string, MilestoneMeta> = {
  'MS-0142-01': { milestoneId: 'MS-0142-01', verification: 'verified', verifiedBy: 'Er. S. D. Kulkarni', paymentLinked: true, paymentRef: 'BILL-2026-0311', deliverables: ['Joint measurement record', 'Land handover memo', 'Utility shifting certificate'] },
  'MS-0142-02': { milestoneId: 'MS-0142-02', verification: 'verified', verifiedBy: 'Er. A. S. Shaikh', paymentLinked: true, paymentRef: 'BILL-2026-0328', deliverables: ['Layer density tests', 'Weekly drone orthomosaic'] },
  'MS-0142-03': { milestoneId: 'MS-0142-03', verification: 'pending', paymentLinked: true, paymentRef: 'BILL-2026-0339 (under verification)', deliverables: ['Layer thickness survey', 'Material test certificates'] },
  'MS-0142-04': { milestoneId: 'MS-0142-04', verification: 'pending', paymentLinked: false, deliverables: ['Core test reports (M35)', 'Paving log'] },
  'MS-0142-05': { milestoneId: 'MS-0142-05', verification: 'rejected', verifiedBy: 'Er. M. P. Joshi', paymentLinked: true, paymentRef: 'On hold — railway permission pending', deliverables: ['Railway crossing approval', 'Girder supply schedule'] },
  'MS-0142-06': { milestoneId: 'MS-0142-06', verification: 'not_due', paymentLinked: false, deliverables: ['Signage layout plan', 'Safety audit certificate'] },
  'MS-0089-01': { milestoneId: 'MS-0089-01', verification: 'verified', verifiedBy: 'Er. M. P. Joshi', paymentLinked: true, paymentRef: 'BILL-2026-0344', deliverables: ['Intake structure as-built', 'Channel section L-sections'] },
  'MS-0089-02': { milestoneId: 'MS-0089-02', verification: 'verified', verifiedBy: 'Er. R. G. Patil', paymentLinked: true, paymentRef: 'BILL-2026-0351 (flagged)', deliverables: ['Block concreting logs', 'Cube test results'] },
  'MS-0311-01': { milestoneId: 'MS-0311-01', verification: 'verified', verifiedBy: 'Er. A. R. Bhosale', paymentLinked: true, paymentRef: 'BILL-2026-0347', deliverables: ['Fit-out completion cert', 'Fire NOC'] },
  'MS-0117-01': { milestoneId: 'MS-0117-01', verification: 'verified', verifiedBy: 'Er. H. T. More', paymentLinked: true, paymentRef: 'BILL-2026-0349', deliverables: ['ESR water-tightness test', 'Structural stability cert'] },
  'MS-0205-01': { milestoneId: 'MS-0205-01', verification: 'verified', verifiedBy: 'Er. M. P. Joshi', paymentLinked: true, paymentRef: 'Paid via RA cycle 2', deliverables: ['Coffer dam removal cert', 'River training as-built'] },
  'MS-0205-02': { milestoneId: 'MS-0205-02', verification: 'rejected', verifiedBy: 'Er. V. B. Wagh', paymentLinked: true, paymentRef: 'Withheld — AUD-2026-014', deliverables: ['Bore-log reconciliation', 'CSL test reports'] },
}

/* ---------- Activity log (WHO / WHAT / WHEN / OLD / NEW) ---------- */
export interface ActivityEntry {
  id: string
  projectId: string
  timestamp: string
  actor: string
  role: string
  action: string
  field: string
  oldValue: string
  newValue: string
}

export const ACTIVITY_LOG: ActivityEntry[] = [
  { id: 'ACT-9041', projectId: 'NIR-PWD-2026-0142', timestamp: '2026-02-09T14:32:00+05:30', actor: 'Er. A. S. Shaikh', role: 'Dy. Engineer', action: 'Progress update submitted', field: 'Progress update PU-2026-0118', oldValue: '—', newValue: 'Pending verification' },
  { id: 'ACT-9038', projectId: 'NIR-PWD-2026-0142', timestamp: '2026-02-09T11:20:00+05:30', actor: 'System (Geo-sync)', role: 'Automated', action: 'Geo-tag mismatch flagged', field: 'Update PU-2026-0090', oldValue: 'Verified', newValue: 'Rejected' },
  { id: 'ACT-9025', projectId: 'NIR-PWD-2026-0142', timestamp: '2026-02-06T16:45:00+05:30', actor: 'Er. S. D. Kulkarni', role: 'Executive Engineer', action: 'Bill verified', field: 'BILL-2026-0328', oldValue: 'Submitted', newValue: 'Verified' },
  { id: 'ACT-9017', projectId: 'NIR-PWD-2026-0142', timestamp: '2026-02-04T09:05:00+05:30', actor: 'Er. M. P. Joshi', role: 'Superintending Engineer', action: 'Approval forwarded', field: 'APR-2026-0411', oldValue: 'Submitted', newValue: 'Forwarded' },
  { id: 'ACT-9010', projectId: 'NIR-PWD-2026-0142', timestamp: '2026-02-03T11:20:00+05:30', actor: 'Er. S. D. Kulkarni', role: 'Executive Engineer', action: 'Approval submitted', field: 'APR-2026-0411', oldValue: '—', newValue: 'Pending' },
  { id: 'ACT-8992', projectId: 'NIR-PWD-2026-0142', timestamp: '2026-01-28T15:10:00+05:30', actor: 'ABC Infrastructure Pvt. Ltd.', role: 'Contractor', action: 'Bill submitted', field: 'BILL-2026-0328', oldValue: '—', newValue: 'Submitted' },
  { id: 'ACT-8977', projectId: 'NIR-PWD-2026-0142', timestamp: '2026-01-20T12:00:00+05:30', actor: 'Shri P. V. Rane', role: 'Controller of Accounts', action: 'Tranche released', field: 'Financials.lastTrancheDate', oldValue: '2025-11-18', newValue: '2026-01-20' },
  { id: 'ACT-8955', projectId: 'NIR-PWD-2026-0142', timestamp: '2026-01-09T10:22:00+05:30', actor: 'Er. S. D. Kulkarni', role: 'Executive Engineer', action: 'Milestone verified', field: 'MS-0142-01', oldValue: 'Pending', newValue: 'Verified' },
]

/* ---------- Contractor extended profile (registration/finance) ---------- */
export const CONTRACTOR_EXTRA: Record<
  string,
  { gstin: string; turnoverCr: number; staffCount: number; equipment: string; bankGuaranteeCr?: number }
> = {
  'CTR-0001': { gstin: '27AABCA1234M1Z5', turnoverCr: 262.0, staffCount: 640, equipment: '2 batching plants, 6 pavers, 18 tippers', bankGuaranteeCr: 4.2 },
  'CTR-0002': { gstin: '27AAACS5678K1Z2', turnoverCr: 148.0, staffCount: 380, equipment: 'Pump errection rigs, 4 cranes, O&M vans', bankGuaranteeCr: 2.8 },
  'CTR-0003': { gstin: '27AAECA9012P1Z8', turnoverCr: 96.0, staffCount: 210, equipment: 'Fibre blowers, ICCC integration lab', bankGuaranteeCr: 1.6 },
  'CTR-0004': { gstin: '27AAACK3456H1Z4', turnoverCr: 121.0, staffCount: 520, equipment: '2 piling rigs, 2 girder launchers', bankGuaranteeCr: 2.1 },
  'CTR-0005': { gstin: '27AAJCS7890D1Z9', turnoverCr: 64.0, staffCount: 260, equipment: 'Pipe layers, 2 ESR formwork sets' },
}

/* ---------- AI Bill Risk Check (computed per flagged/regular bill) ---------- */
export interface BillRisk {
  duplicateProbabilityPct: number
  amountAnomalyPct: number
  previousSimilarBill?: string
  riskScore: number
  explanation: string
}

export function billRiskFor(bill: BillItem): BillRisk {
  if (bill.flag === 'duplicate') {
    return {
      duplicateProbabilityPct: 96,
      amountAnomalyPct: 0,
      previousSimilarBill: 'BILL-2026-0311',
      riskScore: 94,
      explanation:
        'Same e-MB entry range and amount as an already-paid bill from the same contractor. Amount distribution is otherwise normal for RA cycles.',
    }
  }
  if (bill.flag === 'abnormal') {
    return {
      duplicateProbabilityPct: 4,
      amountAnomalyPct: 34,
      previousSimilarBill: 'SWT/LI2/MAT-08 (₹ 11.1 Cr, Dec 2025)',
      riskScore: 78,
      explanation:
        'Unit rate for pump spares runs 34% above the SSR 2025-26 schedule; previous similar bill was 11% below schedule. Rate analysis requested.',
    }
  }
  const spread = bill.type === 'RA Bill' ? 6 : 11
  return {
    duplicateProbabilityPct: 2,
    amountAnomalyPct: spread,
    riskScore: Math.min(30, 12 + spread),
    explanation:
      'Amount is within the normal band for this bill type and contractor history. No matching-entry duplicates found in the last 24 months.',
  }
}
