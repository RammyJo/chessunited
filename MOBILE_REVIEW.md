# Mobile usability and chess identity — 2026-11-06

## Changes

- Compact two-column mobile navigation with current-page indication, background focus isolation, Escape dismissal and focus restoration.
- Responsive headings, unrotated phone actions, shorter hero photography, two-column home gallery and safe-area padding.
- At least 44px cart/size/gallery controls; 16px form inputs to avoid automatic phone focus zoom.
- Checkout scrolls to the delivery form and focuses its first field. Adding products moves focus into the cart and restores it when dismissed.
- Gallery accepts horizontal touch swipes while retaining vertical panning and pinch zoom; the background cannot scroll while the viewer is open.
- Phone content appears without stagger delays; countdown digits avoid forced animation reflows on phones. Reduced-motion preferences remain supported.
- The 16KB cart script is requested only on the shop page.
- New locally hosted knight emblem and more visible chessboard details retain the existing club palette.

## Verification

- Astro check, production build, static QA and build verification passed.
- Chromium checked all eight public pages at 320px, 390px and 768px with no document overflow or clipped menu labels; Escape and focus restoration passed.
- Short landscape navigation, product size selection, cart checkout focus, actual touch-input photo swipe, and reduced motion passed.
- Existing browser suite checked nine routes at 390px and 1440px. Its only failures were two expected /api/partner-clubs 404 console messages: Astro preview has no Functions/D1 backend. Layout, images, naming, menu and lightbox checks passed.
- CSP checks passed on all nine routes, including the new image and scripts.
- Mobile regression tests explicitly stub only the public directory GET. No form submissions or production data writes occurred.

Run with `npm run preview`, then `CHROME_PATH=/usr/bin/chromium npm run qa:mobile` (set CHROME_PATH to your installed Chrome). Use QA_INTERACTIONS_ONLY=1 to rerun interaction checks separately.

These checks use Chromium emulation. Physical iOS/Android testing and production Web Vitals measurement are not included. Production deployment is separate from committing the source.
