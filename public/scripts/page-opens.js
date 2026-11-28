import {publicPath} from './analytics-metrics.js?v=20261127';
const timeout=30*60*1000,day=86400000;
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
const valid=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
// Only fixed public paths are sent. Never collect query strings, fragments or form values.
if(publicPath(location.pathname)&&!(location.pathname==='/membership/'&&new URLSearchParams(location.search).has('m'))&&!navigator.webdriver&&!document.querySelector('meta[name="robots"]')?.content.includes('noindex')) {
 let page=null,recorded=false,lastTick=performance.now(),lastInput=Date.now(),pending=false,dirty=false,lastSent='';
 const read=key=>{try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}};
 const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
 function identity(){
  if(navigator.globalPrivacyControl||navigator.doNotTrack==='1'){try{localStorage.removeItem('cu_analytics_browser_v1');localStorage.removeItem('cu_analytics_visit_v1');}catch{}return null;}
  let saved=read('cu_analytics_browser_v1');if(!valid(saved?.id)||!Number.isFinite(saved?.expires)||saved.expires<Date.now())saved={id:token(),expires:Date.now()+90*day};
  return write('cu_analytics_browser_v1',saved)?saved.id:null;
 }
 function visit(browser,force=false){
  const saved=browser?read('cu_analytics_visit_v1'):null;
  const id=!force&&valid(saved?.id)&&saved.browser===browser&&Date.now()-saved.lastActive<timeout?saved.id:token();
  if(browser)write('cu_analytics_visit_v1',{id,browser,lastActive:Date.now()});
  return id;
 }
 const active=()=>!document.hidden&&document.hasFocus()&&(Date.now()-lastInput<60000||Array.from(document.querySelectorAll('video')).some(v=>!v.paused&&!v.ended));
 function tick(){const now=performance.now();if(page&&active())page.activeMs+=Math.max(0,Math.min(now-lastTick,5000));lastTick=now;}
 function touchVisit(){if(page?.browserId&&active())write('cu_analytics_visit_v1',{id:page.visitId,browser:page.browserId,lastActive:Date.now()});}
 async function transmit(body){try{return (await fetch('/api/analytics',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',keepalive:true,body:JSON.stringify(body)})).ok;}catch{return false;}}
 function scroll(){if(!page)return;const height=Math.max(document.body.scrollHeight,document.documentElement.scrollHeight);page.scrollDepth=Math.max(page.scrollDepth,Math.min(100,Math.round((scrollY+innerHeight)/Math.max(1,height)*100)));}
 function begin(kind='open'){
  let referrer='';try{referrer=new URL(document.referrer).origin;}catch{}
  const tag=(new URLSearchParams(location.search).get('utm_source')||'').toLowerCase(),campaign=['facebook','fb','instagram','ig','google'].includes(tag)?tag:'';
  const browserId=identity();page={kind,path:location.pathname,pageId:token(),visitId:visit(browserId,kind==='resume'),browserId,referrer:kind==='resume'?'':referrer,campaign:kind==='resume'?'':campaign,activeMs:0,scrollDepth:0,formStarted:false,formCompleted:false,formError:false,outbound:false,ready:false};lastSent='';scroll();
  const current=page,opening={kind,path:current.path,pageId:current.pageId,visitId:current.visitId,browserId,referrer:current.referrer,campaign:current.campaign};
  void(async()=>{for(let attempt=0;attempt<3;attempt++){if(await transmit(opening)){current.ready=true;if(current===page)flush();return;}await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));}})();
 }
 function flush(){
  tick();scroll();touchVisit();if(!page?.ready)return;if(pending){dirty=true;return;}
  const current=page,body={kind:'engagement',pageId:current.pageId,visitId:current.visitId,activeMs:Math.min(14400000,Math.floor(current.activeMs)),scrollDepth:current.scrollDepth,formStarted:current.formStarted,formCompleted:current.formCompleted,formError:current.formError,outbound:current.outbound},snapshot=JSON.stringify(body);
  if(snapshot===lastSent)return;pending=true;
  void transmit(body).then(ok=>{if(ok&&current===page)lastSent=snapshot;}).finally(()=>{pending=false;if(dirty){dirty=false;flush();}});
 }
 function input(){
  tick();const expired=page&&Date.now()-lastInput>=timeout;lastInput=Date.now();
  if(expired){flush();begin('resume');}touchVisit();
 }
 const record=event=>{if(document.prerendering||(recorded&&!event?.persisted))return;recorded=true;lastInput=Date.now();lastTick=performance.now();begin();};
 addEventListener('pageshow',record);document.addEventListener('prerenderingchange',record,{once:true});
 for(const type of ['pointerdown','keydown','scroll','touchstart'])addEventListener(type,input,{passive:true});
 addEventListener('focus',input);addEventListener('blur',flush);document.addEventListener('visibilitychange',()=>{if(document.hidden)flush();else{lastTick=performance.now();input();}});addEventListener('pagehide',flush);
 setInterval(tick,1000);setInterval(flush,15000);
 document.addEventListener('focusin',event=>{if(event.target.closest?.('form[data-api]')&&page){page.formStarted=true;flush();}});
 document.addEventListener('invalid',event=>{if(event.target.closest?.('form[data-api]')&&page){page.formStarted=true;page.formError=true;flush();}},true);
 document.addEventListener('cu:form-result',event=>{if(!page)return;page.formStarted=true;if(event.detail?.ok)page.formCompleted=true;else page.formError=true;flush();});
 document.addEventListener('cu:order-complete',()=>{if(page){page.formStarted=true;page.formCompleted=true;flush();}});
 document.addEventListener('click',event=>{const link=event.target.closest?.('a[href]');if(!link||!page)return;try{if(new URL(link.href,location.href).origin!==location.origin){page.outbound=true;flush();}}catch{}});
}
