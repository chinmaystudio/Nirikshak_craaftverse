import { useMemo } from 'react';
import { useAsync } from './useAsync';
import { useAppState } from '@/app/providers/store';
import { getMyComplaints, activeComplaintCount } from '@/services/complaints/complaintsService';

export function useComplaints() {
  const created = useAppState((s) => s.created);
  const state = useAsync(() => getMyComplaints(), [created.length]);
  const complaints = state.data ?? [];
  const active = useMemo(() => complaints.filter((c) => c.status !== 'resolved' && c.status !== 'closed'), [complaints]);
  return { ...state, complaints, active, activeCount: activeComplaintCount(complaints) };
}
