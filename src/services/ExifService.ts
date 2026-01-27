import { exiftool } from 'exiftool-vendored';

interface ExifMetadata {
  hasGps: boolean;
  gpsCoordinates: { lat: number; lng: number } | null;
  dateTaken: string | null;
  dateModified: string | null;
  dateMismatch: boolean;
  hasEdits: boolean;
  software: string | null;
  camera: string | null;
  originalFilename: string | null;
  warnings: string[];
}

/**
 * Service for EXIF metadata extraction using exiftool-vendored
 * Extracts forensic-relevant metadata from images
 */
export class ExifService {
  /**
   * Extract forensic-relevant EXIF metadata from an image file
   */
  async extractMetadata(filePath: string): Promise<ExifMetadata> {
    const warnings: string[] = [];

    try {
      const tags = await exiftool.read(filePath);
      const hasGps = !!(tags.GPSLatitude && tags.GPSLongitude);
      let gpsCoordinates: { lat: number; lng: number } | null = null;

      if (hasGps) {
        gpsCoordinates = {
          lat:
            typeof tags.GPSLatitude === 'number'
              ? tags.GPSLatitude
              : parseFloat(String(tags.GPSLatitude)) || 0,
          lng:
            typeof tags.GPSLongitude === 'number'
              ? tags.GPSLongitude
              : parseFloat(String(tags.GPSLongitude)) || 0,
        };
      }

      const dateTaken = tags.DateTimeOriginal?.toString() || null;
      const dateModified = tags.ModifyDate?.toString() || null;

      let dateMismatch = false;
      if (dateTaken && dateModified) {
        const takenDate = new Date(dateTaken);
        const modifiedDate = new Date(dateModified);
        // If modified significantly after taken, flag it
        const daysDiff =
          (modifiedDate.getTime() - takenDate.getTime()) /
          (1000 * 60 * 60 * 24);
        if (daysDiff > 30) {
          dateMismatch = true;
          warnings.push(
            `Image modified ${Math.round(daysDiff)} days after capture`,
          );
        }
      }

      // Check for editing software (indicates manipulation)
      const software =
        (tags.Software as string) ||
        (tags.CreatorTool as string) ||
        (tags.ProcessingSoftware as string) ||
        null;
      const hasEdits = !!software;

      if (software) {
        const editingTools = [
          'photoshop',
          'gimp',
          'lightroom',
          'snapseed',
          'vsco',
          'canva',
        ];
        if (
          editingTools.some((tool) => software.toLowerCase().includes(tool))
        ) {
          warnings.push(`Edited with: ${software}`);
        }
      }

      const camera = tags.Model
        ? `${tags.Make || ''} ${tags.Model}`.trim()
        : null;

      // Check for metadata errors
      if (tags.errors && tags.errors.length > 0) {
        warnings.push(...tags.errors);
      }

      return {
        hasGps,
        gpsCoordinates,
        dateTaken,
        dateModified,
        dateMismatch,
        hasEdits,
        software,
        camera,
        originalFilename: (tags.OriginalFileName as string) || null,
        warnings,
      };
    } catch (error) {
      return {
        hasGps: false,
        gpsCoordinates: null,
        dateTaken: null,
        dateModified: null,
        dateMismatch: false,
        hasEdits: false,
        software: null,
        camera: null,
        originalFilename: null,
        warnings: [`Failed to extract EXIF: ${(error as Error).message}`],
      };
    }
  }

  /**
   * Extract metadata from multiple files
   */
  async extractMultiple(
    filePaths: string[],
  ): Promise<Map<string, ExifMetadata>> {
    const results = new Map<string, ExifMetadata>();

    for (const path of filePaths) {
      const metadata = await this.extractMetadata(path);
      results.set(path, metadata);
    }

    return results;
  }

  /**
   * Cleanup ExifTool process (call on server shutdown)
   */
  async cleanup(): Promise<void> {
    await exiftool.end();
  }
}
