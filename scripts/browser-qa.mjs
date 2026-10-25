/**
 * Browser QA with a real Chrome build.
 *
 * - desktop 1440x900 and mobile 390x844 for every page
 * - waits for fonts and every image to decode
 * - checks horizontal overflow, broken images, duplicate ids, console errors
 * - exercises the mobile menu and the gallery lightbox
 * - writes full-page screenshots to the OS temp directory
 *
 * Requires the local preview server (npm run preview) and Chrome.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const BASE = (process.env.QA_URL || 'http://127.0.0.1:4321').replace(/\/$/, '');
const CHROME =
  process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = path.join(os.tmpdir(), 'chessunited-qa', 'screens');

const pages = [
  ['home', '/'],
  ['events', '/events/'],
  ['play', '/play/'],
  ['gallery', '/gallery/'],
  ['shop', '/shop/'],
  ['about', '/about/'],
  ['visit', '/visit/'],
  ['404', '/404.html'],
];

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const errors = [];
const warnings = [];
const results = [];

await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  protocolTimeout: 180000,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=1'],
});

for (const viewport of viewports) {
  for (const [name, route] of pages) {
    const page = await browser.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.setViewport({
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      isMobile: viewport.name === 'mobile',
      hasTouch: viewport.name === 'mobile',
    });

    const response = await page.goto(`${BASE}${route}`, {
      waitUntil: 'networkidle0',
      timeout: 45000,
    });

    await page.evaluate(async () => {
      // Scroll through the page so lazy images and reveal observers fire.
      const step = Math.max(300, Math.floor(window.innerHeight * 0.8));
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 70));
      }
      window.scrollTo(0, 0);
      await new Promise((resolve) => setTimeout(resolve, 200));

      // The headless browser does not paint intermediate scroll positions, so
      // explicitly settle scroll-triggered state before capturing.
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in'));
      document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
        img.loading = 'eager';
      });

      await document.fonts.ready;
      await Promise.all(
        Array.from(document.images).map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                const done = () => resolve();
                img.addEventListener('load', done, { once: true });
                img.addEventListener('error', done, { once: true });
                setTimeout(done, 8000);
              }),
        ),
      );
    });
    await new Promise((resolve) => setTimeout(resolve, 350));

    const data = await page.evaluate(() => {
      const html = document.documentElement;
      const overflow = html.scrollWidth - window.innerWidth;
      const offenders = [];
      if (overflow > 1) {
        for (const el of document.querySelectorAll('body *')) {
          const style = getComputedStyle(el);
          if (style.position === 'fixed') continue;
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          if (rect.right > window.innerWidth + 1 || rect.left < -1) {
            offenders.push({
              tag: el.tagName.toLowerCase(),
              class: typeof el.className === 'string' ? el.className.slice(0, 80) : '',
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width),
            });
            if (offenders.length >= 8) break;
          }
        }
      }

      const brokenImages = Array.from(document.images)
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.currentSrc || img.src);

      const ids = Array.from(document.querySelectorAll('[id]')).map((el) => el.id);
      const duplicateIds = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];

      const imagesWithoutAlt = Array.from(document.images).filter(
        (img) => !img.hasAttribute('alt'),
      ).length;

      const emptyControls = Array.from(
        document.querySelectorAll('a[href], button:not([disabled])'),
      )
        .filter((el) => {
          const text = (el.innerText || el.textContent || '').trim();
          const label = el.getAttribute('aria-label') || el.getAttribute('title') || '';
          const imgAlt = Array.from(el.querySelectorAll('img')).some((img) => img.alt);
          return !text && !label && !imgAlt;
        })
        .length;

      const countdown = document.querySelector('[data-countdown]');
      const mark = document.querySelector('.hero-title .mark');
      const heroThirdLine = document.querySelector('.hero-title .line:nth-child(3)');

      return {
        title: document.title,
        h1: Array.from(document.querySelectorAll('h1')).map((el) => el.innerText.trim()),
        overflow,
        offenders,
        brokenImages,
        duplicateIds,
        imagesWithoutAlt,
        emptyControls,
        fonts: {
          archivo: document.fonts.check('700 16px "Archivo Black"'),
          manrope: document.fonts.check('400 16px Manrope'),
        },
        countdown: countdown ? countdown.innerText.replace(/\s+/g, ' ').trim() : null,
        heroMarkRects: mark ? mark.getClientRects().length : null,
        heroThirdLineHeight: heroThirdLine
          ? Math.round(heroThirdLine.getBoundingClientRect().height)
          : null,
        nav: (() => {
          const toggle = document.querySelector('[data-menu-toggle]');
          return toggle ? getComputedStyle(toggle).display : null;
        })(),
      };
    });

    const shot = path.join(OUT, `${name}-${viewport.name}.png`);
    await page.screenshot({ path: shot, fullPage: true });

    if (response && response.status() >= 400) {
      errors.push(`${name}/${viewport.name}: HTTP ${response.status()}`);
    }
    if (data.overflow > 1) {
      errors.push(
        `${name}/${viewport.name}: horizontal overflow ${data.overflow}px ${JSON.stringify(data.offenders)}`,
      );
    }
    if (data.brokenImages.length) {
      errors.push(`${name}/${viewport.name}: broken images ${data.brokenImages.join(', ')}`);
    }
    if (data.duplicateIds.length) {
      errors.push(`${name}/${viewport.name}: duplicate ids ${data.duplicateIds.join(', ')}`);
    }
    if (data.imagesWithoutAlt) {
      errors.push(`${name}/${viewport.name}: ${data.imagesWithoutAlt} image(s) without alt`);
    }
    if (data.emptyControls) {
      errors.push(`${name}/${viewport.name}: ${data.emptyControls} unnamed link/button(s)`);
    }
    if (!data.fonts.archivo || !data.fonts.manrope) {
      errors.push(`${name}/${viewport.name}: webfont not loaded ${JSON.stringify(data.fonts)}`);
    }
    if (data.h1.length !== 1) {
      errors.push(`${name}/${viewport.name}: ${data.h1.length} h1 element(s)`);
    }
    if (data.heroMarkRects && data.heroMarkRects > 1) {
      errors.push(`${name}/${viewport.name}: hero word "everyone." wraps across ${data.heroMarkRects} lines`);
    }
    if (consoleErrors.length) {
      errors.push(`${name}/${viewport.name}: console errors ${consoleErrors.slice(0, 3).join(' | ')}`);
    }
    if (pageErrors.length) {
      errors.push(`${name}/${viewport.name}: page errors ${pageErrors.slice(0, 3).join(' | ')}`);
    }

    // Interactions
    let menu = null;
    if (viewport.name === 'mobile') {
      menu = await page.evaluate(async () => {
        const toggle = document.querySelector('[data-menu-toggle]');
        const menuEl = document.querySelector('[data-menu]');
        if (!toggle || !menuEl) return { skipped: true };
        const before = getComputedStyle(toggle).display;
        toggle.click();
        await new Promise((r) => setTimeout(r, 120));
        const opened = menuEl.classList.contains('is-open') && menuEl.getAttribute('aria-hidden') === 'false';
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await new Promise((r) => setTimeout(r, 80));
        const closed = !menuEl.classList.contains('is-open') && menuEl.getAttribute('aria-hidden') === 'true';
        return { before, opened, closed };
      });
      if (menu && !menu.skipped && (!menu.opened || !menu.closed)) {
        errors.push(`${name}: mobile menu failed ${JSON.stringify(menu)}`);
      }
    }

    let lightbox = null;
    if (name === 'gallery' || name === 'home') {
      lightbox = await page.evaluate(async () => {
        const dialog = document.querySelector('[data-lightbox-dialog]');
        const item = document.querySelector('[data-lightbox]');
        if (!dialog || !item) return { skipped: true };
        item.click();
        await new Promise((r) => setTimeout(r, 120));
        const opened = dialog.open;
        const img = dialog.querySelector('[data-lightbox-img]');
        const loaded = img && img.src && img.naturalWidth > 0;
        dialog.close();
        await new Promise((r) => setTimeout(r, 80));
        return { opened, loaded, closed: !dialog.open };
      });
      if (lightbox && !lightbox.skipped && (!lightbox.opened || !lightbox.loaded || !lightbox.closed)) {
        errors.push(`${name}: lightbox failed ${JSON.stringify(lightbox)}`);
      }
    }

    if (data.countdown !== null && /^00\s+00\s+00\s+00$/.test(data.countdown.replace(/\D+/g, ' ').trim())) {
      warnings.push(`${name}: countdown is all zeros`);
    }

    results.push({ name, viewport: viewport.name, route, shot, ...data, menu, lightbox });
    await page.close();
  }
}

await browser.close();

await writeFile(
  path.join(OUT, '..', 'browser-qa.json'),
  JSON.stringify({ base: BASE, results, errors, warnings }, null, 2),
);

for (const warning of warnings) console.log(`WARN  ${warning}`);
for (const error of errors) console.log(`FAIL  ${error}`);
console.log(`\n${results.length} page/viewport checks; screenshots in ${OUT}`);
if (errors.length) {
  console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}
console.log(`PASS — 0 errors, ${warnings.length} warning(s)`);
