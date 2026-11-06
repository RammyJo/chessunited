/* Chess United — form plumbing.
 *
 * Every form on the site posts JSON to a Cloudflare Pages Function under
 * /api/. This file only makes that pleasant: inline field errors, a success
 * panel, and a live order subtotal. Nothing here is required to submit — the
 * markup is a real form first.
 */
(() => {
  'use strict';

  const $ = (selector, ctx = document) => ctx.querySelector(selector);
  const $$ = (selector, ctx = document) => Array.from(ctx.querySelectorAll(selector));

  const get = (object, path) =>
    path.split('.').reduce((acc, key) => (acc === null || acc === undefined ? acc : acc[key]), object);

  const fill = (template, data) =>
    template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
      const value = get(data, key);
      return value === undefined || value === null ? '' : String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
    });

  const peso = (amount) => '₱' + Number(amount).toLocaleString('en-PH');

  /* ---------------------------------------------------------------------- */
  /* Payload                                                                */
  /* ---------------------------------------------------------------------- */

  const collect = (form) => {
    const data = {};
    for (const [name, value] of new FormData(form).entries()) {
      data[name] = typeof value === 'string' ? value.trim() : value;
    }
    $$('[data-bool]', form).forEach((input) => {
      data[input.name] = input.checked;
    });
    $$('[data-number]', form).forEach((input) => {
      data[input.name] = Number(input.value);
    });

    // The order lines are written by cart.js and carry no field name on purpose:
    // the items array below is what the server prices, never the FormData.
    const itemInputs = $$('[data-item-id]', form);
    if (itemInputs.length) {
      const items = [];
      itemInputs.forEach((input) => {
        const qty = Number.parseInt(input.value, 10);
        if (!Number.isFinite(qty) || qty <= 0) return;
        const item = { id: input.getAttribute('data-item-id'), qty };
        const size = (input.getAttribute('data-item-size') || '').trim();
        if (size) item.size = size;
        items.push(item);
      });
      data.items = items;
    }

    return data;
  };

  /* ---------------------------------------------------------------------- */
  /* Live subtotal                                                          */
  /* ---------------------------------------------------------------------- */

  $$('form[data-api]').forEach((form) => {
    const outputs = $$('[data-subtotal]', form);
    if (!outputs.length) return;

    /* The order lines come and go with the cart, so the rows are read again on
       every input event instead of being captured once at page load. */
    const refresh = () => {
      let total = 0;
      $$('[data-item-id]', form).forEach((input) => {
        const qty = Number.parseInt(input.value, 10) || 0;
        const price = Number(input.getAttribute('data-item-price'));
        if (Number.isFinite(price)) total += Math.max(qty, 0) * price;
      });
      outputs.forEach((node) => {
        node.textContent = peso(total);
      });
    };

    form.addEventListener('input', refresh);
    refresh();
  });

  /* ---------------------------------------------------------------------- */
  /* Submit                                                                 */
  /* ---------------------------------------------------------------------- */

  $$('form[data-api]').forEach((form) => {
    const shell = form.closest('[data-form-shell]') || form.parentElement;
    const status = $('[data-form-status]', form);
    const success = shell ? $('[data-success]', shell) : null;
    const template = success ? $('[data-success-template]', success) : null;
    const button = $('[type="submit"]', form);
    const busyLabel = button ? button.getAttribute('data-busy') : null;
    const idleLabel = button ? button.textContent : null;

    const clearErrors = () => {
      $$('[data-error-for]', form).forEach((node) => {
        node.textContent = '';
        node.hidden = true;
      });
      $$('.is-invalid', form).forEach((node) => node.classList.remove('is-invalid'));
      if (status) {
        status.textContent = '';
        status.hidden = true;
      }
    };

    const showErrors = (message, fields) => {
      if (status) {
        status.textContent = message || 'Please check the highlighted fields.';
        status.hidden = false;
      }
      if (!fields) return;
      Object.keys(fields).forEach((key) => {
        const node = $(`[data-error-for="${key}"]`, form);
        if (node) {
          node.textContent = fields[key];
          node.hidden = false;
        }
        const control = form.elements[key];
        if (control && control.classList) control.classList.add('is-invalid');
      });
      const first = Object.keys(fields)
        .map((key) => $(`[data-error-for="${key}"]`, form))
        .find(Boolean);
      if (first && first.scrollIntoView) {
        first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearErrors();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const endpoint = form.getAttribute('data-api');
      const payload = collect(form);

      if (button) {
        button.disabled = true;
        if (busyLabel) button.textContent = busyLabel;
      }

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });

        let body = null;
        try {
          body = await response.json();
        } catch {
          body = null;
        }

        if (!response.ok || !body || body.ok === false) {
          showErrors(
            (body && body.error) || 'Something went wrong. Please try again, or message the club.',
            body && body.fields,
          );
          return;
        }

        if (endpoint === '/api/orders') {
          document.dispatchEvent(new CustomEvent('cu:order-prepared', { detail: body }));
          return;
        }

        if (success && template) {
          const html = fill(template.innerHTML, body);
          const holder = document.createElement('div');
          holder.innerHTML = html;
          // Links are written as data-href so the built HTML never carries a
          // half-finished URL; they become real hrefs here, once the server has
          // answered.
          holder.querySelectorAll('[data-href]').forEach((node) => {
            node.setAttribute('href', node.getAttribute('data-href'));
          });
          success.innerHTML = '';
          while (holder.firstChild) success.appendChild(holder.firstChild);
          success.hidden = false;
          form.hidden = true;
          success.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (status) {
          status.textContent = body.message || 'Thank you — the club has your details.';
          status.hidden = false;
          form.reset();
        }
      } catch {
        showErrors('Could not reach the club’s server. Check your connection and try again.');
      } finally {
        if (button) {
          button.disabled = endpoint === '/api/orders' && !form.querySelector('[data-shipping-quote-id]')?.value;
          if (idleLabel) button.textContent = idleLabel;
        }
      }
    });
  });

  /* ---------------------------------------------------------------------- */
  /* Membership card lookup (the card page reads ?m=CU-YYYY-NNNN)           */
  /* ---------------------------------------------------------------------- */
  const card = $('[data-member-card]');
  if (card) {
    const params = new URLSearchParams(window.location.search);
    const memberNo = (params.get('m') || '').trim().toUpperCase();
    const loading = $('[data-card-loading]', card);
    const body = $('[data-card-body]', card);
    const error = $('[data-card-error]', card);
    const empty = $('[data-card-empty]', card);

    const show = (node) => {
      [loading, body, error, empty].forEach((panel) => {
        if (panel) panel.hidden = panel !== node;
      });
    };

    const setText = (key, value) => {
      $$(`[data-card-${key}]`, card).forEach((node) => {
        node.textContent = value;
      });
    };

    if (!/^CU-\d{4}-\d{4}$/.test(memberNo)) {
      show(empty);
    } else {
      show(loading);
      fetch('/api/members/' + encodeURIComponent(memberNo))
        .then(async (response) => {
          const payload = await response.json().catch(() => null);
          if (!response.ok || !payload || payload.ok === false) {
            setText('error-message', (payload && payload.error) || 'That membership number was not found.');
            show(error);
            return;
          }
          const member = payload.member;
          setText('number', member.memberNo);
          setText('name', member.fullName);
          setText('division', member.division);
          setText('since', member.since);
          setText('status', member.status);
          const printNote = $('[data-card-print-note]', card);
          if (printNote) printNote.hidden = !member.printedId;
          show(body);
        })
        .catch(() => {
          setText('error-message', 'Could not reach the club’s server.');
          show(error);
        });
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Print the card                                                         */
  /* ---------------------------------------------------------------------- */
  $$('[data-print-card]').forEach((button) => {
    button.addEventListener('click', () => window.print());
  });

  /* ---------------------------------------------------------------------- */
  /* Partner club directory                                                 */
  /*                                                                        */
  /* Everything below is built with textContent rather than innerHTML: the  */
  /* content arrives from other clubs, so it is treated as text, never as   */
  /* markup.                                                                */
  /* ---------------------------------------------------------------------- */
  const directory = $('[data-club-directory]');
  if (directory) {
    const list = $('[data-club-list]', directory);
    const loading = $('[data-club-loading]', directory);
    const empty = $('[data-club-empty]', directory);
    const error = $('[data-club-error]', directory);
    const count = $('[data-club-count]', directory);

    const panel = (node) => {
      [loading, empty, error, list].forEach((item) => {
        if (item) item.hidden = item !== node;
      });
    };

    const term = (text) => {
      const node = document.createElement('dd');
      node.textContent = text;
      return node;
    };

    const build = (club) => {
      const card = document.createElement('article');
      card.className = 'club-card';

      const title = document.createElement('h3');
      title.textContent = club.name;
      card.appendChild(title);

      const where = document.createElement('p');
      where.className = 'club-where';
      where.textContent = [club.city, club.province, club.country].filter(Boolean).join(', ');
      card.appendChild(where);

      const facts = document.createElement('dl');
      if (club.meetingPlace) {
        const dt = document.createElement('dt');
        dt.textContent = 'Meets at';
        facts.appendChild(dt);
        facts.appendChild(term(club.meetingPlace));
      }
      if (club.meetingSchedule) {
        const dt = document.createElement('dt');
        dt.textContent = 'When';
        facts.appendChild(dt);
        facts.appendChild(term(club.meetingSchedule));
      }
      if (club.contactName) {
        const dt = document.createElement('dt');
        dt.textContent = 'Club officer';
        facts.appendChild(dt);
        facts.appendChild(term(club.contactName));
      }
      card.appendChild(facts);

      if (club.facebook) {
        const link = document.createElement('a');
        link.className = 'text-link';
        link.href = club.facebook;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = 'Club page';
        card.appendChild(link);
      }

      if (club.events && club.events.length) {
        const events = document.createElement('ul');
        events.className = 'club-events';
        club.events.forEach((event) => {
          const item = document.createElement('li');
          const name = document.createElement('strong');
          name.textContent = event.title;
          item.appendChild(name);
          const detail = [event.date, event.venue].filter(Boolean).join(' · ');
          if (detail) {
            const meta = document.createElement('span');
            meta.textContent = detail;
            item.appendChild(meta);
          }
          events.appendChild(item);
        });
        card.appendChild(events);
      }

      return card;
    };

    panel(loading);
    fetch('/api/partner-clubs')
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload || payload.ok === false) throw new Error('unavailable');
        return payload.clubs || [];
      })
      .then((clubs) => {
        if (count) count.textContent = String(clubs.length);
        if (!clubs.length) {
          panel(empty);
          return;
        }
        clubs.forEach((club) => list.appendChild(build(club)));
        panel(list);
      })
      .catch(() => panel(error));
  }
})();
