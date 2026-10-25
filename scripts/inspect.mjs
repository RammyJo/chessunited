import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle0' });
const before = await page.evaluate(() => ({
  reveal: document.querySelectorAll('.reveal').length,
  notIn: Array.from(document.querySelectorAll('.reveal:not(.is-in)')).map((el) => el.className),
  gallery: Array.from(document.querySelectorAll('.gallery-item img')).map((img) => ({
    src: img.currentSrc,
    complete: img.complete,
    w: img.naturalWidth,
    h: img.naturalHeight,
    opacity: getComputedStyle(img).opacity,
    display: getComputedStyle(img).display,
  })),
}));
await page.evaluate(async () => {
  const step = 500;
  for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 120));
  }
  await new Promise((r) => setTimeout(r, 500));
});
const after = await page.evaluate(() => ({
  notIn: Array.from(document.querySelectorAll('.reveal:not(.is-in)')).map((el) => el.className),
  gallery: Array.from(document.querySelectorAll('.gallery-item img')).map((img) => ({
    complete: img.complete,
    w: img.naturalWidth,
    opacity: getComputedStyle(img).opacity,
    rect: img.getBoundingClientRect().toJSON(),
  })),
  divisions: Array.from(document.querySelectorAll('.division-card')).map((el) => ({
    cls: el.className,
    opacity: getComputedStyle(el).opacity,
    text: el.innerText.slice(0, 40),
  })),
}));
console.log(JSON.stringify({ before, after }, null, 2));
await browser.close();
