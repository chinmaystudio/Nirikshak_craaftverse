import { LifecycleStageInfo } from '../types';

export const LIFECYCLE_STAGES: LifecycleStageInfo[] = [
  {
    step: '01',
    name: 'PLAN',
    title: 'Project Creation & Budget Sanction',
    objective: 'Official sanctioning of infrastructure projects, budget allocation, and administrative approvals.',
    governmentAction: 'Sanction project scope, allocate capital budget, define jurisdiction and milestone milestones.',
    contractorAction: 'None (Pre-tendering public authority planning phase).',
    aiVerification: 'Historical cost and timeline sanity checks against regional infrastructure baselines.',
    outputs: ['Administrative Approval', 'Sanctioned Budget', 'Official Project Record']
  },
  {
    step: '02',
    name: 'TENDER',
    title: 'Government Publishes Tender',
    objective: 'Public issuance of tenders with technical requirements, eligibility criteria, and deadlines.',
    governmentAction: 'Draft and publish tender notice with detailed scope, estimated value, and submission deadline.',
    contractorAction: 'Review published tender notices, technical requirements, and eligibility guidelines.',
    aiVerification: 'Tender specification clarity checks, estimated rate benchmarking, and timeline validation.',
    outputs: ['Published Tender Notice', 'Technical Requirements', 'Procurement Baseline']
  },
  {
    step: '03',
    name: 'BID',
    title: 'Verified Contractors Submit Bids',
    objective: 'Secure, sealed bid submission from authenticated and verified contractor organizations.',
    governmentAction: 'Monitor bid submission countdown; maintain cryptographic sealed-bid status.',
    contractorAction: 'Submit financial and technical proposals from isolated company workspace.',
    aiVerification: 'Strict contractor isolation: Contractor A can never view Contractor B proposals.',
    outputs: ['Sealed Bid Submission', 'Technical Proposal', 'Company Verification Hash']
  },
  {
    step: '04',
    name: 'AWARD',
    title: 'Government Evaluates & Selects',
    objective: 'Comparative technical and financial evaluation of eligible submissions.',
    governmentAction: 'Unseal all received bids simultaneously; review technical scores and select winning bidder.',
    contractorAction: 'Receive evaluation notification and Letter of Award if selected.',
    aiVerification: 'Outlier bid detection, technical-financial score computation, and audit logging.',
    outputs: ['Comparative Bid Matrix', 'Selection Resolution', 'Award Notification']
  },
  {
    step: '05',
    name: 'CONTRACT',
    title: 'Contract + Contractor Assignment',
    objective: 'Legal contract creation, contractor assignment, and access provisioning.',
    governmentAction: 'Execute contract, bind contractor organization to project, and grant project workspace access.',
    contractorAction: 'Sign agreement; assigned project appears immediately in contractor private portal.',
    aiVerification: 'Organization membership and role-based clearance verified in Supabase RLS.',
    outputs: ['Executed Contract Agreement', 'Project Assignment', 'Workspace Access Granted']
  },
  {
    step: '06',
    name: 'EXECUTE',
    title: 'Contractor Begins Project Work',
    objective: 'Physical site mobilization, milestone schedule execution, and resource deployment.',
    governmentAction: 'Track milestone schedule, oversee right-of-way, and inspect ongoing workfronts.',
    contractorAction: 'Mobilize site crew, execute work against milestone timeline, log daily activity.',
    aiVerification: 'Baseline vs actual schedule tracking; early milestone slippage warnings.',
    outputs: ['Mobilization Record', 'Execution Timeline', 'Site Workfront Logs']
  },
  {
    step: '07',
    name: 'REPORT',
    title: 'Progress + Evidence Submitted',
    objective: 'Contractor submits physical and financial progress backed by geotagged evidence.',
    governmentAction: 'Receive progress submission notification with attached site documentation.',
    contractorAction: 'Submit physical progress % with geotagged site photographs, reports, and bills.',
    aiVerification: 'Evidence integrity validation; submission marked as REPORTED (unverified).',
    outputs: ['Progress Submission', 'Geotagged Evidence Files', 'Measurement Documentation']
  },
  {
    step: '08',
    name: 'ANALYZE',
    title: 'NIRIKSHAK AI Reviews Evidence',
    objective: 'NVIDIA Nemotron via OpenRouter evaluates evidence, progress variance, and risks.',
    governmentAction: 'Review structured AI advisory report detailing risk indicators and variance signals.',
    contractorAction: 'View analysis flags if additional clarification or documentation is requested.',
    aiVerification: 'Deterministic variance calculation + Nemotron contextual risk reasoning.',
    outputs: ['Structured Risk Advisory', 'Variance Score', 'Recommended Review Actions']
  },
  {
    step: '09',
    name: 'VERIFY',
    title: 'Government Accepts / Rejects / Clarifies',
    objective: 'Designated Government officers evaluate evidence and issue official determination.',
    governmentAction: 'Examine ground reality, verify physical progress, and approve, reject, or request revisions.',
    contractorAction: 'Receive official determination; update site logs or rectify flagged deficiencies.',
    aiVerification: 'Constitutional human-in-the-loop: only approved data transitions to verified state.',
    outputs: ['Official Verification Order', 'Certified Physical Progress', 'Audit Trail Record']
  },
  {
    step: '10',
    name: 'TRANSPARENCY',
    title: 'Verified Information + Citizen Feedback',
    objective: 'Public transparency projection on Citizen Portal and community ground feedback.',
    governmentAction: 'Review citizen complaints, assign corrective actions, and track public resolution.',
    contractorAction: 'Respond to assigned corrective actions with evidence of remediation.',
    aiVerification: 'Public projection strictly reflects verified data (Reported ≠ Verified ≠ Public).',
    outputs: ['Public Project View', 'Citizen Issue Redressal', 'Permanent Lifecycle Record']
  }
];

export const AI_CAPABILITIES = [
  {
    id: 'C1',
    title: 'Schedule Risk',
    subtitle: 'Timeline & Milestone Trajectory',
    desc: 'Correlates reported site progress against contract milestones and planned baseline to detect slippages early.',
    metric: 'Milestone Velocity'
  },
  {
    id: 'C2',
    title: 'Progress Variance',
    subtitle: 'Reported vs Actual Gap',
    desc: 'Analyzes discrepancy between contractor claimed percentage and historical completion velocity.',
    metric: 'Delta Detection'
  },
  {
    id: 'C3',
    title: 'Financial / Physical Divergence',
    subtitle: 'Fund Utilization vs Work Done',
    desc: 'Detects if invoice disbursement pacing exceeds verified ground reality to prevent over-certification.',
    metric: 'Fiscal Alignment'
  },
  {
    id: 'C4',
    title: 'Evidence Conflict',
    subtitle: 'Documentation & Photo Validation',
    desc: 'Validates site inspection logs, geo-tagged documentation, and progress reports for internal consistency.',
    metric: 'Signal Verification'
  },
  {
    id: 'C5',
    title: 'Environmental Signals',
    subtitle: 'Weather & Site Constraints',
    desc: 'Monitors external operational factors such as seasonal disruptions, monsoon halts, and local conditions.',
    metric: 'Contextual Factors'
  },
  {
    id: 'C6',
    title: 'Recommended Review Actions',
    subtitle: 'Government Decision Support',
    desc: 'Synthesizes findings into actionable decision recommendations (Approve, Reject, Request Revised Evidence).',
    metric: 'Action Advisory'
  }
];

export const AI_ENGINES = AI_CAPABILITIES;

