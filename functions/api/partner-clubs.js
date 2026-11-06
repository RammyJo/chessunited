import { scheduleRequestedSheetsCheck } from './_sheets.js';
import { json, fail, readJson, clean, isEmail, hasDb, noDb } from './_utils.js';

/**
 * /api/partner-clubs
 *
 * GET  — the published partner-club directory: every approved club with its
 *        approved tournament listings, grouped and ready to render.
 * POST — a club officer submits their club (and optionally one upcoming
 *        tournament). Nothing appears on the site until a club officer
 *        approves it.
 */

export async function onRequestGet(context) {
  const { env } = context;
  if (!hasDb(env)) return noDb();

  try {
    const clubs = await env.DB.prepare(
      `SELECT id, club_name, city, province, country, meeting_place, meeting_schedule,
              contact_name, facebook
         FROM partner_clubs
        WHERE status = 'approved'
        ORDER BY country, province, city, club_name`,
    ).all();

    const events = await env.DB.prepare(
      `SELECT partner_club_id, title, event_date, venue, details
         FROM partner_events
        WHERE status = 'approved'
        ORDER BY event_date`,
    ).all();

    const byClub = new Map();
    for (const event of events.results ?? []) {
      const list = byClub.get(event.partner_club_id) ?? [];
      list.push({
        title: event.title,
        date: event.event_date,
        venue: event.venue,
        details: event.details,
      });
      byClub.set(event.partner_club_id, list);
    }

    const results = (clubs.results ?? []).map((club) => ({
      name: club.club_name,
      city: club.city,
      province: club.province,
      country: club.country,
      meetingPlace: club.meeting_place,
      meetingSchedule: club.meeting_schedule,
      contactName: club.contact_name,
      facebook: club.facebook,
      events: byClub.get(club.id) ?? [],
    }));

    scheduleRequestedSheetsCheck(context);
    return json({ ok: true, count: results.length, clubs: results });
  } catch (error) {
    console.error('partner club read failed', error);
    return fail('The partner club directory is unavailable right now.', 500);
  }
}

export async function onRequestPost({ request, env }) {
  if (!hasDb(env)) return noDb();

  const body = await readJson(request);
  if (!body) return fail('Send a JSON body.');

  const clubName = clean(body.clubName, 140);
  const city = clean(body.city, 80);
  const province = clean(body.province, 80);
  const country = clean(body.country, 80) || 'Philippines';
  const meetingPlace = clean(body.meetingPlace, 200);
  const meetingSchedule = clean(body.meetingSchedule, 160);
  const contactName = clean(body.contactName, 120);
  const contactEmail = clean(body.contactEmail, 160).toLowerCase();
  const contactPhone = clean(body.contactPhone, 24);
  const facebook = clean(body.facebook, 240);
  const notes = clean(body.notes, 600);

  const eventTitle = clean(body.eventTitle, 140);
  const eventDate = clean(body.eventDate, 10);
  const eventVenue = clean(body.eventVenue, 180);
  const eventDetails = clean(body.eventDetails, 400);

  const fields = {};
  if (clubName.length < 3) fields.clubName = 'Enter the club name.';
  if (city.length < 2) fields.city = 'Enter the city or municipality.';
  if (meetingPlace.length < 3) fields.meetingPlace = 'Where does the club meet?';
  if (meetingSchedule.length < 3) fields.meetingSchedule = 'When does the club meet?';
  if (contactName.length < 2) fields.contactName = 'Enter the club officer’s name.';
  if (!isEmail(contactEmail)) fields.contactEmail = 'Enter a valid email address.';
  if (facebook && !/^https?:\/\//i.test(facebook)) {
    fields.facebook = 'Paste the full page URL, starting with https://';
  }
  if (eventTitle && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    fields.eventDate = 'Pick the tournament date.';
  }
  if (Object.keys(fields).length) return fail('Please check the highlighted fields.', 422, fields);

  try {
    const inserted = await env.DB.prepare(
      `INSERT INTO partner_clubs
         (club_name, city, province, country, meeting_place, meeting_schedule,
          contact_name, contact_email, contact_phone, facebook, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    )
      .bind(
        clubName,
        city,
        province,
        country,
        meetingPlace,
        meetingSchedule,
        contactName,
        contactEmail,
        contactPhone,
        facebook,
        notes,
      )
      .run();

    const clubId = inserted.meta?.last_row_id;

    if (eventTitle && clubId) {
      await env.DB.prepare(
        `INSERT INTO partner_events
           (partner_club_id, title, event_date, venue, details, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
      )
        .bind(clubId, eventTitle, eventDate, eventVenue, eventDetails)
        .run();
    }

    return json({
      ok: true,
      message:
        'Thank you — a Chess United officer reviews the details before the club appears in the directory.',
    });
  } catch (error) {
    console.error('partner club insert failed', error);
    return fail('Could not save the club details. Please try again.', 500);
  }
}
