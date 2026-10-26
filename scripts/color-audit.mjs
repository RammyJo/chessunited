/* Colour audit: lists every colour literal in the source and the build and flags
   anything that is not one of the three brand hues or a shade/tint derived from
   them. Run with `npm run qa:colors`. */
import fs from 'node:fs';
import path from 'node:path';

const BRAND = {
  '#4bbced': 'brand azure (primary)',
  '#c92929': 'brand red (secondary)',
  '#f7e42e': 'brand yellow (micro-accent)',
  '#6dcdf5': 'azure tint',
  '#d7ecf7': 'azure tint (page surface)',
  '#0d6590': 'azure-ink (text-safe)',
  '#0b3f5c': 'on-azure-soft (text-safe)',
  '#16244c': 'ink-2 (deep azure shade)',
  '#0a1533': 'ink (deep azure shade, text)',
  '#bb2424': 'red shade',
  '#a81c1c': 'red-ink (text-safe)',
  '#ffffff': 'white surface',
};

const EXT = /\.(css|astro|ts|tsx|js|svg|html|webmanifest)$/i;
const SKIP = /node_modules|\.git|\.astro$/;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP.test(p)) walk(p, out);
    } else if (EXT.test(entry.name)) out.push(p);
  }
  return out;
}

function expand(hex) {
  const h = hex.slice(1);
  return h.length === 3 ? `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}` : `#${h.toLowerCase()}`;
}

function hueOf(hex) {
  const h = hex.slice(1);
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l: max };
  let hh;
  if (max === r) hh = ((g - b) / d) % 6;
  else if (max === g) hh = (b - r) / d + 2;
  else hh = (r - g) / d + 4;
  return { h: (hh * 60 + 360) % 360, s: d / (1 - Math.abs(2 * max - 1) || 1), l: (max + min) / 2 };
}

/* The three approved hues, with tolerance for rounding when a shade is derived. */
const APPROVED_HUES = [
  { name: 'azure', h: 199, span: 26 },
  { name: 'red', h: 0, span: 14 },
  { name: 'yellow', h: 64, span: 12 },
];

function classify(hex) {
  if (BRAND[hex]) return { ok: true, why: BRAND[hex] };
  const { h, s, l } = hueOf(hex);
  if (s < 0.06 && l > 0.93) return { ok: true, why: 'white / near-white' };
  if (s < 0.06 && l < 0.07) return { ok: true, why: 'black / near-black' };
  const near = APPROVED_HUES.find((a) => {
    const d = Math.min(Math.abs(h - a.h), 360 - Math.abs(h - a.h));
    return d <= a.span;
  });
  if (near) return { ok: true, why: `${near.name} hue derivative` };
  return { ok: false, why: `hue ${h.toFixed(0)}° is not azure, red or yellow` };
}

const roots = process.argv.slice(2).length ? process.argv.slice(2) : ['src', 'public', 'dist'];
const found = new Map();

for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  for (const file of walk(root)) {
    const text = fs.readFileSync(file, 'utf8');
    const push = (value, line) => {
      const key = value.toLowerCase();
      if (!found.has(key)) found.set(key, { n: 0, where: new Set(), first: `${file}:${line}` });
      const rec = found.get(key);
      rec.n += 1;
      rec.where.add(file);
    };
    for (const m of text.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
      const raw = m[0].toLowerCase();
      push(raw.length === 4 ? expand(raw) : raw, text.slice(0, m.index).split('\n').length);
    }
    for (const m of text.matchAll(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,[^)]*)?\)/g)) {
      const rgb = `rgb(${m[1]}, ${m[2]}, ${m[3]})`;
      push(rgb, text.slice(0, m.index).split('\n').length);
    }
  }
}

const rows = [...found.entries()].sort((a, b) => b[1].n - a[1].n);
let violations = 0;
console.log(`Colour literals: ${rows.length}\n`);
for (const [value, rec] of rows) {
  let verdict;
  if (value.startsWith('rgb(')) {
    const [r, g, b] = value.match(/[\d.]+/g).map(Number);
    const hex = `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
    verdict = classify(hex);
  } else {
    verdict = classify(value);
  }
  if (!verdict.ok) violations += 1;
  console.log(
    `${verdict.ok ? 'ok  ' : 'FAIL'} ${value.padEnd(22)} x${String(rec.n).padEnd(4)} ${verdict.why}`
  );
  if (!verdict.ok) console.log(`       first seen at ${rec.first}`);
}
console.log(`\n${violations === 0 ? 'PASS' : 'FAIL'} — ${violations} off-palette colour literal(s)`);
process.exit(violations === 0 ? 0 : 1);
