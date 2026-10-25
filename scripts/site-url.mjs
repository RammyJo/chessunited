/**
 * Single source of truth for the absolute site URL used by canonical links,
 * Open Graph tags, the sitemap, robots.txt and the calendar files.
 *
 * Override at build time with SITE_URL when the site moves to another host
 * (for example a custom club domain).
 */
export const SITE_URL = (
  process.env.SITE_URL || 'https://chessunited.pages.dev'
).replace(/\/+$/, '');
