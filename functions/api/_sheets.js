/** Server-only Google Sheets mirror. D1 is authoritative; never append blindly. */
const DEFAULT_SHEET = '1HyWudE1b-yizLdvrjAwUfx7roC-jLYQZig-VfpoCLbI';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const enc = new TextEncoder();
export const SHEET_COLUMNS = {
  member: { title: 'Memberships', table: 'members', fields: ['id', 'member_no', 'created_at', 'first_name', 'last_name', 'email', 'phone', 'city', 'province', 'birth_year', 'division', 'printed_id', 'gcash_ref', 'status'] },
  order: { title: 'Orders', table: 'orders', fields: ['id', 'order_no', 'created_at', 'full_name', 'email', 'phone', 'ship_address', 'ship_city', 'ship_province', 'ship_postcode', 'ship_country', 'courier', 'items_json', 'subtotal', 'shipping_note', 'payment_method', 'payment_status', 'fulfilment_status', 'tracking_no'] },
  registration: { title: 'Registrations', table: 'registrations', fields: ['id', 'created_at', 'event_slug', 'full_name', 'email', 'phone', 'division', 'club', 'member_no', 'gcash_ref', 'amount', 'payment_status', 'notes'] },
};
class SyncError extends Error {}
const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const encodeJson = value => b64url(enc.encode(JSON.stringify(value)));

export function sheetsConfig(env) {
  if (!env.GOOGLE_SHEETS_SERVICE_ACCOUNT) return { configured: false, issue: 'missing_credential' };
  try {
    const account = JSON.parse(env.GOOGLE_SHEETS_SERVICE_ACCOUNT);
    if (account.type !== 'service_account' || !/^[^\s@]+@[^\s@]+\.iam\.gserviceaccount\.com$/.test(account.client_email) || !account.private_key?.includes('BEGIN PRIVATE KEY')) throw new Error();
    const sheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID || DEFAULT_SHEET;
    if (!/^[\w-]{20,}$/.test(sheetId)) throw new Error();
    return { configured: true, account, sheetId };
  } catch { return { configured: false, issue: 'invalid_configuration' }; }
}

