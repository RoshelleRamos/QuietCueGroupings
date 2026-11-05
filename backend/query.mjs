const tables = {
  qc_profiles: { read: 'id,full_name,role,focus_status,available_at', update: 'focus_status,available_at' },
  qc_family_links: { read: 'child_id,parent_id' },
  qc_requests: { read: 'id,child_id,parent_id,category,message,priority,status,created_at', insert: 'child_id,parent_id,category,message,priority', update: 'status' },
  qc_tasks: { read: 'id,user_id,title,completed,completed_at,created_at', insert: 'user_id,title', update: 'title,completed', delete: true },
  qc_focus_sessions: { read: 'id,user_id,task_id,started_at,planned_end,ended_at' },
  qc_notifications: { read: 'id,recipient_id,kind,title,body,request_id,read_at,created_at', update: 'read_at' },
};
export function compileQuery(q) {
  const config = tables[q.table];
  if (!config || !['select', 'insert', 'update', 'delete'].includes(q.action)) throw new Error('Unsupported query.');
  const readable = config.read.split(',');
  const column = name => {
    if (!readable.includes(name)) throw new Error('Unsupported column.');
    return `"${name}"`;
  };
  const values = [];
  const bind = value => { values.push(value); return `$${values.length}`; };
  const selected = !q.columns || q.columns === '*' ? readable : q.columns.split(',');
  const projection = selected.map(column).join(',');
  if (!Array.isArray(q.filters) || q.filters.length > 20) throw new Error('Invalid filters.');
  const filters = q.filters.map(f => {
    const name = column(f.column);
    if (f.op === 'eq') return `${name} = ${bind(f.value)}`;
    if (f.op === 'gte') return `${name} >= ${bind(f.value)}`;
    if (f.op === 'is' && f.value === null) return `${name} IS NULL`;
    if (f.op === 'in' && Array.isArray(f.value) && f.value.length <= 1000) return f.value.length ? `${name} IN (${f.value.map(bind).join(',')})` : 'false';
    throw new Error('Unsupported filter.');
  });
  const where = filters.length ? ` WHERE ${filters.join(' AND ')}` : '';
  const table = `public."${q.table}"`;
  if (q.action === 'select') {
    const order = q.order ? ` ORDER BY ${column(q.order.column)} ${q.order.ascending ? 'ASC' : 'DESC'}` : '';
    const limit = q.limit ?? 1000;
    if (!Number.isInteger(limit) || limit < 1 || limit > 1000) throw new Error('Invalid limit.');
    return { text: `SELECT ${projection} FROM ${table}${where}${order} LIMIT ${bind(limit)}`, values };
  }
  if (!config[q.action]) throw new Error('Operation is not allowed.');
  if (q.action === 'delete') {
    if (!filters.length) throw new Error('A filter is required.');
    return { text: `DELETE FROM ${table}${where} RETURNING ${projection}`, values };
  }
  if (!q.values || typeof q.values !== 'object' || Array.isArray(q.values)) throw new Error('Invalid values.');
  const fields = Object.keys(q.values);
  if (!fields.length || fields.some(f => !config[q.action].split(',').includes(f))) throw new Error('Unsupported write column.');
  if (q.action === 'insert') return { text: `INSERT INTO ${table} (${fields.map(column)}) VALUES (${fields.map(f => bind(q.values[f]))}) RETURNING ${projection}`, values };
  if (!filters.length) throw new Error('A filter is required.');
  return { text: `UPDATE ${table} SET ${fields.map(f => `${column(f)} = ${bind(q.values[f])}`)}${where} RETURNING ${projection}`, values };
}
export function compileRpc(name, args = {}) {
  const definitions = { qc_my_invite: [], qc_join_parent: ['code'], qc_start_focus: ['minutes', 'selected_task'], qc_end_focus: ['next_status'] };
  const fields = definitions[name];
  if (!fields || !args || typeof args !== 'object' || Object.keys(args).some(k => !fields.includes(k))) throw new Error('Unsupported operation.');
  const defaults = { selected_task: null, next_status: 'available' };
  const values = fields.map(f => args[f] ?? defaults[f]);
  return { text: `SELECT public.${name}(${fields.map((_, i) => `$${i + 1}`)}) AS result`, values };
}
