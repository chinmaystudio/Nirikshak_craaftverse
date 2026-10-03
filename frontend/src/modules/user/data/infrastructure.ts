import type { VisionProfile } from "@/types/infrastructure";

export const infrastructureProfiles: VisionProfile[] = [
  {
    key: "urban-road",
    label: "Public Road (Urban)",
    shortLabel: "Road — Ward 12",
    type: "Urban Road",
    confidence: 94,
    description:
      "This appears to be a recently constructed urban road with concrete carriageway, lined drains and footpaths — typical of municipal road improvement works.",
    details: { ageEstimate: "~1 year", usage: "Vehicular & pedestrian", materials: "Concrete (white-topped)" },
    conditionVariants: [
      { label: "Good", observations: [] },
      { label: "Attention Required", observations: ["Surface wear near joints"] }
    ],
    defaultCondition: { label: "Good", observations: [] },
    authority: { organization: "Pune Municipal Corporation", department: "Road Department", contact: "Public Grievance Cell • 1800-11-2026" },
    projectMatch: "sinhgad-road",
    reportCategory: "road-damage"
  },
  {
    key: "pothole-road",
    label: "Damaged Road Surface",
    shortLabel: "Road Damage",
    type: "Road (Damaged Surface)",
    confidence: 92,
    description:
      "The image shows bituminous road surface with an open pothole cluster and edge crumbling — consistent with a surface past its maintenance cycle.",
    details: { ageEstimate: "Surface older than 3 years", usage: "Vehicular", materials: "Bituminous" },
    conditionVariants: null,
    defaultCondition: { label: "Attention Required", observations: ["Potholes", "Edge cracking", "Standing water trace"] },
    authority: { organization: "Pune Municipal Corporation", department: "Road Department", contact: "Public Grievance Cell • 1800-11-2026" },
    projectMatch: "sinhgad-road",
    reportCategory: "pothole"
  },
  {
    key: "metro-viaduct",
    label: "Elevated Transit Viaduct",
    shortLabel: "Metro Viaduct",
    type: "Bridge / Elevated Transit Structure",
    confidence: 96,
    description:
      "This is an elevated rail viaduct on cast-in-situ piers with precast segmental spans — characteristic of an under-construction or operational metro corridor.",
    details: { ageEstimate: "Structure under construction", usage: "Rail transit", materials: "RCC piers, precast segments" },
    conditionVariants: [
      { label: "Good", observations: [] },
      { label: "Attention Required", observations: ["Construction debris near pier base"] }
    ],
    defaultCondition: { label: "Good", observations: [] },
    authority: { organization: "Maharashtra Metro Rail Corporation", department: "MahaMetro Package-4 Site Office", contact: "Site Grievance Line • +91 20 2593 3000" },
    projectMatch: "pune-metro-3",
    reportCategory: "safety-hazard"
  },
  {
    key: "storm-drain",
    label: "Storm-Water Drain",
    shortLabel: "Drainage",
    type: "Storm-Water Drain / Culvert",
    confidence: 90,
    description: "This appears to be an RCC storm-water drain with silt traps at the road edge — part of the ward's monsoon drainage network.",
    details: { ageEstimate: "2–4 years", usage: "Storm-water conveyance", materials: "RCC box sections" },
    conditionVariants: null,
    defaultCondition: { label: "Attention Required", observations: ["Silt accumulation", "Partial blockage"] },
    authority: { organization: "Pune Municipal Corporation", department: "Storm Water Department", contact: "Ward Office • 020-2534 0700" },
    projectMatch: "kothrud-drainage",
    reportCategory: "drainage"
  },
  {
    key: "streetlight",
    label: "Streetlight Pole",
    shortLabel: "Streetlight",
    type: "Streetlight (LED)",
    confidence: 89,
    description: "This is a municipal LED streetlight pole with an integrated feeder pillar connection — part of the city's public lighting network.",
    details: { ageEstimate: "1–2 years", usage: "Public lighting", materials: "Galvanised steel pole" },
    conditionVariants: null,
    defaultCondition: { label: "Good", observations: [] },
    authority: { organization: "Pune Municipal Corporation", department: "Smart City Operations Centre", contact: "Lighting Helpline • 1800-1030-222" },
    projectMatch: null,
    reportCategory: "other"
  },
  {
    key: "public-building",
    label: "Public Building",
    shortLabel: "Public Building",
    type: "Public Building (Municipal)",
    confidence: 91,
    description:
      "This appears to be a municipal public building under finishing works — glazing, signage and access ramps suggest a civic facility nearing completion.",
    details: { ageEstimate: "Under construction", usage: "Civic services", materials: "RCC frame, glazed façade" },
    conditionVariants: null,
    defaultCondition: { label: "Good", observations: [] },
    authority: { organization: "Pune Municipal Corporation", department: "Estate Department", contact: "Estate Cell • 020-2550 1010" },
    projectMatch: "pm-shri-dhankawdi",
    reportCategory: "construction-quality"
  },
  {
    key: "water-pipeline",
    label: "Water Pipeline",
    shortLabel: "Water Pipeline",
    type: "Water Supply Pipeline",
    confidence: 93,
    description: "This is a distribution-main water pipeline section at an exposed joint — layout matches a pressurised 24×7 supply network with DI piping.",
    details: { ageEstimate: "< 2 years (new network)", usage: "Potable water distribution", materials: "Ductile iron with clamp joints" },
    conditionVariants: null,
    defaultCondition: { label: "Attention Required", observations: ["Moisture trace at joint", "Unrestored road cut"] },
    authority: { organization: "Pune Municipal Corporation", department: "Water Supply Department", contact: "Water Helpline • 020-2712 0500" },
    projectMatch: "bhosari-water",
    reportCategory: "water-leakage"
  },
  {
    key: "construction-site",
    label: "Construction Site",
    shortLabel: "Construction Site",
    type: "Construction Site (Institutional)",
    confidence: 95,
    description:
      "An active building construction site with staged structural frames, material stacking and safety barricading — consistent with an institutional hospital block.",
    details: { ageEstimate: "Active works", usage: "Healthcare facility (upcoming)", materials: "RCC frame under casting" },
    conditionVariants: [
      { label: "Good", observations: [] },
      { label: "Attention Required", observations: ["Dust suppression lapse observed"] }
    ],
    defaultCondition: { label: "Good", observations: [] },
    authority: { organization: "Public Works Department", department: "PWD Health Infrastructure Wing", contact: "Executive Engineer (PWD) • 020-2720 4200" },
    projectMatch: "aundh-hospital",
    reportCategory: "environmental"
  },
  {
    key: "riverfront-park",
    label: "Riverfront Park",
    shortLabel: "Park & Riverfront",
    type: "Public Park / Riverfront",
    confidence: 92,
    description: "This is a developed riverfront public park with a paved walking loop, plantation belt and solar lighting — a municipal greenspace asset.",
    details: { ageEstimate: "< 1 year", usage: "Public recreation", materials: "Paver loop, native plantation" },
    conditionVariants: null,
    defaultCondition: { label: "Good", observations: [] },
    authority: { organization: "Pune Municipal Corporation", department: "Gardens Department", contact: "Gardens Ward Office • 020-2538 0900" },
    projectMatch: "ward12-park",
    reportCategory: "other"
  }
];
