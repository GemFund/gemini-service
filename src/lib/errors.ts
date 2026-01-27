/**
 * Error codes for API consumers
 */
export const ErrorCodes = {
  // General
  UNKNOWN: 'ERR_UNKNOWN',
  VALIDATION: 'ERR_VALIDATION',
  NOT_FOUND: 'ERR_NOT_FOUND',

  // Authentication
  UNAUTHORIZED: 'ERR_UNAUTHORIZED',
  TOKEN_EXPIRED: 'ERR_TOKEN_EXPIRED',
  TOKEN_INVALID: 'ERR_TOKEN_INVALID',

  // Storage
  STORAGE_DOWNLOAD_FAILED: 'ERR_STORAGE_DOWNLOAD',
  STORAGE_URL_FAILED: 'ERR_STORAGE_URL',
  STORAGE_FILE_NOT_FOUND: 'ERR_STORAGE_NOT_FOUND',

  // AI Processing
  AI_NO_RESPONSE: 'ERR_AI_NO_RESPONSE',
  AI_PARSE_FAILED: 'ERR_AI_PARSE',
  AI_RATE_LIMITED: 'ERR_AI_RATE_LIMITED',

  // Forensics - Blockchain
  BLOCKCHAIN_API_ERROR: 'ERR_BLOCKCHAIN_API',
  BLOCKCHAIN_INVALID_ADDRESS: 'ERR_BLOCKCHAIN_INVALID_ADDR',
  BLOCKCHAIN_RATE_LIMITED: 'ERR_BLOCKCHAIN_RATE_LIMITED',

  // Forensics - EXIF
  EXIF_EXTRACTION_FAILED: 'ERR_EXIF_EXTRACTION',
  EXIF_UNSUPPORTED_FORMAT: 'ERR_EXIF_UNSUPPORTED',

  // Forensics - Reverse Image
  REVERSE_IMAGE_API_ERROR: 'ERR_REVERSE_IMAGE_API',
  REVERSE_IMAGE_RATE_LIMITED: 'ERR_REVERSE_IMAGE_RATE_LIMITED',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Structured error details for API responses
 */
export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  service?: string;
  operation?: string;
  context?: Record<string, unknown>;
  timestamp: string;
  traceId?: string;
}

/**
 * Base application error with structured details
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly service?: string;
  public readonly operation?: string;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(
    code: ErrorCode,
    message: string,
    options: {
      statusCode?: number;
      service?: string;
      operation?: string;
      context?: Record<string, unknown>;
      cause?: Error;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'AppError';
    this.code = code;
    this.statusCode = options.statusCode ?? 500;
    this.service = options.service;
    this.operation = options.operation;
    this.context = options.context;
    this.timestamp = new Date().toISOString();
  }

  toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      service: this.service,
      operation: this.operation,
      context: this.context,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Storage-related errors (Supabase)
 */
export class StorageError extends AppError {
  constructor(
    operation: 'download' | 'url' | 'upload',
    path: string,
    reason?: string,
    cause?: Error,
  ) {
    const codes = {
      download: ErrorCodes.STORAGE_DOWNLOAD_FAILED,
      url: ErrorCodes.STORAGE_URL_FAILED,
      upload: ErrorCodes.STORAGE_DOWNLOAD_FAILED,
    };

    super(
      codes[operation],
      `Storage ${operation} failed for "${path}"${reason ? `: ${reason}` : ''}`,
      {
        service: 'SupabaseService',
        operation,
        context: { path },
        cause,
      },
    );
    this.name = 'StorageError';
  }
}

/**
 * AI processing errors (Gemini)
 */
export class AIError extends AppError {
  constructor(
    type: 'no_response' | 'parse_failed' | 'rate_limited',
    operation: string,
    details?: string,
    cause?: Error,
  ) {
    const codes = {
      no_response: ErrorCodes.AI_NO_RESPONSE,
      parse_failed: ErrorCodes.AI_PARSE_FAILED,
      rate_limited: ErrorCodes.AI_RATE_LIMITED,
    };

    const messages = {
      no_response: `AI returned no response during ${operation}`,
      parse_failed: `Failed to parse AI response during ${operation}`,
      rate_limited: `AI rate limit exceeded during ${operation}`,
    };

    super(
      codes[type],
      details ? `${messages[type]}: ${details}` : messages[type],
      {
        statusCode: type === 'rate_limited' ? 429 : 500,
        service: 'GeminiService',
        operation,
        cause,
      },
    );
    this.name = 'AIError';
  }
}

/**
 * Blockchain forensics errors (Etherscan)
 */
