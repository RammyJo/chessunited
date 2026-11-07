/** Pages cannot receive Cron events. This small Worker queues a private D1
 * wake-up, then calls the public Pages directory to service it. No Google or
 * admin credential is copied, and there is no public trigger on this Worker.
 */
export async function tick(env,fetcher=fetch){
 const now=Date.now();
 await env.DB.prepare('UPDATE sheets_schedule SET requested_at=?,last_tick_at=? WHERE id=1').bind(now,now).run();
 const response=await fetcher('https://chessunitedglobal.com/api/partner-clubs',{
  headers:{Accept:'application/json','Cache-Control':'no-cache'},
  signal:AbortSignal.timeout(10000),redirect:'manual'
 });
 if(!response.ok)throw new Error('sheets_wakeup_http_'+response.status);
 await response.body?.cancel();
 console.log(JSON.stringify({event:'sheets_sync_requested',at:now}));
}
export default {
 async scheduled(_event,env){await tick(env);},
 async fetch(){return new Response('Not found',{status:404,headers:{'Cache-Control':'no-store'}});}
};
