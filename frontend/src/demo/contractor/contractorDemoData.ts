// ─── NIRIKSHAK Contractor Portal — demonstration data ────────────────────────
import type {
  ProjectStatus,
  RiskLevel,
  MilestoneState,
  Milestone,
  Inspection,
  InspectionRecord,
  ComplianceItem,
  RiskItem,
  ForecastFactor,
  Project,
  Worker,
  ResourceRow,
  InvoiceStatus,
  Invoice,
  ProgressReport,
  Message,
  ProjectDoc,
  NotifCategory,
  Notification,
  EventType,
  CalendarEvent,
  Tender,
  Bid,
  PastBid,
} from '@/modules/contractor/types/contractor.types';


// ─── Contractor profile ──────────────────────────────────────────────────────

export const CONTRACTOR = {
  name: 'Balaji Infraprojects Pvt. Ltd.',
  short: 'Balaji Infraprojects',
  id: 'CON-MH-2019-03487',
  gstin: '27AABCB1234C1ZV',
  cin: 'U45200MH2011PTC214870',
  class: 'Class-A (Unlimited)',
  registered: 'PWD Maharashtra • MJP • ZP Empanelled',
  established: 2011,
  turnover: 68.4, // ₹ Cr avg FY 2023-26
  staff: 240,
  completedWorks: 23,
  city: 'Pune, Maharashtra',
};

export const OFFICER_NAME = 'Officer';

// ─── Projects ────────────────────────────────────────────────────────────────

export const PROJECTS: Project[] = [];

// ─── Workers & Resources ─────────────────────────────────────────────────────

export const INITIAL_WORKERS: Record<string, Worker[]> = {
  p1: [
    { id: 'w1', name: 'Mahesh Salunkhe', role: 'Site Supervisor', category: 'Supervisor', area: 'Zone 1', attendance: 96, hours: 48, status: 'Active', phone: '+91 98220 11012' },
    { id: 'w2', name: 'Vikas Jadhav', role: 'Mason', category: 'Skilled', area: 'Zone 1', attendance: 94, hours: 48, status: 'Active', phone: '+91 98220 11013' },
    { id: 'w3', name: 'Ramesh Pawar', role: 'Bar Bender', category: 'Skilled', area: 'Zone 1', attendance: 92, hours: 46, status: 'Active', phone: '+91 98220 11014' },
    { id: 'w4', name: 'Suresh Kadam', role: 'Carpenter (Shuttering)', category: 'Skilled', area: 'Zone 2', attendance: 88, hours: 44, status: 'Active', phone: '+91 98220 11015' },
    { id: 'w5', name: 'Ganesh Shinde', role: 'Carpenter (Shuttering)', category: 'Skilled', area: 'Zone 2', attendance: 90, hours: 44, status: 'Active', phone: '+91 98220 11016' },
    { id: 'w6', name: 'Dattatray Bhosale', role: 'Electrician', category: 'Skilled', area: 'Zone 2', attendance: 85, hours: 40, status: 'Active', phone: '+91 98220 11017' },
    { id: 'w7', name: 'Santosh Gaikwad', role: 'Steel Fixer', category: 'Skilled', area: 'Zone 1', attendance: 91, hours: 47, status: 'Active', phone: '+91 98220 11018' },
    { id: 'w8', name: 'Prakash Mane', role: 'Construction Labour', category: 'Unskilled', area: 'Zone 1', attendance: 95, hours: 50, status: 'Active', phone: '+91 98220 11019' },
    { id: 'w9', name: 'Ashok Kamble', role: 'Construction Labour', category: 'Unskilled', area: 'Zone 2', attendance: 89, hours: 48, status: 'Active', phone: '+91 98220 11020' },
    { id: 'w10', name: 'Vijay Chavan', role: 'Construction Labour', category: 'Unskilled', area: 'Zone 3', attendance: 82, hours: 42, status: 'Active', phone: '+91 98220 11021' },
    { id: 'w11', name: 'Sunil Thorat', role: 'Paver Operator', category: 'Skilled', area: 'Plant & Yard', attendance: 97, hours: 50, status: 'Active', phone: '+91 98220 11022' },
    { id: 'w12', name: 'Kiran Mokashi', role: 'Safety Officer', category: 'Supervisor', area: 'All Zones', attendance: 100, hours: 48, status: 'Active', phone: '+91 98220 11023' },
    { id: 'w13', name: 'Baban Jadhav', role: 'Construction Labour', category: 'Unskilled', area: 'Zone 3', attendance: 0, hours: 0, status: 'On Leave', phone: '+91 98220 11024' },
    { id: 'w14', name: 'Deepak Sargar', role: 'Helper', category: 'Unskilled', area: 'Zone 1', attendance: 78, hours: 36, status: 'Transferred', phone: '+91 98220 11025' },
  ],
  p2: [
    { id: 'w1', name: 'Rahul Nikam', role: 'Site Supervisor', category: 'Supervisor', area: 'Zone A', attendance: 97, hours: 48, status: 'Active', phone: '+91 98230 22011' },
    { id: 'w2', name: 'Imran Shaikh', role: 'Pipe Fitter', category: 'Skilled', area: 'Zone B', attendance: 95, hours: 48, status: 'Active', phone: '+91 98230 22012' },
    { id: 'w3', name: 'Sanjay Wagh', role: 'Pipe Fitter', category: 'Skilled', area: 'Zone B', attendance: 93, hours: 47, status: 'Active', phone: '+91 98230 22013' },
    { id: 'w4', name: 'Rohit Deshmukh', role: 'Excavator Operator', category: 'Skilled', area: 'Zone A', attendance: 96, hours: 50, status: 'Active', phone: '+91 98230 22014' },
    { id: 'w5', name: 'Akash Deore', role: 'Welder', category: 'Skilled', area: 'Yard', attendance: 90, hours: 45, status: 'Active', phone: '+91 98230 22015' },
    { id: 'w6', name: 'Nitin Bagul', role: 'Construction Labour', category: 'Unskilled', area: 'Zone B', attendance: 92, hours: 49, status: 'Active', phone: '+91 98230 22016' },
    { id: 'w7', name: 'Sameer Pawar', role: 'Construction Labour', category: 'Unskilled', area: 'Zone A', attendance: 88, hours: 46, status: 'Active', phone: '+91 98230 22017' },
    { id: 'w8', name: 'Hemant Kale', role: 'Safety Officer', category: 'Supervisor', area: 'All Zones', attendance: 99, hours: 48, status: 'Active', phone: '+91 98230 22018' },
  ],
  p3: [
    { id: 'w1', name: 'Dinesh Chaudhari', role: 'Site Supervisor', category: 'Supervisor', area: 'Block A', attendance: 95, hours: 50, status: 'Active', phone: '+91 98240 33011' },
    { id: 'w2', name: 'Mahendra Solunke', role: 'Mason', category: 'Skilled', area: 'Block A', attendance: 91, hours: 48, status: 'Active', phone: '+91 98240 33012' },
    { id: 'w3', name: 'Nivrutti Sasane', role: 'Mason', category: 'Skilled', area: 'Block B', attendance: 89, hours: 47, status: 'Active', phone: '+91 98240 33013' },
    { id: 'w4', name: 'Rafiq Ansari', role: 'Electrician (MEP)', category: 'Skilled', area: 'MEP', attendance: 94, hours: 49, status: 'Active', phone: '+91 98240 33014' },
    { id: 'w5', name: 'Tukaram Kendre', role: 'Plumber (MEP)', category: 'Skilled', area: 'MEP', attendance: 92, hours: 48, status: 'Active', phone: '+91 98240 33015' },
    { id: 'w6', name: 'Ganpat Waghmare', role: 'Bar Bender', category: 'Skilled', area: 'Block B', attendance: 87, hours: 45, status: 'Active', phone: '+91 98240 33016' },
    { id: 'w7', name: 'Sunil Dhiwar', role: 'Construction Labour', category: 'Unskilled', area: 'Block A', attendance: 93, hours: 50, status: 'Active', phone: '+91 98240 33017' },
    { id: 'w8', name: 'Bhagwan More', role: 'Construction Labour', category: 'Unskilled', area: 'Block B', attendance: 90, hours: 48, status: 'Active', phone: '+91 98240 33018' },
    { id: 'w9', name: 'Ravi Sonawane', role: 'Construction Labour', category: 'Unskilled', area: 'Yard', attendance: 85, hours: 44, status: 'On Leave', phone: '+91 98240 33019' },
    { id: 'w10', name: 'Pravin Shinde', role: 'Safety Officer', category: 'Supervisor', area: 'All Blocks', attendance: 98, hours: 50, status: 'Active', phone: '+91 98240 33020' },
  ],
  p4: [
    { id: 'w1', name: 'Ajinkya Patil', role: 'Site Supervisor', category: 'Supervisor', area: 'Wards 8–11', attendance: 96, hours: 48, status: 'Active', phone: '+91 98250 44011' },
    { id: 'w2', name: 'Kunal Salvi', role: 'Carpenter (Box Shuttering)', category: 'Skilled', area: 'Ward 10', attendance: 92, hours: 47, status: 'Active', phone: '+91 98250 44012' },
    { id: 'w3', name: 'Rushi Kadam', role: 'Bar Bender', category: 'Skilled', area: 'Ward 9', attendance: 90, hours: 46, status: 'Active', phone: '+91 98250 44013' },
    { id: 'w4', name: 'Omkar Jadhav', role: 'Construction Labour', category: 'Unskilled', area: 'Ward 8', attendance: 94, hours: 49, status: 'Active', phone: '+91 98250 44014' },
    { id: 'w5', name: 'Tejas Bhosale', role: 'Construction Labour', category: 'Unskilled', area: 'Ward 11', attendance: 91, hours: 48, status: 'Active', phone: '+91 98250 44015' },
    { id: 'w6', name: 'Mangesh Gore', role: 'Safety Officer', category: 'Supervisor', area: 'All Wards', attendance: 99, hours: 48, status: 'Active', phone: '+91 98250 44016' },
  ],
  p5: [
    { id: 'w1', name: 'Sheshrao Welekar', role: 'Site Supervisor', category: 'Supervisor', area: 'Bridge Site', attendance: 93, hours: 50, status: 'Active', phone: '+91 98260 55011' },
    { id: 'w2', name: 'Vasant Kalbande', role: 'Bar Bender', category: 'Skilled', area: 'Pier 3', attendance: 88, hours: 47, status: 'Active', phone: '+91 98260 55012' },
    { id: 'w3', name: 'Ramesh Tekam', role: 'Mason', category: 'Skilled', area: 'Pier 2', attendance: 90, hours: 48, status: 'Active', phone: '+91 98260 55013' },
    { id: 'w4', name: 'Dinesh Parteti', role: 'Crane Operator', category: 'Skilled', area: 'Bridge Site', attendance: 95, hours: 50, status: 'Active', phone: '+91 98260 55014' },
    { id: 'w5', name: 'Rohit Kumare', role: 'Construction Labour', category: 'Unskilled', area: 'Approach', attendance: 86, hours: 46, status: 'Active', phone: '+91 98260 55015' },
    { id: 'w6', name: 'Gopal Raut', role: 'Construction Labour', category: 'Unskilled', area: 'Pier 3', attendance: 84, hours: 45, status: 'Active', phone: '+91 98260 55016' },
  ],
  p6: [],
};