export class BlockchainError extends AppError {
  constructor(
    type: 'api_error' | 'invalid_address' | 'rate_limited',
    operation: string,
    details?: string,
    cause?: Error,
  ) {
    const codes = {
      api_error: ErrorCodes.BLOCKCHAIN_API_ERROR,
      invalid_address: ErrorCodes.BLOCKCHAIN_INVALID_ADDRESS,
      rate_limited: ErrorCodes.BLOCKCHAIN_RATE_LIMITED,
    };

    super(
      codes[type],
      `Blockchain ${operation} failed${details ? `: ${details}` : ''}`,
      {
        statusCode:
          type === 'rate_limited'
            ? 429
            : type === 'invalid_address'
              ? 400
              : 500,
        service: 'EtherscanService',
        operation,
        cause,
      },
    );
    this.name = 'BlockchainError';
  }
}

/**
 * EXIF extraction errors
 */
export class ExifError extends AppError {
  constructor(
    type: 'extraction_failed' | 'unsupported_format',
    filePath: string,
    details?: string,
    cause?: Error,
  ) {
    const codes = {
      extraction_failed: ErrorCodes.EXIF_EXTRACTION_FAILED,
      unsupported_format: ErrorCodes.EXIF_UNSUPPORTED_FORMAT,
    };

    super(
      codes[type],
      `EXIF ${type.replace('_', ' ')} for "${filePath}"${details ? `: ${details}` : ''}`,
      {
        statusCode: type === 'unsupported_format' ? 400 : 500,
        service: 'ExifService',
        operation: 'extractMetadata',
        context: { filePath },
        cause,
      },
    );
    this.name = 'ExifError';
  }
}

/**
 * Reverse image search errors (SerpAPI)
 */
export class ReverseImageError extends AppError {
  constructor(
    type: 'api_error' | 'rate_limited',
    imageUrl: string,
    details?: string,
    cause?: Error,
  ) {
    const codes = {
      api_error: ErrorCodes.REVERSE_IMAGE_API_ERROR,
      rate_limited: ErrorCodes.REVERSE_IMAGE_RATE_LIMITED,
    };

    super(
      codes[type],
      `Reverse image search failed${details ? `: ${details}` : ''}`,
      {
        statusCode: type === 'rate_limited' ? 429 : 500,
        service: 'SerpService',
        operation: 'reverseImageSearch',
        context: { imageUrl: imageUrl.substring(0, 100) },
        cause,
      },
    );
    this.name = 'ReverseImageError';
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  constructor(field: string, message: string, value?: unknown) {
    super(
      ErrorCodes.VALIDATION,
      `Validation failed for "${field}": ${message}`,
      {
        statusCode: 400,
        context: { field, invalidValue: value },
      },
    );
    this.name = 'ValidationError';
  }
}

/**
 * Authentication errors
 */
export class AuthError extends AppError {
  constructor(type: 'unauthorized' | 'expired' | 'invalid', details?: string) {
    const codes = {
      unauthorized: ErrorCodes.UNAUTHORIZED,
      expired: ErrorCodes.TOKEN_EXPIRED,
      invalid: ErrorCodes.TOKEN_INVALID,
    };

    const messages = {
      unauthorized: 'Authentication required',
      expired: 'Token has expired',
      invalid: 'Invalid token',
    };

    super(
      codes[type],
      details ? `${messages[type]}: ${details}` : messages[type],
      {
        statusCode: 401,
        service: 'Auth',
      },
    );
    this.name = 'AuthError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    super(
      ErrorCodes.NOT_FOUND,
      `${resource}${identifier ? ` "${identifier}"` : ''} not found`,
      {
        statusCode: 404,
        context: identifier ? { identifier } : undefined,
      },
    );
    this.name = 'NotFoundError';
  }
}

// Legacy exports for backward compatibility
export class AIProcessingError extends AIError {
  constructor(operation: string, reason?: string) {
    super('no_response', operation, reason);
    this.name = 'AIProcessingError';
  }
}

export class DownloadError extends StorageError {
  constructor(path: string, reason?: string) {
    super('download', path, reason);
    this.name = 'DownloadError';
  }
}

export class VideoProcessingError extends AppError {
  constructor(fileName: string, status: 'timeout' | 'failed') {
    const message =
      status === 'timeout'
        ? `Video processing timed out for ${fileName}`
        : `Video processing failed for ${fileName}`;
    super(ErrorCodes.AI_NO_RESPONSE, message, {
      service: 'VideoProcessor',
      context: { fileName, status },
    });
    this.name = 'VideoProcessingError';
  }
}

export class InvestigationError extends AppError {
  constructor(status: string) {
    super(
      ErrorCodes.AI_NO_RESPONSE,
      `Deep research failed with status: ${status}`,
      {
        service: 'Investigation',
        context: { status },
      },
    );
    this.name = 'InvestigationError';
  }
}
