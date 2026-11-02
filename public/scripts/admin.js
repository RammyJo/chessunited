/* Chess United — club dashboard.
 *
 * Signs in against /api/admin/session, reads everything waiting on a club
 * officer from /api/admin/queue, and moves one record at a time with
 * /api/admin/update. The session lives in an HttpOnly cookie that the server
 * signs, so nothing secret is ever kept in this file or in browser storage.
 *
 * Every row is built with createElement/textContent: the queue carries text
 * typed by members of the public, so it is never treated as markup.
 */
(() => {
  'use strict';

  const dashboard = document.querySelector('[data-admin-dashboard]');
  if (!dashboard) return;

  const $ = (selector, ctx = document) => ctx.querySelector(selector);
  const $$ = (selector, ctx = document) => Array.from(ctx.querySelectorAll(selector));

  const signin = $('[data-admin-signin]');
  const signinForm = $('[data-admin-signin-form]');
  const signinStatus = $('[data-admin-status]');
  const reloadButton = $('[data-admin-reload]');
  const signoutButton = $('[data-admin-signout]');
  const panelStatus = $('[data-admin-panel-status]');

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  };

  const td = (...nodes) => {
    const cell = el('td');
    nodes.flat().forEach((node) => {
      if (node === undefined || node === null || node === false) return;
      cell.appendChild(node);
    });
    return cell;
  };

  const line = (tag, className, text) => (text ? el(tag, className, text) : null);

  const chip = (value) => {
    const good = ['active', 'verified', 'paid', 'approved', 'packed', 'shipped', 'delivered'];
    const bad = ['rejected', 'cancelled', 'refunded'];
    const tone = value === 'pending' || value === 'new'
      ? 'chip--pending'
      : good.includes(value)
        ? 'chip--good'
        : bad.includes(value)
          ? 'chip--bad'
          : 'chip--neutral';
    return el('span', `chip ${tone}`, value || '—');
  };

  const action = (label, dataset) => {
    const button = el('button', 'btn btn--xs', label);
    button.type = 'button';
    button.setAttribute('data-act', 'update');
    Object.entries(dataset).forEach(([key, value]) => button.setAttribute(`data-${key}`, value));
    return button;
  };

  const actions = (...buttons) => {
    const wrap = el('div', 'cell-actions');
    buttons.forEach((button) => wrap.appendChild(button));
    return wrap;
  };

  const peso = (amount) => (amount === null || amount === undefined ? 'Quote' : '₱' + Number(amount).toLocaleString('en-PH'));

  const text = (value, fallback = '—') => (value === null || value === undefined || value === '' ? fallback : String(value));

  const emptyRow = (table, message) => {
    const columns = $$('thead th', table).length || 1;
    const row = el('tr');
    const cell = el('td');
    cell.colSpan = columns;
    cell.appendChild(el('p', 'empty-row', message));
    row.appendChild(cell);
    return row;
  };

  const setStatus = (node, message, tone = 'info') => {
    if (!node) return;
    node.textContent = message || '';
    node.hidden = !message;
    node.className = tone === 'bad' ? 'form-status' : 'form-status form-status--info';
  };

  /* ---------------------------------------------------------------------- */
  /* Rendering                                                              */
  /* ---------------------------------------------------------------------- */

  const renderMembers = (body, rows) => {
    if (!rows.length) return body.appendChild(emptyRow(body.closest('table'), 'No memberships yet.'));
    rows.forEach((row) => {
      const tr = el('tr');
      tr.appendChild(td(el('span', 'cell-nowrap', text(row.member_no))));
      tr.appendChild(
        td(
          el('strong', null, `${row.first_name} ${row.last_name}`.trim()),
          line('div', null, row.email),
          line('div', null, row.phone),
        ),
      );
      tr.appendChild(td(text(row.division)));
      tr.appendChild(
        td(
          row.printed_id ? chip('printed') : chip('digital'),
          line('div', 'cell-nowrap', row.printed_id ? row.gcash_ref : ''),
        ),
      );
      tr.appendChild(td(chip(row.status)));
      tr.appendChild(
        td(actions(
          action('Approve', { kind: 'member', id: row.id, status: 'active' }),
          action('Reject', { kind: 'member', id: row.id, status: 'rejected' }),
        )),
      );
      body.appendChild(tr);
    });
  };

  const renderRegistrations = (body, rows) => {
    if (!rows.length) return body.appendChild(emptyRow(body.closest('table'), 'No tournament entries yet.'));
    rows.forEach((row) => {
      const tr = el('tr');
      const link = el('a', null, text(row.event_slug));
      link.href = `/events/#${encodeURIComponent(row.event_slug)}`;
      tr.appendChild(td(link, line('div', null, text(row.created_at).slice(0, 10))));
      tr.appendChild(
        td(
          el('strong', null, text(row.full_name)),
          line('div', null, row.email),
          line('div', null, row.phone),
          line('div', null, row.member_no),
        ),
      );
      tr.appendChild(td(text(row.division), line('div', null, row.club)));
      tr.appendChild(td(el('span', 'cell-nowrap', text(row.gcash_ref))));
      tr.appendChild(td(el('span', 'cell-nowrap', peso(row.amount))));
      tr.appendChild(td(chip(row.payment_status)));
      tr.appendChild(
        td(actions(
          action('Verify', { kind: 'registration', id: row.id, status: 'verified' }),
          action('Reject', { kind: 'registration', id: row.id, status: 'rejected' }),
        )),
      );
      body.appendChild(tr);
    });
  };

  const renderOrders = (body, rows) => {
    if (!rows.length) return body.appendChild(emptyRow(body.closest('table'), 'No orders yet.'));
    rows.forEach((row) => {
      const tr = el('tr');
      tr.appendChild(td(el('span', 'cell-nowrap', text(row.order_no)), line('div', null, text(row.created_at).slice(0, 10))));
      tr.appendChild(
        td(
          el('strong', null, text(row.full_name)),
          line('div', null, row.phone),
          line('div', null, row.email),
        ),
      );

      const items = el('div');
      (row.items || []).forEach((item) => {
        items.appendChild(el('div', null, `${item.quantity} × ${item.name}`));
      });
      tr.appendChild(td(items));

      tr.appendChild(
        td(
          line('div', null, row.ship_address),
          line('div', null, [row.ship_city, row.ship_province, row.ship_postcode].filter(Boolean).join(', ')),
          line('div', null, row.ship_country),
          line('div', null, row.courier),
          line('div', null, row.shipping_note),
        ),
      );

      tr.appendChild(td(el('span', 'cell-nowrap', peso(row.subtotal))));

      const tracking = el('input');
      tracking.type = 'text';
      tracking.setAttribute('data-tracking', '');
      tracking.value = row.tracking_no || '';
      tracking.placeholder = 'Tracking no.';
      tracking.setAttribute('aria-label', `Tracking number for order ${row.order_no}`);

      tr.appendChild(td(chip(row.payment_status)));
      tr.appendChild(td(chip(row.fulfilment_status), tracking));
      tr.appendChild(
        td(actions(
          action('Paid', { kind: 'order', id: row.id, payment: 'paid' }),
          action('Packed', { kind: 'order', id: row.id, fulfilment: 'packed' }),
          action('Shipped', { kind: 'order', id: row.id, fulfilment: 'shipped', tracking: 'true' }),
          action('Delivered', { kind: 'order', id: row.id, fulfilment: 'delivered' }),
          action('Cancel', { kind: 'order', id: row.id, fulfilment: 'cancelled' }),
        )),
      );
      body.appendChild(tr);
    });
  };

  const renderClubs = (body, rows) => {
    if (!rows.length) return body.appendChild(emptyRow(body.closest('table'), 'No partner club submissions yet.'));
    rows.forEach((row) => {
      const tr = el('tr');
      tr.appendChild(td(el('strong', null, text(row.club_name)), line('div', null, row.notes)));
      tr.appendChild(td([row.city, row.province, row.country].filter(Boolean).join(', ')));
      tr.appendChild(td(line('div', null, row.meeting_place), line('div', null, row.meeting_schedule)));
      tr.appendChild(
        td(
          line('div', null, row.contact_name),
          line('div', null, row.contact_email),
          line('div', null, row.contact_phone),
          line('div', null, row.facebook),
        ),
      );
      tr.appendChild(td(chip(row.status)));
      tr.appendChild(
        td(actions(
          action('Approve', { kind: 'partner-club', id: row.id, status: 'approved' }),
          action('Reject', { kind: 'partner-club', id: row.id, status: 'rejected' }),
        )),
      );
      body.appendChild(tr);
    });
  };

  const renderEvents = (body, rows) => {
    if (!rows.length) return body.appendChild(emptyRow(body.closest('table'), 'No partner tournament listings yet.'));
    rows.forEach((row) => {
      const tr = el('tr');
      tr.appendChild(td(el('strong', null, text(row.title)), line('div', null, row.details)));
      tr.appendChild(td(text(row.partner_club_id)));
      tr.appendChild(td(el('span', 'cell-nowrap', text(row.event_date))));
      tr.appendChild(td(text(row.venue)));
      tr.appendChild(td(chip(row.status)));
      tr.appendChild(
        td(actions(
          action('Approve', { kind: 'partner-event', id: row.id, status: 'approved' }),
          action('Reject', { kind: 'partner-event', id: row.id, status: 'rejected' }),
        )),
      );
      body.appendChild(tr);
    });
  };

  const renderStats = (counts) => {
    const pairs = [
      ['members', 'Members'],
      ['membersPrintRequests', 'Printed IDs requested'],
      ['registrations', 'Tournament entries'],
      ['registrationsPending', 'Entries to verify'],
      ['orders', 'Orders'],
      ['ordersPending', 'Orders to check'],
      ['clubs', 'Partner clubs'],
      ['clubsPending', 'Clubs to review'],
    ];
    const grid = $('[data-admin-stats]');
    if (!grid) return;
    grid.textContent = '';
    pairs.forEach(([key, label]) => {
      const card = el('article', 'admin-stat');
      card.appendChild(el('span', null, label));
      card.appendChild(el('strong', null, counts[key] ?? 0));
      grid.appendChild(card);
    });
  };

  const render = (payload) => {
    renderStats(payload.counts || {});
    renderMembers($('[data-queue-body="members"]'), payload.members || []);
    renderRegistrations($('[data-queue-body="registrations"]'), payload.registrations || []);
    renderOrders($('[data-queue-body="orders"]'), payload.orders || []);
    renderClubs($('[data-queue-body="clubs"]'), payload.partnerClubs || []);
    renderEvents($('[data-queue-body="events"]'), payload.partnerEvents || []);
  };

  /* ---------------------------------------------------------------------- */
  /* Loading                                                                */
  /* ---------------------------------------------------------------------- */

  const load = async () => {
    setStatus(panelStatus, 'Loading the queue…');
    try {
      const response = await fetch('/api/admin/queue', { headers: { accept: 'application/json' } });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload || payload.ok === false) {
        setStatus(panelStatus, (payload && payload.error) || 'Could not read the queue.', 'bad');
        return;
      }
      render(payload);
      setStatus(panelStatus, '');
    } catch {
      setStatus(panelStatus, 'Could not reach the club’s server.', 'bad');
    }
  };

  const showDashboard = () => {
    if (signin) signin.hidden = true;
    dashboard.hidden = false;
    load();
  };

  const showSignin = (message) => {
    dashboard.hidden = true;
    if (signin) signin.hidden = false;
    setStatus(signinStatus, message || '');
  };

  /* ---------------------------------------------------------------------- */
  /* Sign in / out                                                          */
  /* ---------------------------------------------------------------------- */

  if (signinForm) {
    signinForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = $('[type="submit"]', signinForm);
      if (button) button.disabled = true;
      setStatus(signinStatus, 'Signing in…');
      try {
        const response = await fetch('/api/admin/session', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ token: signinForm.elements.token.value.trim() }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload || payload.ok === false) {
          setStatus(signinStatus, (payload && payload.error) || 'That token was not accepted.', 'bad');
          return;
        }
        signinForm.reset();
        showDashboard();
      } catch {
        setStatus(signinStatus, 'Could not reach the club’s server.', 'bad');
      } finally {
        if (button) button.disabled = false;
      }
    });
  }

  if (signoutButton) {
    signoutButton.addEventListener('click', async () => {
      await fetch('/api/admin/session', { method: 'DELETE' }).catch(() => null);
      showSignin('Signed out.');
    });
  }

  if (reloadButton) reloadButton.addEventListener('click', load);

  /* ---------------------------------------------------------------------- */
  /* Move a record forward                                                  */
  /* ---------------------------------------------------------------------- */

  dashboard.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-act="update"]');
    if (!button) return;

    const body = {
      kind: button.getAttribute('data-kind'),
      id: Number(button.getAttribute('data-id')),
    };
    const status = button.getAttribute('data-status');
    const payment = button.getAttribute('data-payment');
    const fulfilment = button.getAttribute('data-fulfilment');
    if (status) body.status = status;
    if (payment) body.paymentStatus = payment;
    if (fulfilment) body.fulfilmentStatus = fulfilment;
    if (button.getAttribute('data-tracking') === 'true') {
      const row = button.closest('tr');
      const input = row ? $('[data-tracking]', row) : null;
      body.trackingNo = input ? input.value.trim() : '';
    }

    button.disabled = true;
    setStatus(panelStatus, 'Saving…');
    try {
      const response = await fetch('/api/admin/update', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload || payload.ok === false) {
        setStatus(panelStatus, (payload && payload.error) || 'That change was not saved.', 'bad');
        return;
      }
      await load();
    } catch {
      setStatus(panelStatus, 'Could not reach the club’s server.', 'bad');
    } finally {
      button.disabled = false;
    }
  });

  /* ---------------------------------------------------------------------- */
  /* Start                                                                  */
  /* ---------------------------------------------------------------------- */

  (async () => {
    try {
      const response = await fetch('/api/admin/session', { headers: { accept: 'application/json' } });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload) {
        showSignin('The dashboard is not available right now.');
        return;
      }
      if (!payload.configured) {
        showSignin('The dashboard is not configured: no ADMIN_TOKEN secret is set on the host.');
        return;
      }
      if (payload.signedIn) showDashboard();
      else showSignin('');
    } catch {
      showSignin('Could not reach the club’s server.');
    }
  })();
})();
