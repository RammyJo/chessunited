/** Real Workers/D1 runtime smoke test. Uses only a local, temporary database. */
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { priceItems } from '../functions/api/_catalog.js';
const temp = mkdtempSync(join(tmpdir(), 'chess-sheets-test-'));
execFileSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'pages','functions','build','functions','--outdir',temp,'--compatibility-date','2026-10-01','--compatibility-flags','no_nodejs_compat','no_nodejs_compat_v2'], {stdio:'pipe'});
const mf = new Miniflare(convertV4MiniflareOptions({modules:true,modulesRoot:temp,scriptPath:join(temp,'index.js'),compatibilityDate:'2026-10-01',compatibilityFlags:['no_nodejs_compat','no_nodejs_compat_v2'],d1Databases:['DB'],bindings:{ADMIN_TOKEN:'local-test-only'},serviceBindings:{ASSETS:()=>new Response('test')}}));
try {
 const db = await mf.getD1Database('DB');let sql='';
 for(const line of readFileSync('schema.sql','utf8').split('\n')) {
  if(line.trim().startsWith('--'))continue;sql+=line+'\n';const trimmed=sql.trim();if(!trimmed)continue;
  if((trimmed.startsWith('CREATE TRIGGER')&&/END;\s*$/.test(trimmed))||(!trimmed.startsWith('CREATE TRIGGER')&&/;\s*$/.test(trimmed))) {await db.prepare(sql).run();sql='';}
 }
 const send=(path,data,headers={})=>mf.dispatchFetch('https://example.com'+path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(data)});
 const getQuote=async(data)=>{const r=await send('/api/shipping/quote',data);assert.equal(r.status,200);return (await r.json()).quote;};
 const basket=[{id:'tshirt',qty:1,size:'L'}];const initialQuote=await getQuote({courier:'pickup',items:basket});
 const order={checkoutToken:'a'.repeat(64),quoteId:initialQuote.id,fullName:'Runtime Test',email:'runtime@example.invalid',phone:'09171234567',address:'123 Test Address',city:'Test City',province:'Test Province',courier:'pickup',items:[{id:'tshirt',qty:1,size:'L'}]};
 const result=await mf.dispatchFetch('https://example.com/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(order)});assert.equal(result.status,200);assert.equal((await result.json()).ok,true);
 assert.equal((await db.prepare('SELECT pending FROM sheets_sync').first()).pending,1);
 const draft=await db.prepare('SELECT order_no,payment_status,fulfilment_status,total FROM orders WHERE id=1').first();assert.equal(draft.fulfilment_status,'awaiting_payment');assert.equal(draft.total,300);
 const repeat=await send('/api/orders',order);assert.equal((await repeat.json()).order.orderNo,draft.order_no);assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM orders').first()).n,1);
 const badToken=await send('/api/orders/payment',{checkoutToken:'f'.repeat(64),action:'resume'});assert.equal(badToken.status,404);
 const claim=await send('/api/orders/payment',{checkoutToken:order.checkoutToken,action:'submit',gcashRef:'0001234567890',paymentStatus:'paid'});assert.equal(claim.status,200);assert.equal((await claim.json()).order.submitted,true);
 const claimed=await db.prepare('SELECT gcash_ref,payment_status,fulfilment_status,payment_claimed_at FROM orders WHERE id=1').first();assert.equal(claimed.gcash_ref,'0001234567890');assert.equal(claimed.payment_status,'pending');assert.equal(claimed.fulfilment_status,'new');assert.ok(claimed.payment_claimed_at);
 const changedBasket=await send('/api/orders',{...order,checkoutToken:'e'.repeat(64),items:[{id:'tshirt',qty:2,size:'L'}]});assert.equal(changedBasket.status,409);
 await send('/api/orders/payment',{checkoutToken:order.checkoutToken,action:'submit',gcashRef:'9999999999999'});assert.equal((await db.prepare('SELECT gcash_ref FROM orders WHERE id=1').first()).gcash_ref,'0001234567890');

 assert.equal((await mf.dispatchFetch('https://example.com/api/admin/sheets')).status,401);
 const login=await mf.dispatchFetch('https://example.com/api/admin/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:'local-test-only'})});
 const cookie=login.headers.get('set-cookie').split(';')[0];
 const status=await mf.dispatchFetch('https://example.com/api/admin/sheets',{headers:{Cookie:cookie}});assert.equal(status.status,200);const data=await status.json();assert.equal(data.configured,false);assert.equal(data.pending,1);
 const withoutAddress={...order};delete withoutAddress.address;delete withoutAddress.city;delete withoutAddress.province;
 const delivery=await mf.dispatchFetch('https://example.com/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...withoutAddress,checkoutToken:'b'.repeat(64),courier:'lbc'})});assert.equal(delivery.status,422);
 const pickup=await mf.dispatchFetch('https://example.com/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...withoutAddress,checkoutToken:'c'.repeat(64),courier:'pickup',shippingFee:999,address:'discard this address',country:'discard this country'})});
 assert.equal(pickup.status,200);const pickupResult=(await pickup.json()).order;assert.equal(pickupResult.shippingFee,0);assert.equal(pickupResult.total,300);assert.match(pickupResult.fulfilmentMessage,/Pick up/);
 const savedPickup=await db.prepare("SELECT ship_address, ship_city, ship_country FROM orders WHERE courier = 'pickup'").first();assert.deepEqual(savedPickup,{ship_address:'',ship_city:'',ship_country:''});
 const pickupJob=await db.prepare("SELECT pending FROM sheets_sync WHERE record_id = (SELECT id FROM orders WHERE courier = 'pickup') AND kind = 'order'").first();assert.equal(pickupJob.pending,1);
 const invalidSize=await mf.dispatchFetch('https://example.com/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...withoutAddress,checkoutToken:'d'.repeat(64),courier:'pickup',items:[{id:'tshirt',qty:1,size:'invalid'}]})});assert.equal(invalidSize.status,422);
 const registration={eventSlug:'tournament-2-0',division:'Open Division',fullName:'Tournament Test',email:'tournament@example.invalid',phone:'09171234567',gcashRef:'0001234567890'};
 const entry=await mf.dispatchFetch('https://example.com/api/registrations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(registration)});assert.equal(entry.status,200);assert.equal((await entry.json()).registration.amount,350);
 const entryJob=await db.prepare("SELECT pending FROM sheets_sync WHERE kind = 'registration'").first();assert.equal(entryJob.pending,1);
 const duplicate=await mf.dispatchFetch('https://example.com/api/registrations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(registration)});assert.equal(duplicate.status,409);
 const member={firstName:'Member',lastName:'Test',email:'member@example.invalid',phone:'09171234567'};
 const signup=await mf.dispatchFetch('https://example.com/api/members',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(member)});assert.equal(signup.status,200);assert.ok((await signup.json()).member.memberNo);
 assert.equal((await db.prepare("SELECT pending FROM sheets_sync WHERE kind='member'").first()).pending,1);
 const deniedShipping=await send('/api/admin/shipping',{origins:{}});assert.equal(deniedShipping.status,401);
 const deliveryUnconfigured=await send('/api/shipping/quote',{courier:'jt',destinationId:'57307',items:basket});assert.equal(deliveryUnconfigured.status,503);
 const settings=await send('/api/admin/shipping',{origins:{jt:'56054',lbc:'103314000'},products:{tshirt:{weight:0.5,length:30,width:20,height:5}}},{Cookie:cookie});assert.equal(settings.status,200);
 const oldQuote=await send('/api/orders',{...order,checkoutToken:'9'.repeat(64)});assert.equal(oldQuote.status,409);
 // Exercise the actual order route with locked delivery quotes, without contacting
 // couriers or creating production records. Client totals must never be trusted.
 const revision=(await db.prepare('SELECT revision FROM shipping_settings WHERE id=1').first()).revision;
 for(const [index,courier,serviceId,fee] of [[0,'jt','ez',170],[1,'lbc','auto',200]]) {
  const quoteId='runtime-delivery-'+courier,destination={id:'fixture-'+courier,city:'QUEZON CITY',province:'NCR'};
  await db.prepare('INSERT INTO shipping_quotes(id,basket_json,courier,destination_id,shipping_fee,subtotal,details_json,config_revision,expires_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(quoteId,JSON.stringify(priceItems(basket).lines),courier,destination.id,fee,300,JSON.stringify({serviceId,destination,pricingMessage:'Locked test rate'}),revision,Date.now()+60000).run();
  const deliveryOrder={...order,checkoutToken:String(index+2).repeat(64),quoteId,courier,serviceId,destinationId:destination.id,city:destination.city,province:destination.province,shippingFee:1,total:1};
  const wrongService=await send('/api/orders',{...deliveryOrder,serviceId:'wrong-service'});assert.equal(wrongService.status,409);
  const created=await send('/api/orders',deliveryOrder);assert.equal(created.status,200,await created.clone().text());
  const payment=(await created.json()).order;assert.equal(payment.shippingFee,fee);assert.equal(payment.total,300+fee);assert.equal(payment.canPay,true);assert.equal(payment.paymentStatus,'pending');
  const resumed=await send('/api/orders',deliveryOrder);assert.equal((await resumed.json()).order.orderNo,payment.orderNo);
  // Shipment updates become visible only through the buyer's private token.
  const shipped=await send('/api/admin/update',{kind:'order',id:(await db.prepare('SELECT id FROM orders WHERE order_no=?').bind(payment.orderNo).first()).id,fulfilmentStatus:'shipped',trackingNo:'123456789012'},{Cookie:cookie});assert.equal(shipped.status,200);
  const status=await send('/api/orders/payment',{action:'resume',checkoutToken:deliveryOrder.checkoutToken});const statusOrder=(await status.json()).order;assert.equal(statusOrder.trackingNo,'123456789012');assert.equal(statusOrder.fulfilmentStatus,'shipped');assert.equal(statusOrder.paymentStatus,'pending');assert.ok(statusOrder.trackingUrl.startsWith('https://www.'));
 }
 const mark=await send('/api/admin/update',{kind:'order',id:1,paymentStatus:'paid'},{Cookie:cookie});assert.equal(mark.status,200);assert.equal((await db.prepare('SELECT payment_status FROM orders WHERE id=1').first()).payment_status,'paid');
 const retry=await mf.dispatchFetch('https://example.com/api/admin/sheets',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:'{}'});assert.equal(retry.status,200,await retry.clone().text());assert.equal((await retry.json()).result.issue,'missing_credential');
 console.log('PASS: Workers/D1 checkout, both courier payment drafts, locked delivery totals, service validation, retry, payment claims, pickup, admin auth and Sheets queue. Local database only.');
} finally {await mf.dispose();rmSync(temp,{recursive:true,force:true});}