export const INITIAL_RESOURCES: Record<string, ResourceRow[]> = {
  p1: [
    { id: 'r1', name: 'Excavator JCB 3DX', category: 'Machinery', qty: 3, allocated: 3, used: 3, unit: 'nos.', status: 'In Use' },
    { id: 'r2', name: 'Transit Mixer 6 m³', category: 'Vehicles', qty: 5, allocated: 4, used: 4, unit: 'nos.', status: 'In Use' },
    { id: 'r3', name: 'Vibratory Roller 12T', category: 'Machinery', qty: 2, allocated: 2, used: 2, unit: 'nos.', status: 'In Use' },
    { id: 'r4', name: 'Batching Plant 30 m³/h', category: 'Machinery', qty: 1, allocated: 1, used: 1, unit: 'no.', status: 'In Use' },
    { id: 'r5', name: 'Diesel Generator 125 kVA', category: 'Equipment', qty: 2, allocated: 2, used: 2, unit: 'nos.', status: 'In Use' },
    { id: 'r6', name: 'Total Station (Survey)', category: 'Equipment', qty: 2, allocated: 1, used: 1, unit: 'nos.', status: 'Idle' },
    { id: 'r7', name: 'Plate Compactor', category: 'Equipment', qty: 4, allocated: 3, used: 3, unit: 'nos.', status: 'In Use' },
    { id: 'r8', name: 'Tipper Truck 10 m³', category: 'Vehicles', qty: 6, allocated: 5, used: 5, unit: 'nos.', status: 'In Use' },
    { id: 'r9', name: 'TMT Steel Fe500D', category: 'Materials', qty: 240, allocated: 200, used: 172, unit: 'MT', status: 'Available' },
    { id: 'r10', name: 'Cement OPC 53 Grade', category: 'Materials', qty: 4500, allocated: 4200, used: 3960, unit: 'bags', status: 'Low Stock' },
    { id: 'r11', name: 'Bitumen VG-30', category: 'Materials', qty: 180, allocated: 150, used: 152, unit: 'KL', status: 'Low Stock' },
    { id: 'r12', name: 'River Sand (Zone 1)', category: 'Materials', qty: 1200, allocated: 1000, used: 860, unit: 'm³', status: 'Available' },
    { id: 'r13', name: 'Pickup Van (Site)', category: 'Vehicles', qty: 2, allocated: 2, used: 2, unit: 'nos.', status: 'In Use' },
  ],
  p2: [
    { id: 'r1', name: 'Excavator CAT 320', category: 'Machinery', qty: 2, allocated: 2, used: 2, unit: 'nos.', status: 'In Use' },
    { id: 'r2', name: 'Hydrostatic Pipe Tester', category: 'Equipment', qty: 1, allocated: 1, used: 0, unit: 'no.', status: 'Available' },
    { id: 'r3', name: 'DI Pipe K9 315 mm', category: 'Materials', qty: 9400, allocated: 8200, used: 6980, unit: 'm', status: 'Available' },
    { id: 'r4', name: 'Welding Machine 400A', category: 'Equipment', qty: 3, allocated: 2, used: 2, unit: 'nos.', status: 'In Use' },
    { id: 'r5', name: 'Tipper Truck 10 m³', category: 'Vehicles', qty: 4, allocated: 3, used: 3, unit: 'nos.', status: 'In Use' },
    { id: 'r6', name: 'Concrete Vibrator', category: 'Equipment', qty: 4, allocated: 3, used: 3, unit: 'nos.', status: 'In Use' },
  ],
  p3: [
    { id: 'r1', name: 'Tower Hoist', category: 'Machinery', qty: 2, allocated: 2, used: 2, unit: 'nos.', status: 'In Use' },
    { id: 'r2', name: 'Concrete Pump 38 m boom', category: 'Machinery', qty: 1, allocated: 1, used: 1, unit: 'no.', status: 'In Use' },
    { id: 'r3', name: 'Scaffolding Set', category: 'Equipment', qty: 120, allocated: 110, used: 96, unit: 'sets', status: 'In Use' },
    { id: 'r4', name: 'TMT Steel Fe500D', category: 'Materials', qty: 620, allocated: 560, used: 512, unit: 'MT', status: 'Available' },
    { id: 'r5', name: 'Cement OPC 53 Grade', category: 'Materials', qty: 9800, allocated: 9200, used: 8140, unit: 'bags', status: 'Available' },
    { id: 'r6', name: 'Passenger Hoist', category: 'Machinery', qty: 1, allocated: 1, used: 0, unit: 'no.', status: 'Idle' },
  ],
  p4: [
    { id: 'r1', name: 'Excavator JCB 3DX', category: 'Machinery', qty: 2, allocated: 2, used: 2, unit: 'nos.', status: 'In Use' },
    { id: 'r2', name: 'Box Drain Shutter Set', category: 'Equipment', qty: 12, allocated: 10, used: 10, unit: 'sets', status: 'In Use' },
    { id: 'r3', name: 'RCC Box Segments', category: 'Materials', qty: 340, allocated: 340, used: 336, unit: 'nos.', status: 'Available' },
    { id: 'r4', name: 'Tipper Truck 10 m³', category: 'Vehicles', qty: 3, allocated: 3, used: 2, unit: 'nos.', status: 'In Use' },
    { id: 'r5', name: 'Plate Compactor', category: 'Equipment', qty: 3, allocated: 2, used: 2, unit: 'nos.', status: 'In Use' },
  ],
  p5: [
    { id: 'r1', name: 'Well Sinking Rig', category: 'Machinery', qty: 1, allocated: 1, used: 1, unit: 'no.', status: 'In Use' },
    { id: 'r2', name: '400T Girder Crane', category: 'Machinery', qty: 1, allocated: 1, used: 0, unit: 'no.', status: 'Idle' },
    { id: 'r3', name: 'PSC Girders (22.5 m)', category: 'Materials', qty: 18, allocated: 18, used: 0, unit: 'nos.', status: 'Available' },
    { id: 'r4', name: 'Batching Plant 30 m³/h', category: 'Machinery', qty: 1, allocated: 1, used: 1, unit: 'no.', status: 'In Use' },
    { id: 'r5', name: 'TMT Steel Fe500D', category: 'Materials', qty: 310, allocated: 280, used: 196, unit: 'MT', status: 'Available' },
  ],
  p6: [],
};

// ─── Bills / Invoices ────────────────────────────────────────────────────────

