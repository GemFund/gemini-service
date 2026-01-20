import type { SupabaseClient } from '@supabase/supabase-js';
import { DownloadError } from '../lib/errors';

/**
 * Result of downloading a file from Supabase Storage
 */
export interface FileDownloadResult {
  /** The file as a Blob */
  blob: Blob;
  /** MIME type of the file */
  mimeType: string;
  /** Raw bytes as ArrayBuffer for metadata extraction */
  buffer: ArrayBuffer;
}

/**
 * Service for interacting with Supabase Storage
 * Handles file downloads for media analysis
 */
export class SupabaseService {
  constructor(
    private client: SupabaseClient,
    private bucket: string,
  ) {}

  /**
   * Downloads a file from Supabase Storage
   * @param path - Path to the file (without bucket name), e.g. "campaigns/123/photo.jpg"
   * @returns File blob, MIME type, and raw buffer
   * @throws DownloadError if download fails
   */
  async downloadFile(path: string): Promise<FileDownloadResult> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .download(path);

    if (error || !data) {
      throw new DownloadError(path, error?.message);
    }

    const buffer = await data.arrayBuffer();

    return {
      blob: data,
      mimeType: data.type,
      buffer,
    };
  }
}
