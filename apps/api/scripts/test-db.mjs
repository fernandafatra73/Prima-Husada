import { config } from 'dotenv';
import pg from 'pg';

config({ path: new URL('../.env', import.meta.url), override: true });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

const parsed = new URL(url);
console.log('Trying user=%s host=%s port=%s database=%s', parsed.username, parsed.hostname, parsed.port, parsed.pathname.slice(1));

const client = new pg.Client({ connectionString: url });
try {
  await client.connect();
  const r = await client.query('SELECT current_database() AS db, current_user AS usr');
  console.log('OK', r.rows[0]);
} catch (err) {
  console.error('FAIL', err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
