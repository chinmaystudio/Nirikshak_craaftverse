import { CONTRACTOR } from './data';
import type { Tender } from './data';

export interface EligRow {
  label: string;
  required: string;
  ours: string;
  pass: boolean | null; // null = manual review
}

export function eligibilityRows(t: Tender): EligRow[] {
  const thresholds: Record<string, number> = {
    t1: 25, t2: 18, t3: 22, t4: 10, t5: 120, t6: 7, t7: 14,
  };
  const minTurnover = thresholds[t.id] ?? 10;
  const eligibilityRequirement = t.eligibility?.required?.trim() || 'Eligibility requirements are not specified in the published tender.';
  const eligibilityParts = eligibilityRequirement.match(/[^;]+/g)?.map((part) => part.trim()).filter(Boolean) ?? [];
  const rows: EligRow[] = [
    {
      label: 'Contractor class / registration',
      required: eligibilityParts[0] || eligibilityRequirement,
      ours: `${CONTRACTOR.class} — PWD/MJP/ZP empanelled`,
      pass: t.id === 't3' ? null : true,
    },
    {
      label: 'Average annual turnover (last 3 FY)',
      required: `≥ ₹${minTurnover} Cr`,
      ours: `₹${CONTRACTOR.turnover} Cr`,
      pass: CONTRACTOR.turnover >= minTurnover,
    },
    {
      label: 'Similar completed works',
      required: eligibilityParts.slice(1).join('; ') || 'Per tender clause',
      ours: `${CONTRACTOR.completedWorks} works including comparable ${(t.category || 'general works').toLowerCase()} contracts`,
      pass: t.id === 't5' ? false : t.id === 't3' ? null : true,
    },
    {
      label: 'Financial bid capacity',
      required: `≥ tender value ₹${t.value} Cr`,
      ours: 'Assessed capacity ₹58.6 Cr (PWD formula)',
      pass: t.id === 't5' ? false : true,
    },
    {
      label: 'Statutory compliance',
      required: 'EPF, ESIC, GST, PAN active; no blacklisting',
      ours: 'All active; PAN/GST on file',
      pass: true,
    },
  ];
  return rows;
}

export function eligibilityStatus(t: Tender): 'Eligible' | 'Review' | 'Not Eligible' {
  const rows = eligibilityRows(t);
  if (rows.some((r) => r.pass === false)) return 'Not Eligible';
  if (rows.some((r) => r.pass === null)) return 'Review';
  return 'Eligible';
}