export const INITIAL_INVOICES: Invoice[] = [
  { id: 'i1', no: 'INV-2026-0148', projectId: 'p1', milestone: 'RA Bill 4 — Foundation & Sub-base', amount: 22000000, date: '2026-06-28', status: 'Paid', verification: 'Verified 02 Jul', paidDate: '2026-07-08' },
  { id: 'i2', no: 'INV-2026-0155', projectId: 'p1', milestone: 'RA Bill 5 — Base Course Zone 1', amount: 24500000, date: '2026-07-12', status: 'Paid', verification: 'Verified 16 Jul', paidDate: '2026-07-22' },
  { id: 'i3', no: 'INV-2026-0162', projectId: 'p1', milestone: 'RA Bill 6 — DBM Layer', amount: 23800000, date: '2026-08-05', status: 'Paid', verification: 'Verified 09 Aug', paidDate: '2026-08-15' },
  { id: 'i4', no: 'INV-2026-0170', projectId: 'p3', milestone: 'RA Bill 3 — 3rd Floor Slab', amount: 31000000, date: '2026-08-10', status: 'Paid', verification: 'Verified 18 Aug', paidDate: '2026-08-25' },
  { id: 'i5', no: 'INV-2026-0175', projectId: 'p4', milestone: 'RA Bill 5 — Box Drains W8–9', amount: 11500000, date: '2026-08-18', status: 'Paid', verification: 'Verified 22 Aug', paidDate: '2026-08-30' },
  { id: 'i6', no: 'INV-2026-0179', projectId: 'p1', milestone: 'RA Bill 7 — Structural Zone 1', amount: 21200000, date: '2026-08-20', status: 'Under Verification', verification: 'At DyE table since 24 Aug' },
  { id: 'i7', no: 'INV-2026-0184', projectId: 'p1', milestone: 'RA Bill 7A — Junction Works', amount: 4250000, date: '2026-08-24', status: 'Approved', verification: 'SE approved 08 Sep' },
  { id: 'i8', no: 'INV-2026-0186', projectId: 'p2', milestone: 'RA Bill 4 — Pipe Laying Zone A', amount: 16400000, date: '2026-08-26', status: 'Under Verification', verification: 'At SE office since 30 Aug' },
  { id: 'i9', no: 'INV-2026-0188', projectId: 'p3', milestone: 'RA Bill 4 — Slab & MEP Start', amount: 28600000, date: '2026-08-29', status: 'Submitted', verification: 'Pending DyE check' },
  { id: 'i10', no: 'INV-2026-0191', projectId: 'p2', milestone: 'RA Bill 5 — Zone B Start', amount: 14200000, date: '2026-09-02', status: 'Approved', verification: 'SE approved 09 Sep' },
  { id: 'i11', no: 'INV-2026-0192', projectId: 'p4', milestone: 'RA Bill 6 — Boxing Complete', amount: 10200000, date: '2026-09-03', status: 'Approved', verification: 'Approved 09 Sep' },
  { id: 'i12', no: 'INV-2026-0193', projectId: 'p1', milestone: 'RA Bill 8 — Structural Zone 2', amount: 18400000, date: '2026-09-08', status: 'Submitted', verification: 'Awaiting DyE' },
  { id: 'i13', no: 'INV-2026-0151', projectId: 'p5', milestone: 'RA Bill 2 — Piers 1–2', amount: 9500000, date: '2026-07-08', status: 'Rejected', verification: 'Rejected 20 Jul — BOQ rate mismatch', note: 'Item 4.2 & 4.7 rates did not match BOQ. Corrected bill to be resubmitted.' },
  { id: 'i14', no: 'INV-2026-0195', projectId: 'p2', milestone: 'RA Bill 6 — Zone B Hydro Prep', amount: 15500000, date: '2026-09-10', status: 'Draft' },
];

// ─── Progress reports ────────────────────────────────────────────────────────

export const INITIAL_REPORTS: ProgressReport[] = [
  {
    id: 'rep1',
    projectId: 'p1',
    milestone: 'Foundation & Sub-base',
    progress: 58,
    prevProgress: 51,
    completed: 'Sub-base Zone 1 completed and approved. GSB laying Zone 2 (60%). Culvert extension at CH 3+100 cast.',
    planned: 'DBM layer Zone 1; start structural work Zone 1 median.',
    challenges: '3 days monsoon interruption; aggregate supply delayed by 2 days.',
    photos: ['site-zone1-subbase.jpg', 'culvert-3+100.jpg'],
    docs: ['FDD Reports 31 Aug.pdf'],
    submittedAt: '2026-08-12T17:30:00',
    status: 'Approved',
    reviewerNote: 'Approved by EE on 15 Aug.',
  },
  {
    id: 'rep2',
    projectId: 'p1',
    milestone: 'Foundation & Sub-base',
    progress: 64,
    prevProgress: 58,
    completed: 'DBM Zone 1 (80%). Median work started. Junction 2 excavation complete.',
    planned: 'Complete DBM Zone 1; DBM Zone 2 start.',
    challenges: 'Nil major. Minor downtime for plant maintenance.',
    photos: ['dbm-zone1-paving.jpg'],
    docs: ['Density Test Batch 12.pdf'],
    submittedAt: '2026-08-26T16:10:00',
    status: 'Changes Requested',
    reviewerNote: 'Attach bitumen quality test reports (VG-30 viscosity) with next update — DyE note 28 Aug.',
  },
  {
    id: 'rep3',
    projectId: 'p1',
    milestone: 'Structural Work',
    progress: 72,
    prevProgress: 64,
    completed: 'DBM complete both zones. Kerb & median Zone 1 done. Junction 2 base cast. Structural work 65%.',
    planned: 'Wearing course Zone 1; junction 2 structural completion.',
    challenges: 'Bitumen stock low — procurement in process.',
    photos: ['structural-zone1.jpg', 'junction2-work.jpg', 'kerb-zone1.jpg'],
    docs: ['Layer Test Register Sep.pdf', 'MB Extract Aug.pdf'],
    submittedAt: '2026-09-05T18:45:00',
    status: 'Under Government Review',
  },
  {
    id: 'rep4',
    projectId: 'p4',
    milestone: 'Drain Wards 8–11',
    progress: 88,
    prevProgress: 82,
    completed: 'RCC boxing complete all wards. Catch-basin 300/320 cast. Restoration survey done.',
    planned: 'Road restoration 1.2 km; final inspection prep.',
    challenges: 'Nil.',
    photos: ['boxing-ward10.jpg', 'catch-basins.jpg'],
    docs: ['MB Extract Sep.pdf'],
    submittedAt: '2026-09-06T17:20:00',
    status: 'Approved',
    reviewerNote: 'Approved by City Engineer 08 Sep.',
  },
  {
    id: 'rep5',
    projectId: 'p2',
    milestone: 'Pipe Laying Zone B',
    progress: 45,
    prevProgress: 40,
    completed: 'Zone B pipe laying 100% (7.1 km). Backfilling 70%. Hydro test prep started.',
    planned: 'Zone B hydro test; ESR foundation excavation.',
    challenges: 'Utility shifting approval delayed 3 days on College Road.',
    photos: ['pipe-zone-b.jpg'],
    docs: ['Laying Log Zone B.pdf'],
    submittedAt: '2026-09-02T17:00:00',
    status: 'Submitted',
  },
];

// ─── Messages ────────────────────────────────────────────────────────────────

