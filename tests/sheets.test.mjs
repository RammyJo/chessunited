import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createSheetsClient, drainSheets, sheetsConfig, syncStatus, SHEET_COLUMNS, runRequestedSheetsCheck } from '../functions/api/_sheets.js';
import { onRequest as adminSheets } from '../functions/api/admin/sheets.js';

const pair = await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'}, true, ['sign','verify']);
const pem = '-----BEGIN PRIVATE KEY-----\n'+Buffer.from(await crypto.subtle.exportKey('pkcs8',pair.privateKey)).toString('base64')+'\n-----END PRIVATE KEY-----';
const credential = JSON.stringify({type:'service_account',client_email:'test@example-project.iam.gserviceaccount.com',private_key:pem,token_uri:'https://untrusted.invalid/token'});
const order = {id:1,order_no:'ORD-TEST',created_at:'2026-11-06',full_name:'=IMPORTXML("https://example.org")',email:'test@example.com',phone:'09171234567',ship_address:'Test only street',ship_city:'City',ship_province:'Province',ship_postcode:'0012',ship_country:'Philippines',courier:'lbc',items_json:'[]',subtotal:300,shipping_note:'',payment_method:'gcash',payment_status:'pending',fulfilment_status:'new',tracking_no:''};
function database() {
  const sql = new DatabaseSync(':memory:');
  sql.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
  // Applying the deployment migration twice must be harmless.
  sql.exec(readFileSync(new URL('../migrations/0001_google_sheets.sql',import.meta.url),'utf8'));
  const DB={prepare(query){ return {bind(...params){return statement(params);},...statement([])};
    function statement(params){return {first:async()=>sql.prepare(query).get(...params)||null,all:async()=>({results:sql.prepare(query).all(...params)}),run:async()=>({meta:sql.prepare(query).run(...params)})};}
  }};
  sql.prepare(`INSERT INTO orders (${Object.keys(order).join(',')}) VALUES (${Object.keys(order).map(()=>'?').join(',')})`).run(...Object.values(order));
  return {DB,sql,env:{DB,GOOGLE_SHEETS_SERVICE_ACCOUNT:credential}};
}
function google({header, occupied, lostReply=false, onWrite}={}) {
  const rows=new Map();const headers=new Map();const writes=[];let fail=lostReply;
  const fetcher=async(url,init={})=>{
    const u=new URL(url);
    if(u.hostname==='oauth2.googleapis.com'){
      assert.equal(url,'https://oauth2.googleapis.com/token');
      const assertion=init.body.get('assertion'); const [head,payload,sig]=assertion.split('.');
      const claims=JSON.parse(Buffer.from(payload,'base64url'));
      assert.equal(claims.scope,'https://www.googleapis.com/auth/spreadsheets');
      assert.equal(claims.aud,url);
      assert.ok(await crypto.subtle.verify('RSASSA-PKCS1-v1_5',pair.publicKey,Buffer.from(sig,'base64url'),new TextEncoder().encode(head+'.'+payload)));
      return Response.json({access_token:'mock-token'});
    }
    assert.equal(u.hostname,'sheets.googleapis.com');assert.equal(init.headers.Authorization,'Bearer mock-token');
    if(u.pathname.endsWith('/values:batchGet')) return Response.json({valueRanges:u.searchParams.getAll('ranges').map(range=>({range,values:[rows.get(range)||[]]}))});
    if(!u.pathname.includes('/values/')) return Response.json({sheets:['Orders','Registrations','Memberships'].map((title,index)=>({properties:{title,sheetId:index+1,gridProperties:{rowCount:1000,columnCount:26}}}))});
    const range=decodeURIComponent(u.pathname.split('/values/')[1]);
    const title=range.split('!')[0];
    if(init.method==='GET') return Response.json({values:range.endsWith('1:1')?[headers.get(title) || header || []]:[occupied || rows.get(range) || []]});
    assert.equal(u.searchParams.get('valueInputOption'),'RAW');
    const values=JSON.parse(init.body).values[0];
    if(range.endsWith('A1')) headers.set(title,values);
    else {rows.set(range,values);writes.push({range,values});if(onWrite)onWrite();if(fail){fail=false;throw new Error('Reply lost after Google committed the write');}}
    return Response.json({updatedRows:1});
  };
  return {fetcher,rows,writes};
}

