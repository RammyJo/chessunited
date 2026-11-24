import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { upcomingEvents, saturdayEvent, googleCalendarUrl } from '../src/data/site.ts';
import { TOURNAMENTS } from '../functions/api/_catalog.js';
import { onRequestPost } from '../functions/api/registrations.js';
import { manilaToday, eventPhase } from '../public/scripts/event-dates.js';
import { regionalEvents } from '../src/data/regional-events.mjs';

const event = upcomingEvents.find(event => event.slug === 'super-mario-cup');

test('rescheduled event publishes the confirmed date and venue without old fees or times', () => {
  assert.equal(event.date, '2026-12-12');
  assert.equal(event.name, 'Chess United Tournament 3.0');
  assert.equal(TOURNAMENTS[event.slug].name, event.name);
  assert.equal(event.venue, 'SM City La Union');
  assert.equal(event.detailsPending, true);
  assert.deepEqual(event.divisions, []);
  assert.equal(event.start, '');
  assert.equal(event.end, '');
  assert.equal(event.poster, undefined);
  assert.equal(TOURNAMENTS[event.slug].registrationPending, true);
  assert.equal(saturdayEvent.venue, event.venue);
});

test('calendar links reserve the correct day without inventing a start time', async () => {
  const url = new URL(googleCalendarUrl(event, 'https://chessunitedglobal.com/events/'));
  assert.equal(url.searchParams.get('dates'), '20261212/20261213');
  assert.match(url.searchParams.get('location'), /SM City La Union/);
  const ics = (await readFile(new URL('../public/calendar/chess-united-super-mario-cup.ics', import.meta.url), 'utf8')).replace(/\r?\n /g, '');
  assert.match(ics, /DTSTART;VALUE=DATE:20261212/);
  assert.match(ics, /DTEND;VALUE=DATE:20261213/);
  assert.match(ics, /SEQUENCE:2/);
  assert.doesNotMatch(ics, /50000|50,000|20261205/);
});

test('archive keeps multi-day events present through their last Manila day', () => {
  const championship = regionalEvents.find(event => event.slug === 'peoples-city-chess-2026');
  assert.equal(manilaToday(new Date('2026-11-29T15:59:59Z')), '2026-11-29');
  assert.equal(eventPhase(championship, manilaToday(new Date('2026-11-29T15:59:59Z'))), 'present');
  assert.equal(eventPhase(championship, manilaToday(new Date('2026-11-29T16:00:00Z'))), 'past');
  assert.equal(regionalEvents.find(event => event.slug === 'first-la-union-chessmate-2025').date, '2025-12-06');
  assert.equal(regionalEvents.length, 5, 'Expiration does not delete source records');
});

test('poster-sourced calendars include both championship days without inventing hours', async () => {
  const ics = await readFile(new URL('../public/calendar/peoples-city-chess-2026.ics', import.meta.url), 'utf8');
  assert.match(ics, /DTSTART;VALUE=DATE:20261128/);
  assert.match(ics, /DTEND;VALUE=DATE:20261130/);
  assert.doesNotMatch(ics, /DTSTART;TZID|T100000|T090000/);
});

test('stale registration clients cannot create or charge an entry while fees are pending', async () => {
  let databaseTouched = false;
  const response = await onRequestPost({
    request: new Request('https://chessunitedglobal.com/api/registrations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventSlug: event.slug, division: 'Open Division', fullName: 'Fixture Player', email: 'fixture@example.invalid', phone: '09171234567', gcashRef: '1234567890123' }),
    }),
    env: { DB: { prepare() { databaseTouched = true; throw new Error('Must not write'); } } },
  });
  assert.equal(response.status, 409);
  assert.match((await response.json()).error, /official poster/i);
  assert.equal(databaseTouched, false);
});

test('Manila event reserves 19 December without assigning the Pasay partner centre as its venue', async () => {
  const manila = upcomingEvents.find(event => event.slug === 'manila-december-19');
  assert.equal(manila.date, '2026-12-19');
  assert.equal(manila.detailsPending, true);
  assert.equal(manila.venuePending, true);
  assert.equal(manila.start, '');
  assert.deepEqual(manila.divisions, []);
  assert.doesNotMatch(manila.venue, /SM City|NUCFP|Pasay|Rufino/);
  const url = new URL(googleCalendarUrl(manila, 'https://chessunitedglobal.com/events/'));
  assert.equal(url.searchParams.get('dates'), '20261219/20261220');
  const ics = (await readFile(new URL(`../public${manila.ics}`, import.meta.url), 'utf8')).replace(/\r?\n /g, '');
  assert.match(ics, /DTSTART;VALUE=DATE:20261219/);
  assert.match(ics, /DTEND;VALUE=DATE:20261220/);
  assert.doesNotMatch(ics, /DTSTART;TZID|SM City|NUCFP|Pasay|Rufino/);
});