export const INITIAL_MESSAGES: Record<string, Message[]> = {
  p1: [
    {
      id: 'm1',
      projectId: 'p1',
      dir: 'in',
      from: 'Er. Anil Deshmukh',
      role: 'Executive Engineer, PWD Pune',
      subject: 'Pre-inspection notice — Structural Work, 15 Sep 2026',
      type: 'Notice',
      body: 'Inspection of structural works (Zone 1) is scheduled on 15 Sep 2026 at 10:30 hrs. Ensure layer thickness records, cube test reports and MB entries up to date are available at site. Contractor representative must accompany.',
      ts: '2026-09-08T10:15:00',
      ref: 'PWD/PN/2026-27/1187',
      status: 'Read',
    },
    {
      id: 'm2',
      projectId: 'p1',
      dir: 'out',
      from: 'Balaji Infraprojects Pvt. Ltd.',
      role: 'Contractor',
      subject: 'Clarification — wearing course specification at Junction 2',
      type: 'Clarification',
      body: 'Requested clarification on wearing course specification at Junction 2 approach — standard VG-30 or modified binder as per Item 401. Site team planning procurement this week; early confirmation requested.',
      ts: '2026-09-08T12:40:00',
      ref: 'BIP/PN/2026-27/0231',
      status: 'Read',
      attachments: ['Junction2_layout.pdf'],
    },
    {
      id: 'm3',
      projectId: 'p1',
      dir: 'in',
      from: 'Er. Anil Deshmukh',
      role: 'Executive Engineer, PWD Pune',
      subject: 'Re: Clarification — wearing course specification',
      type: 'Response',
      body: 'Wearing course to follow MoRTH Section 401 with VG-30. At junction approaches, use modified binder (CRMB 55) as approved in the gang proposal. Proceed accordingly and include test certificates with RA Bill 8.',
      ts: '2026-09-09T09:05:00',
      ref: 'PWD/PN/2026-27/1194',
      status: 'Read',
    },
    {
      id: 'm4',
      projectId: 'p1',
      dir: 'in',
      from: 'Office of the Superintending Engineer',
      role: 'SE Circle, PWD Pune',
      subject: 'Progress review meeting — 17 Sep 2026, 11:00 hrs',
      type: 'Meeting',
      body: 'Monthly progress review for road works will be held at SE Office, Pune on 17 Sep 2026 at 11:00 hrs. Bring updated Bar Chart, MB abstracts and bill verification status.',
      ts: '2026-09-10T11:20:00',
      ref: 'PWD/SE/2026-27/0342',
      status: 'Read',
    },
  ],
  p3: [
    {
      id: 'm1',
      projectId: 'p3',
      dir: 'out',
      from: 'Balaji Infraprojects Pvt. Ltd.',
      role: 'Contractor',
      subject: 'Follow-up — payment status INV-2026-0170 (₹3.10 Cr)',
      type: 'Request',
      body: 'Requested status update on RA Bill 3 payment submitted 10 Aug 2026. Expenditure on MEP mobilization is in progress; early release requested.',
      ts: '2026-09-02T10:30:00',
      ref: 'BIP/AUG/2026-27/0227',
      status: 'Read',
    },
    {
      id: 'm2',
      projectId: 'p3',
      dir: 'in',
      from: 'Er. Prakash Jadhav',
      role: 'Executive Engineer, PHD Circle',
      subject: 'Re: Follow-up — payment status INV-2026-0170',
      type: 'Response',
      body: 'Bill approved by SE office on 18 Aug. Payment is processing in the current treasury cycle; expected release by 25 Sep 2026. Kindly continue works as per schedule.',
      ts: '2026-09-03T15:45:00',
      ref: 'PHD/AUG/2026-27/0891',
      status: 'Read',
    },
  ],
  p5: [
    {
      id: 'm1',
      projectId: 'p5',
      dir: 'in',
      from: 'Er. Nitin Raut',
      role: 'Executive Engineer, ZP Gondia',
      subject: 'Show cause — progress shortfall on Bagh River Bridge',
      type: 'Notice',
      body: 'Physical progress is 34% against 52% planned. Reasons cited: land handover delay (23 days, Jan) and monsoon. Submit detailed recovery plan with revised milestones, crane mobilization proof for girder launch, and current status report on or before 16 Sep 2026, failing which action as per contract clause 18 will be initiated.',
      ts: '2026-09-09T12:00:00',
      ref: 'ZP/GD/2026-27/0534',
      status: 'Action Required',
    },
  ],
};

// ─── Documents (uploaded/default per project) ────────────────────────────────

export const INITIAL_DOCS: Record<string, ProjectDoc[]> = {
  p1: [
    { id: 'd1', name: 'Work Order WO-PWD-PN-1042.pdf', type: 'Contract', size: '1.2 MB', uploaded: '2026-02-05', by: 'PWD Pune' },
    { id: 'd2', name: 'BOQ_Amended_V3.xlsx', type: 'BOQ', size: '480 KB', uploaded: '2026-02-10', by: 'PWD Pune' },
    { id: 'd3', name: 'Approved_Drawings_Zone1-3.pdf', type: 'Drawing', size: '8.4 MB', uploaded: '2026-02-20', by: 'PWD Pune' },
    { id: 'd4', name: 'CAR_Insurance_Policy_2026.pdf', type: 'Insurance', size: '760 KB', uploaded: '2026-02-05', by: 'Balaji Infraprojects' },
    { id: 'd5', name: 'Layer_Test_Register_Sep.pdf', type: 'QA Report', size: '2.1 MB', uploaded: '2026-09-05', by: 'Balaji Infraprojects' },
  ],
  p2: [
    { id: 'd1', name: 'Work Order MJP-NSK-0389.pdf', type: 'Contract', size: '1.0 MB', uploaded: '2026-04-01', by: 'MJP Nashik' },
    { id: 'd2', name: 'Pipe_Laying_Drawings_Rev2.pdf', type: 'Drawing', size: '5.2 MB', uploaded: '2026-04-18', by: 'MJP Nashik' },
    { id: 'd3', name: 'Hydro_Test_Protocol.pdf', type: 'QA Report', size: '340 KB', uploaded: '2026-06-02', by: 'Balaji Infraprojects' },
  ],
  p3: [
    { id: 'd1', name: 'Work Order PHD-AUG-0721.pdf', type: 'Contract', size: '1.4 MB', uploaded: '2025-09-15', by: 'PHD Circle' },
    { id: 'd2', name: 'Structural_GA_Drawings.pdf', type: 'Drawing', size: '12.6 MB', uploaded: '2025-10-02', by: 'PHD Circle' },
    { id: 'd3', name: 'Fire_NOC_Application.pdf', type: 'Compliance', size: '620 KB', uploaded: '2026-09-01', by: 'Balaji Infraprojects' },
  ],
  p4: [
    { id: 'd1', name: 'Work Order KMC-UD-0156.pdf', type: 'Contract', size: '0.9 MB', uploaded: '2026-03-10', by: 'KMC' },
    { id: 'd2', name: 'Box_Drain_GA_Wards8-11.pdf', type: 'Drawing', size: '4.1 MB', uploaded: '2026-03-20', by: 'KMC' },
  ],
  p5: [
    { id: 'd1', name: 'Work Order ZP-GD-0918.pdf', type: 'Contract', size: '1.1 MB', uploaded: '2025-11-20', by: 'ZP Gondia' },
    { id: 'd2', name: 'Girder_Launch_Method_Statement.pdf', type: 'QA Report', size: '3.8 MB', uploaded: '2026-06-28', by: 'Balaji Infraprojects' },
    { id: 'd3', name: 'Revised_Recovery_Plan_Draft.docx', type: 'Plan', size: '220 KB', uploaded: '2026-09-10', by: 'Balaji Infraprojects' },
  ],
  p6: [
    { id: 'd1', name: 'Completion_Certificate.pdf', type: 'Contract', size: '820 KB', uploaded: '2026-02-20', by: 'PWD Amravati' },
  ],
};

// ─── Notifications ───────────────────────────────────────────────────────────

export const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 'n1', category: 'Finance', title: 'Payment Approved', body: 'RA Bill 7A — Junction Works approved by SE office. Expected release 18 Sep 2026.', project: 'Pune Road Development', amount: '₹ 42.5 Lakh', time: '2026-09-10T09:40:00', read: false, link: '/projects/p1/finance' },
  { id: 'n2', category: 'Inspection', title: 'Inspection Scheduled', body: 'Structural Work (Zone 1) inspection on 15 September 2026, 10:30 hrs by Er. Anil Deshmukh (EE).', project: 'Pune Road Development', time: '2026-09-08T10:15:00', read: false, link: '/projects/p1/inspection' },
  { id: 'n3', category: 'Compliance', title: 'Document Expiring', body: 'CAR Insurance Certificate expires on 22 September 2026. Initiate renewal to avoid inspection objections.', project: 'Pune Road Development', time: '2026-09-10T08:00:00', read: false, link: '/projects/p1/inspection' },
  { id: 'n4', category: 'Tender', title: 'Tender Submission Deadline', body: 'NH-548C Widening (PWD Satara) closes on 28 September 2026, 17:00 hrs. Bid readiness is 78%.', project: 'Tender PWD/TA/0447', time: '2026-09-09T16:00:00', read: false, link: '/tenders/t1' },
  { id: 'n5', category: 'Government', title: 'Show-cause Notice Received', body: 'Progress shortfall notice on Bagh River Bridge. Response required by 16 September 2026.', project: 'Rural Bridge Construction', time: '2026-09-09T12:00:00', read: false, link: '/projects/p5/communication' },
  { id: 'n6', category: 'AI Alerts', title: 'Resource Shortage Predicted', body: 'AI predicts skilled mason & MEP technician shortfall of 12 from 20 Sep on hospital project.', project: 'District Hospital Expansion', time: '2026-09-09T07:30:00', read: false, link: '/projects/p3/ai-analysis' },
  { id: 'n7', category: 'Project', title: 'Milestone Completed', body: 'Pipe laying Zone B marked 100%. Hydro test scheduled 28 Sep.', project: 'Municipal Water Pipeline Upgrade', time: '2026-09-02T17:30:00', read: true, link: '/projects/p2/details' },
  { id: 'n8', category: 'Finance', title: 'Bill Under Verification', body: 'INV-2026-0179 (₹2.12 Cr) is at DyE table since 24 Aug. Follow-up recommended.', project: 'Pune Road Development', amount: '₹ 2.12 Cr', time: '2026-08-24T11:00:00', read: true, link: '/projects/p1/bills' },
  { id: 'n9', category: 'Project', title: 'Progress Update Approved', body: 'Weekly update approved by City Engineer. 88% complete, ahead of plan.', project: 'Urban Drainage Improvement', time: '2026-09-08T10:05:00', read: true, link: '/projects/p4/update' },
  { id: 'n10', category: 'Government', title: 'Meeting Scheduled', body: 'Monthly progress review at SE Office, Pune on 17 Sep 2026, 11:00 hrs.', project: 'Pune Road Development', time: '2026-09-10T11:20:00', read: true, link: '/projects/p1/communication' },
  { id: 'n11', category: 'AI Alerts', title: 'AI Forecast Updated', body: 'Predicted completion moved to 24 Oct 2026 — 11 days earlier than contract deadline.', project: 'Pune Road Development', time: '2026-09-07T06:00:00', read: true, link: '/projects/p1/ai-completion' },
  { id: 'n12', category: 'Compliance', title: 'Labour License Renewed', body: 'Contract labour license renewed for District Hospital Expansion — valid to Mar 2027.', project: 'District Hospital Expansion', time: '2026-08-30T14:00:00', read: true, link: '/projects/p3/inspection' },
];

