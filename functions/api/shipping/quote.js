import {json,fail,readJson,hasDb,noDb} from '../_utils.js';
import {createShippingQuote,ShippingError} from '../_shipping.js';
export async function onRequestPost({request,env}) {
 if(!hasDb(env))return noDb();const body=await readJson(request);if(!body)return fail('Send a JSON body.');
 try{return json({ok:true,quote:await createShippingQuote(env,body)});}catch(e){return fail(e instanceof ShippingError?e.message:'Shipping is unavailable. Please retry or choose pickup.',e instanceof ShippingError?e.status:503);}
}
