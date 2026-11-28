import test from 'node:test';import assert from 'node:assert/strict';
import {fillDays,groupDays,manilaDate,validDate,publicPath,changePercent} from '../public/scripts/analytics-metrics.js';
import {readFileSync} from 'node:fs';
import {trafficSource} from '../functions/api/_analytics-details.js';
import {audienceGroups,duration} from '../public/scripts/analytics-details-report.js';
test('Manila dates change at UTC16:00; dates reject rollover and timestamps',()=>{
 assert.equal(manilaDate(new Date('2026-11-26T15:59:59Z')),'2026-11-26');assert.equal(manilaDate(new Date('2026-11-26T16:00:00Z')),'2026-11-27');assert(!validDate('2026-11-31'));assert(!validDate('2026-11-27T12:00:00Z'));assert(validDate('2028-02-29'));
});
test('daily gap fill and Monday/week/month/year boundaries preserve all counts',()=>{
 const rows=[{date:'2026-12-31',historical:5,recorded:0},{date:'2027-01-01',historical:0,recorded:7},{date:'2027-01-04',historical:0,recorded:3}];const days=fillDays(rows,'2026-12-31','2027-01-04');assert.equal(days.length,5);assert.equal(days[2].opens,0);
 const weeks=groupDays(days,'week');assert.deepEqual(weeks.map(w=>[w.key,w.opens]),[['2026-12-28',12],['2027-01-04',3]]);assert.deepEqual(groupDays(days,'month').map(w=>[w.key,w.opens]),[['2026-12-01',5],['2027-01-01',10]]);assert.deepEqual(groupDays(days,'year').map(w=>[w.key,w.opens]),[['2026-01-01',5],['2027-01-01',10]]);
 for(const period of ['day','week','month','year'])assert.equal(groupDays(days,period).reduce((s,g)=>s+g.opens,0),15);
});
test('only public page paths count; private/report/token routes do not',()=>{
 for(const path of ['/','/shop/','/events/coach-henry-youth-visit-2026/'])assert(publicPath(path));for(const path of ['/analytics/','/admin/','/shop/order/','/api/orders','/?token=private','/events/a/?private=secret'])assert(!publicPath(path));
});
test('Cloudflare evidence totals680 and verifiesNov25increase without inventingcounts',()=>{
 const source=JSON.parse(readFileSync('research/analytics-cloudflare-history.json','utf8'));assert.equal(Object.values(source.daily).reduce((a,b)=>a+b,0),680);assert.equal(source.daily['2026-11-25'],140);assert.equal(source.daily['2026-11-24'],60);assert(Math.abs(changePercent(140,60)-133.333333)<.001);assert.equal(changePercent(1,0),null);
});
test('referrals classify Google, Facebook and Instagram without storing URLs or treating an unrelated host as social',()=>{
 for(const [ref,tag,result]of [['https://lm.facebook.com/l.php?private=secret','','Facebook'],['https://l.instagram.com/','','Instagram'],['https://www.google.com.ph/search?q=chess','','Google'],['https://chessunitedglobal.com/membership/','','Internal link'],['','','Direct / unknown'],['https://example.org/','','Other referral'],['https://facebook.com.attacker.example/','','Other referral'],['','ig','Instagram'],['','fb','Facebook']])assert.equal(trafficSource(ref,tag),result);
});
test('historical dimensions are genuine hourly Cloudflare groups totaling680, not new engagement data',()=>{
 const source=JSON.parse(readFileSync('research/analytics-dimensions-cloudflare.json','utf8')).data.viewer.accounts[0].rumPageloadEventsAdaptiveGroups;assert.equal(source.reduce((sum,r)=>sum+r.count,0),680);assert(source.every(r=>r.avg.sampleInterval===10));assert(source.every(r=>publicPath(r.dimensions.requestPath)));
});
test('audience date grouping keeps new/returning/unidentified and time totals across years',()=>{
 const days=[{date:'2026-12-31',visits:2,newVisits:1,returningVisits:1,activeMs:20000},{date:'2027-01-01',visits:3,newVisits:1,returningVisits:1,unidentifiedVisits:1,activeMs:40000}];
 for(const period of ['day','week','month','year']){const groups=audienceGroups(days,period);assert.equal(groups.reduce((s,g)=>s+g.visits,0),5);assert.equal(groups.reduce((s,g)=>s+g.activeMs,0),60000);assert.equal(groups.reduce((s,g)=>s+g.unidentifiedVisits,0),1);}assert.equal(duration(83000),'1m 23s');assert.equal(duration(3660000),'1h 1m');
});
