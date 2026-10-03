import type { Project } from "@/types/project";

const IMG = {
  metro: "https://lh3.googleusercontent.com/aida-public/AB6AXuCrjobV5ooc8Kd2pvNpizfWGm6M-CGpXVaidLTiWrqN5PL7lQbcMZhYSSp213iCGPk6OgDNj-8SIQVq_AsqPdX0JIXirucEjaUw2tYLNGFVKBUhLTfG2OusxNS7z4XxKd2PkrXzmDTxKCzJ46DbuAwiANMWkB4JZf_9fe6U9Z3KdfeHYep8_LkF8R1Rc__J4eUFPzk5q46czdv7dIyRxsSCRFhzKavnLNaOHT8z0aEYDUz291EbYwSXag",
  coastal:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAlhIcHLFoTGxhOxubWLCmxrwXjGageOUlxRQg63M4K5ylGhwYyqYDtGKCrp-kGPkhMI4qm5pkIHAhZ8d5KHgbxQtTNicBu7UzHRxWeUkefUDqcDXYVHlcTQoRlV1vrfyYFNHfBLvhMEcKbF3qNZDJGDGDnVApp-SZ5xEl9GiCxEFEgk11vztqEse_xOX7gHa823BQFz9Pq8Bg6pNvjHuRdp8E86KzNAqZyakziUeRP6RjX83C9vgmIdA",
  ring: "https://lh3.googleusercontent.com/aida-public/AB6AXuCCTBS-NzovbLBIeCpdjTSucHFq_tFRKOYwRLx3VJgQleneRr8_9pyBd_L6DrTNTthtdSN-Wx1s_Y-KoT_Jym1SWrSV9F_41e9XYHiCRh1oNKBOmxQL7Ev7OTKJhj5Bg-Ddijz_1c1ideLCynCirql8Bc47nExW9-EzcJl2Vrn-UJp5GJoN2N4NGROW-sG2G9nqXl-c3_7S_wPukbUefZkRteNByVLnVyZiRJA5Y8y01dj2OR8nibwXrw",
  rrts: "https://lh3.googleusercontent.com/aida-public/AB6AXuAXtgw2IfcbIGNVreRFTRhGyc4upsjmxw8xweJGSa4UDaQAgz9qQ2mENonJS8ryBA9n0Q8dBkTSastDY87PZs3bs5oQ054UrByMLGstOjFtdRk4w0J5fJxBlBGvnmaxBUsF0CzeF3H1QziCLxtT_lOo4FTmjidtqa2Y303RSFfeUrWuVPvxcmhmCqZS3SmSJmeO1gDkC9ATpjULzSx5YOvDblgymacAkK_2iX50uEA_BpbA3YPH5IJ_qg",
  pier: "https://lh3.googleusercontent.com/aida-public/AB6AXuAliilxuztSUBOtd0vzzrXtKsHPIW0y1StchZQKhN7O2b98rTel4-QWzLAeDM4_OmJHpYJZ9Q5sYRzKEqorFsDnWuRs8dz1Dm_r_n9QiS78oPUJ7a46DDs1cYJS7cMW58oBAxphVisQvL0AVqC_lhYyDwVfV2Ahp65sAmI_dYBUvgb9DVZ3ddjvyE_Yxhuqqag2ATJCFL-j_F6qtBI7YZczxEPF8_ZT6b1r1chBGbCaY-NHHAzzZJhhWA",
  gantry:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCJaEF-Cs7HQekE1JwNXozsGYp_uzjcjZn67Irh3A2uznk_-G3GbMV7oHeXuuZRg-6T6kLBK9yYjKGF0lSJH5ULDzTwM-jXgRtKnAyMI5HWkCQYQUQq-Ablj-6CLcb27UxsnFIhJq-4FQVxDgLuOa0iY21aVRuM7uZUJ5_nCJX_CAbDYG-tA8JEQWE8y11D0YGDb1o7OIvwZ9X8yGD-i0Dhe1sLCY5chtdvIw_bsBncO0Bj4hgoqtPiNw"
};

export const projectImages = IMG;

let milestoneSeq = 0;
function ms(
  title: string,
  date: string | null,
  status: Project["timeline"][number]["status"],
  description?: string,
  document?: string,
  image?: string
): Project["timeline"][number] {
  milestoneSeq += 1;
  return { id: `ms-${milestoneSeq}`, title, date, status, description, document, image };
}

