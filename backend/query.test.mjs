import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compileQuery, compileRpc } from './query.mjs';
test('values are parameters, including malicious text', () => {
  const attack = "x'); DROP TABLE qc_tasks;--";
  const result = compileQuery({ table: 'qc_tasks', action: 'insert', values: { title: attack, user_id: 'u' }, columns: 'id', filters: [] });
  assert.ok(!result.text.includes(attack));
  assert.deepEqual(result.values, [attack, 'u']);
});
test('rejects forbidden tables, hidden columns and ownership changes', () => {
  const base = { table: 'qc_profiles', action: 'select', columns: '*', filters: [] };
  assert.throws(() => compileQuery({ ...base, table: 'qc_auth.users' }));
  assert.throws(() => compileQuery({ ...base, columns: 'invite_code' }));
  assert.throws(() => compileQuery({ ...base, action: 'update', values: { role: 'parent' }, filters: [{ column: 'id', op: 'eq', value: 'u' }] }));
  assert.throws(() => compileQuery({ ...base, order: { column: 'id; DROP TABLE qc_tasks' } }));
});
test('update parameter numbering remains correct after filters', () => {
  const result = compileQuery({ table: 'qc_tasks', action: 'update', columns: 'id', values: { completed: true }, filters: [{ column: 'id', op: 'eq', value: 'task' }] });
  assert.deepEqual(result.values, ['task', true]);
  assert.match(result.text, /SET "completed" = \$2 WHERE "id" = \$1/);
});
test('forbids unfiltered writes and arbitrary RPC', () => {
  assert.throws(() => compileQuery({ table: 'qc_tasks', action: 'delete', filters: [] }));
  assert.throws(() => compileRpc('pg_sleep', { seconds: 10 }));
  assert.deepEqual(compileRpc('qc_end_focus').values, ['available']);
});
