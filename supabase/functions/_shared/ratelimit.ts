import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

/**
 * Memanggil RPC check_rate_limit (service_role only). Mengembalikan true bila
 * permintaan masih di bawah ambang. Error DB dilempar ke pemanggil supaya
 * function bisa menjawab 500, bukan lolos tanpa limit.
 */
export async function checkRateLimit(
  client: SupabaseClient,
  key: string,
  windowSeconds: number,
  limit: number,
): Promise<boolean> {
  const { data, error } = await client.rpc('check_rate_limit', {
    p_key: key,
    p_window_seconds: windowSeconds,
    p_limit: limit,
  });

  if (error) {
    throw error;
  }

  return data === true;
}
