import {validDate,shiftDate,fillDays,groupDays,formatDate,periodLabel,changePercent,toDate,dateKey} from './analytics-metrics.js?v=20261127';
import {renderVisitDetails} from './analytics-details-report.js?v=20261128';
const root=document.querySelector('[data-analytics-report]');
if(root){
 const $=selector=>root.querySelector(selector),form=$('[data-report-filters]');
 const periodInput=form.elements.period,fromInput=form.elements.from,toInput=form.elements.to;
 const names={day:'Daily',week:'Weekly',month:'Monthly',year:'Yearly'},units={day:'day',week:'week',month:'month',year:'year'};
 let data=null,preset='all',groups=[],period='day',page=0,busy=false,selectedDays=[];
 const number=n=>n.toLocaleString('en-PH');
 const text=(selector,value)=>$(selector).textContent=value;
 const countLabel=group=>(group.from<=data.coverage.historyThrough?'≈ ':'')+number(group.opens);
 const message=(value,error=false)=>{const el=$('[data-report-status]');el.textContent=value;el.toggleAttribute('data-error',error);};
 function rangeForPreset(){const c=data.coverage,today=c.today;let from=c.historyFrom;if(preset==='today')from=today;else if(preset==='7'||preset==='30')from=shiftDate(today,1-Number(preset));else if(preset==='month')from=today.slice(0,7)+'-01';else if(preset==='year')from=today.slice(0,4)+'-01-01';if(from<c.historyFrom)from=c.historyFrom;fromInput.value=from;toInput.value=today;}
 function complete(group){if(group.to===data.coverage.today || (group.from<=data.coverage.liveFrom && group.to>=data.coverage.liveFrom))return false;if(period==='day')return true;const start=group.key;let end;if(period==='week')end=shiftDate(start,6);else if(period==='month'){const date=toDate(start);date.setUTCMonth(date.getUTCMonth()+1);end=shiftDate(dateKey(date),-1);}else end=start.slice(0,4)+'-12-31';return group.from===start&&group.to===end;}
 function renderTable(){
  const body=$('[data-report-rows]');body.replaceChildren();const reverse=[...groups].reverse(),start=page*20;
  for(const group of reverse.slice(start,start+20)){
   const row=document.createElement('tr');row.id='period-'+group.key;row.tabIndex=-1;
   const th=document.createElement('th');th.scope='row';th.textContent=periodLabel(group,period);row.append(th);
   const opens=document.createElement('td');opens.textContent=countLabel(group);row.append(opens);
   const index=groups.indexOf(group),previous=groups[index-1];const delta=previous&&complete(group)&&complete(previous)?changePercent(group.opens,previous.opens):null;
   const change=document.createElement('td');change.textContent=delta===null?'—':`${delta>0?'+':''}${delta.toFixed(1)}%`;row.append(change);
   const source=document.createElement('td');source.className='source-label';source.textContent=(group.from<=data.coverage.historyThrough?(group.to>=data.coverage.liveFrom?'Combined':'Estimate'):'Recorded')+(complete(group)?'':' · partial');row.append(source);body.append(row);
  }
  text('[data-page-label]',groups.length?`${start+1}–${Math.min(start+20,groups.length)} of ${groups.length} periods`:'No periods');$('[data-page-prev]').disabled=page===0;$('[data-page-next]').disabled=start+20>=groups.length;
 }
 function render(){
  if(!data)return;
  const from=fromInput.value,to=toInput.value;
  if(!validDate(from)||!validDate(to)||from>to||from<data.coverage.historyFrom||to>data.coverage.today){message('Choose dates within the available history, with From before To.',true);return;}
  period=periodInput.value;selectedDays=fillDays(data.daily.filter(d=>d.date>=from&&d.date<=to),from,to);groups=groupDays(selectedDays,period);page=Math.min(page,Math.max(0,Math.ceil(groups.length/20)-1));
  const total=selectedDays.reduce((sum,d)=>sum+d.opens,0),historical=from<=data.coverage.historyThrough,peak=groups.reduce((a,b)=>b.opens>a.opens?b:a,groups[0]);
  text('[data-total]',(historical?'≈ ':'')+number(total));text('[data-total-note]',historical?'Includes Cloudflare historical estimates':'Recorded public page opens');text('[data-average]',(total/selectedDays.length).toFixed(1));text('[data-peak-label]','Busiest '+units[period]);text('[data-peak]',peak?countLabel(peak):'0');text('[data-peak-note]',peak?periodLabel(peak,period):'No opens');text('[data-range-label]',`${formatDate(from)} – ${formatDate(to)}`);text('[data-chart-title]',names[period]+' opens');text('[data-breakdown-title]',names[period]+' breakdown');text('[data-period-count]',`${groups.length} ${units[period]}${groups.length===1?'':'s'}`);text('[data-table-total]',(historical?'≈ ':'')+number(total));
  const insight=$('[data-november-insight]'),nov25=selectedDays.find(d=>d.date==='2026-11-25'),nov24=selectedDays.find(d=>d.date==='2026-11-24');insight.hidden=!(nov25&&nov24&&nov25.opens>nov24.opens);
  if(!insight.hidden){const increase=changePercent(nov25.opens,nov24.opens);text('[data-november-copy]',`${number(nov25.opens)} estimated opens, up ${increase.toFixed(1)}% from ${number(nov24.opens)} on 24 November. This increase comes from the website’s Cloudflare history.`);}
  const displayed=groups.slice(-31),max=Math.max(4,...displayed.map(g=>g.opens)),ceiling=Math.ceil(max/4)*4,chart=$('[data-chart-bars]');chart.replaceChildren();
  displayed.forEach(group=>{const bar=document.createElement('a');bar.className='chart-bar'+(period==='day'&&group.key==='2026-11-25'?' chart-bar-increase':'');bar.classList.toggle('chart-bar-zero',group.opens===0);bar.href='#period-'+group.key;bar.style.setProperty('--bar-height',`${group.opens/ceiling*100}%`);bar.setAttribute('aria-label',`${periodLabel(group,period)}: ${countLabel(group)} opens`);const fill=document.createElement('span');fill.className='bar-fill';const tooltip=document.createElement('span');tooltip.className='bar-tooltip';tooltip.textContent=`${periodLabel(group,period)} · ${countLabel(group)}`;bar.append(fill,tooltip);bar.addEventListener('click',event=>{event.preventDefault();page=Math.floor((groups.length-1-groups.indexOf(group))/20);renderTable();const row=document.getElementById('period-'+group.key);row.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});row.focus({preventScroll:true});});chart.append(bar);});
  const scale=$('[data-chart-scale]');scale.replaceChildren();for(let i=4;i>=0;i--){const label=document.createElement('span');label.textContent=number(ceiling*i/4);scale.append(label);}
  const labels=$('[data-chart-dates]');labels.replaceChildren();for(const group of [displayed[0],...(displayed.length>2?[displayed[Math.floor(displayed.length/2)]]:[]),...(displayed.length>1?[displayed.at(-1)]:[])])if(group){const label=document.createElement('span');label.textContent=period==='year'?group.key.slice(0,4):formatDate(group.from,{day:'numeric',month:'short'});labels.append(label);}
  text('[data-chart-help]',groups.length>31?`Showing the latest 31 ${units[period]}s. The totals and table cover the full date range.`:'Select a bar to see its breakdown below.');
  root.querySelectorAll('[data-preset]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.preset===preset)));
  renderTable();message('Live report · Automatically refreshes');void renderVisitDetails(root,{from,to,period});
 }
 async function refresh(){if(busy)return;busy=true;$('[data-refresh]').disabled=true;message('Refreshing analytics…');try{const response=await fetch('/api/analytics',{cache:'no-store',credentials:'omit'});const body=await response.json();if(!response.ok||!body.ok)throw Error(body.error||'Unavailable');data=body;form.querySelector('fieldset').disabled=false;for(const input of [fromInput,toInput]){input.min=data.coverage.historyFrom;input.max=data.coverage.today;}if(preset)rangeForPreset();text('[data-coverage]',`Cloudflare historical estimates: ${formatDate(data.coverage.historyFrom)}–${formatDate(data.coverage.historyThrough)}. Live page-open counting began ${formatDate(data.coverage.liveFrom)}; its first day is a partial day.`);render();}catch{message(data?'Refresh failed. Previously loaded counts remain visible; try again.':'Analytics could not load. Please press Refresh data to try again.',true);}finally{busy=false;$('[data-refresh]').disabled=false;}}
 form.addEventListener('submit',event=>{event.preventDefault();preset='';page=0;render();});periodInput.addEventListener('change',()=>{page=0;render();});root.querySelectorAll('[data-preset]').forEach(button=>button.addEventListener('click',()=>{preset=button.dataset.preset;page=0;rangeForPreset();render();}));$('[data-page-prev]').addEventListener('click',()=>{page=Math.max(0,page-1);renderTable();});$('[data-page-next]').addEventListener('click',()=>{page++;renderTable();});$('[data-refresh]').addEventListener('click',()=>void refresh());document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh();});setInterval(()=>{if(!document.hidden)void refresh();},30000);void refresh();
}
