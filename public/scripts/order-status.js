/* The capability stays in the URL fragment and POST body; never a query string. */
(()=>{
 'use strict';
 const $=s=>document.querySelector(s),message=$('[data-order-status-message]'),panel=$('[data-order-status]'),refresh=$('[data-order-status-refresh]');
 if(!panel)return;
 let key=new URLSearchParams(location.hash.slice(1)).get('key')||'';
 if(!key){try{key=sessionStorage.getItem('cu_last_order_v1')||sessionStorage.getItem('cu_payment_session_v1')||'';}catch{}}
 if(!/^[a-f0-9]{64}$/.test(key)){message.textContent='Open the private status link saved after checkout. If you no longer have it, contact the club with your order number.';return;}
 if(!location.hash)history.replaceState(null,'',location.pathname+'#key='+key);
 const peso=n=>'₱'+Number(n).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
 let busy=false;
 const load=async()=>{
  if(busy)return;busy=true;refresh.disabled=true;
  try{
   const response=await fetch('/api/orders/payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'resume',checkoutToken:key})});
   const body=await response.json();if(!response.ok||!body.ok)throw Error(body.error||'Could not check this order. Please retry.');
   const order=body.order;panel.hidden=false;message.hidden=true;
   $('[data-status-order-no]').textContent=order.orderNo;
   $('[data-status-total]').textContent=peso(order.total);
   $('[data-status-payment]').textContent=order.paymentStatus==='paid'?'GCash payment verified':order.paymentStatus==='refunded'?'Payment refunded':order.submitted?'Payment submitted — awaiting officer verification':'Awaiting payment';
   const pickup=order.courier==='Pick up';
   const labels={awaiting_payment:'Checkout saved',new:'Order received',packed:pickup?'Ready for pickup':'Packed for delivery',shipped:'Handed to courier',delivered:pickup?'Collected':'Delivered',cancelled:'Order cancelled'};
   $('[data-status-fulfilment]').textContent=labels[order.fulfilmentStatus]||'The club is reviewing your order.';
   $('[data-status-delivery]').textContent=order.fulfilmentMessage;
   $('[data-status-tracking]').hidden=!order.trackingNo;
   $('[data-tracking-number]').textContent=order.trackingNo||'';
   const tracking=$('[data-tracking-link]');tracking.hidden=true;tracking.removeAttribute('href');
   if(order.trackingUrl){const url=new URL(order.trackingUrl);if(url.protocol==='https:'&&['www.jtexpress.ph','www.lbcexpress.com'].includes(url.hostname)){tracking.href=url.href;tracking.hidden=false;}}
   const guidance=$('[data-status-guidance]');
   guidance.textContent=order.canPay?'If you have already paid in GCash, return to checkout to submit your reference. Do not pay twice.':order.fulfilmentStatus==='cancelled'?'This order is cancelled. Do not send payment. Contact the club if you have already paid.':order.paymentStatus==='refunded'?'Contact the club if you need help with your refund.':order.paymentStatus==='paid'?'Your payment is confirmed. Check here for handover and tracking updates. Do not pay again.':'The club will check the transfer in GCash. You do not need to pay again.';
   const pay=$('[data-status-pay]');pay.hidden=!order.canPay;
   pay.onclick=()=>{try{sessionStorage.setItem('cu_payment_session_v1',key);}catch{}};
  }catch(e){message.hidden=false;message.textContent=e.message||'Could not reach the club. Refresh to try again.';}
  finally{busy=false;refresh.disabled=false;}
 };
 refresh.addEventListener('click',load);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void load();});
 void load();
})();
