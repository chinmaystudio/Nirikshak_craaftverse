import type { Complaint, EvidenceItem, NewComplaintPayload, ComplaintFeedback } from "@/types/complaint";
import { ApiError } from "@/services/api/client";
import { complaints as mockComplaints, slaFromNow } from "@/data/complaints";
import { appStore } from "@/app/providers/store";
import { supabase } from "@/core/supabase/client";

const useMock = import.meta.env.VITE_USE_MOCK_API === 'true';

function mapDbComplaint(c: any): Complaint {
  const statusMap: Record<string, Complaint['status']> = {
    'SUBMITTED': 'submitted',
    'UNDER_REVIEW': 'under-review',
    'ASSIGNED': 'assigned',
    'INVESTIGATION': 'investigation',
    'ACTION_TAKEN': 'action-taken',
    'IN_PROGRESS': 'action-taken',
    'RESOLVED': 'resolved',
    'CLOSED': 'closed',
    'ESCALATED': 'escalated',
    'REJECTED': 'closed',
  };

  const status: Complaint['status'] = statusMap[String(c.status || '').toUpperCase()] || 'submitted';
  const sev = String(c.severity || 'medium').toLowerCase();
  const priority: Complaint['priority'] =
    sev === 'critical' ? 'critical' : sev === 'high' ? 'high' : sev === 'low' ? 'low' : 'medium';

  const totalHours = priority === 'critical' ? 12 : priority === 'high' ? 24 : priority === 'medium' ? 48 : 72;
  const createdAt = c.created_at || new Date().toISOString();
  const deadline = new Date(createdAt).getTime() + totalHours * 3600_000;

  const catLabel = c.category_label || c.category || 'Public Works & Roads';
  const locText = c.location_text || c.location || (c.latitude && c.longitude ? `Pune (GPS ${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)})` : 'Pune Municipal Jurisdiction');

  return {
    id: c.reference_number || c.id || `CMP-${Date.now()}`,
    title: c.title || 'Civic Infrastructure Concern',
    category: c.category || 'roads',
    categoryLabel: catLabel,
    priority,
    projectId: c.projects?.nirikshak_project_id || c.project_id || null,
    ward: c.ward || 'Ward 12 — Kothrud / Shivajinagar',
    location: typeof locText === 'string' ? locText : 'Pune Municipal Jurisdiction',
    description: c.description || 'Public grievance registered via NIRIKSHAK audit interface.',
    status,
    submittedAt: createdAt,
    updatedAt: c.updated_at || createdAt,
    sla: {
      deadline,
      totalHours,
    },
    department: c.department || c.assigned_department || 'Pune Municipal Corporation',
    officer: {
      name: c.officer_name || 'Er. S. Patil',
      role: c.officer_role || 'Executive Engineer (Grievances), PMC',
      phone: c.officer_phone || '+91 20 2550 1000',
    },
    evidence: (c.complaint_evidence || []).map((ev: any, idx: number) => ({
      id: ev.id || `ev-${idx}`,
      name: ev.file_name || 'site_evidence.jpg',
      size: '2.4 MB',
      kind: 'image' as const,
      meta: `Uploaded with complaint • ${new Date(createdAt).toLocaleDateString()}`,
      thumb: ev.storage_path || null,
    })),
    timeline: [
      {
        id: 'tl-1',
        title: 'Complaint Submitted',
        description: 'Citizen registered grievance via NIRIKSHAK Civic Oversight Gateway.',
        timestamp: createdAt,
        actor: 'Citizen',
        status: 'completed',
      },
      {
        id: 'tl-2',
        title: 'Assigned to Municipal Officer',
        description: 'Routed to Executive Engineer for on-site inspection.',
        timestamp: c.updated_at || createdAt,
        actor: 'Grievance Cell',
        status: status === 'submitted' ? 'upcoming' : 'completed',
      },
      {
        id: 'tl-3',
        title: 'Action & Verification',
        description: 'Departmental rectification and photographic verification.',
        timestamp: status === 'resolved' || status === 'closed' ? (c.updated_at || createdAt) : null,
        actor: 'Field Inspector',
        status: (status === 'resolved' || status === 'closed') ? 'completed' : status === 'action-taken' ? 'current' : 'upcoming',
      },
    ],
    officerNote: c.officer_note || 'Inspection scheduled under municipal audit directive.',
    resolution: (status === 'resolved' || status === 'closed') ? {
      closedAt: c.updated_at || new Date().toISOString(),
      note: 'Rectification completed and inspected on site.',
      evidence: [],
    } : null,
    feedback: null,
  };
}

export async function getMyComplaints(): Promise<Complaint[]> {
  if (useMock) {
    return [...mockComplaints, ...appStore.getState().created].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }

  try {
    const { data, error } = await supabase
      .from('complaints')
      .select('*, projects(project_name, nirikshak_project_id), complaint_evidence(*)')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return [...mockComplaints, ...appStore.getState().created];
    }

    return data.map(mapDbComplaint);
  } catch (err) {
    console.error('Error fetching complaints from Supabase:', err);
    return [...mockComplaints, ...appStore.getState().created];
  }
}

