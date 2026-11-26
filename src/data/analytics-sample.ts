/** Illustrative owner report, not measured traffic. Fixed as of 26 Nov 2026. */
const counts = [8, 11, 9, 14, 18, 23, 16, 12, 15, 17, 22, 29, 24, 18, 16, 20, 21, 25, 33, 28, 19, 17, 24, 21, 18];
let cumulative = 0;
export const sampleDailyOpens = counts.map((opens, index) => {
  const day = index + 2;
  cumulative += opens;
  return { date: `2026-11-${String(day).padStart(2, '0')}`, day, opens, cumulative };
});
export const sampleTotal = sampleDailyOpens.reduce((sum, day) => sum + day.opens, 0);
if (sampleDailyOpens.length !== 25 || sampleTotal !== 478) throw new Error('Sample report must cover 2–26 November and total 478.');
