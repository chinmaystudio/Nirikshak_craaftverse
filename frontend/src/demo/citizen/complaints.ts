import type { Complaint } from "@/types/complaint";

const HOUR = 3600_000;
const DAY = 24 * HOUR;

function slaFromNow(hours: number): number {
  return Date.now() + hours * HOUR;
}

function ago(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

export const complaints: Complaint[] = [
  {
    id: "CMP-2026-004821",
    title: "Hazardous deep trench left unbarricaded near Pier 142, Hinjawadi",
    category: "safety-hazard",
    categoryLabel: "Safety Hazard",
    priority: "high",
    projectId: "pune-metro-3",
    ward: "Ward 9 — Aundh–Bhosari",
    location: "Hinjawadi Phase-1, near Pier 142, opposite Wipro Circle, Pune",
    description:
      "A 2.4-metre deep cable trench dug for the metro duct bank is lying open without barricades, warning lamps or retro-reflective signage. Two-wheeler traffic from the service road is drifting into the trench line after dark. Immediate barricading required.",
    status: "action-taken",
    submittedAt: ago(2 * DAY),
    updatedAt: ago(3 * HOUR),
    sla: { deadline: slaFromNow(18), totalHours: 48 },
    department: "MahaMetro",
    officer: { name: "Er. S. Patil", role: "Junior Engineer (Site), MahaMetro", phone: "+91 20 2593 3021" },
    evidence: [
      { id: "ev-4821-1", name: "IMG_20260909_1832.jpg", size: "3.1 MB", kind: "image", meta: "GPS 18.5913, 73.7389 • 10-Sep, 06:32 PM", tone: "safety" },
      { id: "ev-4821-2", name: "IMG_20260909_1838.jpg", size: "2.7 MB", kind: "image", meta: "GPS 18.5911, 73.7390 • 10-Sep, 06:38 PM", tone: "safety" }
    ],
    timeline: [
      { id: "tl-1", title: "Complaint Submitted", description: "Submitted via NIRIKSHAK Citizen Portal with 2 geotagged photos.", timestamp: ago(2 * DAY), actor: "You", status: "completed" },
      { id: "tl-2", title: "AI-assisted Review", description: "AI classified: Safety Hazard • Severity High • Confidence 94%. Matched to Pune Metro Line-3.", timestamp: ago(2 * DAY - 60_000), actor: "NIRIKSHAK Assistant", status: "completed" },
      { id: "tl-3", title: "Assigned to MahaMetro", description: "Routed to Site Engineer, Package-4. SLA clock started (48h).", timestamp: ago(2 * DAY - 40 * 60_000), actor: "Grievance Cell", status: "completed" },
      { id: "tl-4", title: "Inspection Completed", description: "JE visited at 2:30 PM. Notice issued under Clause 14.2 Safety By-laws.", timestamp: ago(DAY), actor: "Er. S. Patil", status: "completed" },
      { id: "tl-5", title: "Action In Progress", description: "250 m of water-filled barricades and flashing night markers being installed tonight.", timestamp: ago(3 * HOUR), actor: "Contractor Crew", status: "current" },
      { id: "tl-6", title: "Citizen Verification & Closure", description: "Pending — you will be notified to verify the fix with a photo.", timestamp: null, actor: "You", status: "upcoming" }
    ],
    officerNote:
      "Junior Engineer S. Patil visited the location at 02:30 PM on 10-Sep. Notice issued to concessionaire under Clause 14.2 of Safety By-laws. 250 metres of high-visibility water-filled safety barricades and flashing yellow night markers are being installed tonight.",
    resolution: null,
    feedback: null
  },
  {
    id: "CMP-2026-004905",
    title: "Water leakage at new pipeline joint, Bhosari Sector-17",
    category: "water-leakage",
    categoryLabel: "Water Leakage",
    priority: "high",
    projectId: "bhosari-water",
    ward: "Ward 9 — Aundh–Bhosari",
    location: "Bhosari Sector-17, near water tank lane, Pune",
    description:
      "Continuous leakage at the newly laid distribution main joint is flooding the footpath and wasting treated water for the past 36 hours. The road cut for the joint has also not been restored.",
    status: "under-review",
    submittedAt: ago(5 * HOUR),
    updatedAt: ago(4 * HOUR),
    sla: { deadline: slaFromNow(19), totalHours: 24 },
    department: "PMC Water Supply Department",
    officer: { name: "Er. P. R. Kadam", role: "Superintending Engineer, Water Supply", phone: "+91 20 2712 0502" },
    evidence: [{ id: "ev-4905-1", name: "leak_joint_01.jpg", size: "2.2 MB", kind: "image", meta: "GPS 18.6295, 73.8475 • 11-Sep, 07:58 AM", tone: "water" }],
    timeline: [
      { id: "tl-1", title: "Complaint Submitted", description: "Submitted via NIRIKSHAK Citizen Portal with 1 geotagged photo.", timestamp: ago(5 * HOUR), actor: "You", status: "completed" },
      { id: "tl-2", title: "AI-assisted Review", description: "AI classified: Water Leakage • Severity High • Confidence 91%. Matched to Bhosari 24×7 Water Supply project.", timestamp: ago(5 * HOUR - 60_000), actor: "NIRIKSHAK Assistant", status: "completed" },
      { id: "tl-3", title: "Assignment to Water Supply Department", description: "Pending — queue position 3 for this zone.", timestamp: null, actor: "Grievance Cell", status: "upcoming" },
      { id: "tl-4", title: "Field Action", description: "Pending assignment.", timestamp: null, actor: "—", status: "upcoming" },
      { id: "tl-5", title: "Citizen Verification & Closure", description: "Pending.", timestamp: null, actor: "You", status: "upcoming" }
    ],
    officerNote: null,
    resolution: null,
    feedback: null
  },
  {
    id: "CMP-2026-004790",
    title: "Excessive airborne dust pollution near Hebbal junction works",
    category: "environmental",
    categoryLabel: "Environmental Issue",
    priority: "medium",
    projectId: "blr-ring-road",
    ward: "—",
    location: "Hebbal Junction approach, Bengaluru",
    description:
      "Uncovered earth stockpiles and dry hauling during Package-4 works are generating heavy dust across the approach road. No water sprinkling observed despite schedule conditions.",
    status: "resolved",
    submittedAt: ago(4 * DAY),
    updatedAt: ago(2 * DAY),
    sla: { deadline: Date.now() - 2 * HOUR, totalHours: 72 },
    department: "BDA Infrastructure",
    officer: { name: "Er. G. N. Rao", role: "Chief Engineer, BDA", phone: "+91 80 2266 3911" },
    evidence: [{ id: "ev-4790-1", name: "dust_hebbal.jpg", size: "2.9 MB", kind: "image", meta: "GPS 13.0358, 77.5970 • 07-Sep, 05:12 PM", tone: "environment" }],
    timeline: [
      { id: "tl-1", title: "Complaint Submitted", description: "Submitted via NIRIKSHAK Citizen Portal.", timestamp: ago(4 * DAY), actor: "You", status: "completed" },
      { id: "tl-2", title: "AI-assisted Review", description: "AI classified: Environmental Issue • Severity Medium • Confidence 88%.", timestamp: ago(4 * DAY - 60_000), actor: "NIRIKSHAK Assistant", status: "completed" },
      { id: "tl-3", title: "Assigned to BDA Environment Cell", description: "Routed with 72h SLA.", timestamp: ago(4 * DAY - 2 * HOUR), actor: "Grievance Cell", status: "completed" },
      { id: "tl-4", title: "Investigation", description: "Site inspection confirmed non-compliance with dust suppression schedule.", timestamp: ago(3 * DAY), actor: "Environment Cell", status: "completed" },
      { id: "tl-5", title: "Resolved", description: "Two sprinkler tankers deployed twice daily; stockpiles covered with geotextile. Compliance photo attached.", timestamp: ago(2 * DAY), actor: "Contractor", status: "completed" }
    ],
    officerNote: "Environment Cell verified restoration. Sprinkling schedule added to daily compliance log with photographic proof.",
    resolution: {
      closedAt: ago(2 * DAY),
      note: "Sprinkler tankers deployed twice daily; all stockpiles covered. Penalty advisory issued for schedule non-compliance.",
      evidence: [{ id: "ev-4790-r1", name: "compliance_sprinkler.jpg", size: "2.4 MB", kind: "image", meta: "Site compliance photo • 09-Sep, 09:20 AM", tone: "environment" }]
    },
    feedback: null
  },
  {
    id: "CMP-2026-004652",
    title: "Footpath encroachment by steel scrap near Ghaziabad station",
    category: "safety-hazard",
    categoryLabel: "Safety Hazard",
    priority: "low",
    projectId: "delhi-meerut-rrts",
    ward: "—",
    location: "Ghaziabad RRTS station approach, Uttar Pradesh",
    description:
      "Steel scrap and stacking material from the viaduct yard occupies half the pedestrian footpath near the station approach, forcing pedestrians onto the carriageway.",
    status: "closed",
    submittedAt: ago(8 * DAY),
    updatedAt: ago(5 * DAY),
    sla: { deadline: Date.now() - 3 * DAY, totalHours: 72 },
    department: "NCRTC",
    officer: { name: "Er. P. K. Singh", role: "Director, Projects (NCRTC)", phone: "+91 120 456 7811" },
    evidence: [{ id: "ev-4652-1", name: "encroach_path.jpg", size: "3.3 MB", kind: "image", meta: "GPS 28.6675, 77.4370 • 03-Sep, 11:45 AM", tone: "safety" }],
    timeline: [
      { id: "tl-1", title: "Complaint Submitted", description: "Submitted via NIRIKSHAK Citizen Portal.", timestamp: ago(8 * DAY), actor: "You", status: "completed" },
      { id: "tl-2", title: "AI-assisted Review", description: "AI classified: Safety Hazard • Severity Medium • Confidence 90%.", timestamp: ago(8 * DAY - 60_000), actor: "NIRIKSHAK Assistant", status: "completed" },
      { id: "tl-3", title: "Assigned to NCRTC", description: "Routed to yard management.", timestamp: ago(8 * DAY - 3 * HOUR), actor: "Grievance Cell", status: "completed" },
      { id: "tl-4", title: "Resolved", description: "Scrap shifted to designated yard; footpath cleared and barriers installed.", timestamp: ago(6 * DAY), actor: "Contractor", status: "completed" },
      { id: "tl-5", title: "Citizen Verified", description: "You confirmed the footpath is clear. Complaint closed.", timestamp: ago(5 * DAY), actor: "You", status: "completed" }
    ],
    officerNote: "Yard stacking protocol revised; footpath corridor now kept clear with temporary barriers.",
    resolution: {
      closedAt: ago(5 * DAY),
      note: "Footpath cleared, material shifted to designated stacking yard, verified by citizen.",
      evidence: []
    },
    feedback: { rating: 5, comment: "Quick resolution and clear communication.", at: ago(5 * DAY - HOUR) }
  },
  {
    id: "CMP-2026-004501",
    title: "Storm-water drainage backflow at Worli promenade",
    category: "drainage",
    categoryLabel: "Drainage Problem",
    priority: "high",
    projectId: "mumbai-coastal",
    ward: "—",
    location: "Worli Sea Face promenade, Mumbai",
    description:
      "High-tide backflow through the storm-water outfall is flooding the promenade cycle track daily since the coastal road interchange works. Silt accumulation at the outfall appears unattended.",
    status: "escalated",
    submittedAt: ago(12 * DAY),
    updatedAt: ago(DAY),
    sla: { deadline: Date.now() - 2 * DAY, totalHours: 72 },
    department: "BMC Roads & Traffic",
    officer: { name: "Er. S. V. Rane", role: "Chief Engineer, Coastal (BMC)", phone: "+91 22 2270 4411" },
    evidence: [{ id: "ev-4501-1", name: "backflow_worli.jpg", size: "3.0 MB", kind: "image", meta: "GPS 19.0170, 72.8213 • 30-Aug, 08:05 AM", tone: "water" }],
    timeline: [
      { id: "tl-1", title: "Complaint Submitted", description: "Submitted via NIRIKSHAK Citizen Portal.", timestamp: ago(12 * DAY), actor: "You", status: "completed" },
      { id: "tl-2", title: "AI-assisted Review", description: "AI classified: Drainage Problem • Severity High • Confidence 89%.", timestamp: ago(12 * DAY - 60_000), actor: "NIRIKSHAK Assistant", status: "completed" },
      { id: "tl-3", title: "Assigned to BMC Coastal Cell", description: "Routed with 72h SLA.", timestamp: ago(12 * DAY - 5 * HOUR), actor: "Grievance Cell", status: "completed" },
      { id: "tl-4", title: "SLA Breached — Auto Escalation", description: "72h SLA elapsed without field action. Automatically escalated to Chief Engineer's office.", timestamp: ago(8 * DAY), actor: "System", status: "completed", breach: true },
      { id: "tl-5", title: "Re-inspection Ordered", description: "CE office ordered desilting jetting machine deployment and tidal valve check.", timestamp: ago(DAY), actor: "Er. S. V. Rane", status: "current" },
      { id: "tl-6", title: "Field Action", description: "Awaiting jetting deployment confirmation.", timestamp: null, actor: "—", status: "upcoming" }
    ],
    officerNote:
      "Desilting jetting unit scheduled within 48 hours; tidal valve replacement indented. Directly monitored by CE office until closure.",
    resolution: null,
    feedback: null
  }
];

export { slaFromNow };
