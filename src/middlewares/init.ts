import { factory } from '../lib/factory';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { GeminiService } from '../services/GeminiService';
import { SupabaseService } from '../services/SupabaseService';
import { getEnv } from '../lib/env';

export const initServices = factory.createMiddleware(async (c, next) => {
  const env = getEnv();
  const geminiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

  const supabaseService = new SupabaseService(
    supabaseClient,
    env.SUPABASE_BUCKET_NAME,
  );

  const geminiService = new GeminiService(geminiClient, supabaseService);

  c.set('services', {
    gemini: geminiService,
    supabase: supabaseService,
  });

  await next();
});
