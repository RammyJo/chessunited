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
import {prepareSubmission,submissionStatement,savedSubmission,SubmissionError} from './_submissions.js';

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

  const event = Object.hasOwn(TOURNAMENTS,eventSlug) ? TOURNAMENTS[eventSlug] : null;

  const fields = {};
  if (!event) fields.eventSlug = 'Choose a tournament.';
  else if (!Object.hasOwn(event.divisions,division)) fields.division = 'Choose a division.';
  if (fullName.length < 3) fields.fullName = 'Enter the player’s full name.';
  if (!isEmail(email)) fields.email = 'Enter a valid email address.';
  if (!isPhone(phoneRaw)) fields.phone = 'Use a PH mobile number, e.g. 09171234567.';
  if (!isGcashRef(gcashRef)) {
    fields.gcashRef = 'Enter the 13-digit GCash reference number from your receipt.';
  }
  if (Object.keys(fields).length) return fail('Please check the highlighted fields.', 422, fields);

  if(memberNo && !/^CU-\d{4}-(?:\d{4}|\d{8})$/.test(memberNo))return fail('Enter a valid member number.',422,{memberNo:'Use your club member number, or leave this blank.'});
  const amount = event.divisions[division];
  let submission;
  try{submission=await prepareSubmission(env,'registration',body,{eventSlug,division,fullName,email,phoneRaw,club,memberNo,gcashRef,notes});if(submission.response)return json(submission.response);}catch(e){return fail(e instanceof SubmissionError?e.message:'Please retry the entry.',e instanceof SubmissionError?e.status:503);}
  if(Date.now()>=Date.parse(event.registrationClosesAt))return fail('Registration for this event has closed. Please choose an upcoming tournament.',422);
  const response={ok:true,registration:{eventSlug,eventName:event.name,division,fullName,amount,gcashRef,paymentStatus:'pending'},message:'Entry saved. The club verifies receipt in GCash before confirming your slot.'};

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

    const insert = env.DB.prepare(
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
      );
    const marker=await submissionStatement(env,'registration',submission,response);
    await env.DB.batch([insert,...(marker?[marker]:[])]);
  } catch (error) {
    const saved=await savedSubmission(env,submission);if(saved)return json(saved);
    const duplicate=await env.DB.prepare('SELECT id FROM registrations WHERE event_slug=? AND email=?').bind(eventSlug,email).first();
    if(duplicate)return fail('An entry already exists for these details. Contact the club before sending another payment.',409);
    console.error('registration_insert_failed');
    return fail('Could not save the entry. Please try again.', 500);
  }

  scheduleSheetsSync(context);
  return json(response);
}
