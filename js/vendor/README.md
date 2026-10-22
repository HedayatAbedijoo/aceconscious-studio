# StPageFlip

`page-flip.js` is the bundled StPageFlip browser build, distributed under
`page-flip-LICENSE.txt`. It includes these local lifecycle fixes:

- The renderer retains its animation-frame ID and exposes `stop()`;
  `PageFlip.destroy()` calls it before removing the UI. Rebuilding on resize
  must not leave old renderers running or retaining detached pages.
- The UI registers and removes a `touchcancel` handler. Cancellation clears
  the delayed touch start and calls `cancelUserTouch()`, which releases the
  fold and restores the `read` state without starting another page turn.

Preserve or recheck these fixes when replacing the vendor build. The browser
regressions in `scripts/check_book_browser.cjs` exercise both behaviors.
