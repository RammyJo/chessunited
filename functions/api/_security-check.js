import {sheetsConfig} from './_sheets.js';
/** Read only configuration metadata; credentials never leave their runtime. */
export async function runRequestedSecurityCheck(env) {
 const claimed=await env.DB.prepare('UPDATE security_check SET requested=0 WHERE id=1 AND requested=1 RETURNING id').first();
 if(!claimed)return;
 const token=env.ADMIN_TOKEN||'';
 const settings=await env.DB.prepare('SELECT config_json FROM shipping_settings WHERE id=1').first();
 let deliveryConfigured=false;try{const config=JSON.parse(settings?.config_json||'{}');deliveryConfigured=!!config.origins?.jt&&!!config.origins?.lbc&&(config.mode==='minimum_small_parcel'||Object.keys(config.products||{}).length>0);}catch{}
 const checks={adminCredentialMeetsBaseline:token.length>=24&&new Set(token).size>=8,sheetsConfigured:sheetsConfig(env).configured,deliveryConfigured};
 await env.DB.prepare("UPDATE security_check SET checks_json=?,checked_at=datetime('now') WHERE id=1").bind(JSON.stringify(checks)).run();
}
export function scheduleSecurityCheck(context){context.waitUntil(runRequestedSecurityCheck(context.env).catch(()=>console.error('security_configuration_check_deferred')));}
