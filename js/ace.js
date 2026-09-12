/* Standalone ACE pages: contents, language links and collapsed passages. */
(function () {
  "use strict";
  // Keep the same section when switching between standalone translations.
  const languageLinks = Array.from(document.querySelectorAll(".ace-languages a"), link => ({
    link,
    path: link.getAttribute("href")
  }));
  function updateLanguageLinks() {
    languageLinks.forEach(({ link, path }) => link.setAttribute("href", path + location.hash));
  }
  updateLanguageLinks();
  window.addEventListener("hashchange", updateLanguageLinks);
  const toc = document.getElementById("ace-toc");
  if (!toc) return;
  const links = Array.from(toc.querySelectorAll('ol a[href^="#"]'));
  const currentLabel = document.getElementById("ace-tocbar-current");
  const openBtn = document.getElementById("ace-toc-open");
  const closeBtn = document.getElementById("ace-toc-close");
  const backdrop = document.getElementById("ace-toc-backdrop");
  const mobile = window.matchMedia("(max-width: 1023px)");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const background = Array.from(document.querySelectorAll(".ace-nav, .ace-hero, .ace-article, .ace-tocbar, .site-footer, .skip-link"));
  const originalInert = new Map();
  let lastFocus = null;
  let previousOverflow = "";
  let activeId = null;
  let ticking = false;

  function hashTarget(hash) {
    try { return document.getElementById(decodeURIComponent(hash.slice(1))); }
    catch (_) { return null; }
  }
  const targets = links.map(a => hashTarget(a.hash)).filter(Boolean);

  function updateActive() {
    ticking = false;
    const nav = document.querySelector(".ace-nav");
    const bar = document.querySelector(".ace-tocbar");
    const offset = (nav ? nav.getBoundingClientRect().height : 76) +
      (mobile.matches && bar ? bar.getBoundingClientRect().height : 0) + 28;
    let active = targets[0];
    for (const target of targets) {
      if (target.getBoundingClientRect().top <= offset) active = target;
      else break;
    }
    if (!active || active.id === activeId) return;
    activeId = active.id;
    for (const link of links) {
      if (hashTarget(link.hash) === active) {
        link.setAttribute("aria-current", "location");
        if (currentLabel) currentLabel.textContent = link.textContent.trim();
        // Scroll only the contents pane, never the document being read.
        if (!mobile.matches) {
          const row = link.getBoundingClientRect();
          const pane = toc.getBoundingClientRect();
          if (row.top < pane.top + 12) toc.scrollTop += row.top - pane.top - 12;
          else if (row.bottom > pane.bottom - 12) toc.scrollTop += row.bottom - pane.bottom + 12;
        }
      } else link.removeAttribute("aria-current");
    }
  }
  function scheduleActive() {
    if (!ticking) { ticking = true; requestAnimationFrame(updateActive); }
  }
  const isOpen = () => toc.classList.contains("is-open");

  function openDrawer() {
    if (!mobile.matches || isOpen()) return;
    lastFocus = document.activeElement;
    previousOverflow = document.body.style.overflow;
    toc.inert = false;
    toc.removeAttribute("aria-hidden");
    toc.setAttribute("role", "dialog");
    toc.setAttribute("aria-modal", "true");
    toc.setAttribute("aria-labelledby", "ace-toc-title");
    toc.classList.add("is-open");
    if (backdrop) backdrop.classList.add("is-open");
    if (openBtn) openBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    (closeBtn || links[0]).focus();
    background.forEach(el => { originalInert.set(el, el.inert); el.inert = true; });
  }
  function closeDrawer(restoreFocus = true) {
    if (!isOpen()) return;
    background.forEach(el => { el.inert = originalInert.get(el) || false; });
    originalInert.clear();
    document.body.style.overflow = previousOverflow;
    if (restoreFocus && lastFocus && lastFocus.isConnected) lastFocus.focus({ preventScroll: true });
    toc.classList.remove("is-open");
    if (backdrop) backdrop.classList.remove("is-open");
    if (openBtn) openBtn.setAttribute("aria-expanded", "false");
    toc.removeAttribute("role");
    toc.removeAttribute("aria-modal");
    toc.removeAttribute("aria-labelledby");
    toc.inert = mobile.matches;
    if (mobile.matches) toc.setAttribute("aria-hidden", "true");
    else toc.removeAttribute("aria-hidden");
  }
  function syncLayout() {
    closeDrawer();
    toc.inert = mobile.matches;
    if (mobile.matches) toc.setAttribute("aria-hidden", "true");
    else toc.removeAttribute("aria-hidden");
    scheduleActive();
  }
  if (openBtn) openBtn.addEventListener("click", openDrawer);
  if (closeBtn) closeBtn.addEventListener("click", () => closeDrawer());
  if (backdrop) backdrop.addEventListener("click", () => closeDrawer());
  document.addEventListener("keydown", event => {
    if (!isOpen()) return;
    if (event.key === "Escape") { event.preventDefault(); closeDrawer(); }
    if (event.key === "Tab") {
      const items = Array.from(toc.querySelectorAll('a[href],button:not([disabled])'));
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !toc.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !toc.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    }
  });
  function reveal(target) {
    let node = target;
    while (node && node !== document.body) {
      if (node.tagName === "DETAILS") node.open = true;
      node = node.parentElement;
    }
  }
  function navigate(target, focus = false, smooth = false) {
    reveal(target);
    if (isOpen()) closeDrawer(false);
    if (focus) {
      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
        target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
      }
      target.focus({ preventScroll: true });
    }
    requestAnimationFrame(() => {
      target.scrollIntoView({ block: "start", behavior: smooth && !motion.matches ? "smooth" : "instant" });
      scheduleActive();
    });
  }
  document.addEventListener("click", event => {
    const a = event.target.closest('a[href^="#"]');
    if (!a || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = hashTarget(a.hash);
    if (!target) return;
    event.preventDefault();
    if (location.hash !== a.hash) history.pushState(null, "", a.hash);
    // pushState does not fire hashchange; refresh links for ordinary section clicks too.
    updateLanguageLinks();
    navigate(target, true, true);
  });
  function onHashChange() { const target = hashTarget(location.hash); if (target) navigate(target); }
  window.addEventListener("hashchange", onHashChange);
  window.addEventListener("scroll", scheduleActive, { passive: true });
  window.addEventListener("resize", scheduleActive);
  document.addEventListener("toggle", scheduleActive, true);
  if (mobile.addEventListener) mobile.addEventListener("change", syncLayout);
  else mobile.addListener(syncLayout);
  const header = document.querySelector(".ace-nav");
  if (header && typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      document.body.style.setProperty("--ace-header-height", header.getBoundingClientRect().height + "px");
      scheduleActive();
    }).observe(header);
  }
  syncLayout();
  if (location.hash) {
    const target = hashTarget(location.hash);
    if (target) reveal(target);
    if (document.readyState === "complete") onHashChange();
    else window.addEventListener("load", onHashChange, { once: true });
  }
})();
