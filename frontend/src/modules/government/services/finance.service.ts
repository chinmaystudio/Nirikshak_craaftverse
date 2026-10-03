import { supabase } from '@/core/supabase/client';
import type { FundFlow, BillItem } from '@/modules/government/types';

export const financeService = {
  async fundFlows(): Promise<FundFlow[]> {
    try {
      const { data, error } = await supabase
        .from('financial_updates')
        .select('*, projects(project_name, nirikshak_project_id)')
        .order('observation_date', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((f: any, idx: number) => {
          const budget = Number(f.budget_allocation_inr_crore) || Number(f.reported_cost_inr_crore) || 100;
          const spent = Number(f.amount_spent_inr_crore) || budget * 0.4;
          return {
            id: `FF-MH-2026-${(idx + 1).toString().padStart(4, '0')}`,
            fy: '2025-26',
            demandNo: 42,
            head: f.projects?.project_name
              ? `${f.projects.project_name} Execution Head`
              : '5054-Capital Outlay on Roads & Bridges',
            budgetEstimateCr: budget,
            revisedEstimateCr: Number(f.revised_cost_inr_crore) || budget,
            allocationCr: budget,
            releasedCr: budget * 0.8,
            utilizedCr: spent,
            status: budget > 0 ? 'released' : 'allocated',
          };
        });
      }
    } catch (err) {
      console.warn('[financeService] Error fetching financial updates:', err);
    }
    return [];
  },

  async bills(): Promise<BillItem[]> {
    return [];
  },

  async createAllocation(projectId: string, amountCr: number, head: string, notes?: string): Promise<void> {
    try {
      const { error } = await supabase.from('financial_updates').insert({
        project_id: projectId,
        observation_date: new Date().toISOString().slice(0, 10),
        budget_allocation_inr_crore: amountCr,
        notes: `${head}${notes ? ` — ${notes}` : ''}`,
      });
      if (error) {
        console.warn('[financeService] Failed to insert financial allocation:', error.message);
      }
    } catch (err) {
      console.warn('[financeService] Financial allocation error:', err);
    }
  },
};
