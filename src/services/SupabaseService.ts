import type { SupabaseClient } from '@supabase/supabase-js';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { writeFile, unlink, mkdir } from 'fs/promises';

export interface FileUrlResult {
  url: string;
  mimeType: string;
}

export interface DownloadResult {
  localPath: string;
  mimeType: string;
  cleanup: () => Promise<void>;
}

/**
 * Service for interacting with Supabase Storage
 * Provides URLs and download functionality for media files
 */
export class SupabaseService {
  private tempDir: string;

  constructor(
    private client: SupabaseClient,
    private bucket: string,
  ) {
    this.tempDir = join(tmpdir(), 'gemfund-exif');
  }

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

  /**
   * Downloads a file from Supabase Storage to a temporary local file
   * @param path - Path to the file in storage
   * @returns Local file path and cleanup function
   */
  async downloadFile(path: string): Promise<DownloadResult> {
    const mimeType = this.getMimeType(path);
    const ext = path.split('.').pop() || 'bin';
    const localPath = join(this.tempDir, `${randomUUID()}.${ext}`);

    await mkdir(this.tempDir, { recursive: true });

    const { url } = await this.getFileUrl(path);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    await writeFile(localPath, Buffer.from(buffer));

    return {
      localPath,
      mimeType,
      cleanup: async () => {
        try {
          await unlink(localPath);
        } catch {
          // Ignore cleanup errors
        }
      },
    };
  }

  /**
   * Download multiple files to temp storage
   * @param paths - Array of file paths
   * @returns Array of download results with cleanup function for all
   */
  async downloadMultiple(paths: string[]): Promise<{
    files: Array<{ path: string; localPath: string; mimeType: string }>;
    cleanupAll: () => Promise<void>;
  }> {
    const results: Array<{
      path: string;
      localPath: string;
      mimeType: string;
      cleanup: () => Promise<void>;
    }> = [];

    for (const path of paths) {
      try {
        const result = await this.downloadFile(path);
        results.push({
          path,
          localPath: result.localPath,
          mimeType: result.mimeType,
          cleanup: result.cleanup,
        });
      } catch {
        // Skip files that fail to download
      }
    }

    return {
      files: results.map((r) => ({
        path: r.path,
        localPath: r.localPath,
        mimeType: r.mimeType,
      })),
      cleanupAll: async () => {
        await Promise.all(results.map((r) => r.cleanup()));
      },
    };
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
