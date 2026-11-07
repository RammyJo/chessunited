import {test} from 'node:test';
import assert from 'node:assert/strict';
import {officialShippingRate,validateShippingConfig,packItems} from '../functions/api/_shipping.js';
const parcel={weight:1,length:20,width:20,height:10,value:300,quantity:2};
test('J&T uses official route and dimensions; includes valuation and service fee for every parcel',async()=>{
 let posted;const rate=await officialShippingRate('jt',{city:'ORIGIN'},{city:'DESTINATION'},[parcel],async(url,init)=>{assert.equal(new URL(url).hostname,'ylofficialjw.jtexpress.ph');posted=JSON.parse(init.body);return Response.json({succ:true,data:[{type:'fee',fees:'190',serviceFee:'10'},{type:'insured',fees:'5'}]});});
 assert.equal(rate.fee,410);assert.equal(posted.senderAddr,'ORIGIN');assert.equal(posted.dimensionW,'20');assert.equal(posted.goodsValue,'300');
});
test('a zero J&T route rate never becomes free delivery',async()=>{
 await assert.rejects(officialShippingRate('jt',{city:'X'},{city:'Y'},[parcel],async()=>Response.json({succ:true,data:[{type:'fee',fees:'0'}]})),/could not quote/);
});
test('LBC selects a fitting official package, fetches fresh public calculator configuration and adds valuation',async()=>{
 const calls=[];const rate=await officialShippingRate('lbc',{id:'ORIGIN'},{id:'DESTINATION'},[parcel],async(url,init)=>{
  if(new URL(url).pathname==='/Scripts/PH_Rate_Calculator.js')return new Response('request.setRequestHeader("token", "'+'a'.repeat(64)+'");');
  assert.ok(url.startsWith('https://ratecalcapi.lbcapps.com/api/PH/'));const data=new URLSearchParams(init.body);calls.push(data);
  if(url.endsWith('/GetProductsV2'))return Response.json({ResponseCode:'0001',ResponseData:{Products:[{ProductId:1,ProductName:'Too small',MaxWeight_Kg:10,Size_Inch:'3 X 3 X 3 IN'},{ProductId:2,ProductName:'Fits',MaxWeight_Kg:10,Size_Inch:'12 X 10 X 5 IN'}]}});
  return Response.json({ResponseCode:'0001',ResponseData:{Price:300,ValuationFee:15}});
 });assert.equal(rate.fee,630);assert.equal(calls[1].get('ProductId'),'2');assert.equal(calls[1].get('OriginCityId'),'ORIGIN');
});
test('parcel facts must be configured; wrong origins, partial or negative measurements are rejected',()=>{
 assert.throws(()=>validateShippingConfig({origins:{jt:'fake',lbc:'fake'}}),/valid dispatch/);
 assert.throws(()=>validateShippingConfig({origins:{jt:'56054',lbc:'103314000'},products:{tshirt:{weight:1}}}),/valid packed/);
 assert.throws(()=>packItems([{id:'tshirt',quantity:1}],{}),/not available/);
 const config=validateShippingConfig({origins:{jt:'56054',lbc:'103314000'},products:{tshirt:{weight:1,length:30,width:20,height:5},cap:{weight:'',length:'',width:'',height:''}}});assert.equal(packItems([{id:'tshirt',quantity:2,unitPrice:300}],config)[0].quantity,2);assert.equal(config.products.cap,undefined);
});

