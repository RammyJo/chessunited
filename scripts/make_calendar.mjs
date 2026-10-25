/**
 * Generate RFC 5545 calendar files for the two upcoming tournaments.
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
    file: 'chess-united-tournament-2-0.ics',
    uid: 'chess-united-tournament-2-0-2026@chessunited',
    start: '20261107T020000Z', // 10:00 Asia/Manila
    end: '20261107T100000Z', // 18:00 Asia/Manila
    summary: 'Chess United Tournament 2.0',
    location: 'Manna Mall, San Fernando City, La Union',
    description:
      'Open Division (13 and above): registration PHP 350. ' +
      'Kiddies Division (12 and below): registration PHP 300. ' +
      'Tournament runs 10:00 AM to 6:00 PM.',
    url: `${SITE}/events/#tournament-2-0`,
  },
  {
    file: 'chess-united-super-mario-cup.ics',
    uid: 'ortega-super-mario-cup-2026@chessunited',
    start: '20261205T010000Z', // 09:00 Asia/Manila
    end: '20261205T090000Z', // 17:00 Asia/Manila
    summary: 'Ortega Chess Tournament: Super Mario Cup',
    location:
      'Ortega Convention Center, New Government Center, ' +
      'Barangay Sevilla / Sagayad, San Fernando City, La Union',
    description:
      'Open Division (13 and above): registration PHP 500, ' +
      'PHP 50,000 winner take all. Kiddies Division (12 and below): ' +
      'registration PHP 400, PHP 5,000 kids prize. ' +
      '100% of proceeds go to NASUDI. Runs 9:00 AM to 5:00 PM.',
    url: `${SITE}/events/#super-mario-cup`,
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
    'PRODID:-//Chess United//Tournaments//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    'DTSTAMP:20261023T000000Z',
    `DTSTART:${event.start}`,
    `DTEND:${event.end}`,
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
