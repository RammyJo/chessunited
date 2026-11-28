import {digest} from './_security.js';
import {manilaDate} from '../../public/scripts/analytics-metrics.js';
export const VISIT_TIMEOUT=30*60*1000;
export const validToken=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
export function trafficSource(referrer,campaign,origin='https://chessunitedglobal.com') {
 const tag=typeof campaign==='string'?campaign.toLowerCase():'';
 if(['facebook','fb'].includes(tag))return 'Facebook';
 if(['instagram','ig'].includes(tag))return 'Instagram';
 if(tag==='google')return 'Google';
 let host='';try{host=new URL(referrer).hostname.toLowerCase();}catch{}
 const is=domain=>host===domain||host.endsWith('.'+domain);
 if(is('facebook.com')||is('fb.com'))return 'Facebook';
 if(is('instagram.com'))return 'Instagram';
 if(/(^|\.)google\.[a-z.]+$/.test(host))return 'Google';
 if(host===new URL(origin).hostname)return 'Internal link';
 return host?'Other referral':'Direct / unknown';
}
export async function recordDetailedOpen(env,body,origin) {
 if(!validToken(body.pageId)||!validToken(body.visitId)||(body.browserId!==null&&body.browserId!==undefined&&!validToken(body.browserId)))return false;
 const now=Date.now(),date=manilaDate(),page=await digest(body.pageId),visit=await digest(body.visitId),browser=body.browserId?await digest(body.browserId):null;
 const source=trafficSource(body.referrer,body.campaign,origin),opens=body.kind==='resume'?0:1;
 // One D1 transaction makes open retries idempotent and first-browser classification atomic.
 await env.DB.batch([
  env.DB.prepare(`INSERT INTO analytics_visits(hash,browser_hash,visitor_type,date,source,started_at,last_activity,last_page)
   SELECT ?,?,CASE WHEN ? IS NULL THEN 'unidentified' WHEN EXISTS(SELECT 1 FROM analytics_visitors WHERE hash=?) THEN 'returning' ELSE 'new' END,?,?,?,?,?
   WHERE NOT EXISTS(SELECT 1 FROM analytics_pageviews WHERE hash=?)
   ON CONFLICT(hash) DO UPDATE SET last_activity=MAX(last_activity,excluded.last_activity),last_page=excluded.last_page`).bind(visit,browser,browser,browser,date,source,now,now,page,page),
  ...(browser?[env.DB.prepare(`INSERT INTO analytics_visitors(hash,first_date,last_seen) SELECT ?,?,? WHERE NOT EXISTS(SELECT 1 FROM analytics_pageviews WHERE hash=?) ON CONFLICT(hash) DO UPDATE SET last_seen=excluded.last_seen`).bind(browser,date,now,page)]:[]),
  env.DB.prepare(`INSERT INTO analytics_daily(date,recorded_opens) SELECT ?,? WHERE NOT EXISTS(SELECT 1 FROM analytics_pageviews WHERE hash=?) ON CONFLICT(date) DO UPDATE SET recorded_opens=recorded_opens+excluded.recorded_opens`).bind(date,opens,page),
  env.DB.prepare(`INSERT OR IGNORE INTO analytics_pageviews(hash,visit_hash,date,path,opened_at,last_activity,opens) VALUES(?,?,?,?,?,?,?)`).bind(page,visit,date,body.path,now,now,opens),
  env.DB.prepare('DELETE FROM analytics_visitors WHERE hash IN (SELECT hash FROM analytics_visitors WHERE last_seen<? LIMIT 100)').bind(now-90*86400000)
 ]);
 return true;
}
export async function recordEngagement(env,body) {
 if(!validToken(body.pageId)||!validToken(body.visitId)||!Number.isInteger(body.activeMs)||body.activeMs<0||body.activeMs>14400000||!Number.isInteger(body.scrollDepth)||body.scrollDepth<0||body.scrollDepth>100)return false;
 const now=Date.now(),page=await digest(body.pageId),visit=await digest(body.visitId);
 const flags=['formStarted','formCompleted','formError','outbound'].map(key=>body[key]===true?1:0);
 // Cumulative checkpoints use MAX, so retries and overlapping requests cannot double time/events.
 await env.DB.batch([
  env.DB.prepare(`UPDATE analytics_pageviews SET active_ms=MAX(active_ms,MIN(?,MAX(0,?-opened_at))),scroll_depth=MAX(scroll_depth,?),form_started=MAX(form_started,?),form_completed=MAX(form_completed,?),form_error=MAX(form_error,?),outbound=MAX(outbound,?),last_activity=?
   WHERE hash=? AND visit_hash=? AND (active_ms<MIN(?,MAX(0,?-opened_at)) OR scroll_depth<? OR form_started<? OR form_completed<? OR form_error<? OR outbound<?)`)
   .bind(body.activeMs,now,body.scrollDepth,...flags,now,page,visit,body.activeMs,now,body.scrollDepth,...flags),
  env.DB.prepare(`UPDATE analytics_visits SET last_page=CASE WHEN COALESCE((SELECT last_activity FROM analytics_pageviews WHERE hash=? AND visit_hash=?),0)>last_activity THEN ? ELSE last_page END,last_activity=MAX(last_activity,COALESCE((SELECT last_activity FROM analytics_pageviews WHERE hash=? AND visit_hash=?),last_activity)) WHERE hash=?`).bind(page,visit,page,page,visit,visit)
 ]);
 return true;
}
