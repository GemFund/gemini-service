/**
 * Environment configuration abstraction layer.
 * Works with both Cloudflare Workers (c.env) and Node/Bun (process.env).
 */

export interface Env {
  GEMINI_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  SUPABASE_BUCKET_NAME: string;
  SUPABASE_JWT_SECRET: string;
}

/**
 * Get environment variables from process.env (for VPS/Docker deployment)
 */
export const getEnv = (): Env => ({
  GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_KEY: process.env.SUPABASE_KEY!,
  SUPABASE_BUCKET_NAME: process.env.SUPABASE_BUCKET_NAME!,
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET!,
});
