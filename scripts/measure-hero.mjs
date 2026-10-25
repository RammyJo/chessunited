import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle0' });
const data = await page.evaluate(() => {
  const title = document.querySelector('.hero-title');
  const copy = document.querySelector('.hero-copy');
  const style = getComputedStyle(title);
  const canvas = document.createElement('canvas').getContext('2d');
  const measure = (size) => {
    canvas.font = `${style.fontWeight} ${size}px ${style.fontFamily}`;
    return canvas.measureText('EVERYONE.').width;
  };
  const current = parseFloat(style.fontSize);
  const widths = [current, 110, 106, 100, 96, 90].map((size) => ({
    size,
    text: Math.round(measure(size)),
    fits: measure(size) <= copy.clientWidth,
  }));
  return { fontSize: style.fontSize, family: style.fontFamily, copyWidth: copy.clientWidth, widths };
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
