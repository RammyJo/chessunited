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
  tshirt: { name: 'T-shirt', price: 300, group: 'Apparel', note: 'medium only' },
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
  /* The NCF Tap Card has no published price yet, so it is quoted rather than
     priced: an order containing it is saved with a null subtotal and the club
     confirms the total before the buyer pays. */
  'ncf-tap-card': {
    name: 'NCF Tap Card',
    price: null,
    group: 'National Chess Federation',
    quote: true,
  },
};

/** The club's printed membership ID + lanyard option. */
export const MEMBER_PRINT_FEE = 200;

/**
 * Couriers the club uses. `scope` is where the club ships with them:
 * the tap card goes nationally by LBC or J&T; merchandise goes worldwide by
 * FedEx, UPS, DHL, LBC or Philippine Post.
 */
export const COURIERS = {
  lbc: { label: 'LBC', scope: 'ph' },
  jt: { label: 'J&T Express', scope: 'ph' },
  fedex: { label: 'FedEx', scope: 'intl' },
  ups: { label: 'UPS', scope: 'intl' },
  dhl: { label: 'DHL', scope: 'intl' },
  phlpost: { label: 'Philippine Post', scope: 'intl' },
};

/** Tournament entry fees, keyed by event slug then division name. */
export const TOURNAMENTS = {
  'tournament-2-0': {
    name: 'Chess United Tournament 2.0',
    divisions: { 'Open Division': 350, 'Kiddies Division': 300 },
  },
  'super-mario-cup': {
    name: 'Ortega Chess Tournament: Super Mario Cup',
    divisions: { 'Open Division': 500, 'Kiddies Division': 400 },
  },
};

/**
 * Price a posted basket against CATALOG.
 *
 * Returns the resolved lines, the subtotal (null when any line still has to be
 * quoted) and a flag for the quote case.
 */
export function priceItems(rawItems) {
  const lines = [];
  let subtotal = 0;
  let quote = false;

  if (Array.isArray(rawItems)) {
    for (const entry of rawItems.slice(0, 40)) {
      const id = typeof entry?.id === 'string' ? entry.id : '';
      const item = CATALOG[id];
      if (!item) continue;

      const qty = Number.parseInt(entry?.qty, 10);
      if (!Number.isFinite(qty) || qty < 1) continue;
      const quantity = Math.min(qty, 99);

      if (item.price === null) quote = true;
      else subtotal += item.price * quantity;

      lines.push({
        id,
        name: item.name,
        quantity,
        unitPrice: item.price,
        lineTotal: item.price === null ? null : item.price * quantity,
      });
    }
  }

  return { lines, subtotal: quote ? null : subtotal, quote };
}
