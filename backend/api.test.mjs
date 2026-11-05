import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import { createServer } from './server.mjs';

test('HTTP authentication, family requests, isolation and logout', async () => {
  const live = process.env.QUIETCUE_TEST_LIVE === '1';
  const liveClient = live ? new pg.Client({ connectionString: process.env.DATABASE_URL }) : null;
  if (liveClient) await liveClient.connect();
  const db = liveClient ? { query: (...args) => liveClient.query(...args), exec: sql => liveClient.query(sql), close: () => liveClient.end() } : new PGlite();
  const suffix = Date.now();
  const parentEmail = `parent-${suffix}@example.test`;
  const childEmail = `child-${suffix}@example.test`;
  await db.exec(await readFile(new URL('./schema.sql', import.meta.url), 'utf8'));
  const query = (sql, values) => typeof sql === 'object' ? db.query(sql.text, sql.values) : db.query(sql, values);
  const server = createServer({ query, connect: async () => ({ query, release() {} }) });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  async function call(path, body = {}, token) {
    const response = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
    return { status: response.status, ...await response.json() };
  }
  try {
    assert.equal((await call('/query')).status, 401);
    const parent = await call('/auth/register', { email: parentEmail, password: 'test-password', full_name: 'Parent', role: 'parent' });
    assert.equal(parent.status, 200);
    const pt = parent.data.session.access_token;
    const pid = parent.data.session.user.id;
    assert.equal((await call('/auth/login', { email: parentEmail, password: 'wrong-password' })).status, 400);
    assert.equal((await call('/auth/login', { email: parentEmail, password: 'test-password' })).status, 200);
    const child = await call('/auth/register', { email: childEmail, password: 'test-password', full_name: 'Child', role: 'child' });
    assert.equal(child.status, 200);
    const ct = child.data.session.access_token;
    const cid = child.data.session.user.id;
    const invite = await call('/rpc', { name: 'qc_my_invite' }, pt);
    assert.equal(invite.status, 200);
    assert.equal((await call('/rpc', { name: 'qc_join_parent', args: { code: invite.data } }, ct)).status, 200);
    const request = await call('/query', { table: 'qc_requests', action: 'insert', filters: [], values: { child_id: cid, parent_id: pid, category: 'Emergency', message: 'Help please', priority: 'emergency' } }, ct);
    assert.equal(request.status, 200);
    const notifications = { table: 'qc_notifications', action: 'select', filters: [] };
    assert.equal((await call('/query', notifications, pt)).data.length, 2);
    assert.equal((await call('/query', notifications, ct)).data.length, 0);
    assert.equal((await call('/rpc', { name: 'qc_start_focus', args: { minutes: 25 } }, ct)).status, 400);
    assert.equal((await call('/auth/me', {}, pt)).data.user.id, pid);
    assert.equal((await call('/auth/logout', {}, pt)).status, 200);
    assert.equal((await call('/auth/me', {}, pt)).status, 401);
  } finally {
    await new Promise(resolve => server.close(resolve));
    if (live) await db.query('DELETE FROM qc_auth.users WHERE email = ANY($1::text[])', [[parentEmail, childEmail]]);
    await db.close();
  }
});
