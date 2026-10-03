import type { CommunityIssue } from "@/types/community";

const DAY = 24 * 3600_000;
const HOUR = 3600_000;

function ago(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

export const communityIssues: CommunityIssue[] = [
  {
    id: "ISS-2026-0142",
    title: "Pothole cluster on Sinhagad Road near Vitthalwadi bridge approach",
    category: "Pothole",
    projectId: "sinhgad-road",
    ward: "Ward 14 — Warje",
    location: "Sinhagad Road, Vitthalwadi bridge approach, Pune",
    reportedBy: "Meera Joshi (Resident, Vitthalwadi)",
    reportedAt: ago(9 * DAY),
    affected: 137,
    confirmations: 112,
    upvotes: 148,
    status: "confirmed",
    description:
      "A cluster of seven deep potholes has formed on the bridge approach within 200 metres. Two-wheelers swerve into the fast lane to avoid them and at least three skidding incidents were reported in the last week. Emergency patching was ordered after the 04-Sep inspection, but the holes have reopened after two rain spells.",
    confirmers: [
      { name: "Rahul P.", ward: "Ward 14", at: ago(2 * DAY), note: "Confirmed yesterday evening — still open after rain." },
      { name: "Sunita K.", ward: "Ward 14", at: ago(3 * DAY), note: "Auto rickshaw damaged. Very dangerous at night." },
      { name: "Imran S.", ward: "Ward 12", at: ago(4 * DAY), note: "Daily commuter, can confirm all seven potholes." }
    ],
    evidence: [
      { name: "pothole_cluster_1.jpg", meta: "GPS 18.4791, 73.8303 • 02-Sep, 06:45 PM", tone: "roads" },
      { name: "pothole_cluster_2.jpg", meta: "GPS 18.4793, 73.8305 • 02-Sep, 06:52 PM", tone: "roads" }
    ],
    timeline: [
      { id: "ct-1", title: "Issue Reported", description: "Reported with 2 geotagged photos by Meera Joshi.", date: ago(9 * DAY), status: "completed" },
      { id: "ct-2", title: "50+ Citizen Confirmations", description: "Community confirmation crossed 50 citizens across 2 wards.", date: ago(6 * DAY), status: "completed" },
      { id: "ct-3", title: "Flagged to PMC Road Department", description: "Auto-escalated to department with confirmation evidence pack.", date: ago(5 * DAY), status: "completed" },
      { id: "ct-4", title: "Emergency Patching Ordered", description: "Deputy Engineer ordered 48h emergency patching after 04-Sep inspection.", date: ago(7 * DAY), status: "completed" },
      { id: "ct-5", title: "Reopened After Rain (Current)", description: "Patches failed after rain; department notified of reopened potholes with fresh evidence.", date: ago(2 * DAY), status: "current" },
      { id: "ct-6", title: "Permanent Fix (Concrete Panel)", description: "Permanent fix tied to concretization panel casting — due with Oct-2026 programme.", date: null, status: "upcoming" }
    ],
    comments: [
      { author: "Vikram Deshpande", ward: "Ward 14", at: ago(5 * DAY), text: "The PMPL buses slow to walking pace here. Please add this to the ward review meeting agenda." },
      { author: "PMC Roads (Official)", official: true, at: ago(7 * DAY), text: "Emergency patching executed on 05-Sep. Permanent concrete panel scheduled with the concretization programme. Monitoring reopening." },
      { author: "Meera Joshi", ward: "Ward 14", at: ago(2 * DAY), text: "Patches have failed again. Fresh photos uploaded by three residents today." }
    ],
    govResponse: {
      by: "Er. A. B. Jadhav, Deputy Engineer (Roads)",
      at: ago(7 * DAY),
      text: "Emergency patching completed 05-Sep. The approach will receive a full concrete panel under the Sinhagad Road concretization package by mid-October. Reopening will trigger penalty recovery from the maintenance contractor."
    },
    resolution: null
  },
  {
    id: "ISS-2026-0138",
    title: "Open manhole without cover near Kothrud market lane",
    category: "Safety Hazard",
    projectId: "kothrud-drainage",
    ward: "Ward 12 — Kothrud West",
    location: "Kothrud, market lane behind bus stop, Pune",
    reportedBy: "Adv. S. Rane (Resident, Kothrud)",
    reportedAt: ago(4 * DAY),
    affected: 89,
    confirmations: 84,
    upvotes: 132,
    status: "action-taken",
    description:
      "Storm-water manhole cover dislodged during culvert works and left open with only a twig marker. The lane is unlit after 9 PM and children use it for tuition classes. Immediate cover or solid barricading needed.",
    confirmers: [
      { name: "Pooja M.", ward: "Ward 12", at: ago(3 * DAY), note: "Confirmed — nearly stepped in at night." },
      { name: "Ganesh T.", ward: "Ward 12", at: ago(3 * DAY), note: "Shopkeeper on this lane. Very risky for elderly." }
    ],
    evidence: [{ name: "open_manhole.jpg", meta: "GPS 18.5089, 73.8083 • 07-Sep, 09:12 PM", tone: "safety" }],
    timeline: [
      { id: "ct-1", title: "Issue Reported", description: "Reported with geotagged night photo.", date: ago(4 * DAY), status: "completed" },
      { id: "ct-2", title: "Flagged as Critical by Community", description: "84 confirmations within 24 hours — marked critical by review cell.", date: ago(3 * DAY), status: "completed" },
      { id: "ct-3", title: "SWD Crew Dispatched", description: "Temporary steel cover and barricades installed same day.", date: ago(2 * DAY), status: "completed" },
      { id: "ct-4", title: "Permanent Cover Fitted (Current)", description: "Contractor fitting replacement cover with lock-down bolts.", date: ago(DAY), status: "current" }
    ],
    comments: [
      { author: "Kothrud Housing Society Federation", ward: "Ward 12", at: ago(2 * DAY), text: "Thank you for the quick temporary fix. Requesting permanent cover before the weekend market." }
    ],
    govResponse: {
      by: "Er. M. V. Shinde, Executive Engineer (SWD)",
      at: ago(2 * DAY),
      text: "Temporary steel cover placed within 6 hours of flagging. Permanent lockable cover being fitted with contractor costs recovered under safety clause."
    },
    resolution: null
  },
  {
    id: "ISS-2026-0135",
    title: "Continuous water leakage from new distribution main, Bhosari",
    category: "Water Leakage",
    projectId: "bhosari-water",
    ward: "Ward 9 — Aundh–Bhosari",
    location: "Bhosari Sector-17, near water tank lane, Pune",
    reportedBy: "F. Ansari (Resident, Bhosari)",
    reportedAt: ago(6 * DAY),
    affected: 64,
    confirmations: 41,
    upvotes: 57,
    status: "confirmed",
    description:
      "The newly laid 24×7 supply main is leaking at a joint for nearly a week, flooding the footpath. Water supply department informed on helpline; no repair crew has attended so far.",
    confirmers: [{ name: "Devika R.", ward: "Ward 9", at: ago(4 * DAY), note: "Leak is worse in the morning hours." }],
    evidence: [{ name: "joint_leak.jpg", meta: "GPS 18.6295, 73.8475 • 05-Sep, 08:02 AM", tone: "water" }],
    timeline: [
      { id: "ct-1", title: "Issue Reported", description: "Reported with geotagged photo and video reference.", date: ago(6 * DAY), status: "completed" },
      { id: "ct-2", title: "40+ Citizen Confirmations", description: "Crossed 40 confirmations; evidence pack shared with department.", date: ago(3 * DAY), status: "completed" },
      { id: "ct-3", title: "Department Acknowledged", description: "Water Supply Department acknowledged; work order raised for joint re-clamp.", date: ago(2 * DAY), status: "completed" },
      { id: "ct-4", title: "Repair Crew Scheduled (Current)", description: "Crew scheduled with zone shutdown window — night repair planned.", date: ago(DAY), status: "current" }
    ],
    comments: [
      { author: "Sameer J.", ward: "Ward 9", at: ago(2 * DAY), text: "Footpath is slippery and mosquito breeding has started. Please expedite." }
    ],
    govResponse: {
      by: "Er. P. R. Kadam, Superintending Engineer (Water)",
      at: ago(2 * DAY),
      text: "Joint re-clamp work order raised under the project defect liability. Night repair planned with zone shutdown; residents will be notified via SMS."
    },
    resolution: null
  },
  {
    id: "ISS-2026-0129",
    title: "Fallen tree blocking Warje bridge service lane",
    category: "Safety Hazard",
    projectId: null,
    ward: "Ward 14 — Warje",
    location: "Warje bridge service lane, near garden gate, Pune",
    reportedBy: "N. Kale (Resident, Warje)",
    reportedAt: ago(14 * DAY),
    affected: 210,
    confirmations: 156,
    upvotes: 176,
    status: "resolved",
    description:
      "A large rain-soaked tree fell across the service lane blocking two-wheeler and pedestrian movement during morning peak. Gardens department requested for cutting and removal.",
    confirmers: [],
    evidence: [{ name: "fallen_tree.jpg", meta: "GPS 18.4871, 73.8175 • 28-Aug, 08:30 AM", tone: "safety" }],
    timeline: [
      { id: "ct-1", title: "Issue Reported", description: "Reported with geotagged photo at morning peak.", date: ago(14 * DAY), status: "completed" },
      { id: "ct-2", title: "100+ Confirmations", description: "Largest single-day confirmation spike of the month.", date: ago(13 * DAY), status: "completed" },
      { id: "ct-3", title: "Gardens Crew Deployed", description: "Tree cut and lane cleared within 5 hours of report.", date: ago(14 * DAY - 5 * HOUR), status: "completed" },
      { id: "ct-4", title: "Resolved & Verified", description: "Citizens verified lane reopened; compensatory plantation pledged.", date: ago(13 * DAY), status: "completed" }
    ],
    comments: [
      { author: "Rupali S.", ward: "Ward 14", at: ago(13 * DAY), text: "Cleared the same morning. Excellent response." }
    ],
    govResponse: {
      by: "Gardens Department Warje Ward",
      at: ago(13 * DAY),
      text: "Tree removed within 5 hours. Compensatory plantation of 2 native trees scheduled at the same ward under the plantation plan."
    },
    resolution: { closedAt: ago(13 * DAY), note: "Lane reopened same day; compensatory plantation committed." }
  },
  {
    id: "ISS-2026-0121",
    title: "Streetlights out across 800 m of Baner internal road",
    category: "Smart Infrastructure",
    projectId: "ahmedabad-smart-grid",
    ward: "Ward 9 — Aundh–Bhosari",
    location: "Baner internal road, near ITI, Pune",
    reportedBy: "A. Bhosale (Resident, Baner)",
    reportedAt: ago(11 * DAY),
    affected: 95,
    confirmations: 58,
    upvotes: 71,
    status: "action-taken",
    description:
      "Fourteen smart streetlights on the internal road have been dark for over a week. The stretch borders the metro viaduct construction haul road and is unsafe for women returning from late shifts.",
    confirmers: [{ name: "Pratik G.", ward: "Ward 9", at: ago(9 * DAY), note: "Pitch dark near the haul road crossing." }],
    evidence: [{ name: "dark_street.jpg", meta: "GPS 18.5642, 73.7767 • 31-Aug, 09:40 PM", tone: "smart" }],
    timeline: [
      { id: "ct-1", title: "Issue Reported", description: "Reported with night photo showing dark stretch.", date: ago(11 * DAY), status: "completed" },
      { id: "ct-2", title: "Ticket Raised to Smart City Ops", description: "Feeder-pillar fault identified; panel replacement indented.", date: ago(10 * DAY), status: "completed" },
      { id: "ct-3", title: "Panel Replacement In Progress (Current)", description: "Feeder panel replacement underway; temporary tower light installed.", date: ago(2 * DAY), status: "current" }
    ],
    comments: [
      { author: "Shalini V.", ward: "Ward 9", at: ago(8 * DAY), text: "Tower light is helping but please fix the main line soon." }
    ],
    govResponse: {
      by: "Smart City Operations Centre",
      at: ago(10 * DAY),
      text: "Feeder-pillar fault confirmed. Temporary tower light deployed; panel replacement targeted within 7 working days."
    },
    resolution: null
  },
  {
    id: "ISS-2026-0118",
    title: "Construction dust from metro viaduct yard affecting Hinjawadi Phase 1",
    category: "Environmental Issue",
    projectId: "pune-metro-3",
    ward: "Ward 9 — Aundh–Bhosari",
    location: "Hinjawadi Phase-1 road, near yard gate 2, Pune",
    reportedBy: "Hinjawadi Residents Forum",
    reportedAt: ago(16 * DAY),
    affected: 320,
    confirmations: 204,
    upvotes: 251,
    status: "confirmed",
    description:
      "Uncovered aggregate stock and dry haul roads at viaduct yard gate 2 are generating daily dust clouds across the residential sector. Sprinkling happens irregularly despite contractual frequency.",
    confirmers: [
      { name: "Amit K.", ward: "Ward 9", at: ago(12 * DAY), note: "Dust on windows daily. Kids are having more asthma complaints." },
      { name: "GreenTech Society Committee", ward: "Ward 9", at: ago(11 * DAY), note: "Confirmed on behalf of 4 societies." }
    ],
    evidence: [{ name: "dust_yard.jpg", meta: "GPS 18.5921, 73.7401 • 26-Aug, 07:15 AM", tone: "environment" }],
    timeline: [
      { id: "ct-1", title: "Issue Reported", description: "Reported by residents forum with geotagged photo.", date: ago(16 * DAY), status: "completed" },
      { id: "ct-2", title: "200+ Citizen Confirmations", description: "Highest-supported environmental issue this quarter.", date: ago(10 * DAY), status: "completed" },
      { id: "ct-3", title: "Dust Suppression Audit", description: "Environment cell audit found sprinkling frequency below contract.", date: ago(8 * DAY), status: "completed" },
      { id: "ct-4", title: "Compliance Plan Issued (Current)", description: "Revised sprinkling schedule + wheel-wash at yard gate; monthly public compliance log promised.", date: ago(3 * DAY), status: "current" }
    ],
    comments: [
      { author: "Rakesh N.", ward: "Ward 9", at: ago(7 * DAY), text: "Please publish the sprinkling compliance photos monthly as promised." }
    ],
    govResponse: {
      by: "Environment Cell, MahaMetro",
      at: ago(3 * DAY),
      text: "Revised dust-suppression plan enforced: twice-daily sprinkling, covered stockpiles, wheel-wash at yard gate 2. A monthly public compliance log will be published on the project page."
    },
    resolution: null
  }
];
