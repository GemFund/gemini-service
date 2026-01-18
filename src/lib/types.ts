import { GeminiService } from '../services/GeminiService';
import { SupabaseService } from '../services/SupabaseService';

export type Variables = {
  services: {
    gemini: GeminiService;
    supabase: SupabaseService
  };
  user?: { id: string };
};

export type AppType = {
  Bindings: CloudflareBindings;
  Variables: Variables;
};
