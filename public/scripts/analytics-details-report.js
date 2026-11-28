import {bucketStart,periodLabel,formatDate} from './analytics-metrics.js?v=20261127';
let controller=null,requestNumber=0;
const number=n=>Number(n||0).toLocaleString('en-PH');
export function duration(ms){const s=Math.round(Number(ms||0)/1000);if(s<60)return s+'s';if(s<3600)return Math.floor(s/60)+'m '+s%60+'s';return Math.floor(s/3600)+'h '+Math.floor(s%3600/60)+'m';}
const names={'/':'Home','/shop/':'Merchandise','/membership/':'Registration','/events/':'Events','/partners/':'Partner clubs','/gallery/':'Gallery','/visit/':'Weekly play','/about/':'About','/videos/':'Videos'};
const pageLabel=path=>names[path]||(path==='/events/coach-henry-youth-visit-2026/'?'Coach Henry’s youth visit':path.replace(/^\/events\//,'').replace(/\/$/,'').replaceAll('-',' ').replace(/\b[a-z]/g,c=>c.toUpperCase()));
function table(host,headers,rows,empty){
 host.replaceChildren();if(!rows.length){const p=document.createElement('p');p.className='detail-empty';p.textContent=empty;host.append(p);return;}
 const wrap=document.createElement('div');wrap.className='detail-table-wrap';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label',headers.join(', '));const t=document.createElement('table'),thead=document.createElement('thead'),head=document.createElement('tr');
 for(const label of headers){const th=document.createElement('th');th.scope='col';th.textContent=label;head.append(th);}thead.append(head);t.append(thead);const tbody=document.createElement('tbody');
 for(const cells of rows){const tr=document.createElement('tr');cells.forEach((value,i)=>{const cell=document.createElement(i?'td':'th');if(!i)cell.scope='row';cell.textContent=String(value);tr.append(cell);});tbody.append(tr);}t.append(tbody);wrap.append(t);host.append(wrap);
}
export function audienceGroups(days,period){const groups=new Map();for(const day of days){const key=bucketStart(day.date,period);let g=groups.get(key);if(!g){g={key,from:day.date,to:day.date,visits:0,newVisits:0,returningVisits:0,unidentifiedVisits:0,activeMs:0};groups.set(key,g);}g.to=day.date;for(const field of ['visits','newVisits','returningVisits','unidentifiedVisits','activeMs'])g[field]+=Number(day[field]||0);}return[...groups.values()];}
export async function renderVisitDetails(root,{from,to,period}){
 const $=s=>root.querySelector(s),text=(s,v)=>$(s).textContent=v,status=$('[data-details-status]');if(!status)return;
 controller?.abort();controller=new AbortController();const serial=++requestNumber;status.textContent='Refreshing visitor details…';status.removeAttribute('data-error');
 try{
  const response=await fetch('/api/analytics-details?'+new URLSearchParams({from,to}),{cache:'no-store',credentials:'omit',signal:controller.signal}),body=await response.json();if(!response.ok||!body.ok)throw Error();if(serial!==requestNumber)return;
  const live=to>=body.coverage.liveFrom,visits=Number(body.sessions.visits),hasVisits=live&&visits>0,audience=Object.fromEntries(body.audience.map(r=>[r.type,Number(r.visits)])),unknown=audience.unidentified||0;
  text('[data-details-coverage]',`Detailed tracking began ${formatDate(body.coverage.liveFrom)}. Historical source and page estimates cover ${formatDate(body.coverage.historyFrom)}–${formatDate(body.coverage.historyThrough)}. Earlier time spent, exits and returning visits were not recorded. Dates outside that coverage have site-open counts only.`);
  text('[data-detail-visits]',live?number(visits):'—');text('[data-active-time]',hasVisits?duration(body.sessions.activeMs/visits):'—');text('[data-active-total]',hasVisits?duration(body.sessions.activeMs):'—');
  text('[data-completed-visits]',live?number(body.sessions.completedVisits):'—');text('[data-short-visits]',live?number(body.sessions.shortVisits):'—');text('[data-new-visits]',live?number(audience.new):'—');text('[data-returning-visits]',live?number(audience.returning):'—');
  text('[data-audience-note]',hasVisits?`${number(body.browsers)} identified browser${body.browsers===1?'':'s'} · ${number(unknown)} unidentified visit${unknown===1?'':'s'}. New and returning counts describe visits, not guaranteed individual people.`:live?'Waiting for recorded visits in this date range.':'New and returning visits were not tracked for these dates.');
  for(const[key,count]of[['new',audience.new],['returning',audience.returning],['unknown',unknown]])$(`[data-${key}-bar]`).style.width=(visits?(count||0)/visits*100:0)+'%';
  const empty=live?'No recorded visits in this date range yet.':'Not tracked for these dates.';
  table($('[data-detail-sources]'),['Source','Visits'],body.sources.map(r=>[r.source,number(r.visits)]),empty);
  table($('[data-history-sources]'),['Referring source','Estimated opens'],body.historicalSources.map(r=>[r.source,'≈ '+number(r.opens)]),'No historical estimates in this date range.');
  table($('[data-detail-pages]'),['Page / tab','Opens','Avg active time','Scroll depth','Form errors'],body.pages.map(r=>[pageLabel(r.path),number(r.opens),duration(r.activeMs/r.measuredPages),number(r.scrollDepth)+'%',number(r.formError)]),live?'No page activity recorded in this date range yet.':empty);
  table($('[data-history-pages]'),['Page / tab','Estimated opens'],body.historicalPages.map(r=>[pageLabel(r.path),'≈ '+number(r.opens)]),'No historical estimates in this date range.');
  table($('[data-detail-exits]'),['Last page','Exits','Unfinished forms','Error seen','Outward click'],body.exits.map(r=>[pageLabel(r.path),number(r.visits),number(r.unfinishedForms),number(r.formErrors),number(r.outbound)]),hasVisits?'No finished visits yet. Exit pages appear after 30 minutes of inactivity.':empty);
  text('[data-audience-title]',({day:'Daily',week:'Weekly',month:'Monthly',year:'Yearly'}[period]||'Daily')+' visit breakdown');
  table($('[data-detail-daily]'),['Period','Visits','New','Returning','Unidentified','Avg active time'],audienceGroups(body.daily,period).reverse().map(g=>[periodLabel(g,period),number(g.visits),number(g.newVisits),number(g.returningVisits),number(g.unidentifiedVisits),duration(g.activeMs/g.visits)]),empty);
  status.textContent=hasVisits?'Visitor details are current · Open visits are still updating.':live?'Tracking is active · Waiting for visits in the selected dates.':'Showing available historical estimates · Other metrics were not tracked for these dates.';
 }catch(error){if(error.name==='AbortError'||serial!==requestNumber)return;status.textContent='Visitor details could not refresh. Any previously shown details may be out of date. Press Refresh data to retry.';status.setAttribute('data-error','');}
}
