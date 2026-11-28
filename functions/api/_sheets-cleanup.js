import {CLUB_HEADERS} from './_club-registration.js';
const titles=['Orders','Memberships','Tournament Entries','Registrations'];
const same=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
export async function pendingSheetsCleanup(env){
 try{return await env.DB.prepare('SELECT * FROM sheets_cleanup WHERE id=1 AND requested=1').first();}catch{return null;}
}
/** Runs only under the existing shared Sheets lease, using its server-side client.
 * Snapshot IDs protect submissions created after the private cleanup request.
 */
export async function runSheetsCleanup(env,client,job,columns){
 try{
  const expected=[columns.order.fields,columns.member.fields,columns.registration.fields,CLUB_HEADERS];
  const meta=await client.request('?fields=sheets.properties'),sheets=titles.map(title=>meta.sheets?.find(s=>s.properties.title===title)?.properties);
  if(sheets.some(s=>!s))throw Error('cleanup_tab_missing');
  const headers=await client.request('/values:batchGet?'+new URLSearchParams(titles.map(title=>['ranges',`'${title}'!1:1`])));
  if(!titles.every((_,i)=>same(headers.valueRanges?.[i]?.values?.[0]||[],expected[i])))throw Error('cleanup_headers_do_not_match');
  await client.request(':batchUpdate','POST',{requests:sheets.map(s=>({updateCells:{range:{sheetId:s.sheetId,startRowIndex:1},fields:'userEnteredValue,note'}}))});
  const remaining=await client.request('/values:batchGet?'+new URLSearchParams(titles.flatMap(title=>[['ranges',`'${title}'!1:1`],['ranges',`'${title}'!A2:ZZ`]])));
  if(remaining.valueRanges?.length!==8||!titles.every((_,i)=>same(remaining.valueRanges[2*i]?.values?.[0]||[],expected[i])&&!(remaining.valueRanges[2*i+1]?.values||[]).some(row=>row.some(v=>v!==''))))throw Error('cleanup_clear_not_verified');
  // Removing source rows and queued mirrors in the same D1 transaction prevents
  // the next cron run from resurrecting test records. Keep IDs monotonic so a
  // stale officer screen cannot accidentally update a new record with an old ID.
  const info={tabs:titles,headersPreserved:true,rowsCleared:true,sheetIds:sheets.map(s=>s.sheetId)};
  const result=await env.DB.batch([
   env.DB.prepare('DELETE FROM orders WHERE id<=?').bind(job.order_max),
   env.DB.prepare('DELETE FROM members WHERE id<=?').bind(job.member_max),
   env.DB.prepare('DELETE FROM registrations WHERE id<=?').bind(job.registration_max),
   env.DB.prepare('DELETE FROM club_registrations WHERE id<=?').bind(job.club_max),
   env.DB.prepare("DELETE FROM sheets_sync WHERE (kind='order' AND record_id<=?) OR (kind='member' AND record_id<=?) OR (kind='registration' AND record_id<=?)").bind(job.order_max,job.member_max,job.registration_max),
   env.DB.prepare("DELETE FROM form_submissions WHERE key_hash IN (SELECT value FROM json_each(?)) AND kind IN ('member','registration','order','club-registration')").bind(job.submission_keys_json),
   env.DB.prepare('DELETE FROM shipping_quotes WHERE id IN (SELECT value FROM json_each(?))').bind(job.quote_ids_json),
   // Newer records may already have synced before this lease was acquired.
   // Their source data survives; queue them again after clearing Sheet rows.
   env.DB.prepare('UPDATE sheets_sync SET pending=1,last_error=NULL'),
   env.DB.prepare('UPDATE club_registrations SET pending=1,last_error=NULL'),
   env.DB.prepare("UPDATE sheets_cleanup SET requested=0,completed_at=datetime('now'),last_error=NULL,result_json=?,submission_keys_json='[]',quote_ids_json='[]' WHERE id=1 AND requested=1").bind(JSON.stringify(info))
  ]);
  return{cleared:true,deleted:result.slice(0,7).map(r=>r.meta?.changes||0)};
 }catch(error){
  const code=error.message?.startsWith('cleanup_')?error.message:'cleanup_deferred';
  await env.DB.prepare('UPDATE sheets_cleanup SET last_error=? WHERE id=1').bind(code).run();return{issue:code};
 }
}
