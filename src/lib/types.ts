import type { GeminiService } from '../services/GeminiService';
import type { SupabaseService } from '../services/SupabaseService';
import type { MetadataService } from '../services/MetadataService';

export type Variables = {
  services: {
    gemini: GeminiService;
    supabase: SupabaseService;
    metadata: MetadataService;
  };
  user?: { id: string };
};

export type AppType = {
  Bindings: Env;
  Variables: Variables;
};

export * from './schemas';
