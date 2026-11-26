import {publicPath} from './analytics-metrics.js?v=20261127';
// Each page load or back/forward restoration counts again. No cookies or IDs.
if(publicPath(location.pathname) && !navigator.webdriver && !document.querySelector('meta[name="robots"]')?.content.includes('noindex')) {
 let recorded=false;
 const record=event=>{
  if(document.prerendering || (recorded && !event?.persisted))return;
  recorded=true;
  void fetch('/api/analytics',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',keepalive:true,body:JSON.stringify({path:location.pathname})}).catch(()=>{});
 };
 addEventListener('pageshow',record);
 document.addEventListener('prerenderingchange',record,{once:true});
}
