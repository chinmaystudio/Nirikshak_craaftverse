import { supabase } from '../supabase/client';

export interface StorageUploadResult {
  path: string;
  filename: string;
  size: number;
  mimeType: string;
  url: string;
}

export class StorageService {
  /**
   * Uploads evidence or project document to Supabase storage.
   */
  static async uploadFile(
    bucket: string,
    folder: string,
    file: File
  ): Promise<StorageUploadResult> {
    const cleanFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${folder}/${Date.now()}_${cleanFilename}`;

    const { data, error } = await supabase.storage.from(bucket).upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return {
      path: data.path,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
      url: publicUrlData.publicUrl,
    };
  }
}
