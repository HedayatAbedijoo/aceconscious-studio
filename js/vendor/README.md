# StPageFlip

`page-flip.js` is the bundled StPageFlip browser build, distributed under
`page-flip-LICENSE.txt`. It includes these local fixes:

- The renderer retains its animation-frame ID and exposes `stop()`;
  `PageFlip.destroy()` calls it before removing the UI. Rebuilding on resize
  must not leave old renderers running or retaining detached pages.
- Static HTML frames are reused while the same pages, bounds and orientation
  remain visible. Animated frames always draw; changing folded/bottom pages
  invalidates the cache, including cancellation before the first frame. This
  avoids rewriting every hidden sheet and the visible sheet on each idle tick.
- UI destruction always removes resize and cancellation listeners, including
  when native mouse/touch handling is disabled with `useMouseEvents: false`.
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
regressions in `scripts/check_book_browser.cjs` exercise lifecycle and idle drawing.
`scripts/check_book_reverse.cjs` compares forward/backward timing and geometry
and checks keyboard turns, mobile taps, slow swipes and cancellation in every
registered language, with all external requests blocked.

The locale adapter in `js/book.js` mirrors the physical RTL book shell and
counter-mirrors each `.page-face` so text and artwork stay upright. The reader
owns Pointer Events with `useMouseEvents: false` and `showPageCorners: false`;
it maps physical left/right gestures to logical destinations itself. The engine
only receives completed navigation requests. There are no hover folds, delayed
vendor touches or live finger-following folds. Keep that single input owner when
updating the vendor. `scripts/check_book_gestures.cjs` exercises desktop halves,
mobile swipes, controls, selection, cancellation, rapid reversals and every sheet
in English, Persian and Arabic; `check_book_reverse.cjs` checks animation geometry
in every registered language.
