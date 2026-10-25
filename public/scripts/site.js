/* Chess United — small, dependency-free progressive enhancements. */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------- */
  /* Header shadow                                                          */
  /* ---------------------------------------------------------------------- */
  const header = $('[data-header]');
  if (header) {
    const setScrolled = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    setScrolled();
    window.addEventListener('scroll', setScrolled, { passive: true });
  }

  /* ---------------------------------------------------------------------- */
  /* Mobile menu                                                            */
  /* ---------------------------------------------------------------------- */
  const menu = $('[data-menu]');
  const toggle = $('[data-menu-toggle]');
  const closeBtn = $('[data-menu-close]');

  if (menu && toggle) {
    let lastFocused = null;

    const focusable = () =>
      $$('a[href], button:not([disabled])', menu).filter((el) => el.offsetParent !== null);

    const openMenu = () => {
      lastFocused = document.activeElement;
      menu.inert = false;
      menu.setAttribute('aria-hidden', 'false');
      menu.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      document.body.classList.add('menu-open');
      const first = focusable()[0];
      if (first) window.setTimeout(() => first.focus(), 40);
    };

    const closeMenu = (restoreFocus = true) => {
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
      menu.inert = true;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      document.body.classList.remove('menu-open');
      if (restoreFocus) {
        const target = lastFocused && lastFocused.focus ? lastFocused : toggle;
        target.focus();
      }
    };

    toggle.addEventListener('click', () => {
      if (menu.classList.contains('is-open')) closeMenu();
      else openMenu();
    });

    if (closeBtn) closeBtn.addEventListener('click', () => closeMenu());

    $$('[data-menu-link]', menu).forEach((link) =>
      link.addEventListener('click', () => closeMenu(false)),
    );

    menu.addEventListener('click', (event) => {
      if (event.target === menu) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (!menu.classList.contains('is-open')) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 980 && menu.classList.contains('is-open')) closeMenu(false);
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Staggered entrances                                                   */
  /*                                                                        */
  /* Grouped elements get an entrance variant and an index-based delay so   */
  /* cards, tiles and copy blocks arrive in sequence rather than all at     */
  /* once. The classes are added here rather than in markup so that a page  */
  /* is fully readable when JavaScript does not run.                       */
  /* ---------------------------------------------------------------------- */
  const staggerGroups = [
    ['.section-head > *', 'reveal', 70],
    ['.event-grid > *', 'reveal reveal--pop', 120],
    ['.division-grid > *', 'reveal reveal--pop', 130],
    ['.value-grid > *', 'reveal reveal--pop', 90],
    ['.team-grid > *', 'reveal reveal--pop', 90],
    ['.venue-grid > *', 'reveal reveal--pop', 90],
    ['.merch-grid > *', 'reveal reveal--pop', 90],
    ['.fact-grid > *', 'reveal reveal--right', 70],
    ['.cta-inner > *', 'reveal reveal--pop', 110],
    ['.gallery-item', 'reveal reveal--pop', 55],
    ['.poster-card', 'reveal reveal--stamp', 0],
  ];

  if (!reduceMotion()) {
    staggerGroups.forEach(([selector, variant, step]) => {
      $$(selector).forEach((el, index) => {
        variant.split(' ').forEach((name) => el.classList.add(name));
        el.style.setProperty('--delay', `${Math.min(index * step, 420)}ms`);
      });
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Reveal on scroll                                                       */
  /* ---------------------------------------------------------------------- */
  const reveals = $$('.reveal');
  if (reveals.length) {
    if (reduceMotion() || !('IntersectionObserver' in window)) {
      reveals.forEach((el) => el.classList.add('is-in'));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-in');
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: '0px 0px -50px 0px' },
      );
      reveals.forEach((el) => io.observe(el));
      // Failsafe: never leave content invisible if the observer misses a section.
      window.setTimeout(() => reveals.forEach((el) => el.classList.add('is-in')), 3000);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Countdown                                                              */
  /* ---------------------------------------------------------------------- */
  $$('[data-countdown]').forEach((el) => {
    const deadline = new Date(el.getAttribute('data-deadline')).getTime();
    if (Number.isNaN(deadline)) return;

    const days = $('[data-days]', el);
    const hours = $('[data-hours]', el);
    const mins = $('[data-mins]', el);
    const secs = $('[data-secs]', el);
    const pad = (n) => String(n).padStart(2, '0');
    let timer;

    // Set a value and, if it actually changed, give the digits a short pop.
    const set = (node, value) => {
      if (!node || node.textContent === value) return;
      node.textContent = value;
      if (reduceMotion()) return;
      node.classList.remove('is-tick');
      void node.offsetWidth; // restart the animation
      node.classList.add('is-tick');
    };

    const tick = () => {
      const diff = deadline - Date.now();
      if (diff <= 0) {
        el.setAttribute('data-expired', '');
        [days, hours, mins, secs].forEach((node) => {
          if (node) node.textContent = '00';
        });
        window.clearInterval(timer);
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      set(days, pad(Math.floor(totalSeconds / 86400)));
      set(hours, pad(Math.floor((totalSeconds % 86400) / 3600)));
      set(mins, pad(Math.floor((totalSeconds % 3600) / 60)));
      set(secs, pad(totalSeconds % 60));
    };

    tick();
    timer = window.setInterval(tick, 1000);
  });

  /* ---------------------------------------------------------------------- */
  /* Gallery lightbox                                                       */
  /* ---------------------------------------------------------------------- */
  const dialog = $('[data-lightbox-dialog]');
  const items = $$('[data-lightbox]');

  if (dialog && items.length && typeof dialog.showModal === 'function') {
    const img = $('[data-lightbox-img]', dialog);
    const caption = $('[data-lightbox-caption]', dialog);
    const close = $('[data-lightbox-close]', dialog);
    const prev = $('[data-lightbox-prev]', dialog);
    const next = $('[data-lightbox-next]', dialog);
    let current = 0;

    const show = (index) => {
      current = (index + items.length) % items.length;
      const item = items[current];
      img.src = item.getAttribute('data-full');
      img.alt = item.getAttribute('data-alt') || '';
      caption.textContent = `${item.getAttribute('data-caption') || ''} · ${current + 1} / ${items.length}`;
    };

    items.forEach((item, index) => {
      item.addEventListener('click', () => {
        show(index);
        dialog.showModal();
      });
    });

    if (close) close.addEventListener('click', () => dialog.close());
    if (prev) prev.addEventListener('click', () => show(current - 1));
    if (next) next.addEventListener('click', () => show(current + 1));

    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        show(current - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        show(current + 1);
      }
    });
  }

  /* ---------------------------------------------------------------------- */
  /* Copy to clipboard                                                      */
  /* ---------------------------------------------------------------------- */
  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      area.remove();
      return ok;
    }
  };

  $$('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const ok = await copyText(button.getAttribute('data-copy') || '');
      const label = $('[data-copy-label]', button);
      if (!label) return;
      const original = label.textContent;
      label.textContent = ok ? 'Copied' : 'Copy failed';
      window.setTimeout(() => {
        label.textContent = original;
      }, 1800);
    });
  });

  /* ---------------------------------------------------------------------- */
  /* Share                                                                  */
  /* ---------------------------------------------------------------------- */
  $$('[data-share]').forEach((button) => {
    button.addEventListener('click', async () => {
      const url = button.getAttribute('data-share-url') || window.location.href;
      const data = {
        title: button.getAttribute('data-share-title') || document.title,
        text: button.getAttribute('data-share-text') || '',
        url,
      };
      if (navigator.share) {
        try {
          await navigator.share(data);
        } catch {
          /* user cancelled */
        }
        return;
      }
      const ok = await copyText(url);
      const label = $('[data-copy-label]', button);
      if (label) {
        const original = label.textContent;
        label.textContent = ok ? 'Link copied' : 'Copy failed';
        window.setTimeout(() => {
          label.textContent = original;
        }, 1800);
      }
    });
  });
})();