/** One client per drain, so tokens and I/O never cross request lifetimes. */
export async function createSheetsClient(env, fetcher = fetch, deadline = Date.now() + 22000) {
  const config = sheetsConfig(env);
  if (!config.configured) throw new SyncError(config.issue);
  const call = async (url, init, label) => {
    const remaining = deadline - Date.now();
    if (remaining < 100) throw new SyncError('time_budget_exhausted');
    let response;
    try { response = await fetcher(url, { ...init, signal: AbortSignal.timeout(Math.min(6000, remaining)) }); }
    catch { throw new SyncError(`${label}_network_error`); }
    if (!response.ok) throw new SyncError(`${label}_http_${response.status}`);
    try { return await response.json(); } catch { throw new SyncError(`${label}_invalid_response`); }
  };
  let key;
  try {
    const pem = config.account.private_key.replace(/-----[^-]+-----|\s/g, '');
    key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem), c => c.charCodeAt(0)), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  } catch { throw new SyncError('invalid_private_key'); }
  const now = Math.floor(Date.now() / 1000);
  const payload = `${encodeJson({ alg: 'RS256', typ: 'JWT' })}.${encodeJson({ iss: config.account.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 })}`;
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(payload));
  const auth = await call(TOKEN_URL, { method: 'POST', body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${payload}.${b64url(signature)}` }) }, 'google_auth');
  if (!auth.access_token) throw new SyncError('google_auth_invalid_response');
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}`;
  const request = (path, method = 'GET', body) => call(base + path, { method, headers: { Authorization: `Bearer ${auth.access_token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) }, 'google_sheets');
  const rangePath = range => `/values/${encodeURIComponent(range)}`;
  const prepared = new Set();
  const prepare = async (kind, row = 2, verifyWrite = false) => {
    const spec = SHEET_COLUMNS[kind];
    if (!prepared.has(kind)) {
      let meta = await request('?fields=sheets.properties');
      let tab = meta.sheets?.find(s => s.properties.title === spec.title)?.properties;
      if (!tab) {
        try {
          await request(':batchUpdate', 'POST', { requests: [{ addSheet: { properties: { title: spec.title, gridProperties: { rowCount: Math.max(1000, row), columnCount: spec.fields.length, frozenRowCount: 1 } } } }] });
        } catch (error) {
          // Another initializer may have created the same tab. Re-read before failing.
          meta = await request('?fields=sheets.properties');
          if (!meta.sheets?.some(s => s.properties.title === spec.title)) throw error;
        }
      }
      const header = (await request(rangePath(`'${spec.title}'!1:1`))).values?.[0] || [];
      if (header.some(value => value !== '') && JSON.stringify(header) !== JSON.stringify(spec.fields)) throw new SyncError('sheet_headers_do_not_match');
      if (verifyWrite || !header.some(value => value !== '')) await request(rangePath(`'${spec.title}'!A1`) + '?valueInputOption=RAW', 'PUT', { values: [spec.fields] });
      prepared.add(kind);
    }
  };
  return {
    async verify() {
      await prepare('order', 2, true);
      await prepare('registration', 2, true);
      await prepare('member', 2, true);
    },
    async write(kind, record) {
      const spec = SHEET_COLUMNS[kind];
      if (!spec || !Number.isSafeInteger(record.id) || record.id < 1) throw new SyncError('invalid_record');
      const row = record.id + 1;
      await prepare(kind, row);
      const meta = await request('?fields=sheets.properties');
      const tab = meta.sheets?.find(s => s.properties.title === spec.title)?.properties;
      if (!tab) throw new SyncError('sheet_tab_missing');
      if (tab.gridProperties.rowCount < row) await request(':batchUpdate', 'POST', { requests: [{ appendDimension: { sheetId: tab.sheetId, dimension: 'ROWS', length: row - tab.gridProperties.rowCount + 100 } }] });
      if (tab.gridProperties.columnCount < spec.fields.length) await request(':batchUpdate', 'POST', { requests: [{ appendDimension: { sheetId: tab.sheetId, dimension: 'COLUMNS', length: spec.fields.length - tab.gridProperties.columnCount } }] });
      const range = `'${spec.title}'!A${row}:${String.fromCharCode(64 + spec.fields.length)}${row}`;
      const existing = (await request(rangePath(range))).values?.[0] || [];
      if (existing.some(value => value !== '') && String(existing[0]) !== String(record.id)) throw new SyncError('sheet_row_conflict');
      // RAW preserves phone/reference strings and does not execute user-entered formulas.
      await request(rangePath(range) + '?valueInputOption=RAW', 'PUT', { values: [spec.fields.map(field => record[field] ?? '')] });
    },
  };
}

export async function verifySheets(env, fetcher = fetch, deadline = Date.now() + 22000) {
  try {
    const client = await createSheetsClient(env, fetcher, deadline);
    await client.verify();
    return { verified: true };
  } catch (error) { return { verified: false, issue: error instanceof SyncError ? error.message : 'sync_internal_error' }; }
}

export async function syncStatus(env) {
  const config = sheetsConfig(env);
  const stats = await env.DB.prepare(`SELECT COUNT(*) AS total, COALESCE(SUM(pending),0) AS pending,
    COALESCE(SUM(CASE WHEN pending = 1 AND last_error IS NOT NULL THEN 1 ELSE 0 END),0) AS failed,
    MAX(synced_at) AS lastSynced FROM sheets_sync`).first();
  const failure = await env.DB.prepare('SELECT last_error FROM sheets_sync WHERE pending = 1 AND last_error IS NOT NULL ORDER BY attempts DESC LIMIT 1').first();
  return { configured: config.configured, issue: config.issue || null, ...stats, lastError: failure?.last_error || null };
}

/** Single lease serializes remote writes; revision checks retain concurrent D1 edits. */
export async function drainSheets(env, { fetcher = fetch, deadline = Date.now() + 22000 } = {}) {
  const config = sheetsConfig(env);
  if (!config.configured) return { processed: 0, issue: config.issue };
  const owner = crypto.randomUUID();
  const lease = await env.DB.prepare('UPDATE sheets_sync_lock SET owner = ?, expires_at = ? WHERE id = 1 AND expires_at < ? RETURNING id').bind(owner, Date.now() + 120000, Date.now()).first();
  if (!lease) return { processed: 0, busy: true };
  let processed = 0;
  try {
    const jobs = (await env.DB.prepare('SELECT * FROM sheets_sync WHERE pending = 1 ORDER BY attempts, record_id, kind LIMIT 3').all()).results || [];
    if (!jobs.length) return { processed };
    let client;
    for (const job of jobs) {
      if (Date.now() > deadline - 1000) break;
      try {
        client ||= await createSheetsClient(env, fetcher, deadline);
        const spec = SHEET_COLUMNS[job.kind];
        const record = await env.DB.prepare(`SELECT * FROM ${spec.table} WHERE id = ?`).bind(job.record_id).first();
        if (!record) throw new SyncError('source_record_missing');
        await client.write(job.kind, record);
        await env.DB.prepare(`UPDATE sheets_sync SET pending = 0, attempts = 0, last_error = NULL, synced_at = datetime('now') WHERE kind = ? AND record_id = ? AND version = ?`).bind(job.kind, job.record_id, job.version).run();
        processed++;
      } catch (error) {
        const code = error instanceof SyncError ? error.message : 'sync_internal_error';
        await env.DB.prepare('UPDATE sheets_sync SET attempts = attempts + 1, last_error = ? WHERE kind = ? AND record_id = ? AND version = ?').bind(code, job.kind, job.record_id, job.version).run();
        return { processed, issue: code };
      }
    }
    return { processed };
  } finally {
    await env.DB.prepare('UPDATE sheets_sync_lock SET owner = NULL, expires_at = 0 WHERE id = 1 AND owner = ?').bind(owner).run();
  }
}

export function scheduleSheetsSync(context) {
  if (!sheetsConfig(context.env).configured) return;
  context.waitUntil(drainSheets(context.env).catch(() => console.error('Google Sheets background sync deferred; D1 queue retained.')));
}

/** A platform operator may queue a one-off check in D1 without accessing secrets.
 * Public requests only service an already requested check; they cannot request
 * one or observe its result. The result stays in D1/private admin status.
 */
export async function runRequestedSheetsCheck(env, fetcher = fetch) {
  const owner = crypto.randomUUID();
  const claimed = await env.DB.prepare('UPDATE sheets_connection_check SET owner = ?, lease_until = ? WHERE id = 1 AND requested = 1 AND lease_until < ? RETURNING id').bind(owner, Date.now() + 120000, Date.now()).first();
  if (!claimed) return;
  const deadline = Date.now() + 22000;
  const result = await verifySheets(env, fetcher, deadline);
  await env.DB.prepare(`UPDATE sheets_connection_check SET requested = 0, owner = NULL, lease_until = 0,
    verified_at = CASE WHEN ? = 1 THEN datetime('now') ELSE NULL END, last_error = ? WHERE id = 1 AND owner = ?`)
    .bind(result.verified ? 1 : 0, result.issue || null, owner).run();
  if (result.verified) await drainSheets(env, { fetcher, deadline });
}

export function scheduleRequestedSheetsCheck(context) {
  if (!context.env.GOOGLE_SHEETS_SERVICE_ACCOUNT) return;
  context.waitUntil(runRequestedSheetsCheck(context.env).catch(() => console.error('Requested Sheets check deferred.')));
}
