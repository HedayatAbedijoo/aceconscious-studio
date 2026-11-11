/* One set of links: keep priority items inline only while they fit on one row. */
(() => {
  "use strict";
  const header = document.querySelector(".site-nav--home");
  if (!header) return;
  const inner = header.querySelector(".site-nav__inner");
  const primary = header.querySelector(".home-nav__primary");
  const primaryList = primary.querySelector("ul");
  const overflow = header.querySelector(".home-nav__overflow");
  const overflowList = overflow.querySelector("ul");
  const toggle = header.querySelector(".nav-toggle");
  const logo = header.querySelector(".site-nav__logo");
  const actions = header.querySelector(".site-nav__actions");
  const priority = [...primaryList.children];
  const all = [...priority, ...overflowList.children].sort((a, b) => Number(a.dataset.navOrder) - Number(b.dataset.navOrder));
  const mobile = matchMedia("(max-width: 900px)");
  let inlineCount = -1;
  let frame = 0;

  function setOpen(open, returnFocus = false) {
    overflow.classList.toggle("open", open);
    overflow.inert = !open;
    overflow.setAttribute("aria-hidden", String(!open));
    toggle.setAttribute("aria-expanded", String(open));
    if (returnFocus) toggle.focus({ preventScroll: true });
  }

  function arrange() {
    frame = 0;
    // Visibility (rather than display:none) preserves intrinsic link widths in
    // the closed disclosure. This also responds to translated labels and fonts.
    const gap = parseFloat(getComputedStyle(primaryList).columnGap) || 0;
    const innerGap = parseFloat(getComputedStyle(inner).columnGap) || 0;
    const available = inner.clientWidth - logo.getBoundingClientRect().width
      - actions.getBoundingClientRect().width - 2 * innerGap;
    let count = 0;
    let used = 0;
    if (!mobile.matches) {
      for (const item of priority) {
        const width = item.querySelector("a").getBoundingClientRect().width;
        const required = width + (count ? gap : 0);
        if (used + required > available - 2) break;
        used += required;
        count++;
      }
    }
    if (count === inlineCount) return;
    const focused = document.activeElement;
    const visible = priority.slice(0, count);
    const tucked = all.filter(item => !visible.includes(item));
    visible.forEach(item => primaryList.append(item));
    tucked.forEach(item => overflowList.append(item));
    primary.hidden = count === 0;
    inlineCount = count;
    setOpen(false, all.some(item => item.contains(focused)));
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(arrange);
  }
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  toggle.addEventListener("keydown", event => {
    if (event.key !== "ArrowDown") return;
    event.preventDefault();
    setOpen(true);
    overflow.querySelector("a").focus();
  });
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape" || toggle.getAttribute("aria-expanded") !== "true") return;
    event.preventDefault();
    setOpen(false, true);
  });
  document.addEventListener("click", event => {
    if (!overflow.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
  });
  header.addEventListener("focusout", event => {
    if (event.relatedTarget && !header.contains(event.relatedTarget)) setOpen(false);
  });
  all.forEach(item => item.querySelector("a").addEventListener("click", () => {
    setOpen(false, overflow.contains(item));
  }));
  const observer = new ResizeObserver(schedule);
  [inner, logo, actions].forEach(element => observer.observe(element));
  mobile.addEventListener("change", schedule);
  document.fonts.ready.then(schedule);
  document.fonts.addEventListener("loadingdone", schedule);
  setOpen(false);
  arrange();
})();
