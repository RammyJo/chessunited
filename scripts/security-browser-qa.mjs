/** Browser security/UX fixtures: no live data writes, credentials or money. */
import assert from 'node:assert/strict';import puppeteer from 'puppeteer-core';
const args=['--no-sandbox'];if(process.env.QA_URL?.startsWith('https:')&&process.env.HTTPS_PROXY)args.push('--proxy-server='+process.env.HTTPS_PROXY);
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args});
try{
 const page=await browser.newPage();await page.setViewport({width:320,height:844,isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const cardKey='c'.repeat(64),name='<img src=x onerror=window.__injected=1>';let firstToken='',posts=0,cardReads=0;
 await page.setRequestInterception(true);page.on('request',request=>{
  const path=new URL(request.url()).pathname,reply=data=>request.respond({status:200,contentType:'application/json',body:JSON.stringify(data)});
  if(path==='/api/members'&&request.method()==='POST'){
   const data=JSON.parse(request.postData());posts++;assert.match(data.submissionToken,/^[a-f0-9]{64}$/);if(!firstToken)firstToken=data.submissionToken;else assert.equal(data.submissionToken,firstToken);
   if(posts===1)return request.abort('failed');
   return reply({ok:true,member:{memberNo:'CU-2026-12345678',firstName:name,lastName:'Fixture',division:'Open',printedNote:'Free fixture card'},cardUrl:'/membership/?m=CU-2026-12345678#card&key='+cardKey});
  }
  if(path==='/api/members/CU-2026-12345678'){
   assert.equal(request.headers()['x-member-card-key'],cardKey);assert.ok(!request.url().includes(cardKey));cardReads++;
   return reply({ok:true,member:{memberNo:'CU-2026-12345678',fullName:'Browser Security Fixture',division:'Open Division',since:'2026-11-06',status:'active',printedId:false}});
  }
  if(path==='/api/admin/session')return reply({ok:true,configured:true,signedIn:true});
  if(path==='/api/admin/sheets')return reply({ok:true,configured:false,pending:0,total:0});
  if(path==='/api/admin/queue')return reply({ok:true,counts:{},members:[{id:1,member_no:'CU-2026-12345678',first_name:name,last_name:'Fixture',printed_id:0,status:'active'}],registrations:[{id:1,event_slug:'tournament-2-0',full_name:name,amount:350,payment_status:'pending'}],orders:[{id:1,order_no:'ORD-FIXTURE',full_name:name,courier:'pickup',items:[],total:300,subtotal:300,shipping_fee:0,payment_status:'pending',fulfilment_status:'new'}],partnerClubs:[{id:1,club_name:name,status:'pending'}],partnerEvents:[{id:1,title:name,partner_club_id:1,status:'pending'}]});
  if(path==='/api/admin/member-card'){assert.equal(JSON.parse(request.postData()).id,1);return reply({ok:true,cardUrl:'/membership/?m=CU-2026-12345678#card&key='+cardKey});}
  request.continue();
 });
 const base=process.env.QA_URL||'http://127.0.0.1:4321';await page.goto(base+'/membership/',{waitUntil:'networkidle0'});await page.type('#m-first',name);await page.type('#m-last','Fixture');await page.type('#m-email','browser@example.invalid');await page.type('#m-phone','09171234567');
 await page.click('form[data-api="/api/members"] [type="submit"]');await page.waitForFunction(()=>{const s=document.querySelector('[data-form-status]');return !s.hidden&&s.textContent.includes('Could not reach');});
 const saved=await page.evaluate(()=>Object.entries(sessionStorage).find(([k])=>k.startsWith('cu_submission_v1:'))?.[1]);assert.ok(saved&&!saved.includes('browser@example.invalid'));
 await page.click('form[data-api="/api/members"] [type="submit"]');await page.waitForSelector('[data-success]:not([hidden])');assert.equal(posts,2);assert.equal(await page.evaluate(()=>window.__injected),undefined);assert.equal(await page.$eval('[data-success]',e=>e.querySelectorAll('img').length),0);assert.ok((await page.$eval('[data-success]',e=>e.textContent)).includes(name));
 await page.click('[data-success] a');await page.waitForSelector('[data-card-body]:not([hidden])');assert.equal(cardReads,1);assert.equal(await page.$eval('[data-card-name]',e=>e.textContent),'Browser Security Fixture');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'card overflow at 320px');
 console.log('PASS: lost signup replies retain one key, success text resists HTML injection, private card keys stay out of API URLs, eight-digit cards fit mobile.');
 await page.goto(base+'/admin/',{waitUntil:'networkidle0'});await page.waitForSelector('[data-admin-dashboard]:not([hidden])');await page.waitForSelector('[data-queue-body="members"] tr');
 for(const kind of ['members','registrations','orders','clubs','events']){
  const counts=await page.$eval(`[data-queue-body="${kind}"]`,e=>({actual:e.querySelector('tr').children.length,expected:e.closest('table').querySelectorAll('thead th').length,images:e.querySelectorAll('img').length}));assert.equal(counts.actual,counts.expected,kind+' table cells');assert.equal(counts.images,0);
 }
 const button=await page.$('button::-p-text(New private card link)');assert.ok(button);await button.evaluate(e=>e.scrollIntoView({behavior:'instant',block:'center',inline:'center'}));await button.click();await page.waitForSelector('[data-queue-body="members"] a');assert.equal(await page.evaluate(()=>window.__injected),undefined);assert.deepEqual(errors,[]);
 console.log('PASS: all officer tables align, untrusted text remains text, and replacement private card links work.');
}finally{await browser.close();}
