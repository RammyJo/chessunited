import {json,fail,readJson,hasDb,noDb,clean,isGcashRef} from '../_utils.js';
import {tokenHash,orderResult} from '../_checkout.js';
import {scheduleSheetsSync} from '../_sheets.js';
export async function onRequestPost(context) {
 const {request,env}=context;if(!hasDb(env))return noDb();const body=await readJson(request);
 const hash=await tokenHash(body?.checkoutToken);if(!hash)return fail('Payment session not found.',404);
 const row=await env.DB.prepare('SELECT * FROM orders WHERE payment_token_hash=?').bind(hash).first();
 if(!row)return fail('Payment session not found.',404);
 if(body.action==='submit'){
  const ref=clean(body.gcashRef,20).replace(/[\s-]/g,'');
  if(ref&&!isGcashRef(ref))return fail('The optional GCash reference must contain 13 digits.',422);
  // A buyer claim never changes trusted payment_status. Repeated claims keep
  // the original timestamp/reference and never reset packing or staff decisions.
  await env.DB.prepare("UPDATE orders SET payment_claimed_at=datetime('now'),gcash_ref=?,fulfilment_status=CASE WHEN fulfilment_status='awaiting_payment' THEN 'new' ELSE fulfilment_status END WHERE id=? AND payment_claimed_at IS NULL").bind(ref,row.id).run();
  scheduleSheetsSync(context);
 }else if(body.action!=='resume')return fail('Unknown payment action.',422);
 const current=await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(row.id).first();
 return json({ok:true,order:orderResult(current)});
}