// ─── Calendar ────────────────────────────────────────────────────────────────

export const CALENDAR_EVENTS: CalendarEvent[] = [
  { date: '2026-09-15', title: 'Inspection — Structural Work Zone 1 (p1)', type: 'Inspection', time: '10:30', link: '/projects/p1/inspection' },
  { date: '2026-09-16', title: 'Show-cause response due — ZP Gondia', type: 'Government', link: '/projects/p5/communication' },
  { date: '2026-09-17', title: 'Progress review meeting — SE Office Pune', type: 'Government', time: '11:00', link: '/projects/p1/communication' },
  { date: '2026-09-18', title: 'Insurance renewal target (CAR policy)', type: 'Compliance', link: '/projects/p1/inspection' },
  { date: '2026-09-19', title: 'Road restoration start review (p4)', type: 'Inspection', time: '09:30', link: '/projects/p4/inspection' },
  { date: '2026-09-20', title: 'Expected payment — INV-2026-0192 (₹1.02 Cr)', type: 'Payment', link: '/projects/p4/finance' },
  { date: '2026-09-22', title: 'CAR Insurance expires (p1)', type: 'Compliance', link: '/projects/p1/inspection' },
  { date: '2026-09-25', title: 'DG stack emission test due (p3)', type: 'Compliance', link: '/projects/p3/inspection' },
  { date: '2026-09-28', title: 'Tender closes — NH-548C Satara (₹42.30 Cr)', type: 'Tender', time: '17:00', link: '/tenders/t1' },
  { date: '2026-09-28', title: 'Hydro test witness — Zone B (p2)', type: 'Inspection', time: '15:00', link: '/projects/p2/inspection' },
  { date: '2026-09-30', title: 'Tender closes — PMGSY-IV Nashik (₹11.75 Cr)', type: 'Tender', link: '/tenders/t6' },
  { date: '2026-09-30', title: 'Layer-2 review inspection (p1)', type: 'Inspection', time: '11:00', link: '/projects/p1/inspection' },
  { date: '2026-10-02', title: 'Tender closes — Storm Water Drains Kolhapur', type: 'Tender', link: '/tenders/t4' },
  { date: '2026-10-05', title: 'Tender closes — Water Supply Scheme Solapur', type: 'Tender', link: '/tenders/t3' },
  { date: '2026-10-05', title: 'Expected payment — INV-2026-0191 (₹1.42 Cr)', type: 'Payment', link: '/projects/p2/finance' },
  { date: '2026-10-12', title: 'Tender closes — Sub-District Hospital Latur', type: 'Tender', link: '/tenders/t2' },
  { date: '2026-10-15', title: 'RA Bill 9 target submission (p1)', type: 'Payment', link: '/projects/p1/bills' },
  { date: '2026-10-18', title: 'Handover — Urban Drainage (p4)', type: 'Project', link: '/projects/p4/details' },
  { date: '2026-10-20', title: 'MEP progress review (p3)', type: 'Inspection', time: '10:00', link: '/projects/p3/inspection' },
  { date: '2026-10-24', title: 'AI predicted completion — Pune Road (11 days early)', type: 'Project', link: '/projects/p1/ai-completion' },
  { date: '2026-10-25', title: 'Tender closes — Polytechnic Academic Block Pune', type: 'Tender', link: '/tenders/t7' },
  { date: '2026-11-05', title: 'Contract completion — Pune Road Development', type: 'Project', link: '/projects/p1/details' },
  { date: '2026-11-30', title: 'Contract deadline — District Hospital Expansion', type: 'Project', link: '/projects/p3/details' },
];

// ─── Tenders ─────────────────────────────────────────────────────────────────

