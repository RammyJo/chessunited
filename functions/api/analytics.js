import {json,fail,readJson} from './_utils.js';
import {fillDays,manilaDate,publicPath} from '../../public/scripts/analytics-metrics.js';
import {recordDetailedOpen,recordEngagement} from './_analytics-details.js';

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
 if(!body || (body.kind!=='engagement' && !publicPath(body.path)))return fail('This page is not part of the public website.',400);
 if(/bot|crawler|spider|headless/i.test(request.headers.get('User-Agent')||''))return new Response(null,{status:204});
 try {
  if(request.headers.get('DNT')==='1'||request.headers.get('Sec-GPC')==='1'){body.browserId=null;body.visitId=body.pageId;}
  if(body.kind==='engagement') {
   if(!await recordEngagement(env,body))return fail('Invalid engagement checkpoint.',400);
   return new Response(null,{status:204});
  }
  if(body.kind==='open'||body.kind==='resume') {
   if(!await recordDetailedOpen(env,body,new URL(request.url).origin))return fail('Invalid page opening.',400);
   return new Response(null,{status:204});
  }
  if(body.kind!==undefined)return fail('Unknown analytics event.',400);
  const today=manilaDate();
  await env.DB.prepare('INSERT INTO analytics_daily(date,recorded_opens) VALUES(?,1) ON CONFLICT(date) DO UPDATE SET recorded_opens=recorded_opens+1').bind(today).run();
  return new Response(null,{status:204});
 }catch{console.error('analytics_write_failed');return fail('The view could not be recorded.',503);}
}
