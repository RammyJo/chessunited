/**
 * Extra build checks that complement scripts/qa.mjs:
 * metadata, duplicate IDs, sitemap/manifest shape, image dimensions, CSP hashes.
 */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { SITE_URL as SITE } from './site-url.mjs';

const DIST = path.resolve('dist');
const errors = [];
const warnings = [];
const read = (file) => readFile(path.join(DIST, file), 'utf8');

const htmlFiles = [
  ['index.html', '/'],
  ['events/index.html', '/events/'],
  ['play/index.html', '/play/'],
  ['gallery/index.html', '/gallery/'],
  ['shop/index.html', '/shop/'],
  ['about/index.html', '/about/'],
  ['visit/index.html', '/visit/'],
  ['404.html', '/404.html'],
];

let inlineHashes = new Set();
for (const [file, route] of htmlFiles) {
  const html = await read(file);
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '';
  const description = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1] || '';
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1] || '';
  const robots = html.match(/<meta\s+name="robots"\s+content="([^"]*)"/i)?.[1] || '';

  if (!title) errors.push(`${route}: no title`);
  if (!description) errors.push(`${route}: no description`);
  if (title.length > 70) warnings.push(`${route}: title ${title.length} chars`);
  if (description.length < 50 || description.length > 165) {
    warnings.push(`${route}: description ${description.length} chars`);
  }

  if (route === '/404.html') {
    if (!robots.includes('noindex')) errors.push('404: missing noindex');
    if (canonical) warnings.push('404: has a canonical URL');
  } else {
    if (!robots.includes('index')) errors.push(`${route}: missing index robots`);
    const canonicalPath = canonical ? new URL(canonical).pathname : '';
    if (canonicalPath !== route) errors.push(`${route}: canonical path ${canonicalPath}`);
  }

  for (const [name, pattern] of [
    ['og:title', /property="og:title"\s+content="[^"]+"/],
    ['og:description', /property="og:description"\s+content="[^"]+"/],
    ['og:image', /property="og:image"\s+content="[^"]+"/],
    ['og:url', /property="og:url"\s+content="[^"]+"/],
    ['twitter:card', /name="twitter:card"\s+content="[^"]+"/],
    ['twitter:image', /name="twitter:image"\s+content="[^"]+"/],
  ]) {
    if (!pattern.test(html)) errors.push(`${route}: missing ${name}`);
  }

  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  const duplicate = ids.find((id, index) => ids.indexOf(id) !== index);
  if (duplicate) errors.push(`${route}: duplicate id "${duplicate}"`);

  for (const tag of html.match(/<img\b[^>]*>/gi) || []) {
    if (!/\bwidth="\d+"/.test(tag) || !/\bheight="\d+"/.test(tag)) {
      errors.push(`${route}: image without width/height -> ${tag.slice(0, 80)}`);
    }
  }

  if (/fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr|unpkg\.com|cdnjs\.cloudflare/.test(html)) {
    errors.push(`${route}: third-party asset reference`);
  }

  let match;
  const inline = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi;
  while ((match = inline.exec(html)) !== null) {
    if (!match[2].trim()) continue;
    inlineHashes.add(
      `'sha256-${createHash('sha256').update(match[2], 'utf8').digest('base64')}'`,
    );
  }
}

const headers = await read('_headers');
const scriptSrc = headers.match(/script-src ([^;]+);/)?.[1] || '';
if (!scriptSrc.includes("'self'")) errors.push('CSP: script-src missing self');
if (scriptSrc.includes("'unsafe-inline'")) errors.push('CSP: script-src allows unsafe-inline');
for (const hash of inlineHashes) {
  if (!scriptSrc.includes(hash)) errors.push(`CSP: missing inline hash ${hash}`);
}
const allowed = new Set([...scriptSrc.matchAll(/'(sha256-[^']+)'/g)].map((m) => `'${m[1]}'`));
for (const hash of allowed) {
  if (!inlineHashes.has(hash)) warnings.push(`CSP: unused inline hash ${hash}`);
}

const sitemap = await read('sitemap-0.xml');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
for (const route of ['/events/', '/play/', '/gallery/', '/shop/', '/about/', '/visit/']) {
  if (!locs.some((loc) => loc === `${SITE}${route}`)) errors.push(`sitemap: missing ${route}`);
}
if (locs.some((loc) => loc.includes('/404'))) errors.push('sitemap: contains 404');
if (locs.length !== 7) errors.push(`sitemap: expected 7 URLs, found ${locs.length}`);

const manifest = JSON.parse(await read('manifest.webmanifest'));
if (!manifest.name || !manifest.short_name || manifest.start_url !== '/') {
  errors.push('manifest: missing name/short_name/start_url');
}
if (!Array.isArray(manifest.icons) || manifest.icons.length < 2) {
  errors.push('manifest: expected at least two icons');
}

for (const file of ['fonts/OFL-ArchivoBlack.txt', 'fonts/OFL-Manrope.txt']) {
  try {
    await read(file);
  } catch {
    errors.push(`missing dist/${file}`);
  }
}

console.log('Chess United — build verification');
console.log('---------------------------------');
console.log(`pages: ${htmlFiles.length} | sitemap URLs: ${locs.length} | inline hashes: ${inlineHashes.size}`);
for (const warning of warnings) console.log(`WARN  ${warning}`);
for (const error of errors) console.log(`FAIL  ${error}`);
if (errors.length) {
  console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}
console.log(`\nPASS — 0 errors, ${warnings.length} warning(s)`);