test('minimum mode prices a basket as one baseline parcel without inventing item measurements',()=>{
 const config=validateShippingConfig({mode:'minimum_small_parcel',origins:{jt:'56054',lbc:'103314000'},products:{}});
 const parcels=packItems([{id:'tshirt',quantity:2,lineTotal:600},{id:'cap',quantity:1,lineTotal:150}],config);
 assert.deepEqual(parcels,[{minimum:true,weight:1,quantity:1,value:750}]);
 assert.equal(Object.hasOwn(parcels[0],'length'),false);
 assert.throws(()=>packItems([{id:'pen',quantity:21,lineTotal:1050}],config),/20 items/);
 assert.throws(()=>validateShippingConfig({...config,mode:'client_discount'}),/valid delivery pricing/);
});
test('minimum J&T charge is once per order and values every item, with no invented dimensions',async()=>{
 const parcels=packItems([{id:'tshirt',quantity:2,lineTotal:600},{id:'cap',quantity:1,lineTotal:150}],{mode:'minimum_small_parcel'});
 let calls=0;const rate=await officialShippingRate('jt',{city:'ORIGIN'},{city:'DESTINATION'},parcels,async(url,init)=>{
  calls++;const data=JSON.parse(init.body);assert.equal(data.weight,'1');assert.equal(data.goodsValue,'750');assert.equal(data.dimensionW,'');assert.equal(data.dimensionH,'');assert.equal(data.dimensionL,'');
  return Response.json({succ:true,data:[{type:'fee',fees:'95',serviceFee:'0'},{type:'insured',fees:'5'}]});
 });assert.equal(calls,1);assert.equal(rate.fee,100);assert.equal(rate.details.length,1);assert.equal(rate.details[0].quantity,1);
});
test('minimum LBC chooses the lowest official first-tier total including valuation for the entire basket',async()=>{
 const declarations=[];const parcels=packItems([{id:'tshirt',quantity:2,lineTotal:600},{id:'cap',quantity:1,lineTotal:150}],{mode:'minimum_small_parcel'});
 const rate=await officialShippingRate('lbc',{id:'ORIGIN'},{id:'DESTINATION'},parcels,async(url,init)=>{
  if(new URL(url).pathname==='/Scripts/PH_Rate_Calculator.js')return new Response('request.setRequestHeader("token", "'+'a'.repeat(64)+'");');
  const data=new URLSearchParams(init.body);
  if(url.endsWith('/GetProductsV2'))return Response.json({ResponseCode:'0001',ResponseData:{Products:[{ProductId:105,ProductName:'CARGO KB MINI',MaxWeight_Kg:'1',IsWeightRequired:false},{ProductId:16,ProductName:'N-PACK MEDIUM',MaxWeight_Kg:'1',IsWeightRequired:false},{ProductId:19,ProductName:'CARGO KB SMALL',MaxWeight_Kg:'10',IsWeightRequired:true}]}});
  declarations.push(data.get('DeclaredValue'));assert.equal(data.get('Weight'),'1');
  return Response.json({ResponseCode:'0001',ResponseData:{Price:data.get('ProductId')==='16'?140:185,ValuationFee:15}});
 });assert.equal(rate.fee,155);assert.deepEqual(declarations,['750','750']);assert.match(rate.details[0].service,/N-PACK MEDIUM/);
});

