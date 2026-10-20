// Menjalankan satu Edge Function secara lokal tanpa Docker.
// Pemakaian:
//   npx --yes deno-bin run --env-file=.env --allow-net --allow-env \
//     scripts/e2e/serve-function.ts
// Env: E2E_PORT (default 8787), E2E_FUNCTION_ENTRY (file:// URL ke index.ts).

const port = Number(Deno.env.get('E2E_PORT') ?? '8787');
const entry = Deno.env.get('E2E_FUNCTION_ENTRY');

if (!entry) {
  throw new Error('E2E_FUNCTION_ENTRY wajib diisi (file:// URL ke index.ts)');
}

const supabaseUrl =
  Deno.env.get('SUPABASE_URL') ?? Deno.env.get('VITE_SUPABASE_URL') ?? '';
if (supabaseUrl && !Deno.env.get('SUPABASE_URL')) {
  Deno.env.set('SUPABASE_URL', supabaseUrl);
}
if (!Deno.env.get('SUPABASE_ANON_KEY')) {
  Deno.env.set(
    'SUPABASE_ANON_KEY',
    Deno.env.get('VITE_SUPABASE_ANON_KEY') ?? '',
  );
}

// Service key diambil saat runtime (tidak pernah ditulis ke disk) bila hanya
// tersedia token Management API.
const accessToken = Deno.env.get('SUPABASE_ACCESS_TOKEN');
if (supabaseUrl && !Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') && accessToken) {
  const projectRef = new URL(supabaseUrl).host.split('.')[0];
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/api-keys?reveal=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok) {
    throw new Error(`Management API gagal: HTTP ${response.status}`);
  }
  const keys = await response.json();
  const serviceKey = keys.find(
    (key: { name?: string; api_key?: string }) =>
      key.name === 'service_role' && key.api_key,
  )?.api_key;
  if (!serviceKey) {
    throw new Error('service_role key tidak ditemukan');
  }
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', serviceKey);
}

// Supabase Edge Runtime memanggil Deno.serve(handler). Untuk lokal kita paksa
// port agar dua function bisa berjalan berdampingan.
const originalServe = Deno.serve.bind(Deno);
Object.defineProperty(Deno, 'serve', {
  configurable: true,
  value: (first: unknown, second?: unknown) => {
    const handler = typeof first === 'function' ? first : second;
    const options = typeof first === 'function' ? { port } : { ...first, port };
    return originalServe(options as Deno.ServeTcpOptions, handler as never);
  },
});

console.log(`local function siap di http://127.0.0.1:${port}`);
await import(entry);
