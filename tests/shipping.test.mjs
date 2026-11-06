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
  if(url.endsWith('/rates/'))return new Response('var ajax_object = {"get_domestic_product_types_nonce":"1234567890","get_domestic_calculate_price_nonce":"abcdef0123"};');
  assert.equal(url,'https://www.lbcexpress.com/wp-admin/admin-ajax.php');const data=new URLSearchParams(init.body);calls.push(data);
  if(data.get('action')==='get_domestic_product_types')return Response.json({success:true,data:[{ProductId:1,ProductName:'Too small',MaxWeight_Kg:10,Size_Inch:'3 X 3 X 3 IN'},{ProductId:2,ProductName:'Fits',MaxWeight_Kg:10,Size_Inch:'12 X 10 X 5 IN'}]});
  return Response.json({success:true,data:{estimated_price:'300.00',valuation_fee:'15.00'}});
 });assert.equal(rate.fee,630);assert.equal(calls[1].get('ProductId'),'2');assert.equal(calls[1].get('OriginCityId'),'ORIGIN');
});
test('parcel facts must be configured; wrong origins, partial or negative measurements are rejected',()=>{
 assert.throws(()=>validateShippingConfig({origins:{jt:'fake',lbc:'fake'}}),/valid dispatch/);
 assert.throws(()=>validateShippingConfig({origins:{jt:'56054',lbc:'103314000'},products:{tshirt:{weight:1}}}),/valid packed/);
 assert.throws(()=>packItems([{id:'tshirt',quantity:1}],{}),/not available/);
 const config=validateShippingConfig({origins:{jt:'56054',lbc:'103314000'},products:{tshirt:{weight:1,length:30,width:20,height:5},cap:{weight:'',length:'',width:'',height:''}}});assert.equal(packItems([{id:'tshirt',quantity:2,unitPrice:300}],config)[0].quantity,2);assert.equal(config.products.cap,undefined);
});
