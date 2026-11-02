/**
 * Shared helpers for the Chess United Pages Functions API.
 *
 * Files and directories beginning with `_` are not routed by Cloudflare Pages,
 * so this module is import-only.
 */

const enc = new TextEncoder();

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extraHeaders,
    },
  });
}

export function fail(message, status = 400, fields) {
  return json({ ok: false, error: message, fields }, status);
}

export async function readJson(request) {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? body : null;
  } catch {
    return null;
  }
}

/** Trim, collapse whitespace and cap length — every value is user input. */
export function clean(value, max = 200) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/\s+/g, ' ').trim().slice(0, max);
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/** Philippine mobile numbers, loosely: 09XXXXXXXXX / +639XXXXXXXXX. */
export function isPhone(value) {
  return /^(\+?63|0)9\d{9}$/.test(value.replace(/[\s-]/g, ''));
}

export function isGcashRef(value) {
  // GCash reference numbers are 13 digits.
  return /^\d{13}$/.test(value.replace(/[\s-]/g, ''));
}

export function toInt(value, fallback = 0) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

/* --------------------------------------------------------------------------
   Identifiers
   -------------------------------------------------------------------------- */

function randomDigits(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const byte of bytes) out += (byte % 10).toString();
  return out;
}

/** Human-facing member number, e.g. CU-2026-0042. */
export function makeMemberNo() {
  const year = new Date().getUTCFullYear();
  return `CU-${year}-${randomDigits(4)}`;
}

/** Order number, e.g. ORD-4F2K9A. */
export function makeOrderNo() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  return `ORD-${out}`;
}

/* --------------------------------------------------------------------------
   Admin session — a signed, HttpOnly cookie. The signature is an HMAC over the
   cookie value using ADMIN_TOKEN, so the token itself never ships to the client.
   -------------------------------------------------------------------------- */

const COOKIE = 'cu_admin';
const SESSION_HOURS = 12;

async function hmac(value, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Length-independent comparison for secrets. */
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function adminToken(env) {
  return env.ADMIN_TOKEN || '';
}

/**
 * Verify a submitted token and, when it matches, hand back a signed cookie.
 * The token itself is never stored in the cookie — only an HMAC of it.
 */
export async function adminLoginResponse(env, supplied) {
  const token = adminToken(env);
  if (!token) return fail('The admin dashboard is not configured (ADMIN_TOKEN is unset).', 500);
  if (!supplied || !safeEqual(String(supplied), token)) {
    return fail('That admin token is not correct.', 401);
  }

  const expires = Date.now() + SESSION_HOURS * 3600 * 1000;
  const payload = `admin.${expires}`;
  const signature = await hmac(payload, token);

  return json(
    { ok: true, expires },
    200,
    {
      'set-cookie': `${COOKIE}=${payload}.${signature}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${
        SESSION_HOURS * 3600
      }`,
    },
  );
}

export function adminLogoutResponse() {
  return json({ ok: true }, 200, {
    'set-cookie': `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
  });
}

export async function isAdmin(request, env) {
  const token = adminToken(env);
  if (!token) return false;

  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/(?:^|;\s*)cu_admin=([^;]+)/);
  if (!match) return false;

  const raw = decodeURIComponent(match[1]);
  const parts = raw.split('.');
  if (parts.length !== 3) return false;

  const [scope, expires, signature] = parts;
  if (scope !== 'admin') return false;
  if (!Number.isFinite(Number(expires)) || Number(expires) < Date.now()) return false;

  const expected = await hmac(`${scope}.${expires}`, token);
  return safeEqual(signature, expected);
}

export function requireAdmin(env) {
  return fail('Sign in to the admin dashboard first.', 401);
}

/* --------------------------------------------------------------------------
   Misc
   -------------------------------------------------------------------------- */

/** True when a D1 binding is actually configured (guards nicer error text). */
export function hasDb(env) {
  return Boolean(env && env.DB && typeof env.DB.prepare === 'function');
}

export function noDb() {
  return fail(
    'The database is not connected yet. Create the D1 database and set its id in wrangler.toml.',
    503,
  );
}
