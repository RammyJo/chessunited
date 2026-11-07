import {COURIERS} from './_catalog.js';
export async function tokenHash(token) {
 if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))return null;
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),x=>x.toString(16).padStart(2,'0')).join('');
}
export function orderResult(row) {
 const pickup=row.courier==='pickup';
 let shipping={};try{shipping=JSON.parse(row.shipping_quote_json||'{}');}catch{}
 return {
  orderNo:row.order_no,subtotal:row.subtotal,shippingFee:row.shipping_fee,total:row.total,
  courier:COURIERS[row.courier]?.label||row.courier,lines:JSON.parse(row.items_json),
  fulfilmentMessage:pickup?'Pick up — no shipping fee. The club will arrange the place and time.':`Delivery to ${row.ship_city}, ${row.ship_province} by ${COURIERS[row.courier]?.label||row.courier}.`,
  shippingMessage:shipping.pricingMessage||'',
  paymentStatus:row.payment_status,submitted:!!row.payment_claimed_at,
  fulfilmentStatus:row.fulfilment_status,
  canPay:row.payment_status==='pending' && row.fulfilment_status!=='cancelled' && !row.payment_claimed_at,
 };
}
