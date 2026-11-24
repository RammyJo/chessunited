/** All archive dates are civil dates in the club's timezone. */
export function manilaToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = type => parts.find(p => p.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

/** An event remains present through its last day, including multi-day events. */
export function eventPhase(event, today = manilaToday()) {
  return (event.endDate || event.date) < today ? 'past' : 'present';
}
