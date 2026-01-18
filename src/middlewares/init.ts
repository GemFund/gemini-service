import { factory } from '../lib/factory';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { GeminiService } from './../services/GeminiService';
import { SupabaseService } from '../services/SupabaseService';

export const initServices = factory.createMiddleware(async (c, next) => {
  const geminiClient = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });
  const supabaseClient = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY);
  const geminiService = new GeminiService(geminiClient);
  const supabaseService = new SupabaseService(supabaseClient);

  c.set('services', { gemini: geminiService, supabase: supabaseService });

  await next();
});
