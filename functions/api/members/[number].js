import {json,fail,hasDb,noDb,isAdmin} from '../_utils.js';
import {digest} from '../_security.js';
/** Full membership cards require the private card link or an officer session. */
export async function onRequestGet({params,env,request}) {
 if(!hasDb(env))return noDb();const number=String(params.number||'').toUpperCase();
 const unavailable=()=>fail('Open the private card link saved after registration, or ask a club officer for a new link.',404);
 if(!/^CU-\d{4}-(?:\d{4}|\d{8})$/.test(number))return unavailable();
 const officer=await isAdmin(request,env),key=request.headers.get('X-Member-Card-Key')||'';
 if(!officer&&!/^[a-f0-9]{64}$/.test(key))return unavailable();
 const row=await env.DB.prepare(`SELECT member_no,first_name,last_name,division,printed_id,status,created_at FROM members WHERE member_no=?${officer?'':' AND card_token_hash=?'}`).bind(...(officer?[number]:[number,await digest(key)])).first();
 if(!row)return unavailable();
 return json({ok:true,member:{memberNo:row.member_no,fullName:`${row.first_name} ${row.last_name}`,division:row.division==='kiddies'?'Kiddies Division':'Open Division',printedId:!!row.printed_id,status:row.status,since:String(row.created_at||'').slice(0,10)}});
}
