import type { Context } from 'hono';

/**
 * Creates a success response object
 */
export function success<T extends Record<string, unknown>>(data: T) {
  return { success: true as const, ...data };
}

/**
 * Creates an error response object
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
 * Helper to send JSON error response
 */
export function jsonError(
  c: Context,
  message: string,
  status: 400 | 401 | 404 | 500 = 500,
) {
  return c.json(error(message), status);
}
