/**
 * Application configuration constants
 */
export const CONFIG = {
  /** Gemini model for rapid assessments */
  GEMINI_MODEL: 'gemini-2.5-flash',

  /** Deep research agent identifier */
  DEEP_RESEARCH_AGENT: 'deep-research-pro-preview-05-2025',

  /** Maximum wait time for video processing (ms) */
  VIDEO_PROCESSING_TIMEOUT_MS: 60000,

  /** Poll interval for video processing (ms) */
  VIDEO_POLL_INTERVAL_MS: 2000,

  /** Maximum video processing poll attempts */
  VIDEO_MAX_POLL_ATTEMPTS: 30,

  /** Poll interval for investigation status (ms) */
  INVESTIGATION_POLL_INTERVAL_MS: 5000,

  /** Maximum investigation poll attempts */
  INVESTIGATION_MAX_POLL_ATTEMPTS: 24,

  /** Score threshold for recommending deep investigation */
  DEEP_INVESTIGATION_THRESHOLD: 50,
} as const;

export type Config = typeof CONFIG;
