import type { SupabaseClient } from '@supabase/supabase-js';

export interface FileUrlResult {
  url: string;
  mimeType: string;
}

/**
 * Service for interacting with Supabase Storage
 * Provides URLs for media files
 */
export class SupabaseService {
  constructor(
    private client: SupabaseClient,
    private bucket: string,
  ) {}

  /**
   * Gets a signed URL for a file in Supabase Storage
   * Works for both public and private buckets
   * @param path - Path to the file (without bucket name)
   * @returns Signed URL (valid for 1 hour) and MIME type
   */
  async getFileUrl(path: string): Promise<FileUrlResult> {
    const mimeType = this.getMimeType(path);

    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(path, 3600); // 1 hour expiry

    if (error || !data?.signedUrl) {
      throw new Error(
        `Failed to create signed URL for ${path}: ${error?.message}`,
      );
    }

    return { url: data.signedUrl, mimeType };
  }

  private getMimeType(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}
