import { scheduleSheetsSync } from '../_sheets.js';
import { json, fail, isAdmin, requireAdmin, hasDb, noDb } from '../_utils.js';

/**
 * GET /api/admin/queue — everything waiting on a club officer.
 *
 * Returned in one payload so the dashboard needs a single request:
 *  - members       new memberships, with the printed-ID requests flagged
 *  - registrations tournament entries whose GCash reference needs matching
 *  - orders        merchandise orders to pack and ship
 *  - clubs         partner club submissions plus their tournament listings
 */
export async function onRequestGet(context) {
  const { request, env } = context;
  if (!hasDb(env)) return noDb();
  if (!(await isAdmin(request, env))) return requireAdmin(env);

  try {
    const [members, registrations, orders, clubs, events] = await Promise.all([
      env.DB.prepare(
        `SELECT id, member_no, first_name, last_name, email, phone, city, province, division,
                printed_id, gcash_ref, payment_status, status, created_at
           FROM members
          ORDER BY id DESC
          LIMIT 200`,
      ).all(),
      env.DB.prepare(
        `SELECT id, event_slug, full_name, email, phone, division, club, member_no, gcash_ref,
                amount, payment_status, notes, created_at
           FROM registrations
          ORDER BY id DESC
          LIMIT 200`,
      ).all(),
      env.DB.prepare(
        `SELECT id, order_no, full_name, email, phone, ship_address, ship_city, ship_province,
                ship_postcode, ship_country, courier, items_json, subtotal, shipping_note,
                gcash_ref, payment_status, fulfilment_status, tracking_no, shipping_fee, total, payment_claimed_at, created_at
           FROM orders
          ORDER BY id DESC
          LIMIT 200`,
      ).all(),
      env.DB.prepare(
        `SELECT id, club_name, city, province, country, meeting_place, meeting_schedule,
                contact_name, contact_email, contact_phone, facebook, notes, status, created_at
           FROM partner_clubs
          ORDER BY id DESC
          LIMIT 200`,
      ).all(),
      env.DB.prepare(
        `SELECT id, partner_club_id, title, event_date, venue, details, status
           FROM partner_events
          ORDER BY id DESC
          LIMIT 200`,
      ).all(),
    ]);

    const registrationsOut = (registrations.results ?? []).map((row) => ({
      ...row,
      pendingPayment: row.payment_status === 'pending',
    }));

    const ordersOut = (orders.results ?? []).map((row) => {
      let lines = [];
      try {
        lines = JSON.parse(row.items_json);
      } catch {
        lines = [];
      }
      return { ...row, items: lines, items_json: undefined };
    });

    scheduleSheetsSync(context);
    return json({
      ok: true,
      counts: {
        members: members.results?.length ?? 0,
        membersPrintRequests: (members.results ?? []).filter((row) => row.printed_id).length,
        registrations: registrations.results?.length ?? 0,
        registrationsPending: registrationsOut.filter((row) => row.pendingPayment).length,
        orders: orders.results?.length ?? 0,
        ordersPending: ordersOut.filter((row) => row.payment_status === 'pending').length,
        clubs: clubs.results?.length ?? 0,
        clubsPending: (clubs.results ?? []).filter((row) => row.status === 'pending').length,
      },
      members: members.results ?? [],
      registrations: registrationsOut,
      orders: ordersOut,
      partnerClubs: clubs.results ?? [],
      partnerEvents: events.results ?? [],
    });
  } catch (error) {
    console.error('admin queue read failed', error);
    return fail('Could not read the queue.', 500);
  }
}

export async function onRequest({ request }) {
  return fail(`Method ${request.method} is not supported here.`, 405);
}