test('D1 triggers retain inserts, updates and transaction rollbacks', async()=>{
 const {sql}=database();assert.equal(sql.prepare('SELECT pending FROM sheets_sync').get().pending,1);
 sql.exec('UPDATE sheets_sync SET pending=0');sql.exec("UPDATE orders SET payment_status='paid' WHERE id=1");
 const job=sql.prepare('SELECT * FROM sheets_sync').get();assert.equal(job.version,2);assert.equal(job.pending,1);
 sql.exec('BEGIN');sql.exec("UPDATE orders SET payment_status='refunded' WHERE id=1");sql.exec('ROLLBACK');assert.equal(sql.prepare('SELECT version FROM sheets_sync').get().version,2);
 sql.exec("INSERT INTO registrations(event_slug,full_name,email,phone,division,gcash_ref,amount) VALUES ('event','Test','test@example.com','09171234567','Open','1234567890123',350)");
 assert.equal(sql.prepare("SELECT pending FROM sheets_sync WHERE kind='registration'").get().pending,1);
});
test('missing/invalid credentials do not lose queued D1 records',async()=>{
 const {env,sql}=database();delete env.GOOGLE_SHEETS_SERVICE_ACCOUNT;assert.equal((await drainSheets(env)).issue,'missing_credential');assert.equal(sql.prepare('SELECT pending FROM sheets_sync').get().pending,1);
 assert.equal(sheetsConfig({GOOGLE_SHEETS_SERVICE_ACCOUNT:'bad'}).configured,false);
});
test('JWT uses Google only; RAW writes preserve formulas, phone and reference strings',async()=>{
 const g=google();const client=await createSheetsClient({GOOGLE_SHEETS_SERVICE_ACCOUNT:credential},g.fetcher);await client.write('order',order);
 assert.equal(g.writes[0].range,"'Orders'!A2:X2");assert.equal(g.writes[0].values[3],order.full_name);assert.equal(g.writes[0].values[5],'09171234567');assert.equal(g.writes[0].values[9],'0012');
});
test('lost Google reply retries the same row without duplicate append',async()=>{
 const {env,sql}=database();const g=google({lostReply:true});await drainSheets(env,{fetcher:g.fetcher});assert.equal(sql.prepare('SELECT pending FROM sheets_sync').get().pending,1);
 assert.equal((await drainSheets(env,{fetcher:g.fetcher})).processed,1);assert.equal(g.rows.size,1);assert.equal(sql.prepare('SELECT pending FROM sheets_sync').get().pending,0);
});
test('existing unrelated headers or row ids are never overwritten',async()=>{
 for(const options of [{header:['Existing merch data']},{header:SHEET_COLUMNS.order.fields,occupied:['999','Other person']}]){
  const g=google(options);const client=await createSheetsClient({GOOGLE_SHEETS_SERVICE_ACCOUNT:credential},g.fetcher);await assert.rejects(client.write('order',order),/sheet_headers_do_not_match|sheet_row_conflict/);assert.equal(g.writes.length,0);
 }
});
test('concurrent D1 updates stay queued until their current revision is copied',async()=>{
 const {env,sql}=database();let changed=false;const g=google({onWrite(){if(!changed){changed=true;sql.exec("UPDATE orders SET payment_status='paid' WHERE id=1");}}});
 await drainSheets(env,{fetcher:g.fetcher});assert.equal(sql.prepare('SELECT pending FROM sheets_sync').get().pending,1);
 await drainSheets(env,{fetcher:g.fetcher});assert.equal(sql.prepare('SELECT pending FROM sheets_sync').get().pending,0);assert.equal(g.rows.values().next().value[16],'paid');
});
test('active leases prevent competing writes; failures expose codes, not Google response data',async()=>{
 const {env,sql}=database();sql.exec(`UPDATE sheets_sync_lock SET expires_at=${Date.now()+10000}, owner='other'`);assert.equal((await drainSheets(env)).busy,true);
 sql.exec('UPDATE sheets_sync_lock SET expires_at=0');await drainSheets(env,{fetcher:async()=>new Response('sensitive diagnostic', {status:403})});
 const status=await syncStatus(env);assert.equal(status.pending,1);assert.equal(status.lastError,'google_auth_http_403');assert.equal(sql.prepare('SELECT owner FROM sheets_sync_lock').get().owner,null);
});
test('Google Sheets management is private for both reads and writes',async()=>{
 const {env}=database();for(const method of ['GET','POST']) assert.equal((await adminSheets({env,request:new Request('https://example.org/api/admin/sheets',{method})})).status,401);
});

