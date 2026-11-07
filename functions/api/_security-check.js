import {sheetsConfig} from './_sheets.js';
import {digest} from './_security.js';
import {lbcCookieHeader} from './_shipping.js';
/** Read only configuration metadata; credentials never leave their runtime. */
export async function runRequestedSecurityCheck(env) {
 const claimed=await env.DB.prepare('UPDATE security_check SET requested=0 WHERE id=1 AND requested=1 RETURNING id,checks_json').first();
 if(!claimed)return;
 const token=env.ADMIN_TOKEN||'';
 const settings=await env.DB.prepare('SELECT config_json FROM shipping_settings WHERE id=1').first();
 let deliveryConfigured=false;try{const config=JSON.parse(settings?.config_json||'{}');deliveryConfigured=!!config.origins?.jt&&!!config.origins?.lbc&&(config.mode==='minimum_small_parcel'||Object.keys(config.products||{}).length>0);}catch{}
 const checks={adminCredentialMeetsBaseline:token.length>=24&&new Set(token).size>=8,sheetsConfigured:sheetsConfig(env).configured,deliveryConfigured};
 let probe=false;try{probe=JSON.parse(claimed.checks_json||'{}').probeShipping===true;}catch{}
 if(probe){
  const sources={};const start=Date.now();
  try{
   const page=await fetch('https://www.lbcexpress.com/rates/?cu_rates='+crypto.randomUUID(),{headers:{'Cache-Control':'no-cache','User-Agent':'ChessUnited/1.0 (+https://chessunitedglobal.com)'},signal:AbortSignal.timeout(12000)});
   sources.pageStatus=page.status;sources.pageMs=Date.now()-start;sources.pageCache=page.headers.get('CF-Cache-Status');const cookies=lbcCookieHeader(page.headers);sources.sessionCookieProvided=!!cookies;
   if(page.ok){const html=await page.text();const configs=[...html.matchAll(/var ajax_object\s*=\s*(\{[^;]+\});/g)];sources.publicConfigCount=configs.length;const found=configs.at(-1);sources.publicConfigFound=!!found;
    if(found){const config=JSON.parse(found[1]);sources.ajaxHost=new URL(config.ajax_url||'https://www.lbcexpress.com/wp-admin/admin-ajax.php').host;sources.nonceFingerprint=await digest(config.get_domestic_product_types_nonce);const before=Date.now();const products=await fetch('https://www.lbcexpress.com/wp-admin/admin-ajax.php',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','Origin':'https://www.lbcexpress.com','Referer':'https://www.lbcexpress.com/rates/','X-Requested-With':'XMLHttpRequest',...(cookies?{Cookie:cookies}:{}),'User-Agent':'ChessUnited/1.0 (+https://chessunitedglobal.com)'},body:new URLSearchParams({action:'get_domestic_product_types',security:config.get_domestic_product_types_nonce,is_cargo:'true'}).toString(),signal:AbortSignal.timeout(10000)});sources.productsStatus=products.status;sources.productsMs=Date.now()-before;if(products.ok){const data=await products.json();sources.productsSuccess=data.success;}else{const text=await products.text();sources.nonceRejected=text.trim()==='-1';sources.accessChallenge=/challenge-platform|cf-chl-|captcha/i.test(text);sources.errorBodyLength=text.length;}}
   }
  }catch(e){sources.networkFailure=e.name;sources.totalMs=Date.now()-start;}
  checks.shippingSourceProbe=sources;
 }
 await env.DB.prepare("UPDATE security_check SET checks_json=?,checked_at=datetime('now') WHERE id=1").bind(JSON.stringify(checks)).run();
}
export function scheduleSecurityCheck(context){context.waitUntil(runRequestedSecurityCheck(context.env).catch(()=>console.error('security_configuration_check_deferred')));}
