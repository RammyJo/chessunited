import { json, fail, isAdmin, requireAdmin, hasDb, noDb } from '../_utils.js';
import { drainSheets, syncStatus, verifySheets } from '../_sheets.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (!hasDb(env)) return noDb();
  if (!(await isAdmin(request, env))) return requireAdmin(env);
  if (!['GET', 'POST'].includes(request.method)) return fail('Method not supported.', 405);
  try {
    const result = request.method === 'POST' ? (new URL(request.url).searchParams.get('check') === '1' ? await verifySheets(env) : await drainSheets(env)) : null;
    return json({ ok: true, ...await syncStatus(env), result });
  } catch {
    return fail('Google Sheets sync is unavailable. D1 records are retained.', 503);
  }
}
