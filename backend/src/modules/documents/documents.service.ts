import { supabaseAdmin, createAuthenticatedClient } from '../../core/database/supabase.js';
import { CreateUploadUrlInput, RegisterDocumentInput, ProjectDocumentRecord } from './documents.types.js';
import { UserContext } from '../../core/auth/userContext.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../../core/http/errors.js';

export class DocumentsService {
  async requestUploadUrl(
    input: CreateUploadUrlInput,
    userContext: UserContext,
    _token: string
  ): Promise<{ storage_path: string; signed_url: string; token: string }> {
    const sanitizedName = input.file_name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${input.project_id}/${Date.now()}_${sanitizedName}`;

    const { data, error } = await supabaseAdmin.storage
      .from('project-documents')
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      throw new ValidationError(`Failed to generate signed upload URL: ${error?.message || 'Storage error'}`);
    }

    return {
      storage_path: storagePath,
      signed_url: data.signedUrl,
      token: data.token,
    };
  }

  async registerDocument(
    input: RegisterDocumentInput,
    userContext: UserContext,
    token: string
  ): Promise<ProjectDocumentRecord> {
    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('project_documents')
      .insert({
        project_id: input.project_id,
        document_type: input.document_type,
        title: input.title,
        description: input.description || null,
        file_name: input.file_name,
        file_size: input.file_size || null,
        mime_type: input.mime_type || null,
        storage_path: input.storage_path,
        visibility: input.visibility || 'INTERNAL',
        uploaded_by: userContext.userId,
      })
      .select()
      .single();

    if (error || !data) {
      throw new ValidationError(`Failed to register document: ${error?.message}`);
    }

    return data as ProjectDocumentRecord;
  }

  async getDownloadUrl(
    documentId: string,
    userContext: UserContext,
    token: string
  ): Promise<{ download_url: string; file_name: string; mime_type: string | null }> {
    const scopedClient = await createAuthenticatedClient(token);
    const { data: doc, error } = await scopedClient
      .from('project_documents')
      .select('*')
      .eq('id', documentId)
      .is('deleted_at', null)
      .single();

    if (error || !doc) {
      throw new NotFoundError('Document not found or access denied.');
    }

    // Generate signed download URL (valid for 1 hour)
    const { data, error: signErr } = await supabaseAdmin.storage
      .from('project-documents')
      .createSignedUrl(doc.storage_path, 3600);

    if (signErr || !data?.signedUrl) {
      throw new ValidationError(`Failed to create download URL: ${signErr?.message || 'Storage error'}`);
    }

    return {
      download_url: data.signedUrl,
      file_name: doc.file_name,
      mime_type: doc.mime_type,
    };
  }

  async listProjectDocuments(
    projectId: string,
    userContext: UserContext,
    token: string
  ): Promise<ProjectDocumentRecord[]> {
    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('project_documents')
      .select('*')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ValidationError(`Failed to list project documents: ${error.message}`);
    }

    return (data || []) as ProjectDocumentRecord[];
  }
}

export const documentsService = new DocumentsService();
