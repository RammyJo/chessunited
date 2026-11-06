import {json,fail,readJson,isAdmin,requireAdmin,hasDb,noDb} from '../_utils.js';
import {shippingSettings,validateShippingConfig,ShippingError,DEFAULT_ORIGINS} from '../_shipping.js';
import {CATALOG} from '../_catalog.js';
export async function onRequest({request,env}) {
 if(!hasDb(env))return noDb();if(!(await isAdmin(request,env)))return requireAdmin(env);
 try{
  if(request.method==='POST'){
   const body=await readJson(request);const config=validateShippingConfig(body);
   await env.DB.prepare('UPDATE shipping_settings SET config_json=?,revision=revision+1 WHERE id=1').bind(JSON.stringify(config)).run();
  }else if(request.method!=='GET')return fail('Method not supported.',405);
  return json({ok:true,...await shippingSettings(env),products:Object.entries(CATALOG).map(([id,p])=>({id,name:p.name})),suggestedOrigins:DEFAULT_ORIGINS});
 }catch(e){return fail(e instanceof ShippingError?e.message:'Could not save shipping settings.',422);}
}
