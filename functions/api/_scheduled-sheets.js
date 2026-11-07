import { drainSheets } from './_sheets.js';

/** Only the bound scheduler/operator can request work in D1. A public GET can
 * service a requested job, but cannot request one or read the result. The
 * Google credential stays exclusively in the existing Pages environment.
 */
export async function runScheduledSheetsSync(env, options = {}) {
 const owner=crypto.randomUUID(),now=Date.now();
 const job=await env.DB.prepare(`UPDATE sheets_schedule SET owner=?,lease_until=?
  WHERE id=1 AND requested_at>completed_at AND lease_until<? RETURNING requested_at`)
  .bind(owner,now+120000,now).first();
 if(!job)return;
 try{
  const result=await drainSheets(env,options);
  await env.DB.prepare(`UPDATE sheets_schedule SET
   completed_at=CASE WHEN ?=1 THEN completed_at ELSE ? END,
   finished_at=?,last_error=?,owner=NULL,lease_until=0 WHERE id=1 AND owner=?`)
   .bind(result.busy?1:0,job.requested_at,Date.now(),result.issue||(result.busy?'sync_busy':null),owner).run();
  return result;
 }catch{
  await env.DB.prepare("UPDATE sheets_schedule SET last_error='sync_internal_error',owner=NULL,lease_until=0 WHERE id=1 AND owner=?").bind(owner).run();
  console.error(JSON.stringify({event:'scheduled_sheets_failed'}));
 }
}

export function scheduleRequestedSheetsSync(context){
 context.waitUntil(runScheduledSheetsSync(context.env).catch(()=>console.error(JSON.stringify({event:'scheduled_sheets_deferred'}))));
}
