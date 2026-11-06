import { scheduleSheetsSync } from './_sheets.js';
import {
  json,
  fail,
  readJson,
  clean,
  isEmail,
  isPhone,
  isGcashRef,
  toInt,
  makeMemberNo,
  hasDb,
  noDb,
} from './_utils.js';
import { MEMBER_PRINT_FEE } from './_catalog.js';

/**
 * POST /api/members — register a club member and issue a digital membership card.
 *
 * Body: firstName, lastName, email, phone, city?, province?, birthYear?,
 *       division?, printedId? (true when ordering the PHP 200 printed ID + lanyard),
 *       gcashRef? (13 digits, required when printedId is set)
 */
export async function onRequestPost(context) {
  const { request, env } = context;
  if (!hasDb(env)) return noDb();

  const body = await readJson(request);
  if (!body) return fail('Send a JSON body.');

  const firstName = clean(body.firstName, 60);
  const lastName = clean(body.lastName, 60);
  const email = clean(body.email, 160).toLowerCase();
  const phoneRaw = clean(body.phone, 24);
  const city = clean(body.city, 80);
  const province = clean(body.province, 80);
  const birthYear = toInt(body.birthYear, 0);
  const division = body.division === 'kiddies' ? 'kiddies' : 'open';
  const printedId = body.printedId ? 1 : 0;
  const gcashRef = clean(body.gcashRef, 20).replace(/[\s-]/g, '');

  const fields = {};
  if (firstName.length < 2) fields.firstName = 'Enter a first name.';
  if (lastName.length < 2) fields.lastName = 'Enter a last name.';
  if (!isEmail(email)) fields.email = 'Enter a valid email address.';
  if (!isPhone(phoneRaw)) fields.phone = 'Use a PH mobile number, e.g. 09171234567.';
  if (gcashRef && !isGcashRef(gcashRef)) {
    fields.gcashRef = 'A GCash reference number is 13 digits.';
  }
  if (printedId && !isGcashRef(gcashRef)) {
    fields.gcashRef = 'Add the 13-digit GCash reference for the ₱200 printed card.';
  }
  if (Object.keys(fields).length) return fail('Please check the highlighted fields.', 422, fields);

  const memberNo = makeMemberNo();

  try {
    await env.DB.prepare(
      `INSERT INTO members
         (member_no, first_name, last_name, email, phone, city, province, birth_year, division,
          printed_id, gcash_ref, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
    )
      .bind(
        memberNo,
        firstName,
        lastName,
        email,
        phoneRaw,
        city,
        province,
        birthYear || null,
        division,
        printedId,
        gcashRef,
      )
      .run();
  } catch (error) {
    console.error('member insert failed', error);
    return fail('Could not save the registration. Please try again.', 500);
  }

  scheduleSheetsSync(context);
  return json({
    ok: true,
    member: {
      memberNo,
      firstName,
      lastName,
      division: division === 'kiddies' ? 'Kiddies' : 'Open',
      printedId: Boolean(printedId),
      printedFee: printedId ? MEMBER_PRINT_FEE : 0,
      printedNote: printedId
        ? `Printed ID and lanyard: ${MEMBER_PRINT_FEE} pesos, payable by GCash. The club checks your reference number before printing.`
        : 'No printed card requested — your digital card is ready to use right away.',
    },
    cardUrl: `/membership/?m=${encodeURIComponent(memberNo)}#card`,
  });
}
