# StPageFlip

`page-flip.js` is the bundled StPageFlip browser build, distributed under
`page-flip-LICENSE.txt`. It includes these local fixes:

- The renderer retains its animation-frame ID and exposes `stop()`;
  `PageFlip.destroy()` calls it before removing the UI. Rebuilding on resize
  must not leave old renderers running or retaining detached pages.
- The UI registers and removes a `touchcancel` handler. Cancellation clears
  the delayed touch start and calls `cancelUserTouch()`, which releases the
  fold and restores the `read` state without starting another page turn.
- A backward soft-paper turn in portrait mode retraces the forward curl.
  The previous page supplies both its stationary face and a temporary folded
  face; the current page sits underneath the fold. The calculation and shadows
  use forward geometry with the animation endpoints reversed, while completion
  still navigates backward. `convertFoldPoint()` maps a backward drag across
  the visible sheet onto that same curl. Reset restores the live page, including
  after a cancelled touch. Hard-cover and forward-turn geometry are unchanged.
- Both directions use half the configured animation duration for the same curl
  path, including the animated completion after a drag. This keeps forward turns
  at the same speed as the approved faster backward turns.

Preserve or recheck these fixes when replacing the vendor build. The browser
regressions in `scripts/check_book_browser.cjs` exercise both behaviors.
`scripts/check_book_reverse.cjs` compares forward/backward timing and geometry
and checks keyboard turns, mobile taps, held drags and cancellation in every
registered language, with all external requests blocked.

The locale adapter in `js/book.js` mirrors the physical RTL book shell and
counter-mirrors each `.page-face` so text and artwork stay upright. After each
load/rebuild it adapts `getUI().getMousePos()` using `getDistElement()` bounds.
This keeps the engine's fold and swipe calculations in its original coordinate
system. Preserve these API hooks when updating the vendor; verify RTL taps,
swipes and held corner drags with `scripts/check_book_languages.cjs`.