export const TENDERS: Tender[] = [
  {
    id: 't1',
    code: 'PWD/TA/2026-27/0447',
    title: 'Widening & Strengthening of Satara–Karad Road (NH-548C), Km 12–38',
    department: 'PWD Satara',
    location: 'Satara',
    value: 42.3,
    deadline: '2026-09-28',
    emd: 8460000, // ₹ 84.6 L
    category: 'Roads & Highways',
    durationMonths: 18,
    opened: '2026-09-01',
    preBid: '2026-09-16',
    status: 'Open',
    summary:
      'AI Summary: 26 km widening to 4-lane with paved shoulders, 11 cross-drainage structures, 2 bus-bay pairs and junction improvement at Umbraj. Key risks: monsoon working window and crushed-aggregate haul distance of 42 km. Values our profile: Class-A eligible, 4 similar road works in last 7 years (largest ₹31.2 Cr) — comfortably above the 40% value requirement. Plant requirement (paver, batch plant, 2 rollers) is already owned. Watch-outs: bid security 3% and 5-year defect liability with performance guarantee.',
    scopePoints: [
      'Widening to 4-lane with paved shoulders (26 km)',
      '11 CD structures: slab bridges, box culverts & causeways',
      '2 bus-bay pairs with shelters and lighting',
      'Junction improvement at Umbraj with signals & road marking',
      '5-year defect liability with performance guarantee',
    ],
    eligibility: {
      label: 'Registration & Financial',
      required:
        'Class-A PWD contractor; avg annual turnover ≥ ₹25 Cr (last 3 FY); financial bid capacity ≥ tender value; 3 similar works ≥ 40% of tender value in last 7 years.',
    },
    techReq: [
      'MoRTH Section 400/500 paving with DBM + BC, specified mix designs',
      'Paver with automatic screed; 2 vibratory rollers minimum',
      'On-site bitumen heating & storage with temperature logs',
      'Third-party QC testing at NABL lab every 500 m of lane',
      'GPS-fitted tippers; weighbridge tickets for all material receipts',
    ],
    finReq: [
      'EMD: ₹84.60 L (online / BG valid 180 days)',
      'Bid security on award: 3% of bid value (performance guarantee)',
      'Price escalation: applicable as per PWD index from 91st day',
      'Payment terms: monthly RA bills; 21-day verification SLA after DyE check',
    ],
    docs: ['Tender Document (Vol 1–3)', 'BOQ (Excel)', 'Drawings Set A–D', 'Special Conditions', 'MoRTH Specs Extract'],
    timeline: [
      { label: 'Tender Published', date: '2026-09-01' },
      { label: 'Pre-bid Meeting', date: '2026-09-16' },
      { label: 'Query Deadline', date: '2026-09-21' },
      { label: 'Submission Deadline', date: '2026-09-28' },
      { label: 'Technical Bid Opening', date: '2026-10-01' },
      { label: 'Financial Bid Opening', date: '2026-10-08' },
      { label: 'Award (Expected)', date: '2026-10-20' },
    ],
    contact: { name: 'Er. V. R. Shinde', role: 'Executive Engineer, PWD Satara', phone: '+91 2162 232 410', email: 'ee.pwd.satara@mahapwd.gov.in' },
  },
  {
    id: 't2',
    code: 'PHD/LT/2026-27/0213',
    title: 'Construction of 50-bed Sub-District Hospital Block, Latur',
    department: 'Public Health Department',
    location: 'Latur',
    value: 28.9,
    deadline: '2026-10-12',
    emd: 57.8,
    category: 'Buildings',
    durationMonths: 16,
    opened: '2026-09-10',
    preBid: '2026-09-24',
    status: 'Open',
    summary:
      'AI Summary: G+2 hospital block (50 beds) with OT, labour room, CSSD and staff quarters. Structural scope suits our team — similar district hospital wing at ₹32.75 Cr is 58% complete. MEP and medical-gas piping needs a specialist subcontractor (budget ~11%). Department supplies medical equipment; civil interface coordination is a past strength (2 fire/oxygen pipeline inspections passed).',
    scopePoints: [
      'G+2 RCC block — 50 beds with nurse stations',
      'Modular OT, labour room, CSSD with medical gas piping',
      'Electrical, HVAC & lift (1 no.) coordination scope',
      'Internal roads, parking & STP of 20 KLD',
      '12-month defect liability with DLP insurance',
    ],
    eligibility: {
      label: 'Registration & Experience',
      required: 'Class-A / Special class contractor; 1 hospital or institutional building ≥ ₹12 Cr completed in last 7 years; turnover ≥ ₹18 Cr avg.',
    },
    techReq: [
      'CPWD/PWD specifications with third-party QA agency (IIT/NIT empanelled)',
      'Concrete mix designs approved before each pour; cube testing per IS 456',
      'Medical gas piping by certified installer with pressure test records',
      'Seismic zone-III detailing with third-party proof-check for structure',
    ],
    finReq: [
      'EMD: ₹57.80 L',
      'Bid security 3% on award; 10% retention up to DLP',
      'Escalation: fixed-price for civil; market index for steel/cement beyond ±5%',
      'Payment: monthly RA bills; material at site counts at 75%',
    ],
    docs: ['Tender Document', 'BOQ', 'Architectural & Structural Drawings', 'Services (MEP) Notes'],
    timeline: [
      { label: 'Tender Published', date: '2026-09-10' },
      { label: 'Pre-bid Meeting', date: '2026-09-24' },
      { label: 'Submission Deadline', date: '2026-10-12' },
      { label: 'Bid Opening', date: '2026-10-15' },
      { label: 'Award (Expected)', date: '2026-11-02' },
    ],
    contact: { name: 'Er. S. R. Chavan', role: 'Executive Engineer, PHD Latur', phone: '+91 2382 254 310', email: 'ee.phd.latur@mahaphd.gov.in' },
  },
  {
    id: 't3',
    code: 'MJP/WS/2026-27/0918',
    title: 'Regional Water Supply Scheme Phase-II — Solapur Cluster',
    department: 'Maharashtra Jeevan Pradhikaran',
    location: 'Solapur',
    value: 35.6,
    deadline: '2026-10-05',
    emd: 71.2,
    category: 'Water Supply',
    durationMonths: 20,
    opened: '2026-08-25',
    preBid: '2026-09-12',
    status: 'Open',
    summary:
      'AI Summary: 48 km transmission main (DI/MS), 3 ESRs, 2 pump houses with electromechanical supply-and-install scope. Our active Nashik water scheme provides direct experience with DI K9 laying and hydro testing. Electromechanical (pump-motor) portion (~18%) requires an approved OEM partner — shortlist Kirloskar/Grundfos channel partner before bid.',
    scopePoints: [
      '48 km transmission & distribution mains (DI K9 / MS)',
      '3 ESRs — 15 LL, 10 LL, 8 LL with pump rooms',
      '2 pump houses with electromechanical supply & install',
      'SCADA-ready flow meters and pressure logging',
      '24-month O&M support scope',
    ],
    eligibility: {
      label: 'Registration & Similar Works',
      required: 'MJP Class-1 (or PWD Class-A with MJP revalidation); 2 water supply schemes ≥ ₹15 Cr in last 7 years; turnover ≥ ₹22 Cr avg.',
    },
    techReq: [
      'DI K9 / MS pipe laying per IS 8329; hydro test at 1.5× working pressure',
      'Electromechanical via OEM or authorized partner with commissioning support',
      'Survey with DGPS; as-built drawings in GIS format',
      'Disinfection & bacteriological testing before commissioning',
    ],
    finReq: [
      'EMD: ₹71.20 L',
      'Bid security 3%; retention 5% released after O&M entry',
      'Payment: RA bills + 90% on commissioning of each stage',
      'Price variation clause applicable on steel & pumps',
    ],
    docs: ['Tender Document Vol 1–2', 'BOQ', 'Hydraulic Drawings', 'Electromechanical Schedule'],
    timeline: [
      { label: 'Tender Published', date: '2026-08-25' },
      { label: 'Pre-bid Meeting', date: '2026-09-12' },
      { label: 'Submission Deadline', date: '2026-10-05' },
      { label: 'Bid Opening', date: '2026-10-08' },
      { label: 'Award (Expected)', date: '2026-10-28' },
    ],
    contact: { name: 'Er. M. V. Jagtap', role: 'Executive Engineer, MJP Solapur', phone: '+91 217 2730 145', email: 'ee.solapur@mjp.gov.in' },
  },
  {
    id: 't4',
    code: 'KMC/UD/2026-27/0302',
    title: 'Storm Water Drainage Network — Wards 12–18, Kolhapur',
    department: 'Kolhapur Municipal Corporation',
    location: 'Kolhapur',
    value: 15.2,
    deadline: '2026-10-02',
    emd: 30.4,
    category: 'Drainage',
    durationMonths: 10,
    opened: '2026-09-05',
    preBid: '2026-09-18',
    status: 'Open',
    summary:
      'AI Summary: 9.2 km RCC box/pipe drains across 7 flood-prone wards with 410 catch-basins and road restoration. Directly comparable with our running KMC ward 4–11 works (88%, ahead of schedule) — strong city-engineer record is a technical-evaluation advantage. Restoration after monsoon requires early hot-mix booking.',
    scopePoints: [
      '9.2 km RCC box & pipe storm drains',
      '410 catch-basins with heavy-duty gratings',
      'Cross connections to 2 existing pumping stations',
      'Full-width road restoration with hot-mix',
      'Pre-monsoon readiness demo before 15 May 2027',
    ],
    eligibility: {
      label: 'Registration & Experience',
      required: 'Special/Municipal class contractor registered with KMC; 2 similar drainage works ≥ ₹6 Cr in last 5 years; turnover ≥ ₹10 Cr avg.',
    },
    techReq: [
      'M-30 concrete for box drains with cover blocks per drawing',
      'De-watering during excavation; silt disposal at approved site',
      'Restoration compaction with plate compactor + FDD records',
      'Daily site diary countersigned by ward engineer',
    ],
    finReq: [
      'EMD: ₹30.40 L',
      'Bid security 3%; retention 5%',
      'Payment: monthly RA bills; restoration included in item rates',
      'No escalation for works completed within 10 months',
    ],
    docs: ['Tender Document', 'BOQ', 'Drain Layout Wards 12–18'],
    timeline: [
      { label: 'Tender Published', date: '2026-09-05' },
      { label: 'Pre-bid Meeting', date: '2026-09-18' },
      { label: 'Submission Deadline', date: '2026-10-02' },
      { label: 'Bid Opening', date: '2026-10-06' },
      { label: 'Award (Expected)', date: '2026-10-18' },
    ],
    contact: { name: 'Er. Meena Kulkarni', role: 'City Engineer, KMC', phone: '+91 231 2652 300', email: 'cityengineer@kmcmaharashtra.gov.in' },
  },
  {
    id: 't5',
    code: 'MMRDA/FB/2026-27/0071',
    title: 'Flyover at Thane–Ghodbunder Junction (Package 2)',
    department: 'MMRDA',
    location: 'Thane',
    value: 86.4,
    deadline: '2026-11-20',
    emd: 172.8,
    category: 'Bridges',
    durationMonths: 30,
    opened: '2026-10-20',
    preBid: '2026-11-05',
    status: 'Open',
    summary:
      'AI Summary: 1.8 km elevated corridor with 2 ROB spans — technically prestigious but outside our current bid capacity: requires avg turnover ≥ ₹120 Cr (ours ₹68.4 Cr). Recommend partnering as execution joint-venture member instead of lead bidder.',
    scopePoints: [
      '1.8 km 4-lane flyover with 2 major spans',
      'Piling (1200 mm dia) 96 nos. with integrity testing',
      'Precast segmental superstructure with launchers',
      'Utilities diversion and 3 junction modifications',
    ],
    eligibility: {
      label: 'Financial Capacity',
      required: 'Avg annual turnover ≥ ₹120 Cr (last 3 FY); single similar work ≥ ₹60 Cr; net worth ≥ ₹40 Cr.',
    },
    techReq: [
      'IRC-based segmental precast with post-tensioning specialist',
      'Independent proof consultant for staging & launching',
      'Traffic diversion plan approved by Thane Traffic Police',
    ],
    finReq: ['EMD: ₹172.80 L', 'Bid security 3%; additional PG 5% on award', 'Payment: milestone-linked (foundation/superstructure/deck)'],
    docs: ['Tender Document Vol 1–4', 'BOQ', 'GAD & Foundation Drawings'],
    timeline: [
      { label: 'Tender Published', date: '2026-10-20' },
      { label: 'Pre-bid Meeting', date: '2026-11-05' },
      { label: 'Submission Deadline', date: '2026-11-20' },
      { label: 'Bid Opening', date: '2026-11-25' },
    ],
    contact: { name: 'Er. P. S. Nair', role: 'Deputy Engineer, MMRDA', phone: '+91 22 2580 1200', email: 'de.mmrdafb@mmrda.maharashtra.gov.in' },
  },
  {
    id: 't6',
    code: 'ZP/PMGSY/2026-27/0288',
    title: 'Upgradation of 14 Rural Roads under PMGSY-IV, Nashik',
    department: 'Zilla Parishad Nashik',
    location: 'Nashik',
    value: 11.75,
    deadline: '2026-09-30',
    emd: 23.5,
    category: 'Rural Roads',
    durationMonths: 12,
    opened: '2026-09-02',
    preBid: '2026-09-15',
    status: 'Open',
    summary:
      'AI Summary: 54 km BT upgradation across 14 stretches under PMGSY-IV. Low complexity, strong fit with our plant base near Nashik (active water scheme site). PMGSY documentation (OMMS entries) is the main compliance overhead; our PMGSY experience from 2021 helps.',
    scopePoints: [
      '54 km BT road upgradation across 14 stretches',
      'Cross-drainage repairs: 26 structures',
      'Road safety furniture & km stones',
      '5-year maintenance with OMMS reporting',
    ],
    eligibility: {
      label: 'Registration & Experience',
      required: 'ZP Class-1 / PWD Class-A; 2 rural/BT road works ≥ ₹4 Cr in last 5 years; turnover ≥ ₹7 Cr avg.',
    },
    techReq: [
      'Grading & compaction per MoRTH rural road spec',
      'Prime coat + tack coat with temperature records',
      'OMMS progress entries every fortnight',
    ],
    finReq: ['EMD: ₹23.50 L', 'Bid security 3%; retention 5% for 5-year maintenance', 'Payment: per-stretch completion linked 40% + RA bills'],
    docs: ['Tender Document', 'BOQ', 'Stretch-wise Annexures'],
    timeline: [
      { label: 'Tender Published', date: '2026-09-02' },
      { label: 'Pre-bid Meeting', date: '2026-09-15' },
      { label: 'Submission Deadline', date: '2026-09-30' },
      { label: 'Bid Opening', date: '2026-10-03' },
      { label: 'Award (Expected)', date: '2026-10-15' },
    ],
    contact: { name: 'Er. B. S. Aher', role: 'Executive Engineer, ZP Nashik', phone: '+91 253 2570 233', email: 'ee.zp.nashik@mahazp.gov.in' },
  },
  {
    id: 't7',
    code: 'DTE/EDU/2026-27/0119',
    title: 'Academic Block & Workshops — Govt. Polytechnic, Pune',
    department: 'Directorate of Technical Education',
    location: 'Pune',
    value: 22.4,
    deadline: '2026-10-25',
    emd: 44.8,
    category: 'Buildings',
    durationMonths: 18,
    opened: '2026-09-18',
    preBid: '2026-10-02',
    status: 'Open',
    summary:
      'AI Summary: G+4 academic block with workshop sheds and campus development. School complex (₹6.8 Cr, on-time) and hospital wing provide institutional building references. Workshop sheds need light-gauge steel trusses — quote via approved fabricator. Site is 12 km from our Pune yard — logistics advantage.',
    scopePoints: [
      'G+4 academic block — 32 classrooms & labs',
      'Workshop sheds with LG steel trusses (2 nos.)',
      'Campus development, internal roads & drainage',
      'Rainwater harvesting & solar-ready conduit',
    ],
    eligibility: {
      label: 'Registration & Experience',
      required: 'PWD Class-A; 2 educational/institutional buildings ≥ ₹8 Cr in last 7 years; turnover ≥ ₹14 Cr avg.',
    },
    techReq: [
      'RCC frame with seismic detailing as per IS 1893',
      'Third-party structural proof-check before execution',
      'Fire-fighting system per NBC with hydrant layout',
      'Lift (2 nos.) coordination with OEM',
    ],
    finReq: ['EMD: ₹44.80 L', 'Bid security 3%; retention 5%', 'Payment: monthly RA bills; 10% material at site rate'],
    docs: ['Tender Document', 'BOQ', 'Architectural Drawings', 'Structural Notes'],
    timeline: [
      { label: 'Tender Published', date: '2026-09-18' },
      { label: 'Pre-bid Meeting', date: '2026-10-02' },
      { label: 'Submission Deadline', date: '2026-10-25' },
      { label: 'Bid Opening', date: '2026-10-28' },
      { label: 'Award (Expected)', date: '2026-11-14' },
    ],
    contact: { name: 'Er. R. M. Deshpande', role: 'Project Engineer, DTE Pune', phone: '+91 20 2560 1105', email: 'pe.dte.pune@dtemaharashtra.gov.in' },
  },
];

