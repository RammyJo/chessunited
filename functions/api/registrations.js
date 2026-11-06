import { scheduleSheetsSync } from './_sheets.js';
import {
  json,
  fail,
  readJson,
  clean,
  isEmail,
  isPhone,
  isGcashRef,
  hasDb,
  noDb,
} from './_utils.js';
import { TOURNAMENTS } from './_catalog.js';

/**
 * POST /api/registrations — enter a club tournament.
 *
 * Body: eventSlug, division, fullName, email, phone, club?, memberNo?,
 *       gcashRef (13 digits), notes?
 *
 * Payment is by GCash scan of the tournament poster, so the entry is stored as
 * pending until a club officer matches the reference number to the club's
 * GCash account.
 */
export async function onRequestPost(context) {
  const { request, env } = context;
  if (!hasDb(env)) return noDb();

  const body = await readJson(request);
  if (!body) return fail('Send a JSON body.');

  const eventSlug = clean(body.eventSlug, 60);
  const division = clean(body.division, 60);
  const fullName = clean(body.fullName, 120);
  const email = clean(body.email, 160).toLowerCase();
  const phoneRaw = clean(body.phone, 24);
  const club = clean(body.club, 120);
  const memberNo = clean(body.memberNo, 20).toUpperCase();
  const gcashRef = clean(body.gcashRef, 20).replace(/[\s-]/g, '');
  const notes = clean(body.notes, 400);

  const event = TOURNAMENTS[eventSlug];

  const fields = {};
  if (!event) fields.eventSlug = 'Choose a tournament.';
  else if (!event.divisions[division]) fields.division = 'Choose a division.';
  if (fullName.length < 3) fields.fullName = 'Enter the player’s full name.';
  if (!isEmail(email)) fields.email = 'Enter a valid email address.';
  if (!isPhone(phoneRaw)) fields.phone = 'Use a PH mobile number, e.g. 09171234567.';
  if (!isGcashRef(gcashRef)) {
    fields.gcashRef = 'Enter the 13-digit GCash reference number from your receipt.';
  }
  if (Object.keys(fields).length) return fail('Please check the highlighted fields.', 422, fields);

  const amount = event.divisions[division];

  try {
    const existing = await env.DB.prepare(
      `SELECT id FROM registrations WHERE event_slug = ? AND email = ? LIMIT 1`,
    )
      .bind(eventSlug, email)
      .first();

    if (existing) {
      return fail(
        'There is already an entry for this tournament under that email. Message the club if you need to change it.',
        409,
      );
    }

    await env.DB.prepare(
      `INSERT INTO registrations
         (event_slug, full_name, email, phone, division, club, member_no, gcash_ref,
          amount, payment_status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    )
      .bind(
        eventSlug,
        fullName,
        email,
        phoneRaw,
        division,
        club,
        memberNo,
        gcashRef,
        amount,
        notes,
      )
      .run();
  } catch (error) {
    console.error('registration insert failed', error);
    return fail('Could not save the entry. Please try again.', 500);
  }

  scheduleSheetsSync(context);
  return json({
    ok: true,
    registration: {
      eventSlug,
      eventName: event.name,
      division,
      fullName,
      amount,
      gcashRef,
      paymentStatus: 'pending',
    },
    message:
      'Entry saved. The club checks the reference number against its GCash account and confirms your slot.',
  });
}
