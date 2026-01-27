/**
 * Application configuration constants
 */
export const CONFIG = {
  /** Gemini model for assessments */
  GEMINI_MODEL: 'gemini-2.5-flash',

  /** Maximum wait time for video processing (ms) */
  VIDEO_PROCESSING_TIMEOUT_MS: 60000,

  /** Poll interval for video processing (ms) */
  VIDEO_POLL_INTERVAL_MS: 2000,

  /** Maximum video processing poll attempts */
  VIDEO_MAX_POLL_ATTEMPTS: 30,

  /** Score threshold for recommending deeper investigation */
  DEEP_INVESTIGATION_THRESHOLD: 50,
} as const;

export type Config = typeof CONFIG;
