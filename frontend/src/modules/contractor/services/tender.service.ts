import { supabase } from '@/core/supabase/client';
import { realtimeService } from '@/core/realtime/realtime.service';
import type { Tender } from '../lib/data';

export interface DbTender {
  id: string;
  project_id: string;
  tender_number: string;
  title: string;
  description?: string | null;
  estimated_value_inr_crore: number;
  publication_date: string;
  bid_due_date: string;
  eligibility_criteria?: string | null;
  technical_requirements?: string | null;
  documents?: any;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'UNDER_EVALUATION' | 'AWARDED' | 'CANCELLED';
  created_at: string;
  projects?: {
    id: string;
    project_name: string;
    nirikshak_project_id: string;
    location_text?: string;
    sector?: string;
  };
}

export interface DbBid {
  id: string;
  tender_id: string;
  contractor_organization_id: string;
  bid_reference: string;
  bid_amount: number;
  technical_proposal?: string | null;
  technical_score?: number | null;
  financial_score?: number | null;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'QUALIFIED' | 'DISQUALIFIED' | 'SELECTED' | 'REJECTED' | 'WITHDRAWN';
  submitted_by?: string | null;
  submitted_at?: string | null;
  updated_at?: string;
  tenders?: Partial<DbTender>;
}

export class ContractorTenderService {
  static toTender(row: DbTender): Tender {
    const documents = Array.isArray(row.documents) ? row.documents : [];
    const split = (value?: string | null) => value ? value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean) : [];
    return {
      id: row.id,
      code: row.tender_number,
      title: row.title,
      department: 'Unknown',
      location: row.projects?.location_text || 'Unknown',
      value: row.estimated_value_inr_crore == null ? 0 : Number(row.estimated_value_inr_crore),
      deadline: row.bid_due_date,
      emd: 0,
      category: row.projects?.sector || 'Unknown',
      durationMonths: 0,
      opened: row.publication_date,
      preBid: '',
      status: row.status === 'PUBLISHED' ? 'Open' : 'Closed',
      summary: row.description || 'Unknown',
      scopePoints: split(row.description),
      eligibility: { label: 'Eligibility criteria', required: row.eligibility_criteria || 'Unknown' },
      techReq: split(row.technical_requirements),
      finReq: [],
      docs: documents.map((item: any) => typeof item === 'string' ? item : item?.name).filter(Boolean),
      timeline: [
        ...(row.publication_date ? [{ label: 'Published', date: row.publication_date }] : []),
        ...(row.bid_due_date ? [{ label: 'Bid deadline', date: row.bid_due_date }] : []),
      ],
      contact: { name: 'Unknown', role: 'Unknown', phone: 'Unknown', email: 'Unknown' },
    };
  }

  /**
   * Fetches published, open tenders from Supabase PostgreSQL.
   */
  static async getOpenTenders(): Promise<DbTender[]> {
    const { data, error } = await supabase
      .from('tenders')
      .select('*, projects(id, project_name, nirikshak_project_id, location_text, sector)')
      .eq('status', 'PUBLISHED')
      .is('deleted_at', null)
      .order('bid_due_date', { ascending: true });

    if (error) {
      console.error('Failed to query open tenders from Supabase:', error);
      throw error;
    }

    const rows = (data || []) as DbTender[];
    if (typeof sessionStorage !== 'undefined') {
      rows.forEach((row) => sessionStorage.setItem(`nirikshak:tender:${row.id}`, JSON.stringify(this.toTender(row))));
    }
    return rows;
  }

  /**
   * Fetches details of a single tender.
   */
  static async getTender(id: string): Promise<DbTender | null> {
    const { data, error } = await supabase
      .from('tenders')
      .select('*, projects(id, project_name, nirikshak_project_id, location_text, sector)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`Failed to query tender ${id}:`, error);
      throw error;
    }

    return data as DbTender | null;
  }

  /**
   * Fetches bids submitted by the contractor's authenticated organization.
   */
  static async getMyBids(): Promise<DbBid[]> {
    const { data, error } = await supabase
      .from('tender_bids')
      .select('*, tenders(id, tender_number, title, estimated_value_inr_crore, status, bid_due_date, projects(project_name))')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to query contractor bids:', error);
      throw error;
    }

    return (data || []) as unknown as DbBid[];
  }

  /**
   * Submits a formal bid for a tender.
   */
  static async submitBid(payload: {
    tenderId: string;
    bidAmount: number;
    technicalProposal: string;
  }): Promise<DbBid> {
    const { tenderId, bidAmount, technicalProposal } = payload;
    const { data: bid, error: insertErr } = await supabase
      .rpc('save_tender_bid', { p_tender_id: tenderId, p_bid_amount: bidAmount, p_technical_proposal: technicalProposal, p_status: 'SUBMITTED' });

    if (insertErr) {
      console.error('Error submitting bid:', insertErr);
      throw insertErr;
    }

    const savedBid = (Array.isArray(bid) ? bid[0] : bid) as unknown as DbBid | null;
    if (!savedBid?.id || !savedBid.bid_reference) {
      throw new Error('The bid was saved, but its confirmation could not be loaded. Refresh My Bids before retrying.');
    }

    // Bid persistence is authoritative. A transient Realtime notification must not
    // turn a successful database transaction into a visible submission failure.
    void realtimeService.broadcast('government:tenders', 'BID_SUBMITTED', {
      tender_id: tenderId,
      bid_id: savedBid.id,
      bid_reference: savedBid.bid_reference,
    }).catch((error) => console.warn('Bid submitted; Realtime notification was not delivered:', error));

    return savedBid;
  }

  /**
   * Saves a draft bid.
   */
  static async saveDraft(payload: {
    tenderId: string;
    bidAmount: number;
    technicalProposal: string;
  }): Promise<DbBid> {
    const { tenderId, bidAmount, technicalProposal } = payload;
    const { data: bid, error } = await supabase
      .rpc('save_tender_bid', { p_tender_id: tenderId, p_bid_amount: bidAmount, p_technical_proposal: technicalProposal, p_status: 'DRAFT' });

    if (error) throw error;
    const savedBid = (Array.isArray(bid) ? bid[0] : bid) as unknown as DbBid | null;
    if (!savedBid?.id) throw new Error('The bid draft confirmation could not be loaded.');
    return savedBid;
  }

  /**
   * Withdraws a submitted bid before evaluation deadline.
   */
  static async withdrawBid(bidId: string): Promise<void> {
    const { error } = await supabase
      .from('tender_bids')
      .update({ status: 'WITHDRAWN' })
      .eq('id', bidId);

    if (error) throw error;
  }

  /**
   * Subscribes to realtime tender and bid updates.
   */
  static subscribeTenderEvents(callback: () => void): () => void {
    const unsub1 = realtimeService.subscribeToTable('tenders', () => callback());
    const unsub2 = realtimeService.subscribeToTable('tender_bids', () => callback());
    return () => {
      unsub1();
      unsub2();
    };
  }
}
