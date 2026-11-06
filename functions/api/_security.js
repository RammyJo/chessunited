import { json, fail } from './_utils.js';
const enc = new TextEncoder();
export const MAX_BODY_BYTES = 32768;
export async function digest(value) {
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(value))),x=>x.toString(16).padStart(2,'0')).join('');
}
export function secureResponse(response) {
 const copy = new Response(response.body,response);
 for(const [key,value] of Object.entries({
  'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY',
  'Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  'Strict-Transport-Security':'max-age=31536000','Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'X-Robots-Tag':'noindex, nofollow',
 }))copy.headers.set(key,value);
 return copy;
}
export function requestGuard(request) {
 try{decodeURIComponent(new URL(request.url).pathname);}catch{return fail('Invalid request path.',400);}
 const unsafe=!['GET','HEAD','OPTIONS'].includes(request.method);
 if(unsafe){
  const origin=request.headers.get('Origin');
  if((origin && origin!==new URL(request.url).origin) || request.headers.get('Sec-Fetch-Site')==='cross-site')return fail('This request must come from the club website.',403);
  if(['POST','PUT','PATCH'].includes(request.method) && request.body && request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase()!=='application/json')return fail('Send the form as JSON.',415);
 }
 if(Number(request.headers.get('Content-Length')||0)>MAX_BODY_BYTES)return fail('This form is too large. Shorten the details and retry.',413);
 return null;
}
export async function boundedRequest(request) {
 if(!request.body)return request;
 const reader=request.body.getReader(),chunks=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BODY_BYTES){reader.cancel().catch(()=>{});return null;}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 return new Request(request,{body:bytes});
}
export function requestBudget(request) {
 const path=decodeURIComponent(new URL(request.url).pathname).replace(/\/+$/,'').toLowerCase();
 if(path==='/api/admin/session' && request.method==='POST')return {scope:'login',limit:10,period:900000};
 if(path.startsWith('/api/admin/'))return {scope:'officer',limit:300,period:600000};
 if(path.startsWith('/api/members/') && request.method==='GET')return {scope:'card',limit:60,period:60000};
 if(request.method==='GET'||request.method==='HEAD')return {scope:'read',limit:300,period:60000};
 if(path==='/api/shipping/quote')return {scope:'quote',limit:120,period:600000};
 return {scope:'submit',limit:120,period:600000};
}
export async function checkBudget(request,env) {
 const {scope,limit,period}=requestBudget(request),now=Date.now();
 const ip=request.headers.get('CF-Connecting-IP')||'unavailable';
 const key=await digest('cu-budget-v1:'+scope+':'+ip);
 const row=await env.DB.prepare(`INSERT INTO api_rate_limits(key,hits,reset_at) VALUES(?,1,?)
  ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN reset_at<=? THEN 1 ELSE hits+1 END,
  reset_at=CASE WHEN reset_at<=? THEN excluded.reset_at ELSE reset_at END RETURNING hits,reset_at`)
  .bind(key,now+period,now,now).first();
 if(row.hits===1)await env.DB.prepare('DELETE FROM api_rate_limits WHERE key IN (SELECT key FROM api_rate_limits WHERE reset_at < ? LIMIT 100)').bind(now-86400000).run();
 if(row.hits>limit){const seconds=Math.max(1,Math.ceil((row.reset_at-now)/1000));return json({ok:false,error:'Too many attempts. Please wait and try again.',retryAfter:seconds},429,{'Retry-After':String(seconds)});}
 return null;
}
