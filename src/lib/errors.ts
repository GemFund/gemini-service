/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Error thrown when a resource is not found
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Error thrown when file download fails
 */
export class DownloadError extends AppError {
  constructor(path: string, reason?: string) {
    super(
      'DOWNLOAD_FAILED',
      `Download failed for ${path}${reason ? `: ${reason}` : ''}`,
      500,
    );
    this.name = 'DownloadError';
  }
}

/**
 * Error thrown when AI processing fails
 */
export class AIProcessingError extends AppError {
  constructor(operation: string, reason?: string) {
    super(
      'AI_PROCESSING_FAILED',
      `${operation} failed${reason ? `: ${reason}` : ''}`,
      500,
    );
    this.name = 'AIProcessingError';
  }
}

/**
 * Error thrown when video processing times out
 */
export class VideoProcessingError extends AppError {
  constructor(fileName: string, status: 'timeout' | 'failed') {
    const message =
      status === 'timeout'
        ? `Video processing timed out for ${fileName}`
        : `Video processing failed for ${fileName}`;
    super('VIDEO_PROCESSING_FAILED', message, 500);
    this.name = 'VideoProcessingError';
  }
}

/**
 * Error thrown when investigation fails
 */
export class InvestigationError extends AppError {
  constructor(status: string) {
    super(
      'INVESTIGATION_FAILED',
      `Deep research failed with status: ${status}`,
      500,
    );
    this.name = 'InvestigationError';
  }
}
