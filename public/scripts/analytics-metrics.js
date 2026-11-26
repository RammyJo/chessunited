/** Civil dates only; all recorded dates are assigned in Asia/Manila. */
export const toDate = value => new Date(value + 'T12:00:00Z');
export const dateKey = date => date.toISOString().slice(0,10);
export function shiftDate(value, days) { const date=toDate(value); date.setUTCDate(date.getUTCDate()+days); return dateKey(date); }
export function validDate(value) { return typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(toDate(value).valueOf()) && dateKey(toDate(value))===value; }
export function manilaDate(now=new Date()) { return new Date(now.valueOf()+8*3600000).toISOString().slice(0,10); }
export function publicPath(path) {
 return typeof path==='string' && (['/','/events/','/videos/','/gallery/','/shop/','/about/','/visit/','/membership/','/partners/'].includes(path) || /^\/events\/[a-z0-9-]{1,80}\/$/.test(path));
}
export function fillDays(rows, from, to) {
 const byDate=new Map(rows.map(row=>[row.date,row]));const days=[];
 for(let day=from;day<=to;day=shiftDate(day,1)) { const row=byDate.get(day);const historical=Number(row?.historical||0),recorded=Number(row?.recorded||0);days.push({date:day,historical,recorded,opens:historical+recorded}); }
 return days;
}
export function bucketStart(value, period) {
 const date=toDate(value);
 if(period==='week')date.setUTCDate(date.getUTCDate()-((date.getUTCDay()+6)%7));
 if(period==='month')date.setUTCDate(1);
 if(period==='year'){date.setUTCMonth(0);date.setUTCDate(1);}
 return dateKey(date);
}
export function groupDays(days, period='day') {
 const groups=new Map();
 for(const day of days){const key=bucketStart(day.date,period);let group=groups.get(key);if(!group){group={key,from:day.date,to:day.date,opens:0,historical:0,recorded:0};groups.set(key,group);}group.to=day.date;group.opens+=day.opens;group.historical+=day.historical;group.recorded+=day.recorded;}
 return [...groups.values()];
}
export const formatDate = (value,options={day:'numeric',month:'short',year:'numeric'}) => new Intl.DateTimeFormat('en-PH',{timeZone:'UTC',...options}).format(toDate(value));
export function periodLabel(group,period) {
 if(period==='day')return formatDate(group.from);
 if(period==='month')return formatDate(group.key,{month:'long',year:'numeric'});
 if(period==='year')return group.key.slice(0,4);
 return `${formatDate(group.from)} – ${formatDate(group.to)}`;
}
export function changePercent(current, previous) { return previous>0 ? (current-previous)/previous*100 : null; }