test('tournament copies preserve leading-zero GCash references and member numbers',async()=>{
 const g=google();const client=await createSheetsClient({GOOGLE_SHEETS_SERVICE_ACCOUNT:credential},g.fetcher);
 await client.write('registration',{id:3,phone:'09171234567',gcash_ref:'0001234567890',member_no:'CU-2026-0001',amount:350});
 assert.equal(g.writes[0].range,"'Registrations'!A4:N4");assert.equal(g.writes[0].values[9],'0001234567890');assert.equal(g.writes[0].values[8],'CU-2026-0001');
});

test('connection check prepares both owned tabs without adding customer records',async()=>{
 const g=google();const client=await createSheetsClient({GOOGLE_SHEETS_SERVICE_ACCOUNT:credential},g.fetcher);await client.verify();assert.equal(g.rows.size,0);assert.equal(g.writes.length,0);
});

test('connection check requires an operator request and never exposes its result publicly',async()=>{
 const {env,sql}=database();let calls=0;await runRequestedSheetsCheck(env,async()=>{calls++;});assert.equal(calls,0);
 sql.exec('UPDATE sheets_connection_check SET requested=1');const g=google();await runRequestedSheetsCheck(env,g.fetcher);
 const state=sql.prepare('SELECT * FROM sheets_connection_check').get();assert.equal(state.requested,0);assert.ok(state.verified_at);assert.equal(state.last_error,null);
 assert.equal(sql.prepare('SELECT pending FROM sheets_sync').get().pending,0);
 await runRequestedSheetsCheck(env,async()=>{calls++;});assert.equal(calls,0);
});

test('membership inserts and officer updates mirror to Memberships and preserve old sync history',async()=>{
 const {env,sql}=database();sql.exec("UPDATE sheets_sync SET pending=0,synced_at='2026-11-06 00:00:00'");
 sql.exec("INSERT INTO members(member_no,first_name,last_name,email,phone,printed_id,status) VALUES ('CU-2026-0001','Member','Test','member@example.invalid','09171234567',1,'active')");
 sql.exec(readFileSync(new URL('../migrations/0003_membership_sheets.sql',import.meta.url),'utf8'));
 sql.exec('ALTER TABLE sheets_sync ADD COLUMN paid_snapshot TEXT; ALTER TABLE sheets_sync ADD COLUMN payment_checked_at INTEGER NOT NULL DEFAULT 0;');
 const prior=sql.prepare("SELECT * FROM sheets_sync WHERE kind='order'").get();assert.equal(prior.pending,0);assert.equal(prior.synced_at,'2026-11-06 00:00:00');
 const g=google();assert.equal((await drainSheets(env,{fetcher:g.fetcher})).processed,1);assert.equal(g.writes[0].range,"'Memberships'!A2:O2");assert.equal(g.writes[0].values[1],'CU-2026-0001');assert.equal(g.writes[0].values[6],'09171234567');
 sql.exec("UPDATE members SET status='pending' WHERE id=1");assert.equal(sql.prepare("SELECT pending FROM sheets_sync WHERE kind='member'").get().pending,1);
 await drainSheets(env,{fetcher:g.fetcher});assert.equal(g.rows.size,1);assert.equal(g.rows.values().next().value[13],'pending');
});

