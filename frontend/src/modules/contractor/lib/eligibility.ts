import type { Tender } from './data';

export interface EligRow {
  label: string;
  required: string;
  ours: string;
  pass: boolean | null; // null = manual review
}

export function eligibilityRows(t: Tender): EligRow[] {
  const minTurnover = Math.max(5, Math.round(t.value * 0.4));
  const eligibilityRequirement = t.eligibility?.required?.trim() || 'Eligibility requirements are not specified in the published tender.';
  const eligibilityParts = eligibilityRequirement.match(/[^;]+/g)?.map((part) => part.trim()).filter(Boolean) ?? [];
  const rows: EligRow[] = [
    {
      label: 'Contractor class / registration',
      required: eligibilityParts[0] || eligibilityRequirement,
      ours: 'Class-A Empanelled Contractor',
      pass: true,
    },
    {
      label: 'Average annual turnover (last 3 FY)',
      required: `≥ ₹${minTurnover} Cr`,
      ours: 'Turnover meets pre-qualification criteria',
      pass: true,
    },
    {
      label: 'Similar completed works',
      required: eligibilityParts.slice(1).join('; ') || 'Per tender clause',
      ours: `Comparable ${(t.category || 'infrastructure').toLowerCase()} works executed`,
      pass: true,
    },
    {
      label: 'Financial bid capacity',
      required: `≥ tender value ₹${t.value} Cr`,
      ours: `Capacity verified for ₹${t.value} Cr`,
      pass: true,
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
