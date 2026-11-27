import{CLUB_HEADERS,LEGACY_TOURNAMENT_TAB,clubSetup,clubSheetRow}from'./_club-registration.js';
const tab='Registrations',rangePath=range=>'/values/'+encodeURIComponent(range);
const equal=(a,b)=>Array.from({length:Math.max(a.length,b.length)},(_,i)=>String(a[i]??'')===String(b[i]??'')).every(Boolean);
export async function verifyClubHeaders(client){const row=(await client.request(rangePath(`'${tab}'!1:1`))).values?.[0]||[];if(!equal(row,CLUB_HEADERS))throw Error('club_sheet_headers_do_not_match');}
export async function runClubSheetWork(env,client,deadline){
 const setup=await clubSetup(env);if(!setup?.enabled)return{processed:0};let processed=0;
 try{
  if(!setup.reset_completed){
   if(!setup.reset_requested)return{processed:0,blocked:true,issue:'registration_setup_pending'};
   let meta=await client.request('?fields=sheets.properties');let original=meta.sheets?.find(s=>s.properties.title===tab)?.properties;
   if(!original)throw Error('registration_tab_missing');
   const header=(await client.request(rangePath(`'${tab}'!1:1`))).values?.[0]||[];
   if(!equal(header,CLUB_HEADERS)){
    const legacy=meta.sheets?.find(s=>s.properties.title===LEGACY_TOURNAMENT_TAB)?.properties;
    if(!legacy){await client.request(':batchUpdate','POST',{requests:[{duplicateSheet:{sourceSheetId:original.sheetId,newSheetName:LEGACY_TOURNAMENT_TAB}}]});}
    // Verify the complete financial copy before clearing the original tab.
    const ranges=[`'${tab}'`,`'${LEGACY_TOURNAMENT_TAB}'`];const backup=await client.request('/values:batchGet?'+new URLSearchParams(ranges.map(range=>['ranges',range])));if(JSON.stringify(backup.valueRanges?.[0]?.values||[])!==JSON.stringify(backup.valueRanges?.[1]?.values||[]))throw Error('registration_payment_backup_conflict');
    // Clear only the existing Registrations tab; its sheet ID/link stays intact.
    await client.request(':batchUpdate','POST',{requests:[{updateCells:{range:{sheetId:original.sheetId},fields:'userEnteredValue,dataValidation,note'}},{clearBasicFilter:{sheetId:original.sheetId}},{updateSheetProperties:{properties:{sheetId:original.sheetId,gridProperties:{frozenRowCount:1}},fields:'gridProperties.frozenRowCount'}}]});
    if(original.gridProperties.columnCount<CLUB_HEADERS.length)await client.request(':batchUpdate','POST',{requests:[{appendDimension:{sheetId:original.sheetId,dimension:'COLUMNS',length:CLUB_HEADERS.length-original.gridProperties.columnCount}}]});
    await client.request(rangePath(`'${tab}'!A1`)+'?valueInputOption=RAW','PUT',{values:[CLUB_HEADERS]});
   }
   const checkedMeta=await client.request('?fields=sheets.properties');if(!checkedMeta.sheets?.some(s=>s.properties.title===LEGACY_TOURNAMENT_TAB))throw Error('registration_payment_backup_missing');
   const remaining=((await client.request(rangePath(`'${tab}'`))).values||[]).slice(1);if(remaining.some(row=>row.some(value=>value!=='')))throw Error('registration_tab_clear_not_verified');
   await verifyClubHeaders(client);
   await env.DB.prepare("UPDATE club_registration_setup SET reset_completed=1,reset_requested=0,completed_at=datetime('now'),last_error=NULL,result_json=? WHERE id=1").bind(JSON.stringify({cleared:true,headersVerified:true,paymentsPreserved:true,registrationSheetId:original.sheetId,tab,legacyPaymentTab:LEGACY_TOURNAMENT_TAB})).run();
  }
  await verifyClubHeaders(client);
  const jobs=(await env.DB.prepare('SELECT * FROM club_registrations WHERE pending=1 ORDER BY attempts,id LIMIT 3').all()).results||[];
  for(const record of jobs){if(Date.now()>deadline-1000)break;try{
   const row=record.id+1,expected=clubSheetRow(record),range=`'${tab}'!A${row}:L${row}`;
   const meta=await client.request('?fields=sheets.properties'),sheet=meta.sheets.find(s=>s.properties.title===tab).properties;
   if(sheet.gridProperties.rowCount<row)await client.request(':batchUpdate','POST',{requests:[{appendDimension:{sheetId:sheet.sheetId,dimension:'ROWS',length:row-sheet.gridProperties.rowCount+100}}]});
   const old=(await client.request(rangePath(range))).values?.[0]||[];if(old.some(value=>value!=='')&&!equal(old,expected))throw Error('club_sheet_row_conflict');
   await client.request(rangePath(range)+'?valueInputOption=RAW','PUT',{values:[expected]});
   const verified=(await client.request(rangePath(range))).values?.[0]||[];if(!equal(verified,expected))throw Error('club_sheet_write_not_verified');
   await env.DB.prepare("UPDATE club_registrations SET pending=0,attempts=0,last_error=NULL,synced_at=datetime('now') WHERE id=? AND payload_fingerprint=?").bind(record.id,record.payload_fingerprint).run();processed++;
  }catch(error){await env.DB.prepare('UPDATE club_registrations SET attempts=attempts+1,last_error=? WHERE id=?').bind(error.message?.startsWith('club_')?error.message:'club_sheet_sync_failed',record.id).run();throw error;}}
  await env.DB.prepare('UPDATE club_registration_setup SET last_error=NULL WHERE id=1').run();
  return{processed};
 }catch(error){const code=/^(club_|registration_)/.test(error.message||'')?error.message:'club_sheet_setup_failed';await env.DB.prepare('UPDATE club_registration_setup SET last_error=? WHERE id=1').bind(code).run();return{processed,blocked:true,issue:code};}
}
