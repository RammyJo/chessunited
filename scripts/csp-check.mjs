/**
 * Serve dist/ with the production CSP from _headers and check for violations.
 * This catches inline-script hashes, data: images, font loading, etc. before deploy.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const DIST = path.resolve('dist');
const PORT = 4322;
const CHROME =
  process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'text/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.ics': 'text/calendar; charset=utf-8',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
};

const headers = await readFile(path.join(DIST, '_headers'), 'utf8');
const csp = headers.match(/Content-Security-Policy:\s*(.+)/)?.[1]?.trim();
if (!csp) throw new Error('No CSP found in dist/_headers');

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    if (rel === '/index.html') rel = '/index.html';
    const file = path.join(DIST, rel);
    if (!file.startsWith(DIST)) throw new Error('path traversal');
    let body;
    try {
      body = await readFile(file);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(await readFile(path.join(DIST, '404.html')));
      return;
    }
    res.writeHead(200, {
      'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
      'Content-Security-Policy': csp,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(String(error));
  }
});

await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const routes = ['/', '/events/', '/play/', '/gallery/', '/shop/', '/about/', '/visit/', '/404.html'];
const errors = [];
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox'],
});

for (const route of routes) {
  const page = await browser.newPage();
  const messages = [];
  page.on('console', (message) => {
    if (message.type() === 'error') messages.push(message.text());
  });
  page.on('pageerror', (error) => messages.push(String(error)));
  const response = await page.goto(`http://127.0.0.1:${PORT}${route}`, {
    waitUntil: 'networkidle0',
  });
  const jsClass = await page.evaluate(() => document.documentElement.classList.contains('js'));
  if (response.status() !== 200) errors.push(`${route}: HTTP ${response.status()}`);
  if (!jsClass) errors.push(`${route}: boot.js did not run under CSP`);
  for (const message of messages) {
    if (/Content Security Policy|Refused to|violates/i.test(message)) {
      errors.push(`${route}: ${message}`);
    }
  }
  console.log(`${route.padEnd(12)} HTTP ${response.status()} | inline JS ${jsClass ? 'ran' : 'BLOCKED'}`);
  await page.close();
}

await browser.close();
server.close();

if (errors.length) {
  console.error('\nCSP FAILURES');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('\nPASS - no CSP violations across 8 pages');
