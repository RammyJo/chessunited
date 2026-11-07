(() => {
 const details=document.querySelector('[data-shipping-settings]');if(!details)return;
 const form=details.querySelector('form'),status=details.querySelector('[data-shipping-settings-status]'),body=details.querySelector('[data-shipping-products]');let loaded=false;
 const mode=form.querySelector('[data-shipping-mode]'),measurements=form.querySelector('[data-shipping-measurements]');
 const renderMode=()=>{measurements.hidden=mode.value==='minimum_small_parcel';measurements.querySelectorAll('input').forEach(input=>input.disabled=measurements.hidden);};mode.addEventListener('change',renderMode);
 details.addEventListener('toggle',async()=>{
  if(!details.open||loaded)return;status.textContent='Loading delivery setup…';
  try{
   const [r,l]=await Promise.all([fetch('/api/admin/shipping'),fetch('/data/shipping-locations.json')]);if(!r.ok||!l.ok)throw Error();const data=await r.json(),locations=await l.json();
   form.querySelectorAll('[data-shipping-origin]').forEach(select=>{const courier=select.dataset.shippingOrigin;select.replaceChildren();for(const place of locations[courier]){const o=document.createElement('option');o.value=place.id;o.textContent=place.province+' — '+place.city;select.append(o);}select.value=data.config.origins?.[courier]||data.suggestedOrigins[courier];});
   mode.value=data.config.mode||'measured';renderMode();
   body.replaceChildren();for(const product of data.products){const tr=document.createElement('tr'),name=document.createElement('th');name.scope='row';name.textContent=product.name;tr.append(name);for(const key of ['weight','length','width','height']){const td=document.createElement('td'),input=document.createElement('input');input.type='number';input.min='0.001';input.max=key==='weight'?'50':'200';input.step='any';input.inputMode='decimal';input.dataset.parcelProduct=product.id;input.dataset.parcelKey=key;input.setAttribute('aria-label',product.name+' '+key+(key==='weight'?' kg':' cm'));input.value=data.config.products?.[product.id]?.[key]??'';td.append(input);tr.append(td);}body.append(tr);}renderMode();loaded=true;status.textContent=data.config.mode==='minimum_small_parcel'?'Minimum small-parcel delivery is active for all merchandise.':Object.keys(data.config.products||{}).length+' products have delivery measurements.';
  }catch{status.textContent='Could not load setup. Close and reopen to retry.';}
 });
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(!loaded||!form.reportValidity())return;const button=form.querySelector('button');button.disabled=true;
  const config={mode:mode.value,origins:{},products:{}};form.querySelectorAll('[data-shipping-origin]').forEach(x=>{config.origins[x.dataset.shippingOrigin]=x.value;});
  form.querySelectorAll('[data-parcel-product]').forEach(x=>{const id=x.dataset.parcelProduct;config.products[id]??={};config.products[id][x.dataset.parcelKey]=x.value;});
  try{const r=await fetch('/api/admin/shipping',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(config)});const data=await r.json();if(!r.ok||!data.ok)throw Error(data.error||'Could not save.');status.textContent=data.config.mode==='minimum_small_parcel'?'Saved. Minimum delivery is active for all merchandise. The club covers any higher actual courier charge.':'Saved. Checkout can now calculate delivery for '+Object.keys(data.config.products).length+' products.';}catch(e){status.textContent=e.message||'Could not save. Please retry.';}finally{button.disabled=false;}
 });
})();
