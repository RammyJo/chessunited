import { eventPhase, manilaToday } from './event-dates.js?v=20261125';

function refreshArchive() {
  const today = manilaToday();
  for (const archive of document.querySelectorAll('[data-event-archive]')) {
    const cards = [...archive.querySelectorAll('[data-archive-event]')];
    for (const phase of ['present', 'past']) {
      const list = archive.querySelector(`[data-archive-list="${phase}"]`);
      const matching = cards.filter(card => eventPhase({ date: card.dataset.eventDate, endDate: card.dataset.eventEnd }, today) === phase)
        .sort((a, b) => (phase === 'past' ? -1 : 1) * a.dataset.eventDate.localeCompare(b.dataset.eventDate));
      matching.forEach((card, index) => { if (list.children[index] !== card) list.insertBefore(card, list.children[index] || null); });
      archive.querySelector(`[data-archive-empty="${phase}"]`).hidden = matching.length > 0;
    }
  }
  for (const card of document.querySelectorAll('[data-current-event]')) card.hidden = card.dataset.eventEnd < today;
  for (const list of document.querySelectorAll('[data-current-list]')) {
    const empty = list.parentElement.querySelector('[data-current-empty]');
    if (empty) empty.hidden = !!list.querySelector('[data-current-event]:not([hidden])');
  }
  for (const detail of document.querySelectorAll('[data-event-detail]')) {
    const past = eventPhase({ endDate: detail.dataset.eventEnd }, today) === 'past';
    const status = detail.querySelector('[data-event-status]');
    status.textContent = past ? 'Past event' : 'Present event';
    status.classList.toggle('status-pill--past', past);
    detail.querySelectorAll('[data-present-only]').forEach(node => { node.hidden = past; });
    detail.querySelectorAll('[data-past-only]').forEach(node => { node.hidden = !past; });
  }
}
refreshArchive();
window.addEventListener('pageshow', refreshArchive);
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshArchive(); });
setInterval(refreshArchive, 60_000);