export const projects: Project[] = [
  {
    id: "katraj-kondhwa-road",
    code: "PUN-RD-114",
    name: "Katraj–Kondhwa Road Widening & Concretization",
    category: "roads",
    department: "PMC Road Department",
    agency: "Pune Municipal Corporation (PMC)",
    engineer: "Er. S. M. Deshmukh (Executive Engineer, Roads)",
    ward: "Ward 12 — Kothrud West",
    city: "Pune",
    state: "Maharashtra",
    status: "delayed",
    progress: 46,
    physicalProgress: 46,
    financialProgress: 41,
    phase: "Utility Shifting & Carriageway-2 Casting",
    distanceKm: 3.4,
    mapPoint: { x: 72, y: 78 },
    img: IMG.ring,
    latestUpdate: {
      date: "2026-09-08T16:40:00",
      text: "Carriageway-2 casting between Ganga Jamuna Chowk and Rajas Society completed; utility shifting of MSEB poles underway."
    },
    lastInspection: {
      date: "2026-09-05",
      by: "Er. S. M. Deshmukh",
      remark: "Joint inspection with contractor. 60-day delay notice served for pier foundation hold-ups. Liquidated damages advisory issued."
    },
    nextMilestone: { name: "Carriageway-2 Open to Traffic", date: "2026-11-15" },
    description:
      "Widening of the 3.2 km Katraj–Kondhwa arterial corridor from 4 lanes to 8 lanes with fully concretized carriageways, service roads, pedestrian footpaths and a grade-separated junction at Rajas Society.",
    why: "The corridor carries over 90,000 passenger car units daily and recorded 214 accident cases in five years. Peak-hour speeds had fallen below 12 km/h, and monsoon waterlogging repeatedly damaged the bituminous surface.",
    scope: [
      "8-lane concrete carriageway with ducted utilities",
      "3.2 km of service roads and 2.4 km of footpaths",
      "Grade-separated junction at Rajas Society",
      "LED streetlighting and unified utility corridors",
      "Noise barriers near 4 school stretches"
    ],
    benefit:
      "Expected to cut peak travel time from 38 minutes to under 14 minutes, reduce accident risk by an estimated 40%, and eliminate recurrent monsoon resurfacing costs of ₹6–8 Cr per year.",
    finance: {
      sanctionedAmount: 492,
      revisedCost: 516,
      amountSpent: 214,
      fundingSource: "PMC Capital Budget + Maharashtra State Grant (70:30)",
      fundingModel: "Municipal Budget (EPC)",
      varianceNote: "4.8% revision driven by utility-shifting claims and steel price index."
    },
    contractor: {
      name: "NCC Infra Projects Ltd.",
      contractValue: 468,
      start: "2022-11-10",
      duration: "42 months",
      performance: { onTime: "62%", quality: "B+", safety: "88 / 100", disputes: "1 (utility claim, under arbitration)" },
      prevProjects: [
        { name: "Nagar Road Flyover, Pune", year: 2019, note: "Completed 4 months late" },
        { name: "Solapur Bypass Package-2", year: 2021, note: "On time, quality A-" }
      ],
      currentStatus: "Under cure-period notice for delay; works active on 2 of 4 fronts."
    },
    dates: { tender: "2022-02-14", awarded: "2022-07-18", started: "2022-11-10", expected: "2026-12-31", actual: null, originalExpected: "2026-04-30", revisedExpected: "2026-12-31" },
    delay: {
      reason: "Underground utility shifting (MSEB 33kV lines and optical fibre) took 11 months against a sanctioned 4 months; monsoon 2025 halted casting for 92 days.",
      detected: "2025-08-12",
      revisedCompletion: "2026-12-31",
      penalty: "₹4.10 Cr liquidated damages levied (alert ALT-2026-812 refers)"
    },
    timeline: [
      ms("Tender Published", "2022-02-14", "completed", "EPC tender floated on PMC e-procurement portal; 7 bids received."),
      ms("Tender Awarded", "2022-07-18", "completed", "Awarded to NCC Infra Projects Ltd. after technical and financial evaluation.", "Award Letter (PDF)"),
      ms("Work Started", "2022-11-10", "completed", "Site handover of first 1.1 km stretch; barricading and traffic diversion plan activated."),
      ms("Utility Shifting (Planned 4 months)", "2023-03-01", "delayed", "Completed only in Feb 2024 after 11 months due to MSEB and optical fibre coordination failures."),
      ms("Carriageway-1 Opened", "2025-06-20", "completed", "First 3.2 km concrete carriageway opened to Pune–Katraj bound traffic."),
      ms("Delay Detected & Penalty Advisory", "2025-08-12", "delayed", "60-day milestone slippage formally recorded; liquidated damages process initiated.", "Delay Notice (PDF)"),
      ms("Carriageway-2 Casting (Current)", "2026-09-08", "current", "Casting between Ganga Jamuna Chowk and Rajas Society in progress; 46% overall completion."),
      ms("Junction Grade Separator Works", "2026-10-10", "upcoming", "Rajas Society grade-separated junction deck launching scheduled."),
      ms("Revised Completion Target", "2026-12-31", "upcoming", "Revised commissioning after 8-month sanctioned delay.")
    ],
    docs: [
      { name: "Administrative Approval & DPR.pdf", size: "6.2 MB", note: "Sanctioned scope and cost" },
      { name: "Delay Notice & Cure Period Order.pdf", size: "1.1 MB", note: "Clause 14.2 invocation" },
      { name: "Quarterly Progress Report Q1 FY26.pdf", size: "3.4 MB", note: "Physical vs financial variance" }
    ],
    photos: [
      { src: IMG.ring, caption: "Carriageway-2 casting near Rajas Society [08-Sep-2026]" },
      { src: IMG.pier, caption: "Junction pier foundation audit [02-Sep-2026]" }
    ],
    hotline: "+91 20 2550 1122"
  },
  {
    id: "pune-metro-3",
    code: "PUN-MET-03",
    name: "Pune Metro Line 3 (Hinjawadi–Shivajinagar)",
    category: "metro-transit",
    department: "MahaMetro",
    agency: "PMRDA / Maharashtra Metro Rail Corporation",
    engineer: "Er. Rajeshwar Kulkarni (Chief Civil Audit)",
    ward: "Ward 9 — Aundh–Bhosari",
    city: "Pune",
    state: "Maharashtra",
    status: "on-track",
    progress: 74,
    physicalProgress: 74,
    financialProgress: 72,
    phase: "Viaduct & Station Finishing (Package 4)",
    distanceKm: 7.1,
    mapPoint: { x: 58, y: 34 },
    img: IMG.metro,
    latestUpdate: {
      date: "2026-09-09T11:15:00",
      text: "Pier #184 precast segment launching completed at Hinjawadi Phase 2; station 5 façade glazing at 60%."
    },
    lastInspection: {
      date: "2026-09-07",
      by: "Er. Rajeshwar Kulkarni",
      remark: "Girder erection night works verified. Safety compliance satisfactory; two housekeeping observations closed on site."
    },
    nextMilestone: { name: "Track Laying Begins (Shivajinagar–Sakri Section)", date: "2026-10-20" },
    description:
      "23.2 km elevated double-track metro corridor with 23 stations connecting the Hinjawadi IT cluster to Shivajinagar civic centre, designed to cut commuter transit time from 90 minutes to 35 minutes.",
    why: "Hinjawadi Rajiv Gandhi Infotech Park employs over 4.5 lakh people with no mass transit linkage; road corridors operate at 130% of designed capacity during peak hours.",
    scope: [
      "23.2 km elevated viaduct with 23 stations",
      "Rolling stock depot at Maan",
      "Feeder bus integration and FOBs",
      "Acoustic barriers near residential stretches"
    ],
    benefit: "Projected daily ridership of 4.6 lakh; removes an estimated 1.1 lakh private vehicle trips per day from west Pune corridors.",
    finance: {
      sanctionedAmount: 8313,
      revisedCost: 8450,
      amountSpent: 6150,
      fundingSource: "GoI + Govt. of Maharashtra + TRIL Concessionaire",
      fundingModel: "Public-Private Partnership (DBFOT)",
      varianceNote: "1.6% revision from price index adjustment."
    },
    contractor: {
      name: "TRIL Urban Transport & Siemens Consortium",
      contractValue: 6940,
      start: "2021-01-15",
      duration: "60 months",
      performance: { onTime: "86%", quality: "A", safety: "96 / 100", disputes: "None" },
      prevProjects: [
        { name: "Hyderabad Metro Package-2", year: 2018, note: "Delivered on time" },
        { name: "Chennai Metro UG Package", year: 2016, note: "Completed, quality A" }
      ],
      currentStatus: "On schedule; milestone incentives active."
    },
    dates: { tender: "2019-08-01", awarded: "2019-12-11", started: "2021-01-15", expected: "2026-12-31", actual: null },
    timeline: [
      ms("Sanctioned", "2018-10-04", "completed", "Union Cabinet approval with VGF support."),
      ms("Tender Published", "2019-08-01", "completed", "International competitive bidding under PPP-DBFOT framework."),
      ms("Concession Awarded", "2019-12-11", "completed", "TRIL Urban Transport & Siemens consortium selected.", "Concession Agreement (PDF)"),
      ms("Work Started", "2021-01-15", "completed", "Pier foundation works began at Hinjawadi Phase 1."),
      ms("50% Construction", "2024-09-30", "completed", "Viaduct halfway marker achieved across all 4 packages."),
      ms("Night Girder Erection Campaign", "2026-04-12", "completed", "60-tonne precast girders erected over Hinjawadi–Infosys Circle stretch under night closures.", undefined, IMG.gantry),
      ms("Current: 74% Construction", "2026-09-09", "current", "Station finishing and track works in parallel; 74% physical progress."),
      ms("Trial Runs", "2026-11-25", "upcoming", "CMRS safety inspection and trial runs scheduled."),
      ms("Revenue Operations", "2026-12-31", "upcoming", "Full corridor opening targeted.")
    ],
    docs: [
      { name: "CAG Financial Audit Q3-2025.pdf", size: "4.8 MB", note: "Certified clean" },
      { name: "Environmental Clearance (MoEFCC).pdf", size: "2.1 MB", note: "Tree translocation plan" },
      { name: "Concession Agreement.pdf", size: "14.2 MB", note: "Redacted financials" }
    ],
    photos: [
      { src: IMG.pier, caption: "Pier #184 Hinjawadi Ph 2 [12-Apr-2026]" },
      { src: IMG.gantry, caption: "Gantry erection Shivajinagar [10-Apr-2026]" }
    ],
    hotline: "+91 20 2593 3000"
  },
  {
    id: "sinhgad-road",
    code: "PUN-RD-121",
    name: "Sinhagad Road Concrete Concretization (Vitthalwadi–Datta Nagar)",
    category: "roads",
    department: "PMC Road Department",
    agency: "Pune Municipal Corporation (PMC)",
    engineer: "Er. A. B. Jadhav (Deputy Engineer, Roads)",
    ward: "Ward 14 — Warje",
    city: "Pune",
    state: "Maharashtra",
    status: "on-track",
    progress: 62,
    physicalProgress: 62,
    financialProgress: 58,
    phase: "Panel Casting & Drainage Cross-Connections",
    distanceKm: 5.2,
    mapPoint: { x: 62, y: 88 },
    img: IMG.ring,
    latestUpdate: {
      date: "2026-09-06T10:05:00",
      text: "23 of 41 concrete panels cast; stormwater cross-connections at Anandnagar completed."
    },
    lastInspection: {
      date: "2026-09-04",
      by: "Er. A. B. Jadhav",
      remark: "Curing and surface regularity verified. Pothole cluster near Vitthalwadi bridge approach flagged for emergency patching within 48 hours."
    },
    nextMilestone: { name: "Vitthalwadi–Anandnagar Stretch Open", date: "2026-10-05" },
    description:
      "Concretization of a 4.6 km stretch of Sinhagad Road with junction improvements, new stormwater drains, footpaths and bus-bay rationalization between Vitthalwadi and Datta Nagar.",
    why: "Heavy PMPL bus traffic and unregulated utility trenching had left the bituminous surface with chronic pothole clusters; restoration cycles were costing ₹3+ Cr annually.",
    scope: ["4.6 km white-topped concrete carriageway", "Stormwater drains with 14 cross-connections", "3 new bus bays and junction realignment", "Continuous footpath with tactile paving"],
    benefit: "Eliminates the annual pothole-restoration cycle for 60,000+ daily commuters and improves PMPL schedule adherence on 11 routes.",
    finance: {
      sanctionedAmount: 198,
      revisedCost: 198,
      amountSpent: 115,
      fundingSource: "PMC Capital Budget",
      fundingModel: "Municipal Budget (Item-Rate)",
      varianceNote: "No revision; expenditure tracking nominal."
    },
    contractor: {
      name: "R. B. Infrastructure Pvt. Ltd.",
      contractValue: 181,
      start: "2025-04-01",
      duration: "24 months",
      performance: { onTime: "81%", quality: "A-", safety: "91 / 100", disputes: "None" },
      prevProjects: [
        { name: "Kharadi Internal Roads", year: 2023, note: "Completed on time" },
        { name: "Bavdhan Creek Bridge Repairs", year: 2022, note: "Completed 3 weeks early" }
      ],
      currentStatus: "Active on schedule with weekly joint measurements."
    },
    dates: { tender: "2024-11-20", awarded: "2025-02-06", started: "2025-04-01", expected: "2027-03-31", actual: null },
    timeline: [
      ms("Tender Published", "2024-11-20", "completed", "Item-rate tender for concretization package."),
      ms("Tender Awarded", "2025-02-06", "completed", "Awarded to R. B. Infrastructure Pvt. Ltd.", "Award Letter (PDF)"),
      ms("Work Started", "2025-04-01", "completed", "Panel casting from Vitthalwadi end; traffic maintained on half-width."),
      ms("Drainage Cross-Connections", "2026-08-28", "completed", "14 stormwater cross-connections completed at Anandnagar."),
      ms("Current: 62% Panels Cast", "2026-09-06", "current", "23 of 41 panels complete; emergency pothole patching ordered near bridge approach."),
      ms("Vitthalwadi–Anandnagar Open", "2026-10-05", "upcoming", "First completed stretch opens to two-way traffic."),
      ms("Project Completion", "2027-03-31", "upcoming", "Full corridor including footpaths and bus bays.")
    ],
    docs: [
      { name: "Detailed Project Report.pdf", size: "5.7 MB", note: "Traffic study annexed" },
      { name: "Inspection Log Sep-2026.pdf", size: "0.9 MB", note: "Joint measurement sheets" }
    ],
    photos: [{ src: IMG.ring, caption: "Panel casting near Anandnagar [06-Sep-2026]" }],
    hotline: "+91 20 2550 1180"
  },
  {
    id: "bhosari-water",
    code: "PUN-WS-207",
    name: "Bhosari 24×7 Water Supply & Metering",
    category: "water-supply",
    department: "PMC Water Supply Department",
    agency: "Pune Municipal Corporation (PMC)",
    engineer: "Er. P. R. Kadam (Superintending Engineer, Water)",
    ward: "Ward 9 — Aundh–Bhosari",
    city: "Pune",
    state: "Maharashtra",
    status: "on-track",
    progress: 71,
    physicalProgress: 71,
    financialProgress: 70,
    phase: "Distribution Main Laying & House Connections",
    distanceKm: 8.6,
    mapPoint: { x: 44, y: 22 },
    img: null,
    latestUpdate: {
      date: "2026-09-07T09:30:00",
      text: "18.4 of 26 km distribution mains commissioned; 9,200 of 14,000 smart meters installed."
    },
    lastInspection: {
      date: "2026-09-03",
      by: "Er. P. R. Kadam",
      remark: "Pressure trials at 2.8 bar sustained for 6 hours. Joint leakage at Sector-17 header being re-clamped."
    },
    nextMilestone: { name: "Zone-3 Commissioning", date: "2026-11-01" },
    description:
      "Conversion of Bhosari's intermittent supply into a continuous 24×7 pressurized system with 26 km of new distribution mains, district metering areas (DMAs), and 14,000 smart household meters.",
    why: "Bhosari received water for only 3–4 hours daily with 38% non-revenue water; intermittent supply caused contamination ingress and repeated pipeline complaints.",
    scope: ["26 km distribution mains with SCADA monitoring", "14,000 smart meters with consumer portal", "8 district metering areas", "High-level reservoir interconnection"],
    benefit: "Continuous supply for 85,000 residents; NRW reduction from 38% to a targeted 15% saves an estimated 9 MLD of treated water daily.",
    finance: {
      sanctionedAmount: 310,
      revisedCost: 310,
      amountSpent: 220,
      fundingSource: "AMRUT 2.0 Central Share + PMC (50:50)",
      fundingModel: "Municipal Budget (EPC)",
      varianceNote: "No revision; savings redirected to Zone-3 extension."
    },
    contractor: {
      name: "VJTL Technologies & GMR Infra JV",
      contractValue: 289,
      start: "2023-08-12",
      duration: "36 months",
      performance: { onTime: "84%", quality: "A", safety: "94 / 100", disputes: "None" },
      prevProjects: [
        { name: "Pimpri 24×7 Water Zone-1", year: 2021, note: "Delivered on time" },
        { name: "Nashik DMA Metering", year: 2019, note: "Completed, quality A-" }
      ],
      currentStatus: "On schedule; metering ramp-up ahead of plan."
    },
    dates: { tender: "2023-02-10", awarded: "2023-06-01", started: "2023-08-12", expected: "2026-09-30", actual: null },
    timeline: [
      ms("Tender Published", "2023-02-10", "completed", "AMRUT-funded EPC tender."),
      ms("Tender Awarded", "2023-06-01", "completed", "VJTL–GMR JV selected."),
      ms("Work Started", "2023-08-12", "completed", "Mega pipeline works began from Bhosari high-level reservoir."),
      ms("DMA-1 & DMA-2 Commissioned", "2025-12-15", "completed", "First two metering districts went live with 4,100 meters."),
      ms("Current: 71% Mains & Metering", "2026-09-07", "current", "18.4 km mains live; 9,200 smart meters installed."),
      ms("Zone-3 Commissioning", "2026-11-01", "upcoming", "Final distribution zone handover."),
      ms("Project Completion", "2026-09-30", "upcoming", "All 14,000 meters operational and consumer portal public.")
    ],
    docs: [
      { name: "AMRUT Sanction Letter.pdf", size: "1.4 MB", note: "Central share confirmation" },
      { name: "Water Quality Audit Q2-26.pdf", size: "2.2 MB", note: "BIS 10500 compliance" }
    ],
    photos: [],
    hotline: "+91 20 2712 0500"
  },
  {
    id: "kothrud-drainage",
    code: "PUN-SW-066",
    name: "Kothrud Storm-Water Drainage Augmentation",
    category: "drainage",
    department: "Storm Water Department",
    agency: "Pune Municipal Corporation (PMC)",
    engineer: "Er. M. V. Shinde (Executive Engineer, SWD)",
    ward: "Ward 12 — Kothrud West",
    city: "Pune",
    state: "Maharashtra",
    status: "on-track",
    progress: 58,
    physicalProgress: 58,
    financialProgress: 55,
    phase: "Box Culvert Casting (Karve Road Stretch)",
    distanceKm: 1.2,
    mapPoint: { x: 36, y: 52 },
    img: null,
    latestUpdate: {
      date: "2026-09-05T14:20:00",
      text: "Box culvert segments 12–18 cast on Karve Road; desilting of existing nallah completed for 2.1 km."
    },
    lastInspection: {
      date: "2026-09-02",
      by: "Er. M. V. Shinde",
      remark: "Pre-monsoon readiness verified. Two silt-choke points at Paud Phata cleared and re-graded."
    },
    nextMilestone: { name: "Karve Road Culvert Deck Slab", date: "2026-10-12" },
    description:
      "Augmentation of Kothrud's storm-water network with 3.4 km of new box culverts, nallah training works, and 6 high-capacity inlet systems serving one of the ward's most waterlogging-prone catchments.",
    why: "Unchecked concretization reduced ground absorption in Kothrud, causing street flooding above 45 mm/hr rainfall in 2024–25; 3 chronic flooding points disrupted schools and the Karve Road corridor.",
    scope: ["3.4 km RCC box culverts", "6 high-capacity road inlets with silt traps", "Nallah training and retaining walls", "Automated water-level sensors at 4 points"],
    benefit: "Protects 22,000 residents and 4 schools from recurrent monsoon flooding; designed for a 1-in-10-year storm event.",
    finance: {
      sanctionedAmount: 84,
      revisedCost: 84,
      amountSpent: 46,
      fundingSource: "PMC Capital Budget + Disaster Mitigation Fund",
      fundingModel: "Municipal Budget (Item-Rate)",
      varianceNote: "No revision."
    },
    contractor: {
      name: "J. Kumar Infra Projects Ltd.",
      contractValue: 76,
      start: "2025-01-20",
      duration: "24 months",
      performance: { onTime: "88%", quality: "A", safety: "95 / 100", disputes: "None" },
      prevProjects: [
        { name: "Mula-Mutha Riverfront Wall Package-1", year: 2023, note: "Completed on time" },
        { name: "Hadapsar Swargate Storm Line", year: 2020, note: "Completed, quality A" }
      ],
      currentStatus: "Active; monsoon-season works restricted to dry spells."
    },
    dates: { tender: "2024-08-15", awarded: "2024-12-02", started: "2025-01-20", expected: "2027-01-31", actual: null },
    timeline: [
      ms("Tender Published", "2024-08-15", "completed", "Ward-level storm augmentation package tendered."),
      ms("Tender Awarded", "2024-12-02", "completed", "J. Kumar Infra Projects Ltd. selected."),
      ms("Work Started", "2025-01-20", "completed", "Silt survey and nallah training commenced."),
      ms("Desilting of Existing Network", "2026-09-01", "completed", "2.1 km of existing nallah desilted before monsoon tail."),
      ms("Current: Box Culvert Casting", "2026-09-05", "current", "Segments 12–18 cast; 58% overall."),
      ms("Culvert Deck & Inlets", "2026-10-12", "upcoming", "Karve Road deck slab and 6 inlet systems."),
      ms("Project Completion", "2027-01-31", "upcoming", "Sensor integration and defect liability handover.")
    ],
    docs: [
      { name: "Hydrology & Drainage Study.pdf", size: "8.1 MB", note: "IIT-benchmarked catchment model" },
      { name: "Monsoon Readiness Certificate.pdf", size: "0.6 MB", note: "Sep-2026" }
    ],
    photos: [],
    hotline: "+91 20 2534 0700"
  },
  {
    id: "warje-school",
    code: "PUN-ED-042",
    name: "PM Shri Vidyalaya Upgradation (Warje)",
    category: "schools",
    department: "PMC Education Department",
    agency: "Pune Municipal Corporation (PMC)",
    engineer: "Smt. K. S. Patil (Education Officer, Zone-4)",
    ward: "Ward 14 — Warje",
    city: "Pune",
    state: "Maharashtra",
    status: "on-track",
    progress: 66,
    physicalProgress: 66,
    financialProgress: 63,
    phase: "Smart Classroom Fit-out & Labs",
    distanceKm: 4.1,
    mapPoint: { x: 54, y: 76 },
    img: null,
    latestUpdate: {
      date: "2026-09-08T08:50:00",
      text: "12 of 18 smart classrooms commissioned; science and robotics lab civil works complete."
    },
    lastInspection: {
      date: "2026-09-06",
      by: "Smt. K. S. Patil",
      remark: "Furniture delivery quality verified against PM Shri specifications. Playground resurfacing to begin after Ganesh festival."
    },
    nextMilestone: { name: "Digital Library Handover", date: "2026-10-15" },
    description:
      "Transformation of the Warje municipal school into a PM Shri model school: 18 smart classrooms, science and robotics laboratories, a digital library, upgraded sanitation blocks, and a resurfaced playground.",
    why: "Enrolment at the school had fallen 22% in five years as families shifted to private schools; a 2019 infrastructure audit rated its facilities below the national PM Shri benchmark.",
    scope: ["18 smart classrooms with interactive panels", "Science, computer and robotics laboratories", "Digital library with 10,000 e-titles", "Separate upgraded sanitation blocks", "400 m playground resurfacing"],
    benefit: "Directly benefits 1,240 enrolled students and is projected to recover enrolment loss across 6 catchment communities.",
    finance: {
      sanctionedAmount: 28.5,
      revisedCost: 28.5,
      amountSpent: 18,
      fundingSource: "PM Shri (Samagra Shiksha) + PMC Education Fund",
      fundingModel: "Central Scheme + Municipal (60:40)",
      varianceNote: "No revision."
    },
    contractor: {
      name: "Ravi Constructions & Interiors",
      contractValue: 24.2,
      start: "2025-10-01",
      duration: "12 months",
      performance: { onTime: "90%", quality: "A-", safety: "98 / 100", disputes: "None" },
      prevProjects: [
        { name: "Yerawada School Block-2", year: 2024, note: "Completed 1 month early" },
        { name: "Dhankawdi Anganwadi Cluster", year: 2023, note: "Completed on time" }
      ],
      currentStatus: "Ahead of schedule on interiors; playground works weather-dependent."
    },
    dates: { tender: "2025-06-10", awarded: "2025-08-22", started: "2025-10-01", expected: "2026-09-30", actual: null },
    timeline: [
      ms("Scheme Sanction", "2025-05-12", "completed", "PM Shri selection under Samagra Shiksha."),
      ms("Tender Awarded", "2025-08-22", "completed", "Ravi Constructions selected for civil and fit-out package."),
      ms("Work Started", "2025-10-01", "completed", "Diwali vacation window used for demolition and structural strengthening."),
      ms("Lab Civil Works Complete", "2026-08-30", "completed", "Science and robotics laboratory shells handed over."),
      ms("Current: Smart Classroom Fit-out", "2026-09-08", "current", "12 of 18 classrooms commissioned with interactive panels."),
      ms("Digital Library Handover", "2026-10-15", "upcoming", "Library hardware and e-content onboarding."),
      ms("Project Completion", "2026-09-30", "upcoming", "Final integration and third-party quality audit.")
    ],
    docs: [
      { name: "PM Shri Sanction Order.pdf", size: "0.8 MB", note: "Component-wise outlay" },
      { name: "Third-Party QC Report Aug-26.pdf", size: "1.9 MB", note: "Fit-out quality rating A-" }
    ],
    photos: [],
    hotline: "+91 20 2536 0400"
  },
  {
    id: "aundh-hospital",
    code: "PUN-HT-018",
    name: "Aundh District Hospital — Block B Upgradation",
    category: "hospitals",
    department: "PWD Maharashtra",
    agency: "Public Works Department / District Administration",
    engineer: "Er. D. R. Kulkarni (Executive Engineer, PWD)",
    ward: "Ward 9 — Aundh–Bhosari",
    city: "Pune",
    state: "Maharashtra",
    status: "on-track",
    progress: 34,
    physicalProgress: 34,
    financialProgress: 30,
    phase: "Structure Casting (Wing-2, Floors 1–3)",
    distanceKm: 9.3,
    mapPoint: { x: 30, y: 30 },
    img: null,
    latestUpdate: {
      date: "2026-09-09T12:10:00",
      text: "Wing-2 first-slab casting complete; procurement of modular OT packages under technical evaluation."
    },
    lastInspection: {
      date: "2026-09-08",
      by: "Er. D. R. Kulkarni",
      remark: "Rebar and cover-block compliance verified before casting. Site safety inductions current for all 140 workers."
    },
    nextMilestone: { name: "Wing-2 Structural Top-Out", date: "2026-12-20" },
    description:
      "A five-storey 180-bed specialty block at Aundh District Hospital adding ICU capacity, four modular operation theatres, a modernised labour room complex and diagnostic imaging suites.",
    why: "The district hospital operates at 140% bed occupancy and refers 60+ critical cases monthly to private hospitals; the 2023 facility survey rated ICU capacity per capita the lowest among Pune's major public hospitals.",
    scope: ["180 inpatient beds including 36 ICU", "4 modular operation theatres", "Radiology suite with CT and MRI", "Central medical gas and HVAC systems", "Rainwater harvesting and solar pre-heat"],
    benefit: "Expands public tertiary access for 6.2 lakh residents of Aundh–Bhosari–Pimple Gurav and reduces out-of-pocket critical-care expenditure.",
    finance: {
      sanctionedAmount: 142,
      revisedCost: 142,
      amountSpent: 43,
      fundingSource: "Govt. of Maharashtra Health Plan + District Plan Fund",
      fundingModel: "State Budget (Item-Rate)",
      varianceNote: "No revision."
    },
    contractor: {
      name: "P. R. Builders & Sun Infra JV",
      contractValue: 128,
      start: "2026-03-02",
      duration: "30 months",
      performance: { onTime: "94% (early works)", quality: "A", safety: "97 / 100", disputes: "None" },
      prevProjects: [
        { name: "Nashik District Hospital Wing", year: 2022, note: "Completed on time" },
        { name: "Sassoon Trauma Block Fit-out", year: 2024, note: "Completed 2 weeks early" }
      ],
      currentStatus: "Early-works schedule ahead of baseline; equipment procurement in parallel."
    },
    dates: { tender: "2025-09-15", awarded: "2026-01-20", started: "2026-03-02", expected: "2028-06-30", actual: null },
    timeline: [
      ms("Facility Survey & DPR", "2023-11-30", "completed", "Gap analysis and clinical planning approved by Directorate of Health."),
      ms("Tender Published", "2025-09-15", "completed", "Two-cover turnkey tender for civil plus MEP."),
      ms("Contract Awarded", "2026-01-20", "completed", "P. R. Builders & Sun Infra JV.", "Award Letter (PDF)"),
      ms("Work Started", "2026-03-02", "completed", "Excavation and raft foundation for Wing-2."),
      ms("Current: Structure Casting", "2026-09-09", "current", "Wing-2 floors 1–3 in progress; 34% overall."),
      ms("Structural Top-Out", "2026-12-20", "upcoming", "Final slab casting and waterproofing."),
      ms("MEP & Modular OTs", "2027-08-15", "upcoming", "Services integration and equipment installation."),
      ms("Commissioning", "2028-06-30", "upcoming", "NABH-readiness audit and patient rollout.")
    ],
    docs: [
      { name: "Clinical Planning Report.pdf", size: "7.3 MB", note: "Directorate-approved" },
      { name: "Bid Evaluation Summary.pdf", size: "1.2 MB", note: "Two-cover evaluation" }
    ],
    photos: [],
    hotline: "+91 20 2720 4200"
  },
  {
    id: "ward12-park",
    code: "PUN-PK-029",
    name: "Ward 12 Central Park & Riverfront Stretch",
    category: "parks",
    department: "PMC Gardens Department",
    agency: "Pune Municipal Corporation (PMC)",
    engineer: "Shri. V. T. Gore (Superintending Garden Superintendent)",
    ward: "Ward 12 — Kothrud West",
    city: "Pune",
    state: "Maharashtra",
    status: "on-track",
    progress: 81,
    physicalProgress: 81,
    financialProgress: 78,
    phase: "Plantation & Fitness Zone Installation",
    distanceKm: 0.8,
    mapPoint: { x: 40, y: 60 },
    img: null,
    latestUpdate: {
      date: "2026-09-09T17:00:00",
      text: "1,850 of 2,400 saplings planted; open-air fitness zone equipment delivery received and being installed."
    },
    lastInspection: {
      date: "2026-09-09",
      by: "Shri. V. T. Gore",
      remark: "Irrigation drip network commissioned. Accessibility ramp gradients verified per Harmonised Guidelines."
    },
    nextMilestone: { name: "Public Opening (Phase-1)", date: "2026-11-10" },
    description:
      "Redevelopment of a 4.2-acre vacant riverfront plot into the ward's flagship park: a 900 m walking loop, children's play zones, open-air fitness corner, sensory garden and 2,400 native-tree plantation belt.",
    why: "Ward 12 had the lowest per-capita open space (1.1 sq m against the WHO benchmark of 9 sq m) and no accessible riverside public space within 2 km.",
    scope: ["900 m accessible walking loop", "Children's play and fitness zones", "2,400 native-tree plantation belt", "Drip irrigation and solar lighting", "Universal-access ramps and tactile paths"],
    benefit: "Creates 1.9 sq m additional open space per resident for 14,000 people within an 800 m walkshed.",
    finance: {
      sanctionedAmount: 36,
      revisedCost: 36,
      amountSpent: 28,
      fundingSource: "PMC Gardens Budget + ₹6 Cr corporate CSR",
      fundingModel: "Municipal Budget + CSR",
      varianceNote: "No revision."
    },
    contractor: {
      name: "GreenScape Environments LLP",
      contractValue: 31,
      start: "2025-06-15",
      duration: "18 months",
      performance: { onTime: "92%", quality: "A", safety: "99 / 100", disputes: "None" },
      prevProjects: [
        { name: "Vetal Tekdi Nature Trail", year: 2023, note: "Completed on time" },
        { name: "Riverfront Pilot Garden", year: 2022, note: "Completed, quality A" }
      ],
      currentStatus: "Plantation ahead of season target; finishing works in parallel."
    },
    dates: { tender: "2025-01-28", awarded: "2025-04-30", started: "2025-06-15", expected: "2026-11-10", actual: null },
    timeline: [
      ms("Ward Committee Approval", "2024-12-08", "completed", "Concept design approved with citizen jury participation."),
      ms("Tender Awarded", "2025-04-30", "completed", "GreenScape Environments LLP selected.", "Award Letter (PDF)"),
      ms("Work Started", "2025-06-15", "completed", "Earthworks, grading and service corridors."),
      ms("Walking Loop & Lighting", "2026-07-20", "completed", "Loop paving and solar lighting commissioned."),
      ms("Current: Plantation & Fitness Zone", "2026-09-09", "current", "1,850 saplings planted; fitness equipment installation underway."),
      ms("Phase-1 Public Opening", "2026-11-10", "upcoming", "Soft launch with loop, play zone and plantation belt."),
      ms("Sensory Garden Completion", "2026-12-15", "upcoming", "Final phase including sensory garden.")
    ],
    docs: [
      { name: "Concept Design Booklet.pdf", size: "9.4 MB", note: "Citizen-jury revisions included" },
      { name: "Tree Plantation Plan.pdf", size: "1.7 MB", note: "Species mix approved by Tree Authority" }
    ],
    photos: [],
    hotline: "+91 20 2538 0900"
  },
  {
    id: "mumbai-coastal",
    code: "MUM-CST-01",
    name: "Mumbai Coastal Road (South Section)",
    category: "roads",
    department: "BMC Roads & Traffic",
    agency: "Brihanmumbai Municipal Corporation",
    engineer: "Er. S. V. Rane (Chief Engineer, Coastal)",
    ward: "—",
    city: "Mumbai",
    state: "Maharashtra",
    status: "completed",
    progress: 100,
    physicalProgress: 100,
    financialProgress: 100,
    phase: "Dedicated & Operational",
    distanceKm: null,
    mapPoint: null,
    img: IMG.coastal,
    latestUpdate: { date: "2026-08-14T10:00:00", text: "Interchange 4 opened; average daily traffic crossed 62,000 vehicles." },
    lastInspection: { date: "2026-08-10", by: "Third-party auditor", remark: "Annual structural health audit completed — all sensors nominal." },
    nextMilestone: { name: "North Section Tender (Phase 2)", date: "2026-10-30" },
    description:
      "10.58 km coastal freeway connecting Marine Drive to the Bandra-Worli Sea Link, including India's first undersea road twin tunnels, built to relieve arterial congestion along the western coastline.",
    why: "The north–south western corridors operated at 150% of capacity with average peak speeds below 15 km/h, imposing an estimated ₹900 Cr annual congestion cost.",
    scope: ["10.58 km freeway with 3.2 km undersea twin tunnels", "Interchanges at 5 locations", "Seawall with wave-dissipating armour", "Integrated tunnel control and ventilation"],
    benefit: "Cuts Marine Drive–Bandra-Worli Sea Link travel to under 10 minutes and saves an estimated 32,000 litres of fuel daily.",
    finance: {
      sanctionedAmount: 12721,
      revisedCost: 13410,
      amountSpent: 13180,
      fundingSource: "BMC Capital Budget",
      fundingModel: "Municipal Budget (EPC)",
      varianceNote: "5.4% revision from marine geotechnical conditions."
    },
    contractor: {
      name: "Larsen & Toubro (L&T)",
      contractValue: 11900,
      start: "2019-01-10",
      duration: "54 months",
      performance: { onTime: "79%", quality: "A", safety: "95 / 100", disputes: "2 (marine claims, settled)" },
      prevProjects: [
        { name: "Atal Setu Package-3", year: 2023, note: "Delivered on time" },
        { name: "Hyderabad Metro Reach-1", year: 2017, note: "Completed, quality A" }
      ],
      currentStatus: "Defect liability period active till 2027."
    },
    dates: { tender: "2018-05-04", awarded: "2018-10-15", started: "2019-01-10", expected: "2023-10-31", actual: "2024-03-11" },
    timeline: [
      ms("Tender Published", "2018-05-04", "completed", "EPC tender in two packages."),
      ms("Contract Awarded", "2018-10-15", "completed", "L&T selected for south section."),
      ms("Work Started", "2019-01-10", "completed", "Marine pile and seawall works began."),
      ms("Undersea Tunnel Breakthrough", "2023-05-26", "completed", "Both TBMs completed twin-tube drive."),
      ms("Commissioned", "2024-03-11", "completed", "Full corridor opened with tunnel control centre.", undefined, IMG.coastal),
      ms("First Annual Audit", "2026-08-10", "completed", "Structural health audit — all nominal.")
    ],
    docs: [
      { name: "Marine EIA Compliance Report.pdf", size: "6.8 MB", note: "CRZ-III conditions" },
      { name: "Structural Health Audit 2026.pdf", size: "3.9 MB", note: "All sensors nominal" }
    ],
    photos: [{ src: IMG.coastal, caption: "Freeway at Worli interchange [Aug-2026]" }],
    hotline: "+91 22 2270 4400"
  },
  {
    id: "blr-ring-road",
    code: "BLR-PRR-08",
    name: "Bengaluru Peripheral Ring Road (PRR)",
    category: "roads",
    department: "BDA Infrastructure",
    agency: "Bengaluru Development Authority",
    engineer: "Er. G. N. Rao (Chief Engineer, BDA)",
    ward: "—",
    city: "Bengaluru",
    state: "Karnataka",
    status: "delayed",
    progress: 32,
    physicalProgress: 32,
    financialProgress: 29,
    phase: "Earthworks & Culverts (Package 4)",
    distanceKm: null,
    mapPoint: null,
    img: IMG.ring,
    latestUpdate: {
      date: "2026-09-02T15:30:00",
      text: "Package-4 flyover pier foundations resumed after forest-department clearance; 210 additional saplings planted as compensatory offset."
    },
    lastInspection: {
      date: "2026-08-29",
      by: "Er. G. N. Rao",
      remark: "Tree felling vs translocation tally under state forest department audit; drone survey commissioned."
    },
    nextMilestone: { name: "Package-4 Flyover Pier Foundations", date: "2026-12-15" },
    description:
      "73 km, 8-lane access-controlled greenfield expressway around Greater Bengaluru with 16 interchanges, designed to divert inter-state and through freight away from city corridors.",
    why: "Bengaluru's orbital corridors carry 4.2 lakh through-vehicles daily on arterial roads designed for one-third of that volume, contributing an estimated ₹1,100 Cr annual congestion loss.",
    scope: ["73 km 8-lane expressway with service roads", "16 interchanges and 6 toll plazas", "Tunnel at Nandi hill approaches", "Environmental offset plantation of 40,000 trees"],
    benefit: "Removes an estimated 1.8 lakh through-vehicles daily from city roads and cuts freight transit time by 55 minutes.",
    finance: {
      sanctionedAmount: 21091,
      revisedCost: 21870,
      amountSpent: 6750,
      fundingSource: "JICA Loan + KRDCL Bond Issue",
      fundingModel: "State SPV + Loan",
      varianceNote: "3.7% revision from land compensation awards."
    },
    contractor: {
      name: "BDA / Dilip Buildcon–Afcons JV",
      contractValue: 9820,
      start: "2023-11-01",
      duration: "48 months",
      performance: { onTime: "48%", quality: "B", safety: "85 / 100", disputes: "3 (land and forest clearances)" },
      prevProjects: [
        { name: "Hubballi–Dharwad Bypass", year: 2021, note: "Completed 5 months late" },
        { name: "Mysuru Outer Ring Upgrades", year: 2019, note: "Completed on time" }
      ],
      currentStatus: "Under 60-day delay scrutiny; Package-4 critical path."
    },
    dates: { tender: "2022-10-20", awarded: "2023-05-16", started: "2023-11-01", expected: "2027-10-31", actual: null, originalExpected: "2027-10-31", revisedExpected: "2028-06-30" },
    delay: {
      reason: "Forest clearance for 41.2 ha of tree felling took 14 months; land compensation litigation delayed 3 of 7 interchange sites.",
      detected: "2025-06-18",
      revisedCompletion: "2028-06-30",
      penalty: "₹1.85 Cr liquidated damages invoked for Package-4 milestone slippage (ALT-2026-812)."
    },
    timeline: [
      ms("Tender Published", "2022-10-20", "completed", "Two-package EPC tender."),
      ms("Awarded", "2023-05-16", "completed", "Dilip Buildcon–Afcons JV for Packages 3–4."),
      ms("Work Started", "2023-11-01", "completed", "Earthworks on cleared stretches."),
      ms("Forest Clearance Delay", "2025-06-18", "delayed", "41.2 ha clearance pending 14 months; milestone slippage recorded.", "Delay Notice (PDF)"),
      ms("Clearance Received & Offsets Begun", "2026-07-30", "completed", "Compensatory plantation drive started on Doddaballapur stretch."),
      ms("Current: 32% — Package-4 Foundations", "2026-09-02", "current", "Pier foundations resumed; overall 32%."),
      ms("Revised Completion Target", "2028-06-30", "upcoming", "Full expressway commissioning as revised.")
    ],
    docs: [
      { name: "Forest Clearance Order.pdf", size: "2.6 MB", note: "With compensatory afforestation plan" },
      { name: "JICA Tranche Agreement.pdf", size: "5.1 MB", note: "Redacted" }
    ],
    photos: [{ src: IMG.ring, caption: "Package-4 earthworks [Sep-2026]" }],
    hotline: "+91 80 2266 3900"
  },
  {
    id: "delhi-meerut-rrts",
    code: "DEL-MRT-01",
    name: "Delhi–Meerut RRTS (Namo Bharat)",
    category: "metro-transit",
    department: "NCRTC",
    agency: "National Capital Region Transport Corporation",
    engineer: "Er. P. K. Singh (Director, Projects)",
    ward: "—",
    city: "Delhi–Ghaziabad–Meerut",
    state: "Delhi NCR",
    status: "on-track",
    progress: 82,
    physicalProgress: 82,
    financialProgress: 81,
    phase: "Systems Integration & Trial Runs",
    distanceKm: null,
    mapPoint: null,
    img: IMG.rrts,
    latestUpdate: { date: "2026-09-01T09:45:00", text: "Modipuram station concourse finishes complete; 160 km/h trial section extended to Meerut South." },
    lastInspection: { date: "2026-08-28", by: "CMRS delegation", remark: "Trial-run safety observations closed; signalling availability 99.6% across operated section." },
    nextMilestone: { name: "Full-Corridor CMRS Certification", date: "2026-11-05" },
    description:
      "82.15 km semi-high-speed regional rail corridor connecting Sarai Kale Khan (Delhi) to Modipuram (Meerut) with design speeds of 180 km/h and operations at 160 km/h, reducing end-to-end travel to about 55 minutes.",
    why: "Over 3 lakh daily commuters travelled the Delhi–Meerut corridor on overstressed road and slow suburban rail, with door-to-door times exceeding 3.5 hours.",
    scope: ["82.15 km corridor, 25 stations", "Namo Bharat trainsets (Alstom)", "Integrated feeder and parking hubs", "ETCS-compatible signalling"],
    benefit: "Serves a projected 8 lakh daily riders across NCR and removes 25,000+ bus-equivalent trips daily.",
    finance: {
      sanctionedAmount: 30274,
      revisedCost: 32420,
      amountSpent: 26120,
      fundingSource: "GoI + UP + ADB Loan",
      fundingModel: "Central + State SPV + Multilateral",
      varianceNote: "7.1% revision from systems scope and land costs."
    },
    contractor: {
      name: "Afcons Infrastructure (Civil) / Alstom (Systems)",
      contractValue: 18400,
      start: "2020-09-01",
      duration: "72 months",
      performance: { onTime: "83%", quality: "A", safety: "97 / 100", disputes: "1 (right-of-way claim, resolved)" },
      prevProjects: [
        { name: "Chennai Metro Phase-2 UG", year: 2024, note: "On schedule" },
        { name: "Mumbai Trans-Harbour Package-2", year: 2023, note: "Delivered on time" }
      ],
      currentStatus: "Priority section operational; balance on plan."
    },
    dates: { tender: "2019-03-30", awarded: "2019-11-22", started: "2020-09-01", expected: "2026-12-31", actual: null },
    timeline: [
      ms("Sanctioned", "2019-02-20", "completed", "NCRTC incorporated as implementing SPV."),
      ms("Awarded", "2019-11-22", "completed", "Civil to Afcons; systems to Alstom."),
      ms("Work Started", "2020-09-01", "completed", "Viaduct and station works in priority section."),
      ms("Priority Section Operational", "2023-10-20", "completed", "Sahibabad–Duhai opened with 160 km/h trials.", undefined, IMG.rrts),
      ms("Current: 82% — Systems Integration", "2026-09-01", "current", "Trial section extended to Meerut South."),
      ms("Full-Corridor Certification", "2026-11-05", "upcoming", "CMRS certification for complete corridor."),
      ms("Full Operations", "2026-12-31", "upcoming", "Sarai Kale Khan–Modipuram end-to-end service.")
    ],
    docs: [
      { name: "ADB Loan Compliance Report.pdf", size: "4.4 MB", note: "FY25 tranche" },
      { name: "Safety Certification Summary.pdf", size: "1.8 MB", note: "Priority section" }
    ],
    photos: [{ src: IMG.rrts, caption: "Namo Bharat trainset on viaduct [2026]" }],
    hotline: "+91 120 456 7800"
  },
  {
    id: "surat-water-drain",
    code: "SUR-DRN-04",
    name: "Surat Storm-Water Canal & Flood Defence Matrix",
    category: "drainage",
    department: "SMC Drainage Project",
    agency: "Surat Municipal Corporation",
    engineer: "Er. H. B. Patel (City Engineer)",
    ward: "—",
    city: "Surat",
    state: "Gujarat",
    status: "on-track",
    progress: 68,
    physicalProgress: 68,
    financialProgress: 68,
    phase: "Automated Sluice Gate Installation",
    distanceKm: null,
    mapPoint: null,
    img: null,
    latestUpdate: { date: "2026-08-30T13:20:00", text: "9 of 14 telemetry pumping stations commissioned; automated gates calibrated for early-warning linkage." },
    lastInspection: { date: "2026-08-26", by: "Er. H. B. Patel", remark: "Pump-hour trials at 110% design load passed; telemetry handshaking with city EOC verified." },
    nextMilestone: { name: "EOC Telemetry Integration Complete", date: "2026-10-25" },
    description:
      "High-capacity automated sluice gates, 14 telemetry pumping stations and 45 km of reinforced storm-water culverts forming Surat's integrated flood-defence matrix against Tapi-origin flooding.",
    why: "Surat's 2006 and 2021 flood events exposed critical pumping shortfalls; 60% of the city lies below high-tide level with tidal backflow risk during monsoon peaks.",
    scope: ["45 km reinforced storm culverts", "14 automated pumping stations (2,150 cumec combined)", "Automated sluice gates with EOC telemetry", "Silt-forecast linked pre-emptive operation protocols"],
    benefit: "Raises city flood preparedness from 6-hour to 30-minute response and protects 1.2 lakh flood-prone households.",
    finance: {
      sanctionedAmount: 2450,
      revisedCost: 2450,
      amountSpent: 1670,
      fundingSource: "World Bank UB Support + SMC",
      fundingModel: "Municipal Budget + Grant",
      varianceNote: "No revision."
    },
    contractor: {
      name: "Dilip Buildcon Ltd.",
      contractValue: 2010,
      start: "2023-05-10",
      duration: "42 months",
      performance: { onTime: "86%", quality: "A-", safety: "92 / 100", disputes: "None" },
      prevProjects: [
        { name: "Indore Sewer Network Package-2", year: 2022, note: "Completed on time" },
        { name: "Ahmedabad Storm Package-5", year: 2020, note: "Completed, quality A-" }
      ],
      currentStatus: "On schedule; monsoon-commissioned stations performing to design."
    },
    dates: { tender: "2022-09-12", awarded: "2023-01-25", started: "2023-05-10", expected: "2026-11-30", actual: null },
    timeline: [
      ms("Tender Published", "2022-09-12", "completed", "World Bank-supported EPC package."),
      ms("Awarded", "2023-01-25", "completed", "Dilip Buildcon Ltd."),
      ms("Work Started", "2023-05-10", "completed", "Culvert relining and pump station foundations."),
      ms("First 6 Pump Stations Live", "2025-09-01", "completed", "Commissioned before 2025 monsoon."),
      ms("Current: 68% — Gate Automation", "2026-08-30", "current", "Sluice gates calibrated with EOC early-warning linkage."),
      ms("Full Telemetry Integration", "2026-10-25", "upcoming", "All 14 stations on EOC dashboard."),
      ms("Project Completion", "2026-11-30", "upcoming", "Post-monsoon performance audit.")
    ],
    docs: [
      { name: "Flood Risk Modelling Report.pdf", size: "11.2 MB", note: "Deltares-reviewed" },
      { name: "World Bank Aide-Memoire.pdf", size: "1.3 MB", note: "Implementation support mission" }
    ],
    photos: [],
    hotline: "+91 261 253 0300"
  },
  {
    id: "ahmedabad-smart-grid",
    code: "AHM-SMC-12",
    name: "Ahmedabad Smart City Command & Control Centre",
    category: "smart-infrastructure",
    department: "Smart City Mission (AMC)",
    agency: "Ahmedabad Municipal Corporation",
    engineer: "Smt. R. I. Shah (Smart City CEO Office)",
    ward: "—",
    city: "Ahmedabad",
    state: "Gujarat",
    status: "completed",
    progress: 100,
    physicalProgress: 100,
    financialProgress: 100,
    phase: "Operational — Expansion Phase",
    distanceKm: null,
    mapPoint: null,
    img: null,
    latestUpdate: { date: "2026-07-19T11:00:00", text: "Phase-2 expansion: 2,000 additional CCTV feeds onboarded; flood-sensor layer integrated." },
    lastInspection: { date: "2026-07-15", by: "MoHUA Smart City Review", remark: "Rated among top-5 ICCC operations nationally; 99.95% platform uptime." },
    nextMilestone: { name: "Phase-2 Go-Live", date: "2026-10-15" },
    description:
      "Integrated city operations centre unifying 6,000 CCTV feeds, automatic number-plate recognition, adaptive traffic signals, SCADA water telemetry and a GIS incident layer under one command platform.",
    why: "Fragmented departmental monitoring produced an average 26-minute incident detection gap; the ICCC consolidates detection, dispatch and response into a single accountability chain.",
    scope: ["6,000 CCTV feeds + 2,000 expansion", "ANPR at 120 junctions", "Adaptive traffic control at 230 signals", "SCADA water and drainage telemetry", "Disaster-response GIS dashboard"],
    benefit: "Average incident detection gap down from 26 to 4 minutes; vehicle throughput at adaptive junctions up 18%.",
    finance: {
      sanctionedAmount: 1180,
      revisedCost: 1180,
      amountSpent: 1156,
      fundingSource: "SCM Central Share + AMC",
      fundingModel: "Smart Cities Mission",
      varianceNote: "No revision; closed under budget."
    },
    contractor: {
      name: "L&T-Nxt & Honeywell Consortium",
      contractValue: 940,
      start: "2021-06-01",
      duration: "48 months",
      performance: { onTime: "95%", quality: "A", safety: "96 / 100", disputes: "None" },
      prevProjects: [
        { name: "Bhopal ICCC", year: 2020, note: "Completed on time" },
        { name: "Surat ICCC Layer-2", year: 2022, note: "Completed, quality A" }
      ],
      currentStatus: "Operations & maintenance contract active till 2028."
    },
    dates: { tender: "2020-12-15", awarded: "2021-03-10", started: "2021-06-01", expected: "2025-05-31", actual: "2025-04-18" },
    timeline: [
      ms("Tender Awarded", "2021-03-10", "completed", "L&T-Nxt & Honeywell consortium."),
      ms("Work Started", "2021-06-01", "completed", "ICCC facility build-out begun."),
      ms("ICCC Go-Live", "2023-08-15", "completed", "Command centre operational with 3,000 feeds."),
      ms("Adaptive Signals Rollout", "2025-02-28", "completed", "230 junctions on adaptive control."),
      ms("Commissioned", "2025-04-18", "completed", "Full scope commissioned 6 weeks early."),
      ms("Phase-2 Expansion (Current)", "2026-07-19", "current", "2,000 extra feeds and flood-sensor layer.")
    ],
    docs: [
      { name: "ICCC Performance Audit.pdf", size: "2.9 MB", note: "MoHUA review 2026" },
      { name: "Data Privacy & Retention Policy.pdf", size: "0.7 MB", note: "Public summary" }
    ],
    photos: [],
    hotline: "+91 79 2539 1811"
  },
  {
    id: "pm-shri-dhankawdi",
    code: "PUN-ED-051",
    name: "Dhankawdi Ward Office & Civic Centre Complex",
    category: "public-buildings",
    department: "PMC Estate Department",
    agency: "Pune Municipal Corporation (PMC)",
    engineer: "Er. N. S. Jagtap (Deputy Engineer, Estate)",
    ward: "Ward 14 — Warje",
    city: "Pune",
    state: "Maharashtra",
    status: "under-review",
    progress: 12,
    physicalProgress: 12,
    financialProgress: 8,
    phase: "Foundation Works (Geo-technical Hold Cleared)",
    distanceKm: 6.0,
    mapPoint: { x: 50, y: 92 },
    img: null,
    latestUpdate: { date: "2026-09-04T10:40:00", text: "Geo-technical anomaly at west pile cap resolved; raft casting restarted after third-party review." },
    lastInspection: { date: "2026-09-04", by: "IIT-Bombay Review Panel", remark: "Pile-load retest results accepted; amended foundation design approved with conditions." },
    nextMilestone: { name: "Raft Foundation Complete (Wing-A)", date: "2026-11-30" },
    description:
      "G+4 integrated ward office and citizen facilitation centre for Dhankawdi with a single-window citizen hall, library, health post and e-mobility charging hub, built to GRIHA-4 green standards.",
    why: "Residents of Dhankawdi currently travel 7 km to the regional office for 90% of civic services; the 2019 citizen charter review flagged queue times above 2 hours.",
    scope: ["G+4 office and single-window citizen hall", "Public library and community hall", "Urban health post and creche", "GRIHA-4 design with rooftop solar"],
    benefit: "Brings 42 civic services within 2 km for 85,000 residents with targeted 20-minute service timelines.",
    finance: {
      sanctionedAmount: 58,
      revisedCost: 58,
      amountSpent: 4.6,
      fundingSource: "PMC Capital Budget + Amrut DP Reserve",
      fundingModel: "Municipal Budget (EPC)",
      varianceNote: "No revision."
    },
    contractor: {
      name: "S. G. Constructions & Realty",
      contractValue: 52,
      start: "2026-02-16",
      duration: "26 months",
      performance: { onTime: "82% (early works)", quality: "B+", safety: "93 / 100", disputes: "None" },
      prevProjects: [
        { name: "Kondhwa Health Post Block", year: 2023, note: "Completed on time" },
        { name: "Ambegaon Community Hall", year: 2021, note: "Completed 2 months late" }
      ],
      currentStatus: "Foundation hold cleared under third-party supervision."
    },
    dates: { tender: "2025-07-10", awarded: "2025-12-08", started: "2026-02-16", expected: "2028-04-30", actual: null },
    timeline: [
      ms("Tender Published", "2025-07-10", "completed", "EPC tender with GRIHA-4 requirement."),
      ms("Awarded", "2025-12-08", "completed", "S. G. Constructions & Realty."),
      ms("Work Started", "2026-02-16", "completed", "Excavation and piling begun."),
      ms("Geo-technical Hold", "2026-07-01", "delayed", "West pile-cap anomaly; third-party IIT-Bombay review ordered."),
      ms("Current: Raft Casting Restarted", "2026-09-04", "current", "Amended foundation design in execution; 12% overall."),
      ms("Raft Foundation Complete", "2026-11-30", "upcoming", "Wing-A raft and plinth beams."),
      ms("Structure Top-Out", "2027-06-15", "upcoming", "Full RCC frame completion.")
    ],
    docs: [
      { name: "Third-party Geo-technical Review.pdf", size: "3.1 MB", note: "IIT-Bombay, Sep-2026" },
      { name: "GRIHA Design Summary.pdf", size: "2.4 MB", note: "Pre-certification" }
    ],
    photos: [],
    hotline: "+91 20 2439 0500"
  }
];

export function findProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}
