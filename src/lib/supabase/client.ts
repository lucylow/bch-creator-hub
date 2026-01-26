import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/**
 * Returns the Supabase client when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 * are set in the environment. Otherwise returns null so callers can skip
 * Supabase-dependent logic when not configured.
 */
export function getSupabase(): SupabaseClient | null {
  if (client != null) return client;
  if (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.length > 0 &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.length > 0
  ) {
    client = createClient(supabaseUrl, supabaseAnonKey);
    return client;
  }
  return null;
}

/**
 * True if Supabase is configured (both URL and anon key are set).
 */
export function isSupabaseConfigured(): boolean {
  return getSupabase() != null;
}
