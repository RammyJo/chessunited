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
import { COURIERS, priceItems } from './_catalog.js';

/**
 * POST /api/orders — place a merchandise or NCF Tap Card order.
 *
 * Body: fullName, email, phone, address, city, province, postcode, country,
 *       courier, items: [{ id, qty }], gcashRef?, notes?
 *
 * No card details ever reach this endpoint. The order is saved as unpaid and
 * the club verifies the GCash reference by hand before shipping.
 */
export async function onRequestPost({ request, env }) {
  if (!hasDb(env)) return noDb();

  const body = await readJson(request);
  if (!body) return fail('Send a JSON body.');

  const fullName = clean(body.fullName, 120);
  const email = clean(body.email, 160).toLowerCase();
  const phoneRaw = clean(body.phone, 24);
  const address = clean(body.address, 240);
  const city = clean(body.city, 80);
  const province = clean(body.province, 80);
  const postcode = clean(body.postcode, 16);
  const country = clean(body.country, 80) || 'Philippines';
  const courier = clean(body.courier, 12).toLowerCase();
  const gcashRef = clean(body.gcashRef, 20).replace(/[\s-]/g, '');
  const notes = clean(body.notes, 400);

  const { lines, subtotal, quote } = priceItems(body.items);

  const fields = {};
  if (fullName.length < 3) fields.fullName = 'Enter the full name for the parcel.';
  if (!isEmail(email)) fields.email = 'Enter a valid email address.';
  if (!isPhone(phoneRaw)) fields.phone = 'Use a PH mobile number, e.g. 09171234567.';
  if (address.length < 8) fields.address = 'Enter the street address the parcel ships to.';
  if (city.length < 2) fields.city = 'Enter a city or municipality.';
  if (province.length < 2) fields.province = 'Enter a province or state.';
  if (!COURIERS[courier]) fields.courier = 'Choose a courier.';
  if (!lines.length) fields.items = 'Add at least one item to the order.';
  if (gcashRef && !/^\d{13}$/.test(gcashRef)) {
    fields.gcashRef = 'A GCash reference number is 13 digits.';
  }
  if (Object.keys(fields).length) return fail('Please check the highlighted fields.', 422, fields);

  const orderNo = makeOrderNo();

  try {
    await env.DB.prepare(
      `INSERT INTO orders
         (order_no, full_name, email, phone, ship_address, ship_city, ship_province,
          ship_postcode, ship_country, courier, items_json, subtotal, shipping_note,
          payment_method, gcash_ref, payment_status, fulfilment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'gcash', ?, 'pending', 'new')`,
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
        gcashRef,
      )
      .run();
  } catch (error) {
    console.error('order insert failed', error);
    return fail('Could not save the order. Please try again.', 500);
  }

  return json({
    ok: true,
    order: {
      orderNo,
      lines,
      subtotal,
      quote,
      courier: COURIERS[courier].label,
      shipTo: [city, province, country].filter(Boolean).join(', '),
      paymentStatus: 'pending',
      fulfilmentStatus: 'new',
    },
  });
}
