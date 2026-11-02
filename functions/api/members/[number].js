import { json, fail, hasDb, noDb } from '../_utils.js';

/**
 * GET /api/members/:number — public lookup used by the digital card page and by
 * club staff verifying a member at the table.
 *
 * Only publishable fields are returned: never the email, phone or address.
 */
export async function onRequestGet({ params, env }) {
  if (!hasDb(env)) return noDb();

  const number = String(params.number || '').toUpperCase();
  if (!/^CU-\d{4}-\d{4}$/.test(number)) return fail('That is not a valid member number.', 404);

  const row = await env.DB.prepare(
    `SELECT member_no, first_name, last_name, division, printed_id, status, created_at
       FROM members WHERE member_no = ?`,
  )
    .bind(number)
    .first();

  if (!row) return fail('No member found with that number.', 404);

  return json({
    ok: true,
    member: {
      memberNo: row.member_no,
      fullName: `${row.first_name} ${row.last_name}`.trim(),
      division: row.division === 'kiddies' ? 'Kiddies Division' : 'Open Division',
      printedId: Boolean(row.printed_id),
      status: row.status,
      since: String(row.created_at || '').slice(0, 10),
    },
  });
}
