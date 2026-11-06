import { scheduleSheetsSync } from '../_sheets.js';
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

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!hasDb(env)) return noDb();
  if (!(await isAdmin(request, env))) return requireAdmin(env);

  const body = await readJson(request);
  if (!body) return fail('Send a JSON body.');

  const kind = clean(body.kind, 20);
  const table = Object.hasOwn(TABLES,kind) ? TABLES[kind] : null;
  const rule = Object.hasOwn(ALLOWED,kind) ? ALLOWED[kind] : null;
  const id = Number(body.id);

  if (!table || !rule) return fail('Unknown record type.', 422);
  if (!Number.isSafeInteger(id) || id < 1) return fail('Unknown record id.', 422);

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
  } else if (kind === 'member') {
    if (body.paymentStatus !== undefined) {
      const payment = clean(body.paymentStatus, 20);
      if (!ORDER_PAYMENT.includes(payment)) return fail('Unknown payment status.', 422);
      const member = await env.DB.prepare('SELECT printed_id FROM members WHERE id = ?').bind(id).first();
      if (!member?.printed_id) return fail('This membership has no printed-card payment due.', 422);
      sets.push('payment_status = ?'); values.push(payment);
    }
    if (body.status !== undefined) {
      const status = clean(body.status, 20);
      if (!rule.values.includes(status)) return fail('Unknown status.', 422);
      sets.push('status = ?'); values.push(status);
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
    scheduleSheetsSync(context);
    return json({ ok: true, kind, id });
  } catch (error) {
    console.error('admin_update_failed');
    return fail('Could not save the change.', 500);
  }
}

export async function onRequest({ request }) {
  return fail(`Method ${request.method} is not supported here.`, 405);
}
