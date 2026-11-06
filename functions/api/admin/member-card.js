import {json,fail,readJson,isAdmin,requireAdmin,hasDb,noDb,randomToken} from '../_utils.js';
import {digest} from '../_security.js';
export async function onRequestPost({request,env}) {
 if(!hasDb(env))return noDb();if(!(await isAdmin(request,env)))return requireAdmin(env);
 const body=await readJson(request),id=Number(body?.id);if(!Number.isSafeInteger(id)||id<1)return fail('Choose a member.',422);
 const token=randomToken();const row=await env.DB.prepare('UPDATE members SET card_token_hash=? WHERE id=? RETURNING member_no').bind(await digest(token),id).first();
 if(!row)return fail('This member was not found.',404);
 return json({ok:true,cardUrl:`/membership/?m=${encodeURIComponent(row.member_no)}#card&key=${token}`});
}
