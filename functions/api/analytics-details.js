import {json,fail} from './_utils.js';
import {manilaDate,validDate} from '../../public/scripts/analytics-metrics.js';
import {VISIT_TIMEOUT} from './_analytics-details.js';
export async function onRequestGet({request,env}) {
 try {
  const config=await env.DB.prepare('SELECT * FROM analytics_detail_config WHERE id=1').first();
  if(!config)return fail('Detailed analytics is not ready yet.',503);
  const url=new URL(request.url),from=url.searchParams.get('from')||config.history_from,to=url.searchParams.get('to')||manilaDate();
  if(!validDate(from)||!validDate(to)||from>to||from<config.history_from||to>manilaDate())return fail('Choose dates within the available analytics history.',400);
  const cutoff=Date.now()-VISIT_TIMEOUT;
  const queries=[
   ['audience',`SELECT visitor_type AS type,COUNT(*) AS visits FROM analytics_visits WHERE date BETWEEN ? AND ? GROUP BY visitor_type`,[from,to]],
   ['browsers',`SELECT COUNT(DISTINCT browser_hash) AS count FROM analytics_visits WHERE date BETWEEN ? AND ?`,[from,to]],
   ['sources',`SELECT source,COUNT(*) AS visits FROM analytics_visits WHERE date BETWEEN ? AND ? GROUP BY source ORDER BY visits DESC,source`,[from,to]],
   ['pages',`SELECT path,SUM(opens) AS opens,COUNT(*) AS measuredPages,SUM(active_ms) AS activeMs,ROUND(AVG(scroll_depth)) AS scrollDepth,SUM(form_started) AS formStarted,SUM(form_completed) AS formCompleted,SUM(form_error) AS formError,SUM(outbound) AS outbound FROM analytics_pageviews WHERE date BETWEEN ? AND ? GROUP BY path ORDER BY opens DESC,path`,[from,to]],
   ['exits',`SELECT p.path,COUNT(*) AS visits,SUM(p.form_started=1 AND p.form_completed=0) AS unfinishedForms,SUM(p.form_error) AS formErrors,SUM(p.outbound) AS outbound FROM analytics_visits v JOIN analytics_pageviews p ON p.hash=v.last_page WHERE v.date BETWEEN ? AND ? AND v.last_activity<? GROUP BY p.path ORDER BY visits DESC,p.path`,[from,to,cutoff]],
   ['sessions',`SELECT COUNT(*) AS visits,COALESCE(SUM(active_ms),0) AS activeMs,COALESCE(SUM(completed),0) AS completedVisits,COALESCE(SUM(completed=1 AND opens=1 AND active_ms<10000),0) AS shortVisits FROM (SELECT v.hash,v.last_activity<? AS completed,SUM(p.active_ms) AS active_ms,SUM(p.opens) AS opens FROM analytics_visits v JOIN analytics_pageviews p ON p.visit_hash=v.hash WHERE v.date BETWEEN ? AND ? GROUP BY v.hash)`,[cutoff,from,to]],
   ['daily',`SELECT v.date,COUNT(*) AS visits,SUM(v.visitor_type='new') AS newVisits,SUM(v.visitor_type='returning') AS returningVisits,SUM(v.visitor_type='unidentified') AS unidentifiedVisits,SUM((SELECT COALESCE(SUM(p.active_ms),0) FROM analytics_pageviews p WHERE p.visit_hash=v.hash)) AS activeMs FROM analytics_visits v WHERE v.date BETWEEN ? AND ? GROUP BY v.date ORDER BY v.date`,[from,to]],
   ['historicalSources',`SELECT key AS source,SUM(opens) AS opens FROM analytics_history_dimensions WHERE kind='source' AND date BETWEEN ? AND ? GROUP BY key ORDER BY opens DESC,key`,[from,to]],
   ['historicalPages',`SELECT key AS path,SUM(opens) AS opens FROM analytics_history_dimensions WHERE kind='page' AND date BETWEEN ? AND ? GROUP BY key ORDER BY opens DESC,key`,[from,to]]
  ];
  const rows=await env.DB.batch(queries.map(([,sql,params])=>env.DB.prepare(sql).bind(...params)));
  const result=Object.fromEntries(queries.map(([key],i)=>[key,rows[i].results||[]]));
  return json({ok:true,coverage:{liveFrom:config.live_from,historyFrom:config.history_from,historyThrough:config.history_through,today:manilaDate()},range:{from,to},...result,browsers:result.browsers[0]?.count||0,sessions:result.sessions[0]||{visits:0,activeMs:0,completedVisits:0,shortVisits:0}});
 }catch{console.error('analytics_details_read_failed');return fail('Detailed analytics is temporarily unavailable.',503);}
}
