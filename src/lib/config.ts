/**
 * Application configuration constants
 */
export const CONFIG = {
  /** Gemini model for assessments */
  GEMINI_MODEL: 'gemini-3-flash-preview',

  /** Ethereum chain ID (1 = Mainnet, 11155111 = Sepolia) */
  CHAIN_ID: 11155111,
} as const;

export type Config = typeof CONFIG;
