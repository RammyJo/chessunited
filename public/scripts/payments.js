/* GCash QR payments: buyers submit a claim; only officers verify receipt. */
(() => {
 'use strict';
 const $=(s,c=document)=>c.querySelector(s);
 const peso=n=>'₱'+Number(n).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
 document.querySelectorAll('form[data-api="/api/registrations"]').forEach(form=>{
  const division=$('[name="division"]',form),amount=$('[data-gcash-amount]',form);
  const update=()=>{const fee=Number(division?.selectedOptions[0]?.dataset.entryFee);if(amount)amount.textContent=Number.isFinite(fee)&&fee>0?peso(fee):'Select your division to see the entry fee.';};
  const checkOpen=()=>{if(form.dataset.registrationCloses && Date.now()>=Date.parse(form.dataset.registrationCloses)){form.hidden=true;let notice=form.parentElement.querySelector('[data-registration-closed]');if(!notice){notice=document.createElement('p');notice.dataset.registrationClosed='';notice.className='note-box';notice.textContent='Registration for this tournament has closed. Please choose an upcoming event.';form.after(notice);}}};
  division?.addEventListener('change',update);update();checkOpen();setInterval(checkOpen,60000);
 });
 const member=$('form[data-api="/api/members"]');
 if(member){const checkbox=$('[name="printedId"]',member),panel=$('[data-printed-payment]',member),ref=$('[name="gcashRef"]',member);const update=()=>{if(panel)panel.hidden=!checkbox.checked;if(ref){ref.required=checkbox.checked;ref.closest('.field').hidden=!checkbox.checked;}};checkbox?.addEventListener('change',update);update();}
 const form=$('form[data-api="/api/orders"]');if(!form)return;
 const courier=$('[name="courier"]',form),province=$('[data-shipping-province]',form),city=$('[data-shipping-city]',form);
 const quoteId=$('[data-shipping-quote-id]',form),destination=$('[data-shipping-destination-id]',form),tokenInput=$('[data-checkout-token]',form);
 const shipping=$('[data-cart-shipping]'),grand=$('[data-cart-grand]'),note=$('[data-cart-shipping-note]'),submit=$('[type="submit"]',form);
 const panel=$('[data-order-payment]'),success=$('[data-success]',form.closest('[data-form-shell]'));
 const payStatus=$('[data-order-payment-status]',panel),payButton=$('[data-order-paid]',panel),ref=$('[data-order-payment-ref]',panel);
 const KEY='cu_payment_session_v1';let locations=null,sequence=0,lastSignature='',timer,expiry,prepared=null,token='';
 try{token=sessionStorage.getItem(KEY)||'';}catch{}
 const makeToken=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
 const persist=()=>{tokenInput.value=token;try{if(token)sessionStorage.setItem(KEY,token);else sessionStorage.removeItem(KEY);}catch{}};persist();
 const items=()=>Array.from(form.querySelectorAll('[data-item-id]')).map(i=>({id:i.dataset.itemId,qty:Number(i.value),...(i.dataset.itemSize?{size:i.dataset.itemSize}:{})}));
 const payload=()=>({courier:courier.value,destinationId:destination.value,items:items()});
 const message=s=>{note.textContent=s;note.hidden=false;};
 const invalidate=()=>{clearTimeout(expiry);quoteId.value='';submit.disabled=true;shipping.textContent=courier.value==='pickup'?'₱0 — pick up':'—';grand.textContent='—';};
 const quote=async()=>{
  if(prepared)return;
  const data=payload(),signature=JSON.stringify(data),version=++sequence;lastSignature=signature;invalidate();
  if(!data.items.length)return;
  if(data.courier!=='pickup'&&!data.destinationId){message('Choose a delivery province and city to see the full total.');return;}
  message('Calculating the full total…');
  try{
   const response=await fetch('/api/shipping/quote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const body=await response.json();
   if(version!==sequence||JSON.stringify(payload())!==signature)return;
   if(!response.ok||!body.ok)throw new Error(body.error||'Could not calculate shipping. Retry or choose pickup.');
   quoteId.value=body.quote.id;shipping.textContent=peso(body.quote.shippingFee);grand.textContent=peso(body.quote.total);submit.disabled=false;
   message(data.courier==='pickup'?'Pickup has no shipping fee. This is the amount to pay.':'Courier fee includes valuation. Each product unit ships as a separate parcel. This is the full amount to pay.');
   expiry=setTimeout(()=>{invalidate();message('Refresh the delivery total before continuing.');},Math.max(0,body.quote.expiresAt-Date.now()));
  }catch(e){if(version===sequence){message(e.message||'Could not reach the shipping calculator. Please retry.');}}
 };
 const schedule=()=>{const signature=JSON.stringify(payload());if(signature===lastSignature)return;lastSignature=signature;++sequence;invalidate();clearTimeout(timer);timer=setTimeout(quote,400);};
 const option=(value,label)=>{const o=document.createElement('option');o.value=value;o.textContent=label;return o;};
 const loadProvinces=()=>{
  province.replaceChildren(option('','Choose a province'));city.replaceChildren(option('','Choose province first'));destination.value='';
  const list=locations?.[courier.value]||[];for(const name of [...new Set(list.map(x=>x.province))].sort())province.append(option(name,name.replace(/-/g,' ')));
  const pickup=courier.value==='pickup';for(const select of [province,city]){select.disabled=pickup;select.required=!pickup;select.closest('[data-delivery-field]').hidden=pickup;}
  schedule();
 };
 province.addEventListener('change',()=>{city.replaceChildren(option('','Choose a city / municipality'));destination.value='';for(const location of (locations?.[courier.value]||[]).filter(x=>x.province===province.value).sort((a,b)=>a.city.localeCompare(b.city))){const o=option(location.city,location.city.replace(/-/g,' '));o.dataset.destinationId=location.id;city.append(o);}schedule();});
 city.addEventListener('change',()=>{destination.value=city.selectedOptions[0]?.dataset.destinationId||'';schedule();});
 courier.addEventListener('change',loadProvinces);form.addEventListener('input',schedule);
 $('[data-shipping-refresh]')?.addEventListener('click',quote);
 fetch('/data/shipping-locations.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{locations=data;loadProvinces();}).catch(()=>message('Delivery locations could not load. Refresh the page or choose pickup.'));
 form.addEventListener('submit',()=>{if(!token){token=makeToken();persist();}},true);
 const setPayStatus=s=>{payStatus.textContent=s;payStatus.hidden=!s;};
 const complete=order=>{
  token='';persist();prepared=null;panel.hidden=true;form.hidden=true;
  success.replaceChildren();const h=document.createElement('h3');h.textContent=order.paymentStatus==='paid'?'Payment verified.':'Order submitted for payment verification.';const p=document.createElement('p');p.textContent=`${order.orderNo} · Total ${peso(order.total)}. ${order.paymentStatus==='paid'?'The club has verified your GCash payment and will arrange handover.':'The club will verify receipt in GCash and confirm your handover.'} Do not pay again.`;success.append(h,p);success.hidden=false;success.scrollIntoView({behavior:'smooth',block:'center'});
  document.dispatchEvent(new CustomEvent('cu:order-complete'));
 };
 const showPayment=order=>{
  clearTimeout(expiry);prepared=order;form.hidden=true;success.hidden=true;panel.hidden=false;
  const list=$('[data-payment-items]',panel);list.replaceChildren();for(const item of order.lines){const li=document.createElement('li');li.textContent=`${item.quantity} × ${item.name}${item.size?' · '+item.size:''} — ${peso(item.lineTotal)}`;list.append(li);}
  $('[data-payment-order-no]',panel).textContent=order.orderNo;$('[data-payment-subtotal]',panel).textContent=peso(order.subtotal);$('[data-payment-shipping]',panel).textContent=peso(order.shippingFee);$('[data-payment-delivery]',panel).textContent=order.fulfilmentMessage;$('[data-gcash-amount]',panel).textContent=peso(order.total);setPayStatus('');
  const blocked=order.canPay===false && !order.submitted && order.paymentStatus!=='paid';
  $('[data-gcash-panel]',panel).hidden=blocked;
  const warning=$('[data-order-payment-warning]',panel);warning.hidden=!blocked;warning.textContent=blocked?'This order is '+(order.fulfilmentStatus==='cancelled'?'cancelled':'closed for payment')+'. Do not send money. If you already paid, submit the payment details below so the club can help.':'';
  payButton.textContent=blocked?'I already paid — notify the club':'I’ve paid — submit order';
  document.dispatchEvent(new CustomEvent('cu:order-payment'));panel.focus();panel.scrollIntoView({behavior:'smooth',block:'start'});
 };
 document.addEventListener('cu:order-prepared',e=>{(e.detail.order.submitted||e.detail.order.paymentStatus==='paid')?complete(e.detail.order):showPayment(e.detail.order);});
 payButton.addEventListener('click',async()=>{
  if(!prepared||!token)return;if(ref.value&&!ref.checkValidity()){ref.reportValidity();return;}
  payButton.disabled=true;setPayStatus('Submitting for verification…');
  try{const r=await fetch('/api/orders/payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'submit',checkoutToken:token,gcashRef:ref.value.trim()})});const body=await r.json();if(!r.ok||!body.ok)throw Error(body.error||'Could not submit.');complete(body.order);}catch(e){setPayStatus((e.message||'Connection failed.')+' Your payment session is saved. Retry submitting; do not pay again.');}finally{payButton.disabled=false;}
 });
 $('[data-order-start-over]',panel).addEventListener('click',()=>{prepared=null;token='';persist();panel.hidden=true;ref.value='';document.dispatchEvent(new CustomEvent('cu:order-restart'));lastSignature='';schedule();});
 if(token){
  fetch('/api/orders/payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'resume',checkoutToken:token})}).then(async r=>{const b=await r.json();if(r.status===404){token='';persist();return;}if(!r.ok)throw Error();(b.order.submitted||b.order.paymentStatus==='paid')?complete(b.order):showPayment(b.order);}).catch(()=>message('A previous payment session is saved on this tab. Continue checkout to resume it. If you already paid, do not pay again.'));
 }
 invalidate();
})();
