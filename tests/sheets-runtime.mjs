/** Real Workers/D1 runtime smoke test. Uses only a local, temporary database. */
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const temp = mkdtempSync(join(tmpdir(), 'chess-sheets-test-'));
execFileSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'pages','functions','build','functions','--outdir',temp,'--compatibility-date','2026-10-01','--compatibility-flags','no_nodejs_compat','no_nodejs_compat_v2'], {stdio:'pipe'});
const mf = new Miniflare(convertV4MiniflareOptions({modules:true,modulesRoot:temp,scriptPath:join(temp,'index.js'),compatibilityDate:'2026-10-01',compatibilityFlags:['no_nodejs_compat','no_nodejs_compat_v2'],d1Databases:['DB'],bindings:{ADMIN_TOKEN:'local-test-only'},serviceBindings:{ASSETS:()=>new Response('test')}}));
try {
 const db = await mf.getD1Database('DB');let sql='';
 for(const line of readFileSync('schema.sql','utf8').split('\n')) {
  if(line.trim().startsWith('--'))continue;sql+=line+'\n';const trimmed=sql.trim();if(!trimmed)continue;
  if((trimmed.startsWith('CREATE TRIGGER')&&/END;\s*$/.test(trimmed))||(!trimmed.startsWith('CREATE TRIGGER')&&/;\s*$/.test(trimmed))) {await db.prepare(sql).run();sql='';}
 }
 const order={fullName:'Runtime Test',email:'runtime@example.invalid',phone:'09171234567',address:'123 Test Address',city:'Test City',province:'Test Province',courier:'lbc',items:[{id:'tshirt',qty:1,size:'L'}]};
 const result=await mf.dispatchFetch('https://example.com/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(order)});assert.equal(result.status,200);assert.equal((await result.json()).ok,true);
 assert.equal((await db.prepare('SELECT pending FROM sheets_sync').first()).pending,1);
 assert.equal((await mf.dispatchFetch('https://example.com/api/admin/sheets')).status,401);
 const login=await mf.dispatchFetch('https://example.com/api/admin/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:'local-test-only'})});
 const cookie=login.headers.get('set-cookie').split(';')[0];
 const status=await mf.dispatchFetch('https://example.com/api/admin/sheets',{headers:{Cookie:cookie}});assert.equal(status.status,200);const data=await status.json();assert.equal(data.configured,false);assert.equal(data.pending,1);
 const withoutAddress={...order};delete withoutAddress.address;delete withoutAddress.city;delete withoutAddress.province;
 const delivery=await mf.dispatchFetch('https://example.com/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(withoutAddress)});assert.equal(delivery.status,422);
 const pickup=await mf.dispatchFetch('https://example.com/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...withoutAddress,courier:'pickup',shippingFee:999,address:'discard this address',country:'discard this country'})});
 assert.equal(pickup.status,200);const pickupResult=(await pickup.json()).order;assert.equal(pickupResult.shippingFee,0);assert.equal(pickupResult.total,300);assert.match(pickupResult.fulfilmentMessage,/Pick up/);
 const savedPickup=await db.prepare("SELECT ship_address, ship_city, ship_country FROM orders WHERE courier = 'pickup'").first();assert.deepEqual(savedPickup,{ship_address:'',ship_city:'',ship_country:''});
 const pickupJob=await db.prepare("SELECT pending FROM sheets_sync WHERE record_id = (SELECT id FROM orders WHERE courier = 'pickup') AND kind = 'order'").first();assert.equal(pickupJob.pending,1);
 const invalidSize=await mf.dispatchFetch('https://example.com/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...withoutAddress,courier:'pickup',items:[{id:'tshirt',qty:1,size:'invalid'}]})});assert.equal(invalidSize.status,422);
 const retry=await mf.dispatchFetch('https://example.com/api/admin/sheets',{method:'POST',headers:{Cookie:cookie}});assert.equal((await retry.json()).result.issue,'missing_credential');
 console.log('PASS: Workers runtime order insert, transactional D1 queue, authenticated admin status/retry, missing credential, pickup totals/address handling, delivery validation and pickup sync queue. Local database only.');
} finally {await mf.dispose();rmSync(temp,{recursive:true,force:true});}
