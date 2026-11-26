import {json,fail,readJson} from './_utils.js';
import {fillDays,manilaDate,publicPath} from '../../public/scripts/analytics-metrics.js';

/** Aggregate-only, anonymous report. Never returns visitor/contact/payment data. */
export async function onRequestGet({env}) {
 try {
  const config=await env.DB.prepare('SELECT history_from,history_through,live_from FROM analytics_config WHERE id=1').first();
  if(!config)return fail('Analytics is not ready yet. Please try again shortly.',503);
  const today=manilaDate();
  const rows=await env.DB.prepare('SELECT date,historical_opens AS historical,recorded_opens AS recorded FROM analytics_daily WHERE date>=? AND date<=? ORDER BY date').bind(config.history_from,today).all();
  // A single aggregate row per day preserves history across calendar years.
  const from=config.history_from;
  return json({ok:true,coverage:{historyFrom:config.history_from,historyThrough:config.history_through,liveFrom:config.live_from,today},daily:fillDays(rows.results||[],from,today)});
 }catch{console.error('analytics_read_failed');return fail('Analytics is temporarily unavailable. Please try again.',503);}
}
export async function onRequestPost({request,env}) {
 // Tracking is only accepted from same-origin browser navigation, not form sites.
 if(request.headers.get('Origin')!==new URL(request.url).origin)return fail('Open the club website to record a view.',403);
 const body=await readJson(request);
 if(!body || !publicPath(body.path))return fail('This page is not part of the public website.',400);
 if(/bot|crawler|spider|headless/i.test(request.headers.get('User-Agent')||''))return new Response(null,{status:204});
 try {
  const today=manilaDate();
  await env.DB.prepare('INSERT INTO analytics_daily(date,recorded_opens) VALUES(?,1) ON CONFLICT(date) DO UPDATE SET recorded_opens=recorded_opens+1').bind(today).run();
  return new Response(null,{status:204});
 }catch{console.error('analytics_write_failed');return fail('The view could not be recorded.',503);}
}
