import exifr from 'exifr';

export interface ImageMetadata {
  timestamp: string | null;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  cameraModel: string | null;
  cameraMake: string | null;
  software: string | null;
  originalDate: string | null;
  modifyDate: string | null;
  orientation: number | null;
  imageWidth: number | null;
  imageHeight: number | null;
  hasGps: boolean;
  wasEdited: boolean;
  metadataStripped: boolean;
}

export class MetadataService {
  async extractImageMetadata(buffer: ArrayBuffer): Promise<ImageMetadata> {
    try {
      const exif = await exifr.parse(buffer, [
        'DateTimeOriginal',
        'CreateDate',
        'ModifyDate',
        'GPSLatitude',
        'GPSLongitude',
        'Make',
        'Model',
        'Software',
        'Orientation',
        'ImageWidth',
        'ImageHeight',
        'ExifImageWidth',
        'ExifImageHeight',
      ]);

      if (!exif) {
        return this.createEmptyMetadata(true);
      }

      const originalDate = exif.DateTimeOriginal || exif.CreateDate;
      const modifyDate = exif.ModifyDate;
      const wasEdited =
        modifyDate && originalDate
          ? new Date(modifyDate) > new Date(originalDate)
          : Boolean(exif.Software);

      return {
        timestamp: originalDate ? this.formatDate(originalDate) : null,
        gpsLatitude: exif.GPSLatitude ?? exif.latitude ?? null,
        gpsLongitude: exif.GPSLongitude ?? exif.longitude ?? null,
        cameraModel: exif.Model ?? null,
        cameraMake: exif.Make ?? null,
        software: exif.Software ?? null,
        originalDate: originalDate ? this.formatDate(originalDate) : null,
        modifyDate: modifyDate ? this.formatDate(modifyDate) : null,
        orientation: exif.Orientation ?? null,
        imageWidth: exif.ImageWidth ?? exif.ExifImageWidth ?? null,
        imageHeight: exif.ImageHeight ?? exif.ExifImageHeight ?? null,
        hasGps: Boolean(exif.GPSLatitude || exif.latitude),
        wasEdited,
        metadataStripped: false,
      };
    } catch {
      return this.createEmptyMetadata(true);
    }
  }

  formatMetadataForPrompt(
    metadata: ImageMetadata,
    index: number,
    mediaType: 'image' | 'video',
  ): string {
    const lines: string[] = [`[${mediaType.toUpperCase()} ${index + 1}]`];

    if (metadata.metadataStripped) {
      lines.push(
        '  WARNING: Metadata appears to be stripped (common in reused/stolen content)',
      );
      return lines.join('\n');
    }

    if (metadata.timestamp) {
      lines.push(`  Original Timestamp: ${metadata.timestamp}`);
    }

    if (metadata.hasGps) {
      lines.push(
        `  GPS Coordinates: ${metadata.gpsLatitude}, ${metadata.gpsLongitude}`,
      );
    } else {
      lines.push('  GPS: Not available');
    }

    if (metadata.cameraMake || metadata.cameraModel) {
      lines.push(
        `  Camera: ${[metadata.cameraMake, metadata.cameraModel].filter(Boolean).join(' ')}`,
      );
    }

    if (metadata.software) {
      lines.push(`  Editing Software: ${metadata.software}`);
    }

    if (metadata.wasEdited) {
      lines.push('  WARNING: Image appears to have been edited after capture');
    }

    if (metadata.modifyDate && metadata.originalDate) {
      lines.push(
        `  Modified: ${metadata.modifyDate} (Original: ${metadata.originalDate})`,
      );
    }

    return lines.join('\n');
  }

  createVideoMetadataPlaceholder(): ImageMetadata {
    return this.createEmptyMetadata(true);
  }

  private formatDate(date: Date | string): string {
    if (date instanceof Date) {
      return date.toISOString();
    }
    return String(date);
  }

  private createEmptyMetadata(stripped: boolean): ImageMetadata {
    return {
      timestamp: null,
      gpsLatitude: null,
      gpsLongitude: null,
      cameraModel: null,
      cameraMake: null,
      software: null,
      originalDate: null,
      modifyDate: null,
      orientation: null,
      imageWidth: null,
      imageHeight: null,
      hasGps: false,
      wasEdited: false,
      metadataStripped: stripped,
    };
  }
}
