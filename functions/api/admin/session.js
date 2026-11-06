import { json, fail, readJson, clean, adminLoginResponse, adminLogoutResponse, isAdmin } from '../_utils.js';

/**
 * /api/admin/session — sign in, sign out, or ask who you are.
 *
 * POST   { token }  sign in with the ADMIN_TOKEN set on the Pages project
 * DELETE            sign out
 * GET               { signedIn, configured }
 */

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  if (!body || typeof body.token !== 'string' || !body.token.trim()) return fail('Enter the admin token.',422);
  return adminLoginResponse(env, clean(body.token, 200));
}

export async function onRequestDelete() {
  return adminLogoutResponse();
}

export async function onRequestGet({ request, env }) {
  return json({
    ok: true,
    signedIn: await isAdmin(request, env),
    configured: Boolean(env.ADMIN_TOKEN),
  });
}

export async function onRequest({ request }) {
  return fail(`Method ${request.method} is not supported here.`, 405);
}