test('minimum quote locks the entire basket total and billing policy into the unpaid checkout draft',async()=>{
 const {DatabaseSync}=await import('node:sqlite');const {readFileSync}=await import('node:fs');
 const {createShippingQuote}=await import('../functions/api/_shipping.js');const {onRequestPost}=await import('../functions/api/orders.js');
 const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
 const DB={prepare(query){const make=params=>({first:async()=>sql.prepare(query).get(...params)||null,run:async()=>({meta:sql.prepare(query).run(...params)})});return {...make([]),bind:(...params)=>make(params)};}};
 const env={DB};sql.prepare('UPDATE shipping_settings SET config_json=? WHERE id=1').run(JSON.stringify({mode:'minimum_small_parcel',origins:{jt:'56054',lbc:'103314000'},products:{}}));
 const basket={courier:'jt',serviceId:'ez',destinationId:'57307',items:[{id:'tshirt',qty:2,size:'M'},{id:'cap',qty:1}]};
 const quote=await createShippingQuote(env,basket,async()=>Response.json({succ:true,data:[{type:'fee',fees:'95',serviceFee:'0'},{type:'insured',fees:'8'}]}));
 assert.equal(quote.subtotal,750);assert.equal(quote.shippingFee,103);assert.equal(quote.total,853);assert.equal(quote.pricingMode,'minimum_small_parcel');assert.equal(quote.details.parcels.length,1);assert.equal(quote.details.serviceId,'ez');
 const request=new Request('https://example.com/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...basket,fullName:'Delivery Fixture',email:'delivery@example.invalid',phone:'09171234567',address:'123 Fixture Street',city:'QUEZON-CITY',province:'METRO-MANILA',quoteId:quote.id,checkoutToken:'e'.repeat(64),shippingFee:0,total:1})});
 const result=await onRequestPost({request,env,waitUntil:()=>{}});assert.equal(result.status,200);const order=(await result.json()).order;assert.equal(order.shippingFee,103);assert.equal(order.total,853);assert.match(order.shippingMessage,/club covers any higher actual shipping cost/);assert.equal(order.paymentStatus,'pending');assert.equal(order.fulfilmentStatus,'awaiting_payment');
 const stored=sql.prepare('SELECT shipping_quote_json,total FROM orders').get();assert.equal(JSON.parse(stored.shipping_quote_json).pricingMode,'minimum_small_parcel');assert.equal(stored.total,853);sql.close();
});

test('LBC HTTP 403 never becomes an invented flat rate or enables payment',async()=>{
 const {DatabaseSync}=await import('node:sqlite');const {readFileSync}=await import('node:fs');
 const {createShippingQuote}=await import('../functions/api/_shipping.js');
 const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
 const DB={prepare(query){const make=params=>({first:async()=>sql.prepare(query).get(...params)||null,run:async()=>({meta:sql.prepare(query).run(...params)})});return {...make([]),bind:(...params)=>make(params)};}};
 const env={DB};
 sql.prepare('UPDATE shipping_settings SET config_json=? WHERE id=1').run(JSON.stringify({mode:'minimum_small_parcel',origins:{jt:'56054',lbc:'103314000'},products:{}}));
 await assert.rejects(createShippingQuote(env,{courier:'lbc',serviceId:'npack-medium',destinationId:'1381300000',items:[{id:'cap',qty:1}]},async()=>new Response('Forbidden',{status:403})),/courier calculator is unavailable/);
 assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM shipping_quotes').get().n,0);
 sql.close();
});

test('failed J&T requests do not receive a fabricated fallback rate',async()=>{
 const {DatabaseSync}=await import('node:sqlite');const {readFileSync}=await import('node:fs');
 const {createShippingQuote}=await import('../functions/api/_shipping.js');
 const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
 const DB={prepare(query){const make=params=>({first:async()=>sql.prepare(query).get(...params)||null,run:async()=>({meta:sql.prepare(query).run(...params)})});return {...make([]),bind:(...params)=>make(params)};}};
 const env={DB};
 sql.prepare('UPDATE shipping_settings SET config_json=? WHERE id=1').run(JSON.stringify({mode:'minimum_small_parcel',origins:{jt:'56054',lbc:'103314000'},products:{}}));
 await assert.rejects(createShippingQuote(env,{courier:'jt',destinationId:'57307',items:[{id:'cap',qty:1}]},async()=>new Response('Unavailable',{status:503})),/courier calculator is unavailable/);
 sql.close();
});

test('retries a transient J&T HTTP failure without inventing a shipping price',async()=>{
 let requests=0;
 const parcel={minimum:true,weight:1,value:150,quantity:1};
 const rate=await officialShippingRate('jt',{city:'SAN-FERNANDO-CITY'},{city:'QUEZON-CITY'},[parcel],async()=>{
  requests++;
  if(requests===1)return new Response('Unavailable',{status:503});
  return Response.json({succ:true,data:[{type:'fee',fees:'95',serviceFee:'0'},{type:'insured',fees:'5'}]});
 });
 assert.equal(requests,2);
 assert.equal(rate.fee,100);
 assert.match(rate.details[0].service,/J&T EZ/);
});

test('buyer-selected LBC packaging is honored and quotes exactly 1 kg once per basket',async()=>{
 const parcels=packItems([{id:'cap',quantity:3,lineTotal:450}],{mode:'minimum_small_parcel'});
 const ids=[];
 const rate=await officialShippingRate('lbc',{id:'ORIGIN'},{id:'DESTINATION'},parcels,async(url,init)=>{
  if(new URL(url).pathname==='/Scripts/PH_Rate_Calculator.js')return new Response('request.setRequestHeader("token", "'+'a'.repeat(64)+'");');
  const data=new URLSearchParams(init.body);
  if(url.endsWith('/GetProductsV2'))return Response.json({ResponseCode:'0001',ResponseData:{Products:[{ProductId:105,ProductName:'CARGO KB MINI',MaxWeight_Kg:'1',IsWeightRequired:false},{ProductId:16,ProductName:'N-PACK MEDIUM',MaxWeight_Kg:'1',IsWeightRequired:false}]}});
  ids.push(data.get('ProductId'));assert.equal(data.get('Weight'),'1');assert.equal(data.get('DeclaredValue'),'450');
  return Response.json({ResponseCode:'0001',ResponseData:{Price:199,ValuationFee:11}});
 },'kb-mini');
 assert.deepEqual(ids,['105']);assert.equal(rate.fee,210);assert.equal(parcels[0].quantity,1);
 assert.match(rate.details[0].service,/KB MINI/);
});
test('invalid service choice is rejected before an official calculator request',async()=>{
 const {serviceSelection}=await import('../functions/api/_shipping.js');
 assert.throws(()=>serviceSelection('jt','super-premium'),/valid courier service/);
 assert.throws(()=>serviceSelection('lbc','fake-box'),/valid courier service/);
 assert.equal(serviceSelection('jt','ez').id,'ez');
 assert.equal(serviceSelection('pickup').id,'pickup');
});
