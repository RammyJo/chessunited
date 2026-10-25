/**
 * Static QA pass over the built site.
 * Checks metadata, headings, image alt text, JSON-LD, internal links,
 * srcset files, same-page anchors and cross-page anchors.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const DIST = path.resolve('dist');
const errors = [];
const warnings = [];
const stats = { pages: 0, links: 0, images: 0, jsonLd: 0 };

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

const exists = async (file) => {
  try {
    const info = await stat(file);
    return info.isFile();
  } catch {
    return false;
  }
};

const toUrl = (file) => {
  const rel = path.relative(DIST, file).replaceAll('\\', '/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel}`;
};

const isExternal = (url) =>
  /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(url) && !url.startsWith('/');

const clean = (url) => url.split('#')[0].split('?')[0];

const resolveTarget = async (url, fromFile) => {
  const pathname = decodeURIComponent(clean(url));
  if (!pathname) return { file: fromFile, anchor: url.includes('#') ? url.split('#')[1] : '' };

  let candidate;
  if (pathname.startsWith('/')) candidate = path.join(DIST, pathname);
  else candidate = path.resolve(path.dirname(fromFile), pathname);

  if (pathname.endsWith('/')) {
    candidate = path.join(candidate, 'index.html');
  } else if (!path.extname(candidate)) {
    if (!(await exists(candidate))) {
      if (await exists(path.join(candidate, 'index.html'))) candidate = path.join(candidate, 'index.html');
      else if (await exists(`${candidate}.html`)) candidate = `${candidate}.html`;
    }
  }

  return { file: candidate, anchor: url.includes('#') ? url.split('#')[1] : '' };
};

const files = await walk(DIST);
const htmlFiles = files.filter((file) => file.endsWith('.html'));
const htmlCache = new Map();

const getHtml = async (file) => {
  if (!htmlCache.has(file)) htmlCache.set(file, await readFile(file, 'utf8'));
  return htmlCache.get(file);
};

for (const file of htmlFiles) {
  const html = await getHtml(file);
  const url = toUrl(file);
  stats.pages += 1;

  if (!html.includes('<html lang="en"')) errors.push(`${url}: missing lang="en"`);

  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  if (!title) errors.push(`${url}: missing <title>`);
  else if (title.length > 90) warnings.push(`${url}: title is ${title.length} chars`);

  const desc = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1];
  if (!desc) errors.push(`${url}: missing meta description`);
  else if (desc.length > 170) warnings.push(`${url}: description is ${desc.length} chars`);

  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
  if (!canonical) {
    if (url !== '/404.html') errors.push(`${url}: missing canonical`);
  } else if (!/^https:\/\//.test(canonical)) {
    errors.push(`${url}: canonical is not absolute https`);
  }

  const h1s = (html.match(/<h1\b/gi) || []).length;
  if (h1s !== 1) errors.push(`${url}: expected exactly one <h1>, found ${h1s}`);

  if (/on(?:click|load|error|mouseover)=/i.test(html)) errors.push(`${url}: inline event handler found`);
  for (const token of ['undefined', 'NaN', '[object Object]', 'Lorem ipsum', 'TODO:']) {
    if (html.includes(token)) errors.push(`${url}: placeholder "${token}" found`);
  }

  // Images and alt text
  const imgTags = html.match(/<img\b[^>]*>/gi) || [];
  stats.images += imgTags.length;
  for (const tag of imgTags) {
    if (!/\balt="/i.test(tag)) errors.push(`${url}: <img> without alt -> ${tag.slice(0, 90)}`);
  }

  // JSON-LD
  const ldPattern = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let ld;
  while ((ld = ldPattern.exec(html)) !== null) {
    stats.jsonLd += 1;
    try {
      JSON.parse(ld[1]);
    } catch (error) {
      errors.push(`${url}: invalid JSON-LD (${error.message})`);
    }
  }

  // Internal links and assets
  const attrPattern = /\b(?:href|src)="([^"]+)"/g;
  let attr;
  while ((attr = attrPattern.exec(html)) !== null) {
    const target = attr[1].trim();
    if (!target || target === '#' || isExternal(target)) continue;
    if (target.startsWith('data:') || target.startsWith('mailto:') || target.startsWith('tel:')) continue;

    stats.links += 1;
    const resolved = await resolveTarget(target, file);
    if (!(await exists(resolved.file))) {
      errors.push(`${url}: broken link ${target}`);
      continue;
    }

    if (resolved.anchor && resolved.file.endsWith('.html')) {
      const targetHtml = await getHtml(resolved.file);
      const escaped = resolved.anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const idPattern = new RegExp(`\\b(?:id|name)="${escaped}"`);
      if (!idPattern.test(targetHtml)) {
        errors.push(`${url}: missing anchor #${resolved.anchor} in ${toUrl(resolved.file)}`);
      }
    }
  }

  // Responsive image candidates
  const srcsetPattern = /\bsrcset="([^"]+)"/g;
  let srcset;
  while ((srcset = srcsetPattern.exec(html)) !== null) {
    for (const candidate of srcset[1].split(',')) {
      const target = candidate.trim().split(/\s+/)[0];
      if (!target || isExternal(target)) continue;
      stats.links += 1;
      const resolved = await resolveTarget(target, file);
      if (!(await exists(resolved.file))) errors.push(`${url}: missing srcset file ${target}`);
    }
  }
}

// Sitemap sanity
const sitemapFile = path.join(DIST, 'sitemap-0.xml');
if (!(await exists(sitemapFile))) {
  warnings.push('sitemap-0.xml not found (sitemap integration may name it differently)');
} else {
  const sitemap = await readFile(sitemapFile, 'utf8');
  for (const url of ['https://', '/events/', '/play/', '/gallery/', '/shop/', '/about/', '/visit/']) {
    if (!sitemap.includes(url)) warnings.push(`sitemap missing ${url}`);
  }
  if (sitemap.includes('/404')) warnings.push('sitemap includes /404');
}

// robots + headers
for (const required of ['robots.txt', '_headers', 'manifest.webmanifest']) {
  if (!(await exists(path.join(DIST, required)))) errors.push(`missing dist/${required}`);
}

console.log('Chess United — static QA');
console.log('------------------------');
console.log(`pages: ${stats.pages} | links checked: ${stats.links} | images: ${stats.images} | JSON-LD blocks: ${stats.jsonLd}`);
for (const warning of warnings) console.log(`WARN  ${warning}`);
for (const error of errors) console.log(`FAIL  ${error}`);
if (errors.length) {
  console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}
console.log(`\nPASS — 0 errors, ${warnings.length} warning(s)`);
