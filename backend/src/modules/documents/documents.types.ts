export interface CreateUploadUrlInput {
  project_id: string;
  file_name: string;
  mime_type: string;
  document_type: string;
}

export interface RegisterDocumentInput {
  project_id: string;
  document_type: string;
  title: string;
  description?: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  storage_path: string;
  visibility?: 'PUBLIC' | 'INTERNAL' | 'RESTRICTED';
}

export interface ProjectDocumentRecord {
  id: string;
  project_id: string;
  document_type: string;
  title: string;
  description: string | null;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  storage_path: string;
  version: number;
  visibility: string;
  uploaded_by: string | null;
  created_at: string;
}
