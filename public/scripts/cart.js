/* Chess United — merchandise cart.
 *
 * The cart is a convenience layer over the real order form: it never becomes the
 * source of truth for money. Prices are read from the markup the build generated
 * from src/data/site.ts, and the only thing the club receives is the list of
 * lines this file writes into [data-order-lines], which /api/orders re-prices on
 * the server. Nothing here can change what a buyer is charged.
 */
(() => {
  'use strict';

  const drawer = document.querySelector('[data-cart-drawer]');
  const triggers = Array.from(document.querySelectorAll('[data-cart-open]'));
  if (!triggers.length || !drawer) return;

  const KEY = 'cu_cart_v2';
  /* v1 keys were bare product ids and could not hold a size, so an old cart is
     only carried over for products that never offered one. */
  const LEGACY_KEY = 'cu_cart_v1';
  const MAX_LINES = 40;

  const closeButton = document.querySelector('[data-cart-close]');
  const scrim = document.querySelector('[data-cart-scrim]');
  const linesEl = drawer.querySelector('[data-cart-lines]');
  const emptyEl = drawer.querySelector('[data-cart-empty]');
  const totalEl = drawer.querySelector('[data-cart-total]');
  const status = document.querySelector('[data-cart-status]');

  const summaryEl = document.querySelector('[data-cart-summary]');
  const form = document.querySelector('form[data-api="/api/orders"]');
  const linesHost = form ? form.querySelector('[data-order-lines]') : null;
  const courierSelect = form ? form.querySelector('[data-courier-select]') : null;
  const shippingEl = document.querySelector('[data-cart-shipping]');
  const grandEl = document.querySelector('[data-cart-grand]');
  const shippingNote = document.querySelector('[data-cart-shipping-note]');
  const emptyPrompt = document.querySelector('[data-checkout-empty]');
  const shell = form ? form.closest('[data-form-shell]') : null;
  const success = shell ? shell.querySelector('[data-success]') : null;

  /* ---------------------------------------------------------------------- */
  /* Catalogue                                                              */
  /* ---------------------------------------------------------------------- */

  const catalogue = new Map();
  document.querySelectorAll('[data-product]').forEach((card) => {
    const id = card.getAttribute('data-product-id');
    if (!id) return;
    const raw = card.getAttribute('data-product-price');
    const price = raw === null || raw === '' ? null : Number(raw);
    const qty = card.querySelector('[data-product-qty]');
    catalogue.set(id, {
      id,
      name: card.getAttribute('data-product-name') || id,
      price: Number.isFinite(price) ? price : null,
      sizes: (card.getAttribute('data-product-sizes') || '').split(',').filter(Boolean),
      max: Math.min(Number(qty && qty.max) || 99, 99),
      card,
    });
  });

  /* One line per product and size, so the same shirt in M and L is two lines. */
  const lineKey = (id, size) => (size ? `${id}|${size}` : id);
  const productOf = (key) => key.split('|')[0];
  const sizeOf = (key) => {
    const at = key.indexOf('|');
    return at === -1 ? '' : key.slice(at + 1);
  };

  const labelOf = (key) => {
    const item = catalogue.get(productOf(key));
    if (!item) return '';
    const size = sizeOf(key);
    return size ? `${item.name} size ${size}` : item.name;
  };

  /* ---------------------------------------------------------------------- */
  /* State                                                                  */
  /* ---------------------------------------------------------------------- */

  let cart = {};

  const adopt = (source) => {
    if (!source || typeof source !== 'object' || Array.isArray(source)) return;
    Object.entries(source).forEach(([key, value]) => {
      const item = catalogue.get(productOf(key));
      if (!item) return;
      const size = sizeOf(key);
      const rightSize = item.sizes.length ? item.sizes.includes(size) : size === '';
      if (!rightSize) return;
      const qty = Number.parseInt(value, 10);
      if (Number.isFinite(qty) && qty > 0) cart[key] = Math.min(qty, item.max);
    });
  };

  try {
    adopt(JSON.parse(localStorage.getItem(KEY) || '{}'));
    if (!Object.keys(cart).length) adopt(JSON.parse(localStorage.getItem(LEGACY_KEY) || '{}'));
  } catch {
    cart = {};
  }

  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(cart));
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      /* Private-browsing and full-quota storage are not worth failing over:
         the cart still works for the visit, it just does not survive a reload. */
    }
  };

  const keys = () => Object.keys(cart).slice(0, MAX_LINES);
  const units = () => keys().reduce((sum, key) => sum + cart[key], 0);
  const qtyFor = (id) =>
    keys().reduce((sum, key) => (productOf(key) === id ? sum + cart[key] : sum), 0);

  const peso = (amount) => '₱' + Number(amount).toLocaleString('en-PH');

  const subtotal = () =>
    keys().reduce((sum, key) => {
      const item = catalogue.get(productOf(key));
      return item && item.price !== null ? sum + item.price * cart[key] : sum;
    }, 0);

  /* The courier fee is the club's own number, carried on the option the build
     rendered. No data-courier-fee means the club has not published a fee for
     that courier yet, so the order total stays open instead of guessing one. */
  const courierFee = () => {
    const option = courierSelect && courierSelect.selectedOptions
      ? courierSelect.selectedOptions[0]
      : null;
    const raw = option ? option.getAttribute('data-courier-fee') : null;
    if (raw === null || raw.trim() === '') return null;
    const fee = Number(raw);
    return Number.isFinite(fee) ? fee : null;
  };

  /* ---------------------------------------------------------------------- */
  /* Rendering                                                              */
  /* ---------------------------------------------------------------------- */

  const step = (glyph, action, key) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cart-step';
    button.textContent = glyph;
    button.setAttribute('aria-label', `${glyph === '−' ? 'Decrease' : 'Increase'} ${labelOf(key)}`);
    button.addEventListener('click', action);
    return button;
  };

  const renderDrawer = () => {
    linesEl.textContent = '';
    const list = keys();
    emptyEl.hidden = list.length > 0;
    linesEl.hidden = list.length === 0;

    list.forEach((key) => {
      const item = catalogue.get(productOf(key));
      const qty = cart[key];
      const size = sizeOf(key);

      const line = document.createElement('li');
      line.className = 'cart-line';

      const copy = document.createElement('div');
      copy.className = 'cart-line-copy';
      const name = document.createElement('strong');
      name.textContent = item.name;
      const unit = document.createElement('span');
      unit.textContent = `${size ? `Size ${size} · ` : ''}${peso(item.price)} each`;
      copy.appendChild(name);
      copy.appendChild(unit);

      const stepper = document.createElement('div');
      stepper.className = 'cart-stepper';
      stepper.appendChild(step('−', () => setQty(key, qty - 1), key));
      const value = document.createElement('span');
      value.className = 'cart-line-qty';
      value.textContent = String(qty);
      stepper.appendChild(value);
      stepper.appendChild(step('+', () => setQty(key, qty + 1), key));

      const amount = document.createElement('span');
      amount.className = 'cart-line-total';
      amount.textContent = peso(item.price * qty);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'cart-remove';
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', `Remove ${labelOf(key)} from cart`);
      remove.addEventListener('click', () => setQty(key, 0));

      line.appendChild(copy);
      line.appendChild(stepper);
      line.appendChild(amount);
      line.appendChild(remove);
      linesEl.appendChild(line);
    });

    totalEl.textContent = peso(subtotal());
  };

  const renderSummary = () => {
    if (!summaryEl) return;
    summaryEl.textContent = '';
    keys().forEach((key) => {
      const item = catalogue.get(productOf(key));
      const li = document.createElement('li');
      li.textContent = `${cart[key]} × ${labelOf(key)} — ${peso(item.price * cart[key])}`;
      summaryEl.appendChild(li);
    });
  };

  const renderBadge = () => {
    const count = units();
    document.querySelectorAll('[data-cart-count]').forEach((badge) => {
      badge.textContent = String(count);
      badge.hidden = count === 0;
    });
  };

  /* The hidden lines are the only thing the API reads, so they are written last
     and one input event on the form runs the subtotal logic in forms.js. */
  const renderOrderLines = () => {
    if (!linesHost) return;
    linesHost.textContent = '';
    keys().forEach((key) => {
      const item = catalogue.get(productOf(key));
      const input = document.createElement('input');
      input.type = 'hidden';
      input.setAttribute('data-item-id', item.id);
      input.setAttribute('data-item-price', String(item.price));
      const size = sizeOf(key);
      if (size) input.setAttribute('data-item-size', size);
      input.value = String(cart[key]);
      linesHost.appendChild(input);
    });
    if (form) form.dispatchEvent(new Event('input', { bubbles: true }));
  };

  const renderShipping = () => {
    const fee = courierFee();
    const total = subtotal();
    if (shippingEl) shippingEl.textContent = fee === null ? 'Quoted by the club' : peso(fee);
    if (grandEl) grandEl.textContent = fee === null ? '—' : peso(total + fee);
    if (shippingNote) shippingNote.hidden = fee !== null;
  };

  let checkingOut = false;
  const renderCheckout = () => {
    const hasLines = keys().length > 0;
    if (!hasLines) checkingOut = false;
    if (emptyPrompt) emptyPrompt.hidden = checkingOut;
    if (!form) return;
    form.hidden = !checkingOut;
    if (checkingOut && success) success.hidden = true;
  };

  /* A card already in the cart shows the combined quantity, so the catalogue and
     the drawer never disagree after a reload. */
  const renderCards = () => {
    catalogue.forEach((item) => {
      const input = item.card.querySelector('[data-product-qty]');
      if (input) input.value = String(Math.min(qtyFor(item.id) || 1, item.max));
    });
  };

  const render = () => {
    renderDrawer();
    renderSummary();
    renderBadge();
    renderShipping();
    renderCards();
    renderCheckout();
    renderOrderLines();
    save();
  };

  const announce = (message) => {
    if (status) status.textContent = message;
  };

  /* ---------------------------------------------------------------------- */
  /* Actions                                                                */
  /* ---------------------------------------------------------------------- */

  function setQty(key, next) {
    const item = catalogue.get(productOf(key));
    if (!item) return;
    const qty = Math.max(0, Math.min(Number.parseInt(next, 10) || 0, item.max));
    if (qty === 0) delete cart[key];
    else cart[key] = qty;
    render();
    announce(`${labelOf(key)}: ${qty} in cart.`);
  }

  function addToCart(key, qty) {
    const item = catalogue.get(productOf(key));
    if (!item) return;
    const next = Math.min((cart[key] || 0) + qty, item.max);
    cart[key] = next;
    render();
    announce(`${labelOf(key)}: ${next} in cart.`);
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => open(trigger));
  });

  document.querySelectorAll('[data-add-to-cart]').forEach((button) => {
    const item = catalogue.get(button.getAttribute('data-add-to-cart'));
    if (!item) return;

    button.addEventListener('click', () => {
      const input = item.card.querySelector('[data-product-qty]');
      const requested = Number.parseInt(input && input.value, 10);
      const qty = Math.max(1, Math.min(Number.isFinite(requested) ? requested : 1, item.max));

      if (item.sizes.length) {
        const chosen = item.card.querySelector('.product-size-input:checked');
        if (!chosen) {
          announce(`Choose a size for the ${item.name}.`);
          const first = item.card.querySelector('.product-size-input');
          if (first) first.focus();
          return;
        }
        addToCart(lineKey(item.id, chosen.value), qty);
      } else {
        addToCart(lineKey(item.id, ''), qty);
      }
      open(button);
    });
  });

  const clearButton = document.querySelector('[data-cart-clear]');
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      cart = {};
      render();
      announce('Cart emptied.');
    });
  }

  const checkout = drawer.querySelector('[data-cart-checkout]');
  if (checkout) checkout.addEventListener('click', (event) => {
    event.preventDefault();
    closeCart();
    checkingOut = keys().length > 0;
    renderCheckout();
    if (checkingOut && form) {
      form.scrollIntoView({ behavior: 'instant', block: 'start' });
      const first = form.querySelector('input:not([type=hidden]), select, textarea');
      if (first) first.focus({ preventScroll: true });
    }
  });

  if (courierSelect) courierSelect.addEventListener('change', renderShipping);

  /* Once the club has the order, the cart has done its job. */
  if (success) {
    new MutationObserver(() => {
      if (success.hidden) return;
      cart = {};
      render();
    }).observe(success, { attributes: true, attributeFilter: ['hidden'] });
  }

  /* ---------------------------------------------------------------------- */
  /* Open / close                                                           */
  /* ---------------------------------------------------------------------- */

  let opener = null;

  function openCart() {
    if (!drawer.hasAttribute('data-cart-open')) {
      drawer.setAttribute('data-cart-open', '');
      drawer.removeAttribute('inert');
      drawer.setAttribute('aria-hidden', 'false');
      if (scrim) scrim.hidden = false;
      document.documentElement.classList.add('has-cart-open');
      triggers.forEach((trigger) => trigger.setAttribute('aria-expanded', 'true'));
    }
  }

  function open(trigger) {
    opener = trigger;
    openCart();
    const focusTarget = drawer.querySelector('.cart-lines button') || closeButton;
    if (focusTarget) focusTarget.focus();
  }

  function closeCart() {
    if (!drawer.hasAttribute('data-cart-open')) return;
    drawer.removeAttribute('data-cart-open');
    drawer.setAttribute('inert', '');
    drawer.setAttribute('aria-hidden', 'true');
    if (scrim) scrim.hidden = true;
    document.documentElement.classList.remove('has-cart-open');
    triggers.forEach((trigger) => trigger.setAttribute('aria-expanded', 'false'));
    if (opener && document.contains(opener)) opener.focus();
    opener = null;
  }

  if (closeButton) closeButton.addEventListener('click', closeCart);
  if (scrim) scrim.addEventListener('click', closeCart);

  document.addEventListener('keydown', (event) => {
    if (!drawer.hasAttribute('data-cart-open')) return;
    if (event.key === 'Escape') {
      closeCart();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = Array.from(
      drawer.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
    ).filter((node) => !node.disabled && node.offsetParent !== null);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || !drawer.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  });

  render();
})();
