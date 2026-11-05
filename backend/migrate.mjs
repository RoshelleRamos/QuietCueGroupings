import pg from 'pg';
import { readFile } from 'node:fs/promises';
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL on the backend.');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query(await readFile(new URL('./schema.sql', import.meta.url), 'utf8'));
  console.log('QuietCue PostgreSQL schema is ready.');
} finally { await client.end(); }
