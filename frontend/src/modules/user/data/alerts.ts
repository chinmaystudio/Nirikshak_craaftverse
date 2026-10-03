import type { GovernmentAlert } from "@/types/infrastructure";

const DAY = 24 * 3600_000;
const HOUR = 3600_000;

function ago(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

export const alerts: GovernmentAlert[] = [
  {
    id: "ALT-2026-902",
    severity: "critical",
    category: "safety",
    title: "Overnight girder erection — Hinjawadi Phase 2 to Infosys Circle closed 23:00–05:00",
    body: "Hinjawadi Phase 2 to Infosys Circle will remain completely closed for vehicular traffic between 23:00 hrs and 05:00 hrs from 12-Sep to 20-Sep-2026 for erection of 60-tonne precast girder spans on Pune Metro Line 3. Emergency vehicles will be escorted. Penalty applies for unauthorised passage through the work zone.",
    area: "Hinjawadi Phase 2 → Infosys Circle, Ward 9",
    detour: "Diverted via Maan Village Link Road",
    startTime: "2026-09-12T23:00:00",
    endTime: "2026-09-20T05:00:00",
    postedAt: ago(26 * HOUR),
    projectId: "pune-metro-3",
    contact: "Traffic Police Helpline 1095"
  },
  {
    id: "ALT-2026-899",
    severity: "critical",
    category: "safety",
    title: "Open manhole overflow warning — Kothrud market lane",
    body: "Storm-water manhole near Kothrud market lane is overflowing after today's rainfall. The surrounding 15 m stretch is slippery and unsafe for children and two-wheelers. Barricades are being placed; avoid the lane until the SWD crew completes suction clearance (expected within 4 hours).",
    area: "Kothrud market lane, Ward 12",
    detour: "Use Paud Road service lane",
    startTime: ago(3 * HOUR).slice(0, 19),
    endTime: null,
    postedAt: ago(3 * HOUR),
    projectId: "kothrud-drainage",
    contact: "Ward Office 020-2534 0700"
  },
  {
    id: "ALT-2026-897",
    severity: "warning",
    category: "infrastructure",
    title: "Katraj–Kondhwa Road: carriageway closure for utility pole shifting",
    body: "The service carriageway between Ganga Jamuna Chowk and Rajas Society will remain closed from 09-Sep to 25-Sep-2026, 08:00–20:00 daily, for MSEB 33kV pole shifting under the road widening project. Peak-hour congestion expected; heavy vehicles advised alternate route.",
    area: "Ganga Jamuna Chowk → Rajas Society, Ward 12",
    detour: "Heavy vehicles via NIBM–Undri corridor",
    startTime: "2026-09-09T08:00:00",
    endTime: "2026-09-25T20:00:00",
    postedAt: ago(2 * DAY),
    projectId: "katraj-kondhwa-road",
    contact: "PMC Roads 020-2550 1122"
  },
  {
    id: "ALT-2026-895",
    severity: "warning",
    category: "infrastructure",
    title: "Pre-monsoon-tail culvert desilting advisory along riverfront works",
    body: "Desilting of cross-drainage culverts along the riverfront park stretch will be carried out 14-Sep to 18-Sep-2026 between 07:00–11:00. The walking loop will remain open; brief diversions at two culvert crossings. Cyclists requested to dismount at work zones.",
    area: "Ward 12 riverfront park stretch",
    detour: "Loop open; 2 culvert crossings diverted",
    startTime: "2026-09-14T07:00:00",
    endTime: "2026-09-18T11:00:00",
    postedAt: ago(30 * HOUR),
    projectId: "ward12-park",
    contact: "Gardens Dept 020-2538 0900"
  },
  {
    id: "ALT-2026-891",
    severity: "notice",
    category: "project",
    title: "Milestone completed: Pier #184 launching done on Metro Line 3",
    body: "Pier #184 precast segment launching completed at Hinjawadi Phase 2 on 09-Sep. Corridor progress now 74%. Track laying between Shivajinagar and Sakri begins 20-Oct-2026. Station-5 façade works continue under noise-restricted daytime hours.",
    area: "Hinjawadi–Shivajinagar corridor",
    startTime: "2026-09-09T11:15:00",
    endTime: null,
    postedAt: ago(27 * HOUR),
    projectId: "pune-metro-3",
    contact: "MahaMetro 020-2593 3000"
  },
  {
    id: "ALT-2026-888",
    severity: "notice",
    category: "project",
    title: "New project approved: Ward 12 Central Park Phase-1 opening 10-Nov",
    body: "The Ward 12 Central Park & Riverfront Stretch has reached 81% completion. Phase-1 (900 m walking loop, children's play zone and plantation belt) opens to the public on 10-Nov-2026. Sensory garden completes in December.",
    area: "Ward 12 — Kothrud West",
    startTime: "2026-09-09T17:00:00",
    endTime: null,
    postedAt: ago(28 * HOUR),
    projectId: "ward12-park",
    contact: "Gardens Dept 020-2538 0900"
  },
  {
    id: "ALT-2026-884",
    severity: "info",
    category: "project",
    title: "Quarterly public audit report published — Q1 FY 2026-27",
    body: "The consolidated quarterly transparency report for all Ward 12 and city-level projects has been published: physical vs financial variance, contractor performance ratings, and complaint redressal statistics. Available on each project page under Public Records.",
    area: "City-wide",
    startTime: "2026-09-08T09:00:00",
    endTime: null,
    postedAt: ago(3 * DAY),
    projectId: null,
    contact: "NIRIKSHAK Helpdesk 1800-11-2026"
  },
  {
    id: "ALT-2026-812",
    severity: "notice",
    category: "project",
    title: "Liquidated damages invoked: Bengaluru PRR Package-4 delay",
    body: "Liquidated damages of ₹1.85 Cr levied against the Package-4 contractor on Bengaluru Peripheral Ring Road after an unexcused 60-day milestone delay in flyover pier foundations. A 30-day cure period notice has been served; forest-clearance offsets are under way.",
    area: "Bengaluru — Packages 3–4",
    startTime: "2026-09-02T15:30:00",
    endTime: null,
    postedAt: ago(9 * DAY),
    projectId: "blr-ring-road",
    contact: "BDA 080-2266 3900"
  },
  {
    id: "ALT-2026-798",
    severity: "warning",
    category: "infrastructure",
    title: "Night water-supply shutdown for Zone-3 main connection, Bhosari",
    body: "Water supply to Bhosari Sectors 14–19 will remain shut on 13-Sep-2026 from 22:00 to 06:00 for connecting the new Zone-3 distribution main under the 24×7 water project. Store water in advance; tankers available on 1800-1030-222.",
    area: "Bhosari Sectors 14–19, Ward 9",
    detour: "Tanker service: 1800-1030-222",
    startTime: "2026-09-13T22:00:00",
    endTime: "2026-09-14T06:00:00",
    postedAt: ago(5 * DAY),
    projectId: "bhosari-water",
    contact: "Water Supply 020-2712 0500"
  }
];
