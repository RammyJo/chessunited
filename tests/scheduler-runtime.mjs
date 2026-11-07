/** Actual Cron handler with a temporary D1 and an intercepted Pages wake-up. */
import assert from 'node:assert/strict';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {resolve} from 'node:path';
import {readFileSync} from 'node:fs';
let wakeups=0;
// Pinned local workerd supports dates through 2026-10-30. Production uses
// 2026-11-07 and is additionally checked via its real scheduled heartbeat.
const mf=new Miniflare(convertV4MiniflareOptions({modules:true,scriptPath:resolve('workers/sheets-scheduler/index.js'),compatibilityDate:'2026-10-30',d1Databases:['DB'],outboundService:request=>{
 assert.equal(request.url,'https://chessunitedglobal.com/api/partner-clubs');wakeups++;return Response.json({ok:true});
}}));
try{
 const db=await mf.getD1Database('DB');
 for(const sql of readFileSync('migrations/0007_scheduled_sheets.sql','utf8').split(';').filter(s=>s.trim()))await db.prepare(sql).run();
 const worker=await mf.getWorker();const result=await worker.scheduled({scheduledTime:Date.now(),cron:'*/5 * * * *'});assert.equal(result.outcome,'ok');
 assert.equal(wakeups,1);const job=await db.prepare('SELECT * FROM sheets_schedule').first();assert.ok(job.last_tick_at);assert.equal(job.requested_at,job.last_tick_at);
 const request=await mf.dispatchFetch('https://example.com/');assert.equal(request.status,404);assert.equal(wakeups,1);
 console.log('PASS: actual scheduled handler queues one private D1 wake-up; anonymous fetch cannot trigger it. No production requests.');
}finally{await mf.dispose();}
