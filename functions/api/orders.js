import { scheduleSheetsSync } from './_sheets.js';
import {
  json,
  fail,
  readJson,
  clean,
  isEmail,
  isPhone,
  makeOrderNo,
  hasDb,
  noDb,
} from './_utils.js';
import { CATALOG, COURIERS, priceItems } from './_catalog.js';
import { tokenHash, orderResult } from './_checkout.js';

/**
 * POST /api/orders — place a merchandise order.
 *
 * Body: fullName, email, phone, address, city, province, postcode, country,
 *       courier, items: [{ id, qty, size? }], notes?
 *
 * Saves a payment draft with a server-locked delivery total. The buyer submits
 * the draft after paying via /api/orders/payment; only officers mark it paid.
 */
export async function onRequestPost(context) {
  const { request, env } = context;
  if (!hasDb(env)) return noDb();

  const body = await readJson(request);
  if (!body) return fail('Send a JSON body.');

  const hash = await tokenHash(body.checkoutToken);
  if (!hash) return fail('Reopen checkout to start a secure payment session.', 422);
  const prior = await env.DB.prepare('SELECT * FROM orders WHERE payment_token_hash = ?').bind(hash).first();
  if (prior) return json({ ok: true, order: orderResult(prior) });

  const fullName = clean(body.fullName, 120);
  const email = clean(body.email, 160).toLowerCase();
  const phoneRaw = clean(body.phone, 24);
  const courier = clean(body.courier, 12).toLowerCase();
  const pickup = courier === 'pickup';
  const address = pickup ? '' : clean(body.address, 240);
  const city = pickup ? '' : clean(body.city, 80);
  const province = pickup ? '' : clean(body.province, 80);
  const postcode = pickup ? '' : clean(body.postcode, 16);
  const country = pickup ? '' : clean(body.country, 80) || 'Philippines';
  const notes = clean(body.notes, 400);

  const { lines, subtotal } = priceItems(body.items);

  const fields = {};
  if (fullName.length < 3) fields.fullName = 'Enter your full name.';
  if (!isEmail(email)) fields.email = 'Enter a valid email address.';
  if (!isPhone(phoneRaw)) fields.phone = 'Use a PH mobile number, e.g. 09171234567.';
  if (!pickup && address.length < 8) fields.address = 'Enter the street address the parcel ships to.';
  if (!pickup && city.length < 2) fields.city = 'Enter a city or municipality.';
  if (!pickup && country.toLowerCase() !== 'philippines') fields.country = 'Delivery is within the Philippines.';
  if (!pickup && province.length < 2) fields.province = 'Enter a province or state.';
  if (!Object.hasOwn(COURIERS, courier)) fields.courier = 'Choose a courier or pickup.';
  if (!lines.length) fields.items = 'Add at least one item to the order.';
  else if (lines.some(({ id, size }) => size && !CATALOG[id].options.values.includes(size))) {
    fields.items = 'Choose an available T-shirt size.';
  }
  if (Object.keys(fields).length) return fail('Please check the highlighted fields.', 422, fields);

  const quote = await env.DB.prepare('SELECT * FROM shipping_quotes WHERE id = ?').bind(clean(body.quoteId, 80)).first();
  const setting = await env.DB.prepare('SELECT revision FROM shipping_settings WHERE id=1').first();
  if (!quote || quote.expires_at < Date.now() || quote.config_revision !== setting?.revision || quote.courier !== courier || quote.basket_json !== JSON.stringify(lines) || quote.destination_id !== (pickup ? '' : clean(body.destinationId, 30))) return fail('Your total has expired or your basket changed. Refresh the delivery total before paying.', 409);
  const details = JSON.parse(quote.details_json);
  const expectedServiceId = courier === 'pickup' ? 'pickup' : courier === 'jt' ? 'ez' : 'auto';
  const selectedServiceId = clean(body.serviceId || expectedServiceId, 40);
  if (details.serviceId && details.serviceId !== selectedServiceId) {
    return fail('Your courier service changed. Refresh the shipping rate before paying.', 409);
  }
  const destination = details.destination;
  if (!pickup && (city !== destination.city || province !== destination.province)) return fail('Choose the delivery location again to refresh the total.', 409);
  const shippingFee = quote.shipping_fee;
  const total = Math.round((subtotal + shippingFee) * 100) / 100;
  const orderNo = makeOrderNo();

  try {
    await env.DB.prepare(
      `INSERT INTO orders
         (order_no, full_name, email, phone, ship_address, ship_city, ship_province,
          ship_postcode, ship_country, courier, items_json, subtotal, shipping_note,
          payment_method, payment_status, fulfilment_status, shipping_fee, total, shipping_quote_json, payment_token_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'gcash', 'pending', 'awaiting_payment', ?, ?, ?, ?)`,
    )
      .bind(
        orderNo,
        fullName,
        email,
        phoneRaw,
        address,
        city,
        province,
        postcode,
        country,
        courier,
        JSON.stringify(lines),
        subtotal,
        notes,
        shippingFee, total, quote.details_json, hash,
      )
      .run();
  } catch (error) {
    // A retry may have won the unique payment-session insert. Return its draft.
    const existing = await env.DB.prepare('SELECT * FROM orders WHERE payment_token_hash = ?').bind(hash).first();
    if (existing) return json({ ok: true, order: orderResult(existing) });
    console.error('order insert failed');
    return fail('Could not save the order. Please try again.', 500);
  }

  scheduleSheetsSync(context);
  const saved = await env.DB.prepare('SELECT * FROM orders WHERE payment_token_hash = ?').bind(hash).first();
  return json({ ok: true, order: orderResult(saved) });
}
