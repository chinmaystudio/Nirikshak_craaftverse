import { apiClient } from '@/lib/api/apiClient';

export interface ProjectDocument {
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

export interface UploadUrlResponse {
  upload_url: string;
  file_path: string;
  bucket: string;
}

export interface RegisterDocumentPayload {
  document_type: string;
  file_name: string;
  file_path: string;
  file_size_bytes: number;
  mime_type: string;
  visibility: 'PUBLIC' | 'CONTRACTOR_ONLY' | 'GOVERNMENT_ONLY';
}

export class ContractorDocumentsService {
  static async getProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
    return apiClient.get<ProjectDocument[]>(`/api/documents/project/${projectId}`);
  }

  static async getUploadUrl(
    projectId: string,
    payload: { file_name: string; mime_type: string; document_type: string }
  ): Promise<UploadUrlResponse> {
    return apiClient.post<UploadUrlResponse>(`/api/documents/project/${projectId}/upload-url`, payload);
  }

  static async registerDocument(projectId: string, payload: RegisterDocumentPayload): Promise<ProjectDocument> {
    return apiClient.post<ProjectDocument>(`/api/documents/project/${projectId}`, payload);
  }

  static async getDownloadUrl(documentId: string): Promise<{ download_url: string }> {
    return apiClient.get<{ download_url: string }>(`/api/documents/${documentId}/download`);
  }

  /**
   * Upload file end-to-end to Supabase Storage via signed URL and register metadata in Database V2
   */
  static async uploadDocument(
    projectId: string,
    file: File,
    documentType: string,
    visibility: 'PUBLIC' | 'CONTRACTOR_ONLY' | 'GOVERNMENT_ONLY' = 'CONTRACTOR_ONLY'
  ): Promise<ProjectDocument> {
    const uploadMeta = await this.getUploadUrl(projectId, {
      file_name: file.name,
      mime_type: file.type || 'application/octet-stream',
      document_type: documentType,
    });

    // Upload directly using signed URL
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

    // Register metadata
    return this.registerDocument(projectId, {
      document_type: documentType,
      file_name: file.name,
      file_path: uploadMeta.file_path,
      file_size_bytes: file.size,
      mime_type: file.type || 'application/octet-stream',
      visibility,
    });
  }
}
