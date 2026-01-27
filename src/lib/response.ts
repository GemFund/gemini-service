import type { Context } from 'hono';
import {
  AppError,
  ErrorCodes,
  type ErrorDetails,
  type ErrorCode,
} from './errors';

/**
 * Structured API error response
 */
export interface ErrorResponse {
  success: false;
  error: ErrorDetails;
}

/**
 * Structured API success response
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Creates a success response object
 */
export function success<T extends Record<string, unknown>>(data: T) {
  return { success: true as const, ...data };
}

/**
 * Creates a structured error response
 */
export function errorResponse(
  error: AppError | Error | unknown,
): ErrorResponse {
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.toJSON(),
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: {
        code: ErrorCodes.UNKNOWN,
        message: error.message,
        timestamp: new Date().toISOString(),
      },
    };
  }

  return {
    success: false,
    error: {
      code: ErrorCodes.UNKNOWN,
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Legacy: Creates a simple error response object
 * @deprecated Use errorResponse() for structured errors
 */
export function error(message: string) {
  return { success: false as const, error: message };
}

/**
 * Extracts error message from unknown error
 */
export function getErrorMessage(e: unknown): string {
  if (e instanceof Error) {
    return e.message;
  }
  return 'Unknown error occurred';
}

/**
 * Extracts error code from unknown error
 */
export function getErrorCode(e: unknown): ErrorCode {
  if (e instanceof AppError) {
    return e.code;
  }
  return ErrorCodes.UNKNOWN;
}

/**
 * Extracts status code from error
 */
export function getStatusCode(e: unknown): number {
  if (e instanceof AppError) {
    return e.statusCode;
  }
  return 500;
}

/**
 * Helper to send structured JSON error response
 */
export function jsonError(c: Context, err: AppError | Error | unknown) {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  return c.json(errorResponse(err), statusCode as 400 | 401 | 404 | 429 | 500);
}

/**
 * Helper to send simple JSON error response
 * @deprecated Use jsonError with AppError for structured errors
 */
export function jsonErrorSimple(
  c: Context,
  message: string,
  status: 400 | 401 | 404 | 500 = 500,
) {
  return c.json(error(message), status);
}
