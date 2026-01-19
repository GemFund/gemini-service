import type { SupabaseClient } from '@supabase/supabase-js';

export interface FileDownloadResult {
  blob: Blob;
  mimeType: string;
  buffer: ArrayBuffer;
}

export class SupabaseService {
  constructor(
    private client: SupabaseClient,
    private bucket: string,
  ) {}

  async downloadFile(path: string): Promise<FileDownloadResult> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .download(path);

    if (error || !data) {
      throw new Error(`Download failed for ${path}: ${error?.message}`);
    }

    const buffer = await data.arrayBuffer();

    return {
      blob: data,
      mimeType: data.type,
      buffer,
    };
  }
}
