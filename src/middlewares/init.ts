import { factory } from '../lib/factory';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { GeminiService } from '../services/GeminiService';
import { SupabaseService } from '../services/SupabaseService';
import { MetadataService } from '../services/MetadataService';

export const initServices = factory.createMiddleware(async (c, next) => {
  const geminiClient = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });
  const supabaseClient = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);

  const supabaseService = new SupabaseService(
    supabaseClient,
    c.env.SUPABASE_BUCKET_NAME,
  );
  const metadataService = new MetadataService();
  const geminiService = new GeminiService(
    geminiClient,
    supabaseService,
    metadataService,
  );

  c.set('services', {
    gemini: geminiService,
    supabase: supabaseService,
    metadata: metadataService,
  });

  await next();
});
