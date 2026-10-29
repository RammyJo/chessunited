import puppeteer from 'puppeteer-core';

const [, , selector = '.team-grid', out = 'research/section.png'] = process.argv;
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await puppeteer.launch({ headless: 'new', executablePath: CHROME, args: ['--no-sandbox'] });
const page = await browser.newPage();
const errors = [];
page.on('requestfailed', (r) => errors.push('requestfailed ' + r.url()));

const report = {};
for (const [name, width, height] of [['desktop', 1280, 900], ['mobile', 390, 844]]) {
  await page.setViewport({ width, height });
  await page.goto('http://localhost:4321/about/', { waitUntil: 'networkidle0' });
  await page.evaluate((s) => document.querySelector('#officers-junior').closest('.officer-group').scrollIntoView({ block: 'start' }), selector);
  await new Promise((r) => setTimeout(r, 700));
  await page.screenshot({ path: out.replace('.png', `-${name}.png`) });
  if (name === 'desktop') {
    report.state = await page.evaluate(() => ({
      groups: [...document.querySelectorAll('.officer-group')].map((g) => ({
        title: g.querySelector('h3').textContent.trim(),
        cards: g.querySelectorAll('.team-card').length,
      })),
      open: document.querySelectorAll('.team-card--open').length,
      notes: [...document.querySelectorAll('.team-note')].map((n) => n.textContent.trim()),
      names: [...document.querySelectorAll('.team-card h3')].map((n) => n.textContent.trim()),
    }));
  }
}
await browser.close();
console.log(JSON.stringify(report, null, 1), '| errors:', errors.length ? errors : 'none');
