/**
 * Post-build: robots.txt, Cloudflare Pages `_headers`, and CSP hashes.
 *
 * Astro emits inline JSON-LD blocks. Rather than weakening script-src with
 * 'unsafe-inline', this script hashes every inline script actually present in
 * the built HTML and allow-lists those exact hashes.
 */
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { SITE_URL as SITE } from './site-url.mjs';

const DIST = path.resolve('dist');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

const files = await walk(DIST);
const htmlFiles = files.filter((file) => file.endsWith('.html'));

const hashes = new Set();
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const scriptPattern = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptPattern.exec(html)) !== null) {
    const content = match[2];
    if (!content.trim()) continue;
    hashes.add(`'sha256-${createHash('sha256').update(content, 'utf8').digest('base64')}'`);
  }
}

// The Cloudflare host injects its cookieless Web Analytics beacon into HTML
// responses; allow that one first-party host so the edge does not log a CSP
// violation on every page view. Nothing else third-party is permitted.
const INSIGHTS = 'https://static.cloudflareinsights.com';
const scriptSrc = ["'self'", ...hashes, INSIGHTS].join(' ');

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "frame-src https://maps.google.com https://www.google.com",
  "style-src 'self' 'unsafe-inline'",
  `script-src ${scriptSrc}`,
  "connect-src 'self' https://cloudflareinsights.com",
  "manifest-src 'self'",
  'upgrade-insecure-requests',
].join('; ');

// Strict-Transport-Security deliberately has no includeSubDomains: pages.dev is a
// domain Cloudflare shares with every other Pages customer, and pinning its
// subdomains would affect hosts this project does not own.
const headers = `# Cloudflare Pages headers
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  Cross-Origin-Opener-Policy: same-origin
  Strict-Transport-Security: max-age=31536000
  Content-Security-Policy: ${csp}
  Cache-Control: public, max-age=0, must-revalidate

/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/images/*
  Cache-Control: public, max-age=2592000, stale-while-revalidate=604800

/calendar/*
  Cache-Control: public, max-age=86400

/scripts/*
  Cache-Control: public, max-age=86400
`;

await writeFile(path.join(DIST, '_headers'), headers, 'utf8');

await writeFile(
  path.join(DIST, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap-index.xml\n`,
  'utf8',
);

const sitemapFiles = files
  .map((file) => path.basename(file))
  .filter((name) => name.startsWith('sitemap'));

console.log(`postbuild: ${htmlFiles.length} HTML pages`);
console.log(`postbuild: ${hashes.size} inline script hash(es) allow-listed`);
console.log(`postbuild: sitemap -> ${sitemapFiles.join(', ') || 'MISSING'}`);
console.log(`postbuild: _headers + robots.txt written for ${SITE}`);
