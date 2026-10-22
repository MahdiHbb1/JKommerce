import {
  createClient,
  type SupabaseClient,
} from 'npm:@supabase/supabase-js@2';

export interface AdminEnv {
  url: string;
  serviceRoleKey: string;
  anonKey: string | null;
}

export function readAdminEnv(): AdminEnv | null {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !serviceRoleKey) {
    return null;
  }

  return {
    url,
    serviceRoleKey,
    anonKey: Deno.env.get('SUPABASE_ANON_KEY') ?? null,
  };
}

export function createAdminClient(env: AdminEnv): SupabaseClient {
  return createClient(env.url, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
