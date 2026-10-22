const LOCALHOST_DEV_ORIGINS = ['http://localhost:5173'];
const ALLOW_HEADERS = 'authorization, x-client-info, apikey, content-type';
const ALLOW_METHODS = 'POST, OPTIONS';

/**
 * ALLOWED_ORIGINS berisi origin produksi dipisah koma. Wildcard sengaja
 * diabaikan: CORS harus fail-closed.
 */
export function parseAllowedOrigins(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0 && origin !== '*');
}

export function corsHeadersFor(
  origin: string | null,
  allowedOrigins: string[],
): Record<string, string> {
  const headers: Record<string, string> = { Vary: 'Origin' };

  if (!origin) {
    return headers;
  }

  const allowed = new Set([
    ...LOCALHOST_DEV_ORIGINS,
    ...allowedOrigins.filter((candidate) => candidate !== '*'),
  ]);

  if (!allowed.has(origin)) {
    return headers;
  }

  headers['Access-Control-Allow-Origin'] = origin;
  headers['Access-Control-Allow-Headers'] = ALLOW_HEADERS;
  headers['Access-Control-Allow-Methods'] = ALLOW_METHODS;
  headers['Access-Control-Max-Age'] = '86400';

  return headers;
}