export const INITIAL_BIDS: Record<string, Bid> = {
  t1: { tenderId: 't1', status: 'Draft', step: 3, updatedAt: '2026-09-09T18:30:00', data: {} },
  t3: { tenderId: 't3', status: 'Submitted', step: 7, updatedAt: '2026-09-04T16:20:00', ref: 'NRK-BID-2026-0312', submittedAt: '2026-09-04T16:20:00', bidValue: 348900000, data: {} },
  t6: { tenderId: 't6', status: 'Submitted', step: 7, updatedAt: '2026-09-08T15:45:00', ref: 'NRK-BID-2026-0318', submittedAt: '2026-09-08T15:45:00', bidValue: 112100000, data: {} },
};

export const PAST_BIDS: PastBid[] = [
  { id: 'pb1', tender: 'Ring Road Package-3, Nagpur', department: 'PWD Nagpur', year: '2025', value: 31.2, outcome: 'Lost', detail: 'L1 gap 2.1% — our ₹30.86 Cr vs ₹30.21 Cr' },
  { id: 'pb2', tender: 'Govt. College Building, Amravati', department: 'PWD Amravati', year: '2024', value: 6.6, outcome: 'Awarded', detail: 'Awarded as L1; delivered as Amravati School Complex (p6)' },
  { id: 'pb3', tender: 'Bus Stand Redevelopment, Ahmednagar', department: 'MSRTC / PWD', year: '2025', value: 12.8, outcome: 'Rejected', detail: 'Technical: experience certificate shortfall (1 work < threshold)' },
  { id: 'pb4', tender: 'Check Dam Bundle-2, Yavatmal', department: 'ZP Yavatmal', year: '2024', value: 4.1, outcome: 'Lost', detail: 'L1 gap 0.8% — marginal margin loss' },
];

export const BID_STEPS = ['Company Details', 'Eligibility', 'Technical Proposal', 'Financial Proposal', 'Documents', 'Review', 'Submit'];

// ─── Performance ─────────────────────────────────────────────────────────────

export const PERFORMANCE = {
  score: 87,
  grade: 'A — Reliable Partner',
  percentile: 'Top 12% of 3,412 empanelled contractors',
  breakdown: [
    { label: 'On-Time Completion', value: 91 },
    { label: 'Quality', value: 88 },
    { label: 'Budget Adherence', value: 84 },
    { label: 'Compliance', value: 95 },
    { label: 'Citizen Feedback', value: 86 },
  ],
  trend: {
    labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    values: [82, 84, 83, 85, 86, 87],
    benchmark: [75, 75, 76, 76, 77, 77],
  },
  stats: [
    { label: 'Completion Rate', value: '92%', sub: '22 of 24 contracts' },
    { label: 'Average Delay', value: '8 days', sub: 'across last 6 projects' },
    { label: 'On-time Handovers', value: '5 / 6', sub: 'last 6 contracts' },
    { label: 'Government Rating', value: 'A', sub: 'PWD & MJP evaluation 2026' },
  ],
  history: [
    { name: 'Amravati School Complex', dept: 'SED', value: 6.8, year: '2026', delay: 0, quality: 92, rating: 'A' },
    { name: 'Wardha Road Widening', dept: 'PWD', value: 8.9, year: '2023', delay: 0, quality: 89, rating: 'A' },
    { name: 'Nashik Water Scheme Ph-3', dept: 'MJP', value: 14.2, year: '2022', delay: 6, quality: 87, rating: 'A-' },
    { name: 'Solapur GH Renovation', dept: 'PHD', value: 5.6, year: '2023', delay: 0, quality: 90, rating: 'A' },
    { name: 'Ratnagiri Coastal Repairs', dept: 'PWD RR', value: 3.8, year: '2021', delay: 15, quality: 84, rating: 'B+' },
    { name: 'Pune ZP School Blocks', dept: 'ZP', value: 2.9, year: '2020', delay: 0, quality: 88, rating: 'A' },
  ],
  feedback: [
    { quote: 'Road quality near Baner stretch is excellent. Drainage works completed before monsoon as promised.', source: 'Resident survey, Ward 8, Pune', stars: 4.5 },
    { quote: 'Hospital block construction site was safe, organized, and dust levels were well controlled.', source: 'Zonal office feedback, Aurangabad', stars: 4.0 },
  ],
};

// ─── AI Assist canned answers ────────────────────────────────────────────────

