import { LOCATIONS } from './_shipping-locations.js';
import { CATALOG, priceItems } from './_catalog.js';
export class ShippingError extends Error {constructor(message,status=503){super(message);this.status=status;}}
export const DEFAULT_ORIGINS = { jt: '56054', lbc: '103314000' };
export const MINIMUM_POLICY = 'minimum_small_parcel';
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
  return [{minimum:true,weight:0.5,quantity:1,value:lines.reduce((n,line)=>n+line.lineTotal,0)}];
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
 let r;try{r=await fetcher(url,{...init,signal:AbortSignal.timeout(6000)});}catch{throw new ShippingError('The courier calculator is unavailable. Please retry or choose pickup.');}
 if(!r.ok)throw new ShippingError('The courier calculator is unavailable. Please retry or choose pickup.');return r;
}
export async function officialShippingRate(courier,origin,destination,parcels,fetcher=fetch) {
 const deadline=Date.now()+18000;
 const boundedFetch=(url,init={})=>fetcher(url,{...init,signal:AbortSignal.timeout(Math.max(1,Math.min(6000,deadline-Date.now())))});
 let context;
 if(courier==='lbc') {
  const html=await (await response(boundedFetch,LBC_PAGE,{cf:{cacheTtl:300,cacheEverything:true}})).text();
  const found=html.match(/var ajax_object\s*=\s*(\{[^;]+\});/);
  try{context=JSON.parse(found?.[1]||'');}catch{throw new ShippingError('LBC calculator settings are unavailable. Please retry or choose another option.');}
 }
 const lbcCall=async(action,data)=>{
  const security=context[action+'_nonce'];if(!/^[a-f0-9]{10}$/.test(security||''))throw new ShippingError('LBC calculator settings have changed. Please choose another option.');
  const r=await (await response(boundedFetch,LBC_AJAX,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({action,security,...data})})).json();
  if(!r.success)throw new ShippingError('LBC could not quote this parcel and destination. Please choose another option.');return r.data;
 };
 let products;if(courier==='lbc')products=await lbcCall('get_domestic_product_types',{is_cargo:'true'});
 let total=0;const details=[];
 for(const p of parcels) {
  let fee,service;
  if(courier==='jt') {
   const r=await (await response(boundedFetch,JT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({country:'PH',senderAddr:origin.city,receiverAddr:destination.city,weight:String(p.weight),goodType:'PARCEL',productType:'EZ',goodsValue:String(p.value),dimensionW:p.width===undefined?'':String(p.width),dimensionH:p.height===undefined?'':String(p.height),dimensionL:p.length===undefined?'':String(p.length),pouchSize:''})})).json();
   const basic=r.data?.find(x=>x.type==='fee');const insured=r.data?.find(x=>x.type==='insured');
   if(!r.succ || !basic || !Number.isFinite(Number(basic.fees)) || Number(basic.fees)<=0)throw new ShippingError('J&T could not quote this route. Please choose another option.');
   fee=Number(basic.fees)+Number(basic.serviceFee||0)+Number(insured?.fees||0);service=p.minimum?'J&T EZ · minimum 0.5 kg rate':'J&T EZ';
  }else{
   const parseFee=r=>Number(String(r.estimated_price).replace(/,/g,''))+Number(String(r.valuation_fee).replace(/,/g,''));
   if(p.minimum) {
    // Compare the official fixed-weight minimum packages, rather than inventing
    // parcel dimensions. Their quoted charge is the customer's final fee.
    const fixed=products.filter(x=>x.IsWeightRequired===false && Number(x.MaxWeight_Kg)>0);
    const minimumWeight=Math.min(...fixed.map(x=>Number(x.MaxWeight_Kg)));
    const candidates=fixed.filter(x=>Number(x.MaxWeight_Kg)===minimumWeight);
    if(!candidates.length || candidates.length>4)throw new ShippingError('LBC minimum packages are unavailable. Choose another courier.');
    const offers=[];
    for(const product of candidates) {
     const r=await lbcCall('get_domestic_calculate_price',{OriginCityId:origin.id,DestinationCityId:destination.id,ProductId:String(product.ProductId),Weight:String(minimumWeight),DeclaredValue:String(p.value)});
     const amount=parseFee(r);if(Number.isFinite(amount)&&amount>0)offers.push({amount,product});
    }
    offers.sort((a,b)=>a.amount-b.amount);
    if(!offers.length)throw new ShippingError('LBC could not quote this route. Please choose another option.');
    fee=offers[0].amount;service=offers[0].product.ProductName+' · minimum '+minimumWeight+' kg rate';
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
 const {lines,subtotal}=priceItems(body.items);if(!lines.length || lines.some(x=>x.size&&!CATALOG[x.id].options.values.includes(x.size)))throw new ShippingError('Choose valid items and sizes.',422);
 const {config,revision}=await shippingSettings(env);
 let destination,origin,rate={fee:0,details:[]};
 if(courier!=='pickup') {
  destination=LOCATIONS[courier].find(x=>x.id===String(body.destinationId));
  if(!destination)throw new ShippingError('Choose a delivery province and city.',422);
  origin=LOCATIONS[courier].find(x=>x.id===config.origins?.[courier]);
  if(!origin)throw new ShippingError('The club must confirm its dispatch location before delivery checkout opens. Pickup is available.');
  rate=await officialShippingRate(courier,origin,destination,packItems(lines,config),fetcher);
 }
 const id=crypto.randomUUID(),expiresAt=Date.now()+15*60*1000;
 const pricingMode=courier==='pickup'?'pickup':config.mode||'measured';
 const pricingMessage=pricingMode===MINIMUM_POLICY?'Minimum small-parcel delivery, once per order. The club covers any higher actual courier charge.':'Courier fee includes valuation. Each product unit ships as a separate parcel. This is the full amount to pay.';
 const details={pricingMode,pricingMessage,origin,destination,parcels:rate.details,source:courier==='pickup'?'Club pickup':courier==='jt'?JT:LBC_PAGE,quotedAt:new Date().toISOString()};
 await env.DB.prepare('DELETE FROM shipping_quotes WHERE expires_at < ?').bind(Date.now()).run();
 await env.DB.prepare('INSERT INTO shipping_quotes(id,basket_json,courier,destination_id,shipping_fee,subtotal,details_json,config_revision,expires_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,JSON.stringify(lines),courier,destination?.id||'',rate.fee,subtotal,JSON.stringify(details),revision,expiresAt).run();
 return {id,shippingFee:rate.fee,subtotal,pricingMode,pricingMessage,total:Math.round((subtotal+rate.fee)*100)/100,expiresAt,details};
}
