import { json, fail, readJson, clean, isAdmin, requireAdmin, hasDb, noDb } from '../_utils.js';

/**
 * POST /api/admin/update — move one record forward.
 *
 * Body: { kind, id, status?, trackingNo? }
 *
 * Every status is checked against an allow-list before it reaches the database,
 * so the dashboard cannot write an arbitrary string into a column other code
 * later switches on.
 */

const ALLOWED = {
  member: { column: 'status', values: ['active', 'pending', 'rejected'] },
  registration: {
    column: 'payment_status',
    values: ['pending', 'verified', 'rejected'],
  },
  order: { allowed: true },
  'partner-club': { column: 'status', values: ['pending', 'approved', 'rejected'] },
  'partner-event': { column: 'status', values: ['pending', 'approved', 'rejected'] },
};

const ORDER_PAYMENT = ['pending', 'paid', 'refunded'];
const ORDER_FULFILMENT = ['new', 'packed', 'shipped', 'delivered', 'cancelled'];

const TABLES = {
  member: 'members',
  registration: 'registrations',
  order: 'orders',
  'partner-club': 'partner_clubs',
  'partner-event': 'partner_events',
};

export async function onRequestPost({ request, env }) {
  if (!hasDb(env)) return noDb();
  if (!(await isAdmin(request, env))) return requireAdmin(env);

  const body = await readJson(request);
  if (!body) return fail('Send a JSON body.');

  const kind = clean(body.kind, 20);
  const table = TABLES[kind];
  const rule = ALLOWED[kind];
  const id = Number.parseInt(body.id, 10);

  if (!table || !rule) return fail('Unknown record type.', 422);
  if (!Number.isFinite(id) || id < 1) return fail('Unknown record id.', 422);

  const sets = [];
  const values = [];

  if (kind === 'order') {
    const payment = clean(body.paymentStatus, 20);
    const fulfilment = clean(body.fulfilmentStatus, 20);
    const trackingNo = clean(body.trackingNo, 60);

    if (payment) {
      if (!ORDER_PAYMENT.includes(payment)) return fail('Unknown payment status.', 422);
      sets.push('payment_status = ?');
      values.push(payment);
    }
    if (fulfilment) {
      if (!ORDER_FULFILMENT.includes(fulfilment)) return fail('Unknown fulfilment status.', 422);
      sets.push('fulfilment_status = ?');
      values.push(fulfilment);
    }
    if (body.trackingNo !== undefined) {
      sets.push('tracking_no = ?');
      values.push(trackingNo);
    }
  } else {
    const status = clean(body.status, 20);
    if (!rule.values.includes(status)) return fail('Unknown status.', 422);
    sets.push(`${rule.column} = ?`);
    values.push(status);
  }

  if (!sets.length) return fail('Nothing to update.', 422);

  try {
    const result = await env.DB.prepare(
      `UPDATE ${table} SET ${sets.join(', ')} WHERE id = ?`,
    )
      .bind(...values, id)
      .run();

    if (!result.meta?.changes) return fail('That record no longer exists.', 404);
    return json({ ok: true, kind, id });
  } catch (error) {
    console.error('admin update failed', error);
    return fail('Could not save the change.', 500);
  }
}

export async function onRequest({ request }) {
  return fail(`Method ${request.method} is not supported here.`, 405);
}
