import {sheetsConfig} from './_sheets.js';
import {officialShippingRate,CHECKOUT_WEIGHT_KG} from './_shipping.js';
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
  const entries=await Promise.all(['jt','lbc'].map(async courier=>{
   const start=Date.now();
   try{
    const origin=courier==='jt'?{id:'56054',city:'LA-UNION-SAN-FERNANDO-CITY'}:{id:'103314000'};
    const destination=courier==='jt'?{id:'57307',city:'QUEZON-CITY'}:{id:'1381300000'};
    const rate=await officialShippingRate(courier,origin,destination,[{minimum:true,weight:CHECKOUT_WEIGHT_KG,quantity:1,value:150}]);
    return [courier,{available:true,fee:rate.fee,ms:Date.now()-start}];
   }catch{return [courier,{available:false,ms:Date.now()-start}];}
  }));
  checks.shippingSourceProbe=Object.fromEntries(entries);
 }
 await env.DB.prepare("UPDATE security_check SET checks_json=?,checked_at=datetime('now') WHERE id=1").bind(JSON.stringify(checks)).run();
}
export function scheduleSecurityCheck(context){context.waitUntil(runRequestedSecurityCheck(context.env).catch(()=>console.error('security_configuration_check_deferred')));}
