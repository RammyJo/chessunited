/** A buyer's payment claim is never proof that money was received. */
export function paidLabel(kind, record) {
  if (kind === 'member' && !record.printed_id) return 'Not required';
  return ['paid', 'verified'].includes(record.payment_status) ? 'Paid' : 'Not paid';
}
export function paymentStatusForMark(kind, mark, record) {
  if (kind === 'member' && !record.printed_id) return null;
  if (mark === 'Paid') return kind === 'registration' ? 'verified' : 'paid';
  if (mark === 'Not paid') return 'pending';
  return null;
}
