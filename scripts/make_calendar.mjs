/**
 * Generate RFC 5545 calendars for tournaments and recurring Saturday chess.
 *
 * Times are converted from Asia/Manila (UTC+08:00) to UTC so no VTIMEZONE
 * block is required. Output uses CRLF and RFC-compliant line folding.
 *
 * Runs before astro build so the URLs follow SITE_URL on every deployment.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { SITE_URL } from './site-url.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public', 'calendar');
const SITE = SITE_URL;

const events = [
  {
    file: 'chess-united-saturday-chess.ics',
    uid: 'chess-united-saturday-chess@chessunited',
    updated: true,
    start: '20261121T020000Z', // 10:00 Asia/Manila
    end: '20261121T060000Z', // 14:00 Asia/Manila
    recurrence: 'FREQ=WEEKLY;BYDAY=SA',
    summary: 'Saturday chess at SM City La Union',
    location: 'SM City La Union, San Fernando City, La Union',
    description: 'Chess for everyone: kids, teens and adults. Every Saturday, 10:00 AM to 2:00 PM. Join the club group for updates: https://m.me/j/HytA8igzNnAWDEXo/?send_source=gc:qr_code_scan_c',
    url: `${SITE}/events/#saturday-chess`,
  },
  {
    file: 'chess-united-tournament-2-0.ics',
    uid: 'chess-united-tournament-2-0-2026@chessunited',
    start: '20261107T020000Z', // 10:00 Asia/Manila
    end: '20261107T100000Z', // 18:00 Asia/Manila
    summary: 'Chess United Tournament 2.0',
    location: 'Robinsons Mall La Union, San Fernando City, La Union',
    description:
      'Open Division (13 and above): registration PHP 350. ' +
      'Kiddies Division (12 and below): registration PHP 300. ' +
      'Tournament runs 10:00 AM to 6:00 PM.',
    url: `${SITE}/events/#tournament-2-0`,
  },
  {
    file: 'chess-united-super-mario-cup.ics',
    uid: 'ortega-super-mario-cup-2026@chessunited',
    start: '20261212',
    end: '20261213',
    dateOnly: true,
    updated: true,
    summary: 'Chess United Tournament at SM City La Union',
    location: 'SM City La Union, San Fernando City, La Union',
    description: 'Date and venue confirmed. Time, divisions, entry fees and prizes will be announced with the new official poster. Registration details coming soon.',
    url: `${SITE}/events/#super-mario-cup`,
  },
  {
    file: 'chess-united-manila-december-19.ics',
    uid: 'chess-united-manila-20261219@chessunited',
    start: '20261219', end: '20261220', dateOnly: true,
    updated: true, stamp: '20261123T000000Z',
    summary: 'Chess United Manila Tournament',
    location: 'Manila, Metro Manila - venue to be announced',
    description: 'Tournament date announced by Chess United. Venue, time, divisions and entry details to follow. Follow the community group for updates.',
    url: `${SITE}/events/#manila-december-19`,
  },
];

const esc = (text) =>
  text
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
    .replaceAll('\n', '\\n');

/** Fold a content line to <=75 octets; continuation lines start with a space. */
function fold(line, limit = 75) {
  const chunks = [];
  let current = line;
  while (Buffer.byteLength(current, 'utf8') > limit) {
    let cut = Math.min(current.length, limit);
    while (Buffer.byteLength(current.slice(0, cut), 'utf8') > limit) cut -= 1;
    chunks.push(current.slice(0, cut));
    current = ` ${current.slice(cut)}`;
    limit = 75;
  }
  chunks.push(current);
  return chunks;
}

await mkdir(OUT, { recursive: true });

for (const event of events) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Chess United//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${event.stamp ?? (event.updated ? '20261119T090000Z' : '20261023T000000Z')}`,
    ...(event.updated ? [`LAST-MODIFIED:${event.stamp ?? '20261119T090000Z'}`, 'SEQUENCE:1'] : []),
    `DTSTART${event.dateOnly ? ';VALUE=DATE' : ''}:${event.start}`,
    `DTEND${event.dateOnly ? ';VALUE=DATE' : ''}:${event.end}`,
    ...(event.recurrence ? [`RRULE:${event.recurrence}`] : []),
    `SUMMARY:${esc(event.summary)}`,
    `LOCATION:${esc(event.location)}`,
    `DESCRIPTION:${esc(event.description)}`,
    `URL:${event.url}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  const payload = `${lines.flatMap((line) => fold(line)).join('\r\n')}\r\n`;
  const file = path.join(OUT, event.file);
  await writeFile(file, payload, 'utf8');
  console.log(`calendar: ${event.file} (${Buffer.byteLength(payload, 'utf8')} bytes)`);
}
