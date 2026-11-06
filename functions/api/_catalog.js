/**
 * Server-side price, courier and fee tables.
 *
 * These mirror the club's published lists in `src/data/site.ts`. They live here
 * as well so that every total stored in D1 is recomputed on the server: a
 * browser can post whatever it likes, but only these numbers are ever saved.
 *
 * When the club changes a price in `src/data/site.ts`, change it here too.
 * Underscore-prefixed files are not routed by Cloudflare Pages, so this is
 * import-only.
 */

/** Club merchandise, exactly as published on the club's price list. */
export const CATALOG = {
  tshirt: {
    name: 'T-shirt',
    price: 300,
    group: 'Apparel',
    options: { label: 'Size', values: ['S', 'M', 'L', 'XL', 'XXL'] },
  },
  'polo-shirt': { name: 'Polo shirt', price: 400, group: 'Apparel' },
  'sublimation-shirt': { name: 'Sublimation shirt', price: 600, group: 'Apparel' },
  cap: { name: 'Cap', price: 150, group: 'Apparel' },
  'chess-set': { name: 'Chess set', price: 800, group: 'Chess gear' },
  tumbler: { name: 'Tumbler', price: 250, group: 'Chess gear' },
  mug: { name: 'Mug', price: 120, group: 'Chess gear' },
  'magic-mug': { name: 'Magic mug', price: 180, group: 'Chess gear' },
  mousepad: { name: 'Mousepad', price: 100, group: 'Chess gear' },
  lanyard: { name: 'Lanyard', price: 100, group: 'Chess gear' },
  'member-id': { name: 'Member ID', price: 100, group: 'Chess gear' },
  'wall-clock': { name: 'Wall clock', price: 275, group: 'Desk & study' },
  'table-clock': { name: 'Table clock', price: 250, group: 'Desk & study' },
  notebook: { name: 'Notebook', price: 150, group: 'Desk & study' },
  pen: { name: 'Pen', price: 50, group: 'Desk & study' },
  'hand-fan': { name: 'Hand fan', price: 120, group: 'Small things' },
  'pocket-mirror': { name: 'Pocket mirror', price: 75, group: 'Small things' },
  keychain: { name: 'Keychain', price: 50, group: 'Small things' },
  'ref-magnet': { name: 'Ref magnet', price: 50, group: 'Small things' },
  stickers: { name: 'Stickers', price: 5, group: 'Small things' },
};

/** The club's printed membership ID + lanyard option. */
export const MEMBER_PRINT_FEE = 200;

/**
 * Couriers the club uses — nationwide only for now. `fee` is added to the order
 * total on the server; a null fee means the club has not published an amount
 * yet, so the order is saved with the shipping still to be confirmed.
 */
export const COURIERS = {
  lbc: { label: 'LBC', fee: null },
  jt: { label: 'J&T Express', fee: null },
  pickup: { label: 'Pick up', fee: 0 },
};

/** Tournament entry fees, keyed by event slug then division name. */
export const TOURNAMENTS = {
  'tournament-2-0': {
    name: 'Chess United Tournament 2.0',
    registrationClosesAt: '2026-11-07T18:00:00+08:00',
    divisions: { 'Open Division': 350, 'Kiddies Division': 300 },
  },
  'super-mario-cup': {
    name: 'Ortega Chess Tournament: Super Mario Cup',
    registrationClosesAt: '2026-12-05T17:00:00+08:00',
    divisions: { 'Open Division': 500, 'Kiddies Division': 400 },
  },
};

/**
 * Price a posted basket against CATALOG.
 *
 * A size is only kept when the product actually offers that option and the
 * posted value is one of its values; every price comes from here, never from
 * the browser.
 */
export function priceItems(rawItems) {
  const lines = [];
  let subtotal = 0;

  if (!Array.isArray(rawItems) || !rawItems.length || rawItems.length > 40) return { lines: [], subtotal: 0 };
  const seen = new Set();
  for (const entry of rawItems) {
    const id = typeof entry?.id === 'string' ? entry.id : '';
    if (!Object.hasOwn(CATALOG, id)) return { lines: [], subtotal: 0 };
    const item = CATALOG[id], quantity = entry.qty;
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) return { lines: [], subtotal: 0 };
    const size = item.options ? entry.size : null;
    if (item.options && !item.options.values.includes(size)) return { lines: [], subtotal: 0 };
    const key = id + '|' + (size || '');
    if (seen.has(key)) return { lines: [], subtotal: 0 };
    seen.add(key);
    subtotal += item.price * quantity;
    lines.push({ id, name: item.name, quantity, size, unitPrice: item.price, lineTotal: item.price * quantity });
  }
  return { lines, subtotal };
}