test('officers can mark Paid and Not paid in Sheets and the next sync imports both', async()=>{
 const {env,sql}=database();const g=google();await drainSheets(env,{fetcher:g.fetcher});
 const row=g.rows.get("'Orders'!A2:X2");assert.equal(row[19],'Not paid');row[19]='Paid';
 await drainSheets(env,{fetcher:g.fetcher});assert.equal(sql.prepare('SELECT payment_status FROM orders').get().payment_status,'paid');assert.equal(sql.prepare('SELECT pending FROM sheets_sync').get().pending,0);
 row[19]='Not paid';g.rows.set("'Orders'!A2:X2",row);
 await drainSheets(env,{fetcher:g.fetcher});assert.equal(sql.prepare('SELECT payment_status FROM orders').get().payment_status,'pending');
});
test('newer dashboard payment edits win; wrong row IDs and invalid marks never change payments',async()=>{
 const {env,sql}=database();const g=google();await drainSheets(env,{fetcher:g.fetcher});
 sql.exec("UPDATE orders SET payment_status='paid' WHERE id=1");await drainSheets(env,{fetcher:g.fetcher});assert.equal(sql.prepare('SELECT payment_status FROM orders').get().payment_status,'paid');assert.equal(g.rows.get("'Orders'!A2:X2")[19],'Paid');
 const row=g.rows.get("'Orders'!A2:X2");row[0]='999';row[19]='Not paid';await drainSheets(env,{fetcher:g.fetcher});assert.equal(sql.prepare('SELECT payment_status FROM orders').get().payment_status,'paid');
 row[0]=1;row[19]='anything';await drainSheets(env,{fetcher:g.fetcher});assert.equal(sql.prepare('SELECT payment_status FROM orders').get().payment_status,'paid');assert.equal(g.rows.get("'Orders'!A2:X2")[19],'Paid');
});
test('Sheets payment edits verify tournaments, paid printed cards, and never charge free memberships',async()=>{
 const {env,sql}=database();const g=google();
 sql.exec("INSERT INTO members(member_no,first_name,last_name,email,phone,printed_id,status) VALUES ('CU-2026-0001','Printed','Test','printed@example.invalid','09171234567',1,'active'),('CU-2026-0002','Digital','Test','digital@example.invalid','09171234567',0,'active')");
 sql.exec("INSERT INTO registrations(event_slug,full_name,email,phone,division,gcash_ref,amount) VALUES ('event','Test','test@example.com','09171234567','Open','1234567890123',350)");
 await drainSheets(env,{fetcher:g.fetcher});await drainSheets(env,{fetcher:g.fetcher});
 assert.equal(g.rows.get("'Memberships'!A3:O3")[14],'Not required');
 for(const range of ["'Memberships'!A2:O2","'Memberships'!A3:O3","'Registrations'!A2:N2"]){const row=g.rows.get(range);row[row.length-1]='Paid';}
 await drainSheets(env,{fetcher:g.fetcher});
 assert.equal(sql.prepare('SELECT payment_status FROM registrations').get().payment_status,'verified');assert.equal(sql.prepare('SELECT payment_status FROM members WHERE printed_id=1').get().payment_status,'paid');assert.equal(sql.prepare('SELECT payment_status FROM members WHERE printed_id=0').get().payment_status,'pending');
 assert.equal(g.rows.get("'Memberships'!A3:O3")[14],'Not required');
});
