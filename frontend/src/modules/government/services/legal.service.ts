import type { LitigationCase } from '@/modules/government/types';

export const legalService = {
  async all(): Promise<LitigationCase[]> {
    // Authoritative litigation records will be populated when legal module V2 is active
    return [];
  },
};
