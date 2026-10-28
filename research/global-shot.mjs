import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await puppeteer.launch({ headless: 'new', executablePath: CHROME, args: ['--no-sandbox'] });
const page = await browser.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('requestfailed', (r) => errors.push('requestfailed ' + r.url()));

async function shot(name, width, height) {
  await page.setViewport({ width, height });
  await page.evaluate(() => document.getElementById('global-title').scrollIntoView());
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: `research/${name}.png` });
}

await page.goto('http://localhost:4321/about/', { waitUntil: 'networkidle0' });
await page.waitForFunction('document.querySelector(".global-map img").complete', { timeout: 15000 });

const state = await page.evaluate(() => {
  const map = document.querySelector('.global-map img');
  const markers = [...document.querySelectorAll('.map-marker')];
  const labels = markers.map((m) => {
    const l = m.querySelector('.map-label');
    const b = l.getBoundingClientRect();
    const c = map.getBoundingClientRect();
    return { text: l.textContent.trim(), right: Math.round(b.right - c.right), left: Math.round(b.left - c.left) };
  });
  const rects = markers.map((m) => {
    const b = m.getBoundingClientRect();
    const t = m.querySelector('.map-label').textContent.trim();
    return { t, top: Math.round(b.top), bottom: Math.round(b.bottom), right: Math.round(b.right), left: Math.round(b.left) };
  });
  const ph = rects;
  const overlaps = [];
  for (let i = 0; i < ph.length; i++)
    for (let j = i + 1; j < ph.length; j++)
      if (ph[i].left < ph[j].right && ph[j].left < ph[i].right && ph[i].top < ph[j].bottom && ph[j].top < ph[i].bottom)
        overlaps.push(ph[i].t + ' / ' + ph[j].t);
  return {
    mapLoaded: map.complete && map.naturalWidth > 0,
    markers: markers.length,
    hubs: document.querySelectorAll('.hub-card').length,
    nets: document.querySelectorAll('.network-card').length,
    labelsOutsideMap: labels.filter((l) => l.right > 0 || l.left < 0).map((l) => l.text),
    overlaps,
  };
});

await shot('global-desktop', 1280, 900);
await page.evaluate(() => document.querySelector('.global-map').scrollIntoView());
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: 'research/global-map.png' });
await shot('global-mobile', 390, 844);

await browser.close();
console.log(JSON.stringify(state, null, 1), '| errors:', errors.length ? errors : 'none');
