import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await puppeteer.launch({ headless: 'new', executablePath: CHROME, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
await page.goto('http://localhost:4321/about/', { waitUntil: 'networkidle0' });
await page.evaluate(() => document.querySelector('.global-scope').scrollIntoView({ block: 'center' }));
await new Promise((r) => setTimeout(r, 600));
await page.screenshot({ path: 'research/global-cards.png' });
await browser.close();
console.log('done');
