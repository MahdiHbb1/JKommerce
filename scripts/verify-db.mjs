import { Client } from 'pg';

try {
  process.loadEnvFile('.env');
} catch {
  // .env is optional when the variables are already exported in the shell.
}

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error(
    'SUPABASE_DB_URL belum diset. Lihat docs/runbook/00-supabase-setup.md.',
  );
  process.exit(1);
}

const client = new Client({ connectionString });

try {
  await client.connect();
  await client.query('select 1');
  console.log('DB OK');
} catch (error) {
  console.error('DB FAIL:', error.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
