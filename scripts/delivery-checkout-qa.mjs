/** Actual browser shipping → payment checks. Order POSTs are fixtures, never production writes. */
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
const base=process.env.QA_URL||'http://127.0.0.1:4321';const live=process.env.QA_LIVE_RATES==='1';
const args=['--no-sandbox'];if(base.startsWith('https:')&&process.env.HTTPS_PROXY)args.push('--proxy-server='+process.env.HTTPS_PROXY);
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args});
try{
 for(const courier of ['jt','lbc']){
  const context=await browser.createBrowserContext(),page=await context.newPage();await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
  let rateRequests=0,orderPosts=0,pendingRequest,quote;
  let rateStarted,quoteReceived;const started=new Promise(r=>rateStarted=r),received=new Promise(r=>quoteReceived=r);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('response',async response=>{
   if(live&&new URL(response.url()).pathname==='/api/shipping/quote'){
    const body=await response.json();quote=body.quote;quoteReceived({status:response.status(),body});
   }
  });
  await page.setRequestInterception(true);page.on('request',async request=>{
   const path=new URL(request.url()).pathname;
   if(path==='/api/shipping/quote'){
    const body=JSON.parse(request.postData());assert.equal(body.courier,courier);assert.ok(body.serviceId);assert.ok(body.destinationId);rateRequests++;
    rateStarted();if(!live){pendingRequest=request;return;}return request.continue();
   }
   if(path==='/api/orders'){
    await received;
    const body=JSON.parse(request.postData());assert.equal(body.courier,courier);assert.equal(body.quoteId,quote.id);assert.equal(body.serviceId,courier==='jt'?'ez':'auto');assert.ok(body.address.length>=8);assert.match(body.checkoutToken,/^[a-f0-9]{64}$/);orderPosts++;
    return request.respond({status:200,contentType:'application/json',body:JSON.stringify({ok:true,order:{orderNo:'DELIVERY-UI-FIXTURE',subtotal:150,shippingFee:quote.shippingFee,total:quote.total,lines:[{name:'Cap',quantity:1,lineTotal:150}],fulfilmentMessage:courier+' delivery fixture',shippingMessage:quote.pricingMessage,paymentStatus:'pending',submitted:false,canPay:true}})});
   }
   return request.continue();
  });
  await page.goto(base+'/shop/',{waitUntil:'networkidle0'});await page.click('[data-add-to-cart="cap"]');await page.waitForFunction(()=>document.querySelector('[data-cart-drawer]').getAttribute('aria-hidden')==='false');await page.$eval('[data-cart-checkout]',e=>e.click());
  for(const[id,value]of [['#o-name','Delivery Browser Fixture'],['#o-email','delivery@example.invalid'],['#o-phone','09171234567'],['#o-address','123 Delivery Fixture Street']])await page.type(id,value);
  await page.select('#o-courier',courier);const province=courier==='jt'?'METRO-MANILA':'NATIONAL CAPITAL REGION NCR',city=courier==='jt'?'QUEZON-CITY':'QUEZON CITY';await page.waitForFunction(value=>Array.from(document.querySelector('#o-province').options).some(o=>o.value===value),{},province);await page.select('#o-province',province);await page.select('#o-city',city);
  await started;
  const submit='form[data-api="/api/orders"] [type="submit"]';await page.click(submit);
  if(!live){
   assert.equal(await page.$eval(submit,e=>e.disabled),true,'Button must show a busy state while awaiting its quote');assert.equal(orderPosts,0);
   const fee=courier==='jt'?170:200;quote={id:'QUOTE-'+courier,subtotal:150,shippingFee:fee,total:150+fee,expiresAt:Date.now()+900000,pricingMessage:'Official 1 kg parcel quote, once per order'};
   await pendingRequest.respond({status:200,contentType:'application/json',body:JSON.stringify({ok:true,quote})});quoteReceived({status:200,body:{ok:true,quote}});
  }
  const response=await received;assert.equal(response.status,200,JSON.stringify({courier,error:response.body.error}));
  await page.waitForSelector('[data-order-payment]:not([hidden])',{timeout:35000});assert.equal(orderPosts,1);assert.equal(rateRequests,1,'Click must reuse the quote already loading');
  const displayed=await page.$eval('[data-order-payment] [data-gcash-amount]',e=>e.textContent);assert.equal(displayed,'₱'+quote.total.toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2}));assert.deepEqual(errors,[]);
  console.log('PASS: '+courier.toUpperCase()+' delivery reaches payment from one click; shipping ₱'+quote.shippingFee+', total ₱'+quote.total+'. '+(live?'Actual live courier quote; order intercepted.':'Delayed quote fixture.'));
  await context.close();
 }
}finally{await browser.close();}
