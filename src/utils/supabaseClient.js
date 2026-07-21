import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Avoid crashing if not yet configured, but warn
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Ensure .env is configured properly.');
}

export const supabase = createClient(supabaseUrl || 'http://dummy.url', supabaseAnonKey || 'dummy-key');
