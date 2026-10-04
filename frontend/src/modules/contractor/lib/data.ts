/**
 * Contractor Domain Interfaces and Data Types.
 * Strictly live production domain definitions with zero demo fixtures.
 */
export * from '../types/contractor.types';
import type { Invoice, Tender } from '../types/contractor.types';

export const BID_STEPS = [
  'Company Details',
  'Eligibility',
  'Technical Proposal',
  'Financial Proposal',
  'Documents',
  'Review',
  'Submit',
];

export function getTender(id: string): Tender | undefined {
  if (typeof sessionStorage !== 'undefined') {
    const cached = sessionStorage.getItem(`nirikshak:tender:${id}`);
    if (cached) {
      try {
        return JSON.parse(cached) as Tender;
      } catch {
        sessionStorage.removeItem(`nirikshak:tender:${id}`);
      }
    }
  }
  return undefined;
}

export function pendingForProject(projectId: string, invoices: Invoice[]): number {
  return invoices
    .filter((i) => i.projectId === projectId && ['Submitted', 'Under Verification', 'Approved'].includes(i.status))
    .reduce((s, i) => s + (i.amount || 0), 0);
}

export function paidForProject(projectId: string, invoices: Invoice[]): number {
  return invoices.filter((i) => i.projectId === projectId && i.status === 'Paid').reduce((s, i) => s + (i.amount || 0), 0);
}
