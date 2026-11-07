/** Browser regression: live-style shipping failures must never trap checkout or create an unquoted order. */
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import puppeteer from 'puppeteer-core';
const exe=['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync);
assert.ok(exe,'Headless Chrome must be present on the CI runner');
const browser=await puppeteer.launch({executablePath:exe,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage();
 await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
 let orders=0,rateRequests=0,failJT=true,scriptErrors=[];
 page.on('pageerror',e=>scriptErrors.push(e.message));
 await page.setRequestInterception(true);
 page.on('request',request=>{
  const path=new URL(request.url()).pathname;
  const send=(status,body)=>request.respond({status,contentType:'application/json',body:JSON.stringify(body)});
  if(path==='/api/shipping/quote'){
   rateRequests++;const b=JSON.parse(request.postData()||'{}');
   if(b.courier==='jt'&&failJT)return send(503,{ok:false,error:'J&T live calculator is temporarily unavailable. Retry or choose pickup.'});
   const fee=b.courier==='pickup'?0:b.courier==='jt'?95:100;
   return send(200,{ok:true,quote:{id:'TEST-QUOTE-'+rateRequests,subtotal:150,shippingFee:fee,total:150+fee,expiresAt:Date.now()+10*60*1000,pricingMessage:'Valid shipping quote',details:{fallbackApplied:false}}});
  }
  if(path==='/api/orders'){
   const b=JSON.parse(request.postData()||'{}');orders++;
   assert.ok(b.quoteId,'No order can be created without a quote');
   assert.match(b.checkoutToken,/^[0-9a-f]{64}$/);
   return send(200,{ok:true,order:{orderNo:'MOCK-TEST',subtotal:150,shippingFee:b.courier==='pickup'?0:95,total:b.courier==='pickup'?150:245,lines:[{name:'Cap',quantity:1,lineTotal:150}],fulfilmentMessage:'Test fixture',shippingMessage:'No actual payment',paymentStatus:'pending',fulfilmentStatus:'awaiting_payment',submitted:false,canPay:true}});
  }
  if(path==='/api/orders/payment')return send(404,{ok:false,error:'No existing session'});
  request.continue();
 });
 const base=process.env.QA_URL||'http://127.0.0.1:4321';
 await page.goto(base+'/shop/',{waitUntil:'networkidle0'});
 await page.click('[data-add-to-cart="cap"]');await page.click('[data-cart-checkout]');
 await page.type('#o-name','Checkout Browser Test');
 await page.type('#o-email','checkout@example.invalid');
 await page.type('#o-phone','09171234567');
 await page.type('#o-address','123 Fixture Street');
 await page.select('#o-courier','jt');
 await page.waitForSelector('#o-province option[value="METRO-MANILA"]',{timeout:15000});
 await page.select('#o-province','METRO-MANILA');
 await page.waitForSelector('#o-city option[value="QUEZON-CITY"]');
 await page.select('#o-city','QUEZON-CITY');
 await page.waitForFunction(()=>document.querySelector('[data-cart-shipping-note]')?.textContent.includes('unavailable'));
 const submit='form[data-api="/api/orders"] [type="submit"]';
 assert.equal(await page.$eval(submit,el=>el.disabled),false,'Button must remain actionable when a rate fails');
 await page.click(submit);
 await page.waitForSelector('form[data-api="/api/orders"] [data-form-status]:not([hidden])');
 assert.match(await page.$eval('[data-form-status]',el=>el.textContent),/shipping total is not ready/i);
 assert.equal(orders,0,'Do not send an unquoted order');
 console.log('PASS: J&T API failure is explained on click without an unpaid order.');
 failJT=false;
 await page.select('#o-courier','pickup');
 await page.waitForFunction(()=>document.querySelector('[data-cart-grand]').textContent.includes('150'));
 assert.equal(await page.$eval(submit,el=>el.disabled),false);
 await page.click(submit);
 await page.waitForSelector('[data-order-payment]:not([hidden])',{timeout:10000});
 assert.equal(orders,1);
 assert.equal(await page.$eval('[data-order-payment] [data-gcash-amount]',e=>e.textContent),'₱150.00');
 console.log('PASS: Switching to pickup resumes checkout and displays GCash QR screen. No payment or production order occurred.');
 assert.deepEqual(scriptErrors,[]);
}finally{await browser.close();}
