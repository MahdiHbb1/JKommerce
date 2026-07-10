import { createClient } from '@supabase/supabase-js';

// SECURITY WARNING: Any environment variable with VITE_ prefix is automatically
// embedded in the public JavaScript bundle by Vite. NEVER add service role keys,
// private API keys, or any secrets with VITE_ prefix. These would be exposed
// to anyone who opens DevTools. Service role keys should be set via Supabase CLI:
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const SUPABASE_ORDERS_TABLE = import.meta.env.VITE_SUPABASE_ORDERS_TABLE || 'orders';