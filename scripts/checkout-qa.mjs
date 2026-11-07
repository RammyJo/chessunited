/** Browser checkout regressions. API fixtures only; no production records or payments. */
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
const browserArgs=['--no-sandbox'];if(process.env.QA_URL?.startsWith('https:')&&process.env.HTTPS_PROXY)browserArgs.push('--proxy-server='+process.env.HTTPS_PROXY);
const browser=await puppeteer.launch({executablePath:'/usr/bin/chromium',args:browserArgs});
try{
 const page=await browser.newPage();await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));let draft=null,submitted=false,token='',orderPosts=0;
 await page.setRequestInterception(true);page.on('request',request=>{
  const path=new URL(request.url()).pathname;
  const reply=(body,status=200)=>request.respond({status,contentType:'application/json',body:JSON.stringify(body)});
  if(path==='/api/shipping/quote'){
   const body=JSON.parse(request.postData());const fee=body.courier==='pickup'?0:100;
   return reply({ok:true,quote:{id:'local-quote',shippingFee:fee,subtotal:300,total:300+fee,pricingMode:body.courier==='pickup'?'pickup':'minimum_small_parcel',pricingMessage:'Minimum small-parcel delivery, once per order. The club covers any higher actual courier charge.',expiresAt:Date.now()+900000}});
  }
  if(path==='/api/orders'){
   const body=JSON.parse(request.postData());assert.equal(body.quoteId,'local-quote');assert.match(body.checkoutToken,/^[a-f0-9]{64}$/);token=body.checkoutToken;orderPosts++;
   draft={orderNo:'ORD-LOCAL-TEST',subtotal:300,shippingFee:body.courier==='pickup'?0:195,total:body.courier==='pickup'?300:495,lines:[{name:'T-shirt',quantity:1,size:'M',lineTotal:300}],fulfilmentMessage:'Local test pickup.',submitted:false,paymentStatus:'pending'};return reply({ok:true,order:draft});
  }
  if(path==='/api/orders/payment'){
   const body=JSON.parse(request.postData());assert.equal(body.checkoutToken,token);if(body.action==='submit')submitted=true;return reply({ok:true,order:{...draft,submitted}});
  }
  request.continue();
 });
 const base=process.env.QA_URL||'http://127.0.0.1:4321';await page.goto(base+'/shop/',{waitUntil:'networkidle0'});
 await page.click('label[for="size-tshirt-M"]');await page.click('[data-add-to-cart="tshirt"]');await page.waitForFunction(()=>document.querySelector('[data-cart-drawer]').getAttribute('aria-hidden')==='false');await page.click('[data-cart-checkout]');
 await page.type('#o-name','Checkout Test');await page.type('#o-email','checkout@example.invalid');await page.type('#o-phone','09171234567');await page.select('#o-courier','jt');await page.waitForSelector('#o-province option[value="METRO-MANILA"]');await page.select('#o-province','METRO-MANILA');await page.select('#o-city','QUEZON-CITY');await page.waitForFunction(()=>document.querySelector('[data-cart-grand]').textContent.includes('400'));assert.match(await page.$eval('[data-cart-shipping-note]',e=>e.textContent),/once per order/);await page.select('#o-courier','pickup');
 await page.waitForFunction(()=>document.querySelector('[data-cart-grand]').textContent.includes('300'));
 assert.equal(await page.$eval('#o-city',e=>e.disabled),true);assert.equal(await page.$eval('#o-address',e=>e.disabled),true);
 await page.click('form[data-api="/api/orders"] [type="submit"]');await page.waitForSelector('[data-order-payment]:not([hidden])');
 assert.equal(await page.$eval('[data-order-payment] [data-gcash-amount]',e=>e.textContent),'₱300.00');
 assert.ok(await page.$eval('form[data-api="/api/orders"]',e=>e.hidden));assert.equal(orderPosts,1);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.reload({waitUntil:'networkidle0'});await page.waitForSelector('[data-order-payment]:not([hidden])');assert.equal(orderPosts,1);
 await page.type('[data-order-payment-ref]','0001234567890');await page.click('[data-order-paid]');await page.waitForSelector('[data-success]:not([hidden])');assert.equal(submitted,true);
 assert.match(await page.$eval('[data-success]',e=>e.textContent),/payment verification/);
 assert.equal(await page.evaluate(()=>sessionStorage.getItem('cu_payment_session_v1')),null);
 // If an officer already verified the transfer, a recovered session must not
 // ask the buyer to pay again.
 draft.paymentStatus='paid';submitted=false;await page.evaluate(t=>sessionStorage.setItem('cu_payment_session_v1',t),token);await page.reload({waitUntil:'networkidle0'});await page.waitForSelector('[data-success]:not([hidden])');assert.match(await page.$eval('[data-success]',e=>e.textContent),/Payment verified/);assert.equal(await page.$eval('[data-order-payment]',e=>e.hidden),true);

 draft.paymentStatus='pending';draft.fulfilmentStatus='cancelled';draft.canPay=false;submitted=false;await page.evaluate(t=>sessionStorage.setItem('cu_payment_session_v1',t),token);await page.reload({waitUntil:'networkidle0'});await page.waitForSelector('[data-order-payment]:not([hidden])');assert.equal(await page.$eval('[data-order-payment] [data-gcash-panel]',e=>getComputedStyle(e).display),'none');assert.match(await page.$eval('[data-order-payment-warning]',e=>e.textContent),/Do not send money/);

 await page.goto(base+'/events/',{waitUntil:'networkidle0'});const eventForm=await page.$('form[data-api="/api/registrations"]');assert.ok(eventForm);
 const amount=await eventForm.$eval('[data-gcash-amount]',e=>e.textContent);assert.ok(/₱[0-9]/.test(amount));const options=await eventForm.$$eval('[name="division"] option',es=>es.map(e=>e.value));await (await eventForm.$('select[name="division"]')).select(options[1]);const amount2=await eventForm.$eval('[data-gcash-amount]',e=>e.textContent);assert.notEqual(amount,amount2);
 await page.goto(base+'/membership/',{waitUntil:'networkidle0'});assert.equal(await page.$eval('[data-printed-payment]',e=>e.hidden),true);await page.click('#m-printed');assert.equal(await page.$eval('[data-printed-payment]',e=>e.hidden),false);assert.equal(await page.$eval('#m-ref',e=>e.required),true);
 assert.deepEqual(errors,[]);console.log('PASS: mobile total → GCash draft → reload/resume → claim; event fee and printed membership QR. Mock payments only.');
}finally{await browser.close();}
