process.env.QUIETCUE_TEST_LIVE = '1';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for the live PostgreSQL test.');
await import('./api.test.mjs');
