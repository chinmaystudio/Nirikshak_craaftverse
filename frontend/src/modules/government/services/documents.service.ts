import { supabase } from '@/core/supabase/client';
import { apiClient } from '@/lib/api/apiClient';
import type { DocumentItem, Paginated, ListQuery } from '@/modules/government/types';

function matchesQuery<T extends object>(items: T[], q?: ListQuery): T[] {
  if (!q?.search) return items;
  const s = q.search.toLowerCase();
  return items.filter((item) =>
    Object.values(item as Record<string, unknown>).some(
      (v) => typeof v === 'string' && v.toLowerCase().includes(s)
    )
  );
}

function paginate<T>(items: T[], q?: ListQuery): Paginated<T> {
  const page = q?.page ?? 1;
  const pageSize = q?.pageSize ?? 20;
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    pageSize,
  };
}

export interface ProjectDocumentV2 {
  id: string;
  project_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size_bytes: number;
  mime_type: string;
  visibility: 'PUBLIC' | 'CONTRACTOR_ONLY' | 'GOVERNMENT_ONLY';
  uploaded_by: string;
  uploaded_by_organization_id: string;
  created_at: string;
  version: number;
}

export const documentsService = {
  async all(): Promise<DocumentItem[]> {
    try {
      const { data, error } = await supabase
        .from('project_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => {
          let category: DocumentItem['category'] = 'Work Order';
          if (d.document_type === 'DPR') category = 'Administrative Approval';
          else if (d.document_type === 'EIA') category = 'Technical Approval';
          else if (d.document_type === 'CONTRACT') category = 'Contract Agreement';
          else if (d.document_type === 'INSPECTION') category = 'Inspection Report';

          return {
            id: d.id,
            name: d.file_name || d.title || 'Project Document',
            category,
            projectId: d.project_id,
            uploadedOn: (d.created_at || d.document_date || '2025-01-01').slice(0, 10),
            uploadedBy: d.publisher || 'Department Engineer',
            fileSizeKb: Math.round((d.file_size_bytes || 2450000) / 1024),
            version: d.version || 1,
            accessLevel: d.visibility === 'PUBLIC' || d.is_public ? 'Public' : 'Internal',
          };
        });
      }
    } catch (err) {
      console.warn('[documentsService] Error fetching project documents:', err);
    }
    return [];
  },

  async list(q?: ListQuery): Promise<Paginated<DocumentItem>> {
    const all = await this.all();
    return paginate(matchesQuery(all, q), q);
  },

  /* ---------- Database V2 Runtime Document & Storage Services ---------- */

  async getProjectDocuments(projectId: string): Promise<ProjectDocumentV2[]> {
    return apiClient.get<ProjectDocumentV2[]>(`/api/documents/project/${projectId}`);
  },

  async getUploadUrl(
    projectId: string,
    payload: { file_name: string; mime_type: string; document_type: string }
  ): Promise<{ upload_url: string; file_path: string; bucket: string }> {
    return apiClient.post<{ upload_url: string; file_path: string; bucket: string }>(
      `/api/documents/project/${projectId}/upload-url`,
      payload
    );
  },

  async registerDocument(
    projectId: string,
    payload: {
      document_type: string;
      file_name: string;
      file_path: string;
      file_size_bytes: number;
      mime_type: string;
      visibility: 'PUBLIC' | 'CONTRACTOR_ONLY' | 'GOVERNMENT_ONLY';
    }
  ): Promise<ProjectDocumentV2> {
    return apiClient.post<ProjectDocumentV2>(`/api/documents/project/${projectId}`, payload);
  },

  async getDownloadUrl(documentId: string): Promise<{ download_url: string }> {
    return apiClient.get<{ download_url: string }>(`/api/documents/${documentId}/download`);
  },

  async uploadDocument(
    projectId: string,
    file: File,
    documentType: string,
    visibility: 'PUBLIC' | 'CONTRACTOR_ONLY' | 'GOVERNMENT_ONLY' = 'GOVERNMENT_ONLY'
  ): Promise<ProjectDocumentV2> {
    const uploadMeta = await this.getUploadUrl(projectId, {
      file_name: file.name,
      mime_type: file.type || 'application/octet-stream',
      document_type: documentType,
    });

    const uploadRes = await fetch(uploadMeta.upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error(`Failed to upload file to storage: ${uploadRes.statusText}`);
    }

    return this.registerDocument(projectId, {
      document_type: documentType,
      file_name: file.name,
      file_path: uploadMeta.file_path,
      file_size_bytes: file.size,
      mime_type: file.type || 'application/octet-stream',
      visibility,
    });
  },
};
