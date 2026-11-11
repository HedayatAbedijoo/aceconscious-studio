/* Localized book shortcuts. The book owns navigation through native jump links. */
(() => {
  "use strict";
  const nav = document.querySelector("#book-actions");
  const stage = document.querySelector("#stage");
  const close = document.querySelector("#close");
  if (!nav || !stage || !close) return;
  const actions = [...nav.querySelectorAll(".book-action")];
  const suggestions = actions.filter(action => action.hasAttribute("data-jump"));
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const cuePeriod = 45000, cueDuration = 1800;
  let nextAction = 1, timer = 0, hideTimer = 0, pendingDestination = null, focusFrame = 0;
  const eligible = () => !nav.hidden && !document.hidden && !motion.matches
    && !stage.matches(".is-turning,.is-riffling,.is-back-cover")
    && stage.classList.contains("is-reading-quiet")
    && !document.activeElement?.matches("input,textarea,select")
    && !nav.matches(":hover") && !actions.some(action => action.matches(":focus-visible"));
  function clearCue() {
    clearTimeout(hideTimer);
    hideTimer = 0;
    actions.forEach(action => action.classList.remove("is-nudging"));
  }
  function schedule(delay = cuePeriod) {
    if (timer || hideTimer || !eligible()) return;
    timer = setTimeout(() => {
      timer = 0;
      if (!eligible()) return;
      const action = actions[nextAction];
      nextAction = (nextAction + 1) % actions.length;
      action.classList.add("is-nudging");
      // No automatic text bubbles: only a slight lift, shadow and edge light.
      hideTimer = setTimeout(() => { clearCue(); schedule(cuePeriod - cueDuration); }, cueDuration);
    }, delay);
  }
  function focusDestination() {
    focusFrame = 0;
    if (pendingDestination && !stage.matches(".is-turning,.is-riffling")
      && stage.dataset.section === pendingDestination) {
      const section = pendingDestination;
      const heading = stage.querySelector(section === "community"
        ? '.gift-page:not([aria-hidden="true"]) .gift-community-heading'
        : '.buy-page:not([aria-hidden="true"]) h2');
      // Instant turns update the book model before PageFlip paints the sheet.
      // Wait for its visible face before moving keyboard focus or scrolling.
      if (heading && heading.getClientRects().length && !heading.closest("[inert]")) {
        pendingDestination = null;
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
        if (section === "community") heading.closest(".page-body").scrollTop = heading.offsetTop - 12;
      } else if (heading) {
        focusFrame = requestAnimationFrame(focusDestination);
      }
    }
  }
  function sync() {
    nav.hidden = close.hidden;
    for (const action of suggestions) {
      if (action.dataset.jump === stage.dataset.section) action.setAttribute("aria-current", "location");
      else action.removeAttribute("aria-current");
    }
    if (pendingDestination && !focusFrame) focusFrame = requestAnimationFrame(focusDestination);
    if (!eligible()) pauseCue();
    else schedule();
  }
  function pauseCue() {
    clearTimeout(timer); timer = 0; clearCue();
  }
  for (const type of ["pointerenter", "pointerdown", "focusin"]) nav.addEventListener(type, pauseCue);
  nav.addEventListener("pointerleave", () => queueMicrotask(sync));
  nav.addEventListener("click", event => {
    const action = event.target.closest(".book-action");
    if (action) action.classList.add("hint-dismissed");
    pendingDestination = action?.dataset.jump || null;
    pauseCue();
  });
  for (const action of actions) {
    for (const type of ["pointerleave", "focusin"]) action.addEventListener(type, () => action.classList.remove("hint-dismissed"));
  }
  // Escape dismisses an open hint before the reader's Escape-to-cover handler.
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    const shown = actions.filter(action => getComputedStyle(action.querySelector(".book-action__hint")).visibility === "visible");
    if (!shown.length) return;
    shown.forEach(action => action.classList.add("hint-dismissed"));
    pauseCue();
    event.preventDefault(); event.stopImmediatePropagation();
  }, true);
  document.addEventListener("visibilitychange", sync);
  document.addEventListener("focusin", sync);
  document.addEventListener("focusout", () => queueMicrotask(sync));
  motion.addEventListener("change", sync);
  new MutationObserver(sync).observe(stage, { attributes: true, attributeFilter: ["class", "data-section"] });
  new MutationObserver(sync).observe(close, { attributes: true, attributeFilter: ["hidden"] });
  sync();
})();
