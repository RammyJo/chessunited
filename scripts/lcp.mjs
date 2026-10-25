import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 412, height: 823, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
await page.evaluateOnNewDocument(() => {
  window.__lcp = [];
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      window.__lcp.push({
        startTime: Math.round(entry.startTime),
        size: entry.size,
        tag: entry.element?.tagName,
        cls: entry.element?.className,
        src: entry.url,
        text: (entry.element?.innerText || '').slice(0, 60),
      });
    }
  }).observe({ type: 'largest-contentful-paint', buffered: true });
});
const client = await page.createCDPSession();
await client.send('Network.enable');
await client.send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 150,
  downloadThroughput: (1.6384 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
});
await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await page.goto('http://127.0.0.1:4321/gallery/', { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise((r) => setTimeout(r, 5000));
const entries = await page.evaluate(() => window.__lcp);
console.log(JSON.stringify(entries, null, 2));
await browser.close();
