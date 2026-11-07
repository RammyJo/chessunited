import {sheetsConfig} from './_sheets.js';
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
   const page=await fetch('https://www.lbcexpress.com/rates/',{headers:{'User-Agent':'ChessUnited/1.0 (+https://chessunitedglobal.com)'},signal:AbortSignal.timeout(12000)});
   sources.pageStatus=page.status;sources.pageMs=Date.now()-start;
   if(page.ok){const html=await page.text();const found=html.match(/var ajax_object\s*=\s*(\{[^;]+\});/);sources.publicConfigFound=!!found;
    if(found){const config=JSON.parse(found[1]);const before=Date.now();const products=await fetch('https://www.lbcexpress.com/wp-admin/admin-ajax.php',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':'ChessUnited/1.0 (+https://chessunitedglobal.com)'},body:new URLSearchParams({action:'get_domestic_product_types',security:config.get_domestic_product_types_nonce,is_cargo:'true'}),signal:AbortSignal.timeout(10000)});sources.productsStatus=products.status;sources.productsMs=Date.now()-before;if(products.ok){const data=await products.json();sources.productsSuccess=data.success;}}
   }
  }catch(e){sources.networkFailure=e.name;sources.totalMs=Date.now()-start;}
  checks.shippingSourceProbe=sources;
 }
 await env.DB.prepare("UPDATE security_check SET checks_json=?,checked_at=datetime('now') WHERE id=1").bind(JSON.stringify(checks)).run();
}
export function scheduleSecurityCheck(context){context.waitUntil(runRequestedSecurityCheck(context.env).catch(()=>console.error('security_configuration_check_deferred')));}