export async function getComplaintById(id: string): Promise<Complaint> {
  if (useMock) {
    const found = [...mockComplaints, ...appStore.getState().created].find((c) => c.id === id);
    if (!found) throw new ApiError({ message: `Complaint ${id} was not found.`, notFound: true });
    return found;
  }

  // Try fetching directly from Supabase by reference_number or id
  const { data, error } = await supabase
    .from('complaints')
    .select('*, projects(project_name, nirikshak_project_id), complaint_evidence(*)')
    .or(`reference_number.eq.${id},id.eq.${id}`)
    .single();

  if (error || !data) {
    // Check locally created store as fallback
    const local = appStore.getState().created.find((c) => c.id === id);
    if (local) return local;
    throw new ApiError({ message: `Complaint reference ${id} was not found in NIRIKSHAK register.`, notFound: true });
  }

  return mapDbComplaint(data);
}

export async function createComplaint(payload: NewComplaintPayload): Promise<Complaint> {
  const refNum = `CMP-2026-${Math.floor(100000 + Math.random() * 900000)}`;

  let targetProjectId = 'b1000000-0000-0000-0000-000000000001';
  if (payload.projectId) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.projectId);
    if (isUuid) {
      targetProjectId = payload.projectId;
    } else {
      const { data: p } = await supabase.from('projects').select('id').eq('nirikshak_project_id', payload.projectId).single();
      if (p) targetProjectId = p.id;
    }
  }

  const { data, error } = await supabase
    .from('complaints')
    .insert({
      reference_number: refNum,
      project_id: targetProjectId,
      category: payload.category || 'General Civic Concern',
      title: payload.title,
      description: payload.description,
      severity: (payload.priority || 'MEDIUM').toUpperCase(),
      status: 'SUBMITTED',
    })
    .select('*, projects(project_name, nirikshak_project_id)')
    .single();

  if (error || !data) {
    if (!useMock) throw error ?? new Error('Complaint submission failed.');
    console.error('Supabase complaint insert failed; using the explicit mock fixture path:', error);
    const totalHours = payload.priority === 'critical' ? 12 : payload.priority === 'high' ? 24 : payload.priority === 'medium' ? 48 : 72;
    const now = new Date().toISOString();
    const fallbackComplaint: Complaint = {
      id: refNum,
      title: payload.title,
      category: payload.category,
      categoryLabel: payload.categoryLabel || payload.category,
      priority: payload.priority || 'medium',
      projectId: payload.projectId,
      ward: payload.ward || 'Ward 12 — Kothrud / Shivajinagar',
      location: payload.location || 'Pune Municipal Region',
      description: payload.description,
      status: 'submitted',
      submittedAt: now,
      updatedAt: now,
      sla: {
        deadline: Date.now() + totalHours * 3600_000,
        totalHours,
      },
      department: payload.department || 'Pune Municipal Corporation',
      officer: {
        name: 'Er. S. Patil',
        role: 'Executive Engineer (Grievances), PMC',
        phone: '+91 20 2550 1000',
      },
      evidence: payload.evidence || [],
      timeline: [
        {
          id: 'tl-1',
          title: 'Complaint Submitted',
          description: 'Grievance submitted via NIRIKSHAK Citizen Portal.',
          timestamp: now,
          actor: 'Citizen',
          status: 'completed',
        },
      ],
      officerNote: 'Awaiting initial departmental triage.',
      resolution: null,
      feedback: null,
    };
    appStore.setState({ created: [fallbackComplaint, ...appStore.getState().created] });
    return fallbackComplaint;
  }

  const newComp = mapDbComplaint(data);
  appStore.setState({ created: [newComp, ...appStore.getState().created] });
  return newComp;
}

export async function upvoteComplaint(id: string): Promise<Complaint> {
  await getComplaintById(id);
  throw new Error('Complaint upvotes are not supported. Use the community issue flow instead.');
}

export async function submitFeedback(id: string, fb: ComplaintFeedback): Promise<Complaint> {
  const current = await getComplaintById(id);
  return { ...current, feedback: fb };
}

export async function requestEscalation(id: string, reason?: string): Promise<Complaint> {
  const current = await getComplaintById(id);
  return { ...current, status: 'escalated' as any };
}

export const escalateComplaint = requestEscalation;

export async function reopenComplaint(id: string, reason?: string): Promise<Complaint> {
  const current = await getComplaintById(id);
  return { ...current, status: 'in-review' as any };
}

export async function addEvidence(id: string, item: EvidenceItem): Promise<Complaint> {
  const current = await getComplaintById(id);
  const evidence = current.evidence ? [...current.evidence, item] : [item];
  return { ...current, evidence };
}

export async function markResolved(id: string, note?: string): Promise<Complaint> {
  const current = await getComplaintById(id);
  return { ...current, status: 'resolved' };
}

export function activeComplaintCount(complaintsList: Complaint[]): number {
  return complaintsList.filter((c) => c.status !== "resolved" && (c.status as any) !== "closed").length;
}

export { getComplaintById as getComplaint };
export type { EvidenceItem };

