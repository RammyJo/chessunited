/** Phone regressions. Run against npm run preview; no forms are submitted.
 * The public directory GET is stubbed because Astro preview has no D1 backend.
 */
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
const base = process.env.QA_URL || 'http://127.0.0.1:4321';
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (new URL(request.url()).pathname === '/api/partner-clubs' && request.method() === 'GET') {
      return request.respond({status: 200, contentType: 'application/json', body: JSON.stringify({ok: true, count: 0, clubs: []})});
    }
    request.continue();
  });
  for (const width of (process.env.QA_INTERACTIONS_ONLY ? [] : [320, 390, 768])) {
    await page.setViewport({ width, height: 844, isMobile: true, hasTouch: true });
    for (const route of ['/', '/events/', '/gallery/', '/shop/', '/about/', '/visit/', '/membership/', '/partners/']) {
      await page.goto(base + route, { waitUntil: 'networkidle0' });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `overflow: ${route} at ${width}`);
      await page.click('[data-menu-toggle]');
      await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-menu]')).opacity === '1');
      assert.equal(await page.$eval('main', el => el.inert), true);
      assert.equal(await page.$$eval('.mobile-nav a', links => links.every(el => el.scrollWidth <= el.clientWidth)), true, `menu text clipped at ${width}`);
      await page.keyboard.press('Escape');
      assert.equal(await page.$eval('main', el => el.inert), false);
      assert.equal(await page.evaluate(() => document.activeElement.matches('[data-menu-toggle]')), true);
    }
  }
  if (!process.env.QA_INTERACTIONS_ONLY) console.log('PASS: 24 phone/tablet layouts and menu focus.');
  await page.goto(base, {waitUntil: 'networkidle0'});
  // Short landscape screens must be able to scroll to every navigation link.
  await page.setViewport({width: 667, height: 375, isMobile: true, hasTouch: true});
  await page.click('[data-menu-toggle]');
  await page.$eval('.mobile-menu-foot .btn', el => el.scrollIntoView());
  assert.ok(await page.$eval('.mobile-menu-foot .btn', el => el.getBoundingClientRect().bottom <= innerHeight + 1));
  await page.keyboard.press('Escape');
  await page.setViewport({width: 390, height: 844, isMobile: true, hasTouch: true});
  await page.goto(base + '/shop/', {waitUntil: 'networkidle0'});
  await page.click('label[for="size-tshirt-L"]');
  await page.click('[data-add-to-cart="tshirt"]');
  assert.equal(await page.$eval('[data-checkout-form]', el => el.hidden), true);
  await page.waitForFunction(() => document.querySelector('[data-cart-drawer]').getAttribute('aria-hidden') === 'false');
  assert.ok(await page.$eval('.cart-step', el => el.getBoundingClientRect().height >= 44));
  await page.click('[data-cart-checkout]');
  assert.equal(await page.$eval('[data-checkout-form]', el => el.hidden), false);
  assert.equal(await page.evaluate(() => document.activeElement.closest('[data-checkout-form]') !== null), true);
  assert.ok(await page.$eval('[data-checkout-form] input:not([type=hidden])', el => parseFloat(getComputedStyle(el).fontSize) >= 16));
  await page.goto(base + '/gallery/', {waitUntil: 'networkidle0'});
  await page.click('[data-lightbox]');
  const before = await page.$eval('[data-lightbox-caption]', el => el.textContent);
  // Real touch input exercises browser pointer gesture handling.
  const image = await page.$eval('[data-lightbox-img]', el => { const r = el.getBoundingClientRect(); return {x: r.x + r.width * .75, y: r.y + r.height / 2}; });
  const client = await page.createCDPSession();
  await client.send('Input.dispatchTouchEvent', {type:'touchStart', touchPoints:[image]});
  await client.send('Input.dispatchTouchEvent', {type:'touchMove', touchPoints:[{x:image.x - 100, y:image.y}]});
  await client.send('Input.dispatchTouchEvent', {type:'touchEnd', touchPoints:[]});
  assert.notEqual(await page.$eval('[data-lightbox-caption]', el => el.textContent), before);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.documentElement.classList.contains('has-lightbox-open'));
  await page.emulateMediaFeatures([{name: 'prefers-reduced-motion', value: 'reduce'}]);
  await page.goto(base, {waitUntil: 'networkidle0'});
  assert.equal(await page.$eval('.hero-title .line', el => getComputedStyle(el).animationName), 'none');
  assert.deepEqual(errors, []);
  console.log('PASS: landscape navigation, cart checkout, gallery touch swipe and reduced motion. Directory GET stubbed; no backend writes.');
} finally { await browser.close(); }
