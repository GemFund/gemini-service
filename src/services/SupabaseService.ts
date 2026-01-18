import { SupabaseClient } from '@supabase/supabase-js';

export class SupabaseService {
  constructor(private client: SupabaseClient) {}
}
