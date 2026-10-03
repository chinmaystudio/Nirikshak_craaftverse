export type SharedProjectStatus = 'sanctioned' | 'in_execution' | 'at_risk' | 'delayed' | 'completed' | 'on_hold' | 'unknown';

export function normalizeProjectStatus(value: unknown): SharedProjectStatus {
  const status = String(value ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (status === 'COMPLETED') return 'completed';
  if (status === 'DELAYED') return 'delayed';
  if (status === 'STALLED' || status === 'SUSPENDED' || status === 'AT_RISK') return 'at_risk';
  if (status === 'ON_HOLD') return 'on_hold';
  if (status === 'PROPOSED' || status === 'DPR_STAGE' || status === 'APPROVED' || status === 'SANCTIONED') return 'sanctioned';
  if (status === 'IN_EXECUTION' || status === 'ACTIVE' || status === 'UNDER_CONSTRUCTION') return 'in_execution';
  return 'unknown';
}

export const PROJECT_STATUS_LABEL: Record<SharedProjectStatus, string> = {
  sanctioned: 'Sanctioned', in_execution: 'In Execution', at_risk: 'At Risk', delayed: 'Delayed',
  completed: 'Completed', on_hold: 'On Hold', unknown: 'Not available',
};

export const PROJECT_STATUS_TONE: Record<SharedProjectStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  sanctioned: 'info', in_execution: 'info', at_risk: 'warning', delayed: 'danger', completed: 'success', on_hold: 'neutral', unknown: 'neutral',
};
