/**
 * Single source of truth for the absolute site URL used by canonical links,
 * Open Graph tags, the sitemap, robots.txt and the calendar files.
 *
 * Override at build time with SITE_URL when the site moves to another host
 * (for example a custom club domain).
 */
const raw = process.env.SITE_URL || 'https://chessunited.pages.dev';

// SITE_URL is pasted into canonical tags, og:url, the sitemap, robots.txt and the
// downloadable .ics files, so a typo here ships a broken or unsafe URL everywhere.
let parsed;
try {
  parsed = new URL(raw);
} catch {
  throw new Error(`SITE_URL is not an absolute URL: ${JSON.stringify(raw)}`);
}
if (parsed.protocol !== 'https:' || !parsed.hostname.includes('.')) {
  throw new Error(`SITE_URL must be an absolute https:// URL with a host: ${JSON.stringify(raw)}`);
}
if (parsed.username || parsed.password) {
  throw new Error('SITE_URL must not contain credentials');
}

export const SITE_URL = raw.replace(/\/+$/, '');
