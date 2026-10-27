import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await puppeteer.launch({ headless: 'new', executablePath: CHROME, args: ['--no-sandbox'] });
const page = await browser.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('requestfailed', (r) => errors.push('requestfailed ' + r.url()));

await page.setViewport({ width: 1280, height: 900 });
await page.goto('http://localhost:4321/about/', { waitUntil: 'networkidle0' });
await page.evaluate(() => document.getElementById('sponsor-logos-title').scrollIntoView());
await new Promise((r) => setTimeout(r, 1500));

const state = await page.evaluate(() => {
  const tracks = [...document.querySelectorAll('.sponsor-track')];
  const imgs = [...document.querySelectorAll('.sponsor-card img')];
  return {
    rows: tracks.length,
    cardsPerRow: tracks.map((t) => t.querySelectorAll('.sponsor-card').length),
    anims: tracks.map((t) => getComputedStyle(t).animation.slice(0, 40)),
    loaded: imgs.filter((i) => i.complete && i.naturalWidth > 0).length,
    total: imgs.length,
  };
});
await page.screenshot({ path: 'research/marquee-a.png' });
await new Promise((r) => setTimeout(r, 2500));
await page.screenshot({ path: 'research/marquee-b.png' });

await page.setViewport({ width: 390, height: 844 });
await page.evaluate(() => document.getElementById('sponsor-logos-title').scrollIntoView());
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: 'research/marquee-mobile.png' });

await browser.close();
console.log(JSON.stringify(state), '| errors:', errors.length ? errors : 'none');