export interface AIAnswer {
  match: string[];
  title: string;
  blocks: { heading?: string; kind: 'text' | 'list' | 'links' | 'actions'; text?: string; items?: { label: string; value?: string; link?: string; tone?: 'ok' | 'warn' | 'bad' | 'info' }[] }[];
}

export const AI_ANSWERS: AIAnswer[] = [
  {
    match: ['risk', 'at risk'],
    title: 'Projects at risk',
    blocks: [
      {
        kind: 'list',
        items: [
          { label: 'Rural Bridge Construction', value: 'HIGH — 18% behind plan; girder crane unconfirmed; show-cause due 16 Sep', link: '/projects/p5/ai-analysis', tone: 'bad' },
          { label: 'District Hospital Expansion', value: 'MEDIUM — 5% behind; MEP teams short by 12 from 20 Sep', link: '/projects/p3/ai-analysis', tone: 'warn' },
          { label: 'Pune Road Development', value: 'LOW-MEDIUM — 6% behind but forecast shows 11-day early finish', link: '/projects/p1/ai-analysis', tone: 'info' },
        ],
      },
      { kind: 'text', text: 'Highest priority is Rural Bridge Construction — the show-cause notice response is due 16 Sep and girder-launch crane availability is the binding constraint.' },
      { kind: 'actions', items: [{ label: 'Open AI Project Analysis — p5', link: '/projects/p5/ai-analysis' }, { label: 'View Government Communication — p5', link: '/projects/p5/communication' }] },
    ],
  },
  {
    match: ['payment', 'pending'],
    title: 'Payments pending',
    blocks: [
      {
        kind: 'list',
        items: [
          { label: 'INV-2026-0184 — Pune Road', value: '₹42.5 L — Approved, release expected 18 Sep', tone: 'ok' },
          { label: 'INV-2026-0191 / 0192', value: '₹1.42 Cr + ₹1.02 Cr — Approved', tone: 'ok' },
          { label: 'INV-2026-0179 — Pune Road', value: '₹2.12 Cr — Under verification since 24 Aug (13 days)', tone: 'warn' },
          { label: 'INV-2026-0186 — Water Pipeline', value: '₹1.64 Cr — Under verification', tone: 'warn' },
          { label: 'INV-2026-0188 — Hospital', value: '₹2.86 Cr — Submitted, pending DyE check', tone: 'info' },
        ],
      },
      { kind: 'text', text: 'Total pending: ₹10.93 Cr across 6 bills. The oldest pending bill (INV-2026-0179) has crossed the 21-day SLA — recommend written follow-up to the EE office today.' },
      { kind: 'actions', items: [{ label: 'Open Bills & Invoices — Pune Road', link: '/projects/p1/bills' }] },
    ],
  },
  {
    match: ['finish', 'earlier', 'early'],
    title: 'Finishing Pune Road Development earlier',
    blocks: [
      { kind: 'text', text: 'AI forecast places completion on 24 Oct 2026 — 11 days before the 05 Nov contract deadline — if the following actions are taken:' },
      { kind: 'list', items: [{ label: 'Increase workforce on structural work by 8–10%', value: '+4 days' }, { label: 'Reallocate roller & paver crew to Zone B', value: '+3 days' }, { label: 'Complete bitumen & cement procurement by 18 Sep', value: '+2 days' }, { label: 'Run finishing prep parallel to structural work', value: '+2 days' }] },
      { kind: 'text', text: 'Potential recovery: 7–11 days. This is an AI estimate based on current productivity trends — not a guaranteed date.' },
      { kind: 'actions', items: [{ label: 'Open AI Completion Prediction', link: '/projects/p1/ai-completion' }] },
    ],
  },
  {
    match: ['eligible', 'tender'],
    title: 'Tenders you are eligible for',
    blocks: [
      {
        kind: 'list',
        items: [
          { label: 'NH-548C Satara (PWD) — ₹42.30 Cr', value: 'Eligible — deadline 28 Sep, readiness 78%', link: '/tenders/t1', tone: 'ok' },
          { label: 'Hospital Block Latur (PHD) — ₹28.90 Cr', value: 'Eligible — deadline 12 Oct', link: '/tenders/t2', tone: 'ok' },
          { label: 'Water Supply Solapur (MJP) — ₹35.60 Cr', value: 'Eligible — needs MJP Class-1 revalidation note', link: '/tenders/t3', tone: 'warn' },
          { label: 'Drainage Kolhapur (KMC) — ₹15.20 Cr', value: 'Eligible — strong local track record', link: '/tenders/t4', tone: 'ok' },
          { label: 'Flyover Thane (MMRDA) — ₹86.40 Cr', value: 'Not eligible — turnover ≥ ₹120 Cr required', link: '/tenders/t5', tone: 'bad' },
        ],
      },
      { kind: 'actions', items: [{ label: 'Open Tender Management', link: '/tenders' }] },
    ],
  },
  {
    match: ['missing', 'document', 'bid'],
    title: 'Missing bid documents — NH-548C Satara (Draft bid)',
    blocks: [
      { kind: 'list', items: [{ label: 'Experience Certificate (similar works)', value: 'Required by eligibility clause 4.2', tone: 'warn' }, { label: 'Equipment Ownership Proof', value: 'Paver & batching plant RC books', tone: 'warn' }] },
      { kind: 'text', text: 'All other documents are on file: PAN, GST, EPF/ESIC, EMD BG template, turnover certificates FY24–26, Class-A registration. Bid readiness is 78%.' },
      { kind: 'actions', items: [{ label: 'Open AI Bid Assist', link: '/tenders/t1/bid/ai-assist' }, { label: 'Continue Bid Submission', link: '/tenders/t1/bid' }] },
    ],
  },
  {
    match: ['delayed', 'why', 'delay'],
    title: 'Why is Rural Bridge Construction delayed?',
    blocks: [
      { kind: 'text', text: 'Three compounding causes detected across the last 6 months:' },
      { kind: 'list', items: [{ label: 'Land handover delay', value: '23 days — Jan 2026, approach section' }, { label: 'Monsoon window', value: 'River works suspended 21 Jun – 05 Sep' }, { label: 'Pier cycle overrun', value: '18 days/pier vs 12 planned — crane & crew constraints' }] },
      { kind: 'text', text: 'Recovery potential is 18–49 days if the 400T crane is booked by 20 Sep and double shifting is applied on pier cap 3. A revised recovery plan must reach ZP Gondia by 16 Sep.' },
      { kind: 'actions', items: [{ label: 'Open AI Project Analysis — p5', link: '/projects/p5/ai-analysis' }, { label: 'Respond to Show-cause', link: '/projects/p5/communication' }] },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const getProject = (id: string) => PROJECTS.find((p) => p.id === id);

function normalizeTender(value: Partial<Tender> | null | undefined): Tender | undefined {
  if (!value?.id) return undefined;

  const text = (input: unknown, fallback = '') =>
    typeof input === 'string' && input.trim() ? input : fallback;
  const list = (input: unknown) =>
    Array.isArray(input) ? input.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())) : [];

  return {
    ...value,
    id: value.id,
    code: text(value.code, 'Tender reference pending'),
    title: text(value.title, 'Untitled tender'),
    department: text(value.department, 'Not specified'),
    location: text(value.location, 'Not specified'),
    value: Number(value.value) || 0,
    deadline: text(value.deadline),
    emd: Number(value.emd) || 0,
    category: text(value.category, 'General works'),
    durationMonths: Number(value.durationMonths) || 0,
    opened: text(value.opened),
    preBid: text(value.preBid),
    status: value.status || 'Open',
    summary: text(value.summary, 'No tender summary was provided.'),
    scopePoints: list(value.scopePoints),
    eligibility: {
      label: text(value.eligibility?.label, 'Eligibility criteria'),
      required: text(value.eligibility?.required, 'Eligibility requirements were not specified.'),
    },
    techReq: list(value.techReq),
    finReq: list(value.finReq),
    docs: list(value.docs),
    timeline: Array.isArray(value.timeline) ? value.timeline : [],
    contact: value.contact || { name: 'Not specified', role: 'Not specified', phone: '', email: '' },
  } as Tender;
}

export const getTender = (id: string) => {
  if (typeof sessionStorage !== 'undefined') {
    const cached = sessionStorage.getItem(`nirikshak:tender:${id}`);
    if (cached) {
      try { return normalizeTender(JSON.parse(cached) as Partial<Tender>); } catch { sessionStorage.removeItem(`nirikshak:tender:${id}`); }
    }
  }
  return normalizeTender(TENDERS.find((t) => t.id === id));
};

export function pendingForProject(projectId: string, invoices: Invoice[]): number {
  return invoices
    .filter((i) => i.projectId === projectId && ['Submitted', 'Under Verification', 'Approved'].includes(i.status))
    .reduce((s, i) => s + i.amount, 0);
}

export function paidForProject(projectId: string, invoices: Invoice[]): number {
  return invoices.filter((i) => i.projectId === projectId && i.status === 'Paid').reduce((s, i) => s + i.amount, 0);
}

