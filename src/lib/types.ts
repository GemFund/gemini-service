import type { GeminiService } from '../services/GeminiService';
import type { SupabaseService } from '../services/SupabaseService';

export type Variables = {
  services: {
    gemini: GeminiService;
    supabase: SupabaseService;
  };
  user?: { id: string };
};

export type AppType = {
  Bindings: Env;
  Variables: Variables;
};

export * from './schemas';
