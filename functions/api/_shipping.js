import { LOCATIONS } from './_shipping-locations.js';
import { CATALOG, priceItems } from './_catalog.js';
export class ShippingError extends Error {constructor(message,status=503){super(message);this.status=status;}}
export const DEFAULT_ORIGINS = { jt: '56054', lbc: '103314000' };
export const MINIMUM_POLICY = 'minimum_small_parcel';
// The club quotes a single 1 kg shipment per merchandise order, regardless of quantity.
// Buyers never enter guessed dimensions. The club accepts any carrier overage.
export const CHECKOUT_WEIGHT_KG = 1;
export const SERVICE_CHOICES = Object.freeze({
 jt: [{id:'ez',label:'J&T EZ — regular parcel'}],
 lbc: [
  {id:'auto',label:'LBC — lowest available 1 kg parcel'},
  {id:'npack-medium',label:'LBC N-Pack Medium'},
  {id:'kb-mini',label:'LBC Kilobox Mini'},
  {id:'kb-small',label:'LBC Kilobox Small'},
 ],
 pickup:[{id:'pickup',label:'Club pickup (free)'}]
});
export function serviceSelection(courier,serviceId){
 const choices=SERVICE_CHOICES[courier];
 const id=String(serviceId||({jt:'ez',lbc:'auto',pickup:'pickup'}[courier]||''));
 const choice=choices?.find(x=>x.id===id);
 if(!choice)throw new ShippingError('Choose a valid courier service or packaging option.',422);
 return choice;
}
export async function shippingSettings(env) {
 const row = await env.DB.prepare('SELECT config_json,revision FROM shipping_settings WHERE id=1').first();
 return { config: JSON.parse(row?.config_json || '{}'), revision: row?.revision || 1 };
}
export function validateShippingConfig(raw) {
 if (!raw || typeof raw !== 'object') throw new ShippingError('Enter shipping settings.');
 const mode=raw.mode || 'measured';
 if(!['measured',MINIMUM_POLICY].includes(mode))throw new ShippingError('Choose a valid delivery pricing mode.');
 const origins = {};
 for (const courier of ['jt','lbc']) {
  const id=String(raw.origins?.[courier] || '');
  if (!LOCATIONS[courier].some(x=>x.id===id)) throw new ShippingError('Choose a valid dispatch location for each courier.');
  origins[courier]=id;
 }
 const products={};
 for(const id of Object.keys(CATALOG)) {
  const input=raw.products?.[id]; if(!input || Object.values(input).every(x=>x==='' || x===null))continue;
  const p={};for(const k of ['weight','length','width','height']) {
   const n=Number(input[k]);if(!Number.isFinite(n)||n<=0||n>(k==='weight'?50:200))throw new ShippingError(`Enter valid packed kg and cm for ${CATALOG[id].name}, or leave all four empty.`);
   p[k]=n;
  } products[id]=p;
 }
 return { mode, origins, products };
}
export function packItems(lines, config) {
 const units=lines.reduce((n,line)=>n+line.quantity,0);
 if(units>20)throw new ShippingError('Online delivery supports up to 20 items per order. Choose pickup for a larger order.',422);
 if(config.mode===MINIMUM_POLICY) {
  // This is the merchant's customer pricing policy, not a claim of measured
  // merchandise weight/size. The club covers any higher actual carrier charge.
  return [{minimum:true,weight:CHECKOUT_WEIGHT_KG,quantity:1,value:lines.reduce((n,line)=>n+line.lineTotal,0)}];
 }
 // The club specifies measured packed envelopes/boxes. Each unit is priced as a
 // separate parcel. This avoids promising that unrelated fragile goods fit a box.
 const parcels=[];
 for(const line of lines){
  const p=config.products?.[line.id];if(!p)throw new ShippingError('Delivery is not available for one of these items yet. Choose pickup or ask the club to complete its parcel measurements.');
  parcels.push({...p,quantity:line.quantity,value:line.unitPrice,productId:line.id});
 }
 if(parcels.reduce((n,p)=>n+p.quantity,0)>20)throw new ShippingError('Online delivery supports up to 20 parcels. Choose pickup for a larger order.');
 return parcels;
}
const JT='https://ylofficialjw.jtexpress.ph/website/fee/findRates';
const LBC_PAGE='https://www.lbcexpress.com/rates/';
const LBC_AJAX='https://www.lbcexpress.com/wp-admin/admin-ajax.php';
async function response(fetcher,url,init={}) {
 let r;try{r=await fetcher(url,{...init,headers:{'User-Agent':'ChessUnited/1.0 (+https://chessunitedglobal.com)',...init.headers},signal:AbortSignal.timeout(10000)});}catch{throw new ShippingError('The courier calculator is unavailable. Please retry or choose pickup.');}
 if(!r.ok)throw new ShippingError('The courier calculator is unavailable. Please retry or choose pickup.');return r;
}
export function lbcCookieHeader(headers) {
 const values=typeof headers.getSetCookie==='function'?headers.getSetCookie():typeof headers.getAll==='function'?headers.getAll('Set-Cookie'):[headers.get('Set-Cookie')||''];
 return values.map(value=>value.split(';')[0]).filter(value=>/^[^\s=;]+=[^;\r\n]*$/.test(value)).join('; ');
}
export async function officialShippingRate(courier,origin,destination,parcels,fetcher=fetch,serviceId) {
 const selected=serviceSelection(courier,serviceId);
 const deadline=Date.now()+22000;
 const boundedFetch=(url,init={})=>fetcher(url,{...init,signal:AbortSignal.timeout(Math.max(1,Math.min(10000,deadline-Date.now())))});
 let context,lbcCookies='';
 if(courier==='lbc') {
  const page=await response(boundedFetch,LBC_PAGE+'?cu_rates='+crypto.randomUUID(),{headers:{'Cache-Control':'no-cache'},cf:{cacheTtl:0,cacheEverything:false}});
  lbcCookies=lbcCookieHeader(page.headers);
  const html=await page.text();
  const found=[...html.matchAll(/var ajax_object\s*=\s*(\{[^;]+\});/g)].at(-1);
  try{context=JSON.parse(found?.[1]||'');}catch{throw new ShippingError('LBC calculator settings are unavailable. Please retry or choose another option.');}
 }
 const lbcCall=async(action,data)=>{
  const security=context[action+'_nonce'];if(!/^[a-f0-9]{10}$/.test(security||''))throw new ShippingError('LBC calculator settings have changed. Please choose another option.');
  const r=await (await response(boundedFetch,LBC_AJAX,{method:'POST',redirect:'error',headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','Origin':'https://www.lbcexpress.com','Referer':LBC_PAGE,'X-Requested-With':'XMLHttpRequest',...(lbcCookies?{Cookie:lbcCookies}:{})},body:new URLSearchParams({action,security,...data}).toString()})).json();
  if(!r.success)throw new ShippingError('LBC could not quote this parcel and destination. Please choose another option.');return r.data;
 };
 let products;if(courier==='lbc')products=await lbcCall('get_domestic_product_types',{is_cargo:'true'});
 let total=0;const details=[];
 for(const p of parcels) {
  let fee,service;
  if(courier==='jt') {
   const requestBody=JSON.stringify({country:'PH',senderAddr:origin.city,receiverAddr:destination.city,weight:String(p.weight),goodType:'PARCEL',productType:'EZ',goodsValue:String(p.value),dimensionW:p.width===undefined?'':String(p.width),dimensionH:p.height===undefined?'':String(p.height),dimensionL:p.length===undefined?'':String(p.length),pouchSize:''});
   let r;
   // J&T's public rate endpoint can briefly fail even for otherwise serviceable routes.
   // Retry one failed transport/HTTP request; never substitute an invented amount.
   for(let attempt=0;attempt<2;attempt++){
    try{r=await (await response(boundedFetch,JT,{method:'POST',headers:{'Content-Type':'application/json'},body:requestBody})).json();break;}
    catch(error){if(attempt===1)throw error;}
   }
   const basic=r.data?.find(x=>x.type==='fee');const insured=r.data?.find(x=>x.type==='insured');
   if(!r.succ || !basic || !Number.isFinite(Number(basic.fees)) || Number(basic.fees)<=0)throw new ShippingError('J&T could not quote this route. Please choose another option.');
   fee=Number(basic.fees)+Number(basic.serviceFee||0)+Number(insured?.fees||0);service=p.minimum?'J&T EZ · 1 kg parcel rate':'J&T EZ';
  }else{
   const parseFee=r=>Number(String(r.estimated_price).replace(/,/g,''))+Number(String(r.valuation_fee).replace(/,/g,''));
   if(p.minimum) {
    // Product and service options are sourced from the official LBC calculator.
    // No fabricated parcel measurements or a fixed shipping charge are used.
    const eligible=products.filter(x=>Number(x.MaxWeight_Kg)>=CHECKOUT_WEIGHT_KG&&Number(x.ProductId)>0);
    const named=eligible.filter(x=>{
     const name=String(x.ProductName||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
     if(selected.id==='npack-medium')return name.includes('NPACKMEDIUM');
     if(selected.id==='kb-mini')return name.includes('KBMINI');
     if(selected.id==='kb-small')return name.includes('KBSMALL');
     return x.IsWeightRequired===false;
    });
    const candidates=selected.id==='auto'?
     named.sort((a,b)=>Number(a.MaxWeight_Kg)-Number(b.MaxWeight_Kg)).slice(0,4):named.slice(0,1);
    if(!candidates.length)throw new ShippingError('This LBC packaging is not currently available in the official calculator. Choose a different service.');
    const offers=[];
    for(const product of candidates){
     const r=await lbcCall('get_domestic_calculate_price',{OriginCityId:origin.id,DestinationCityId:destination.id,ProductId:String(product.ProductId),Weight:String(CHECKOUT_WEIGHT_KG),DeclaredValue:String(p.value)});
     const amount=parseFee(r);if(Number.isFinite(amount)&&amount>0)offers.push({amount,product});
    }
    offers.sort((a,b)=>a.amount-b.amount);
    if(!offers.length)throw new ShippingError('LBC could not quote this 1 kg service. Choose another service or courier.');
    fee=offers[0].amount;service=offers[0].product.ProductName+' · 1 kg';
   }else{
    // Measured mode chooses an official package fitting the measured unit.
    const dims=[p.length,p.width,p.height].sort((a,b)=>a-b);
    const fits=products.map(x=>({...x,dims:(x.Size_Inch||'').split(/X/i).map(v=>parseFloat(v)*2.54).sort((a,b)=>a-b)}))
     .filter(x=>x.dims.length===3 && x.dims.every((n,i)=>Number.isFinite(n)&&n>=dims[i]) && Number(x.MaxWeight_Kg)>=p.weight)
     .sort((a,b)=>a.dims.reduce((v,n)=>v*n,1)-b.dims.reduce((v,n)=>v*n,1));
    const product=fits[0];if(!product)throw new ShippingError('This parcel does not fit an online LBC package. Choose J&T or pickup.');
    const r=await lbcCall('get_domestic_calculate_price',{OriginCityId:origin.id,DestinationCityId:destination.id,ProductId:String(product.ProductId),Weight:String(Math.max(1,p.weight)),DeclaredValue:String(p.value)});
    fee=parseFee(r);service=product.ProductName;
   }
   // The public calculator returns freight and valuation separately. Verified
   // against two declared values: freight stays fixed while valuation changes.
  }
  if(!Number.isFinite(fee)||fee<=0||fee>50000)throw new ShippingError('The courier returned an invalid price. Please retry or choose pickup.');
  fee=Math.round(fee*100)/100;total+=fee*p.quantity;details.push({...p,fee,service});
 }
 return {fee:Math.round(total*100)/100,details};
}
export async function createShippingQuote(env,body,fetcher=fetch) {
 const courier=body.courier;if(!['lbc','jt','pickup'].includes(courier))throw new ShippingError('Choose a courier or pickup.',422);
 const selected=serviceSelection(courier,body.serviceId);
 const {lines,subtotal}=priceItems(body.items);if(!lines.length || lines.some(x=>x.size&&!CATALOG[x.id].options.values.includes(x.size)))throw new ShippingError('Choose valid items and sizes.',422);
 const {config,revision}=await shippingSettings(env);
 let destination,origin,rate={fee:0,details:[]};
 if(courier!=='pickup') {
  destination=LOCATIONS[courier].find(x=>x.id===String(body.destinationId));
  if(!destination)throw new ShippingError('Choose a delivery province and city.',422);
  origin=LOCATIONS[courier].find(x=>x.id===config.origins?.[courier]);
  if(!origin)throw new ShippingError('The club must confirm its dispatch location before delivery checkout opens. Pickup is available.');
  const parcels=packItems(lines,config);
  rate=await officialShippingRate(courier,origin,destination,parcels,fetcher,selected.id);
 }
 const id=crypto.randomUUID(),expiresAt=Date.now()+15*60*1000;
 const pricingMode=courier==='pickup'?'pickup':config.mode||'measured';
 const pricingMessage=pricingMode===MINIMUM_POLICY?'Official '+selected.label+' quote for 1 kg, once per order. The club covers any higher actual shipping cost.':'Courier fee includes valuation. Each product unit ships as a separate parcel. This is the full amount to pay.';
 const details={pricingMode,pricingMessage,serviceId:selected.id,serviceLabel:selected.label,origin,destination,parcels:rate.details,fallbackApplied:false,source:courier==='pickup'?'Club pickup':courier==='jt'?JT:LBC_PAGE,quotedAt:new Date().toISOString()};
 await env.DB.prepare('DELETE FROM shipping_quotes WHERE expires_at < ?').bind(Date.now()).run();
 await env.DB.prepare('INSERT INTO shipping_quotes(id,basket_json,courier,destination_id,shipping_fee,subtotal,details_json,config_revision,expires_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,JSON.stringify(lines),courier,destination?.id||'',rate.fee,subtotal,JSON.stringify(details),revision,expiresAt).run();
 return {id,shippingFee:rate.fee,subtotal,pricingMode,pricingMessage,total:Math.round((subtotal+rate.fee)*100)/100,expiresAt,details};
}
