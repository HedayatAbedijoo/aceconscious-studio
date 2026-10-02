/* Industry pages (/rights/, /screen/): "On this page" navigation and contact category presets. */
(function () {
  "use strict";

  const compact = window.matchMedia("(max-width: 1023px)");

  // ── On this page ──
  const wrap = document.querySelector(".ind-toc-wrap");
  const toc = document.getElementById("ind-toc");
  const toggle = document.getElementById("ind-toc-toggle");
  const currentLabel = document.getElementById("ind-toc-current");
  const header = document.querySelector(".site-nav");
  const bar = document.querySelector(".ind-tocbar");
  const links = toc ? Array.from(toc.querySelectorAll('ol a[href^="#"]')) : [];
  const targets = links.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean);
  let activeId = null;
  let ticking = false;

  function isOpen() {
    return Boolean(toc && toc.classList.contains("is-open"));
  }

  function setOpen(open, restoreFocus) {
    if (!toc || !toggle) return;
    toc.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    if (!open && restoreFocus) toggle.focus({ preventScroll: true });
  }

  if (toggle) {
    toggle.addEventListener("click", () => {
      // If the bar has not reached its sticky position yet, bring it up first so the
      // list opens on screen rather than below the fold.
      if (!isOpen() && wrap) {
        const headerHeight = header ? header.getBoundingClientRect().height : 72;
        const offset = wrap.getBoundingClientRect().top - headerHeight;
        if (offset > 1) window.scrollBy({ top: offset, behavior: "instant" });
      }
      setOpen(!isOpen(), false);
      if (isOpen() && links[0]) {
        const current = toc.querySelector('[aria-current="location"]') || links[0];
        current.focus({ preventScroll: true });
      }
    });
  }

  document.addEventListener("click", (event) => {
    if (isOpen() && wrap && !wrap.contains(event.target)) setOpen(false, false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen()) {
      event.preventDefault();
      setOpen(false, true);
    }
  });

  if (toc) {
    toc.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false, false);
    });
  }

  function onBreakpoint() {
    setOpen(false, false);
    scheduleActive();
  }
  if (compact.addEventListener) compact.addEventListener("change", onBreakpoint);
  else compact.addListener(onBreakpoint);

  function updateActive() {
    ticking = false;
    if (!targets.length) return;
    const offset =
      (header ? header.getBoundingClientRect().height : 72) +
      (compact.matches && bar ? bar.getBoundingClientRect().height : 0) + 40;
    let active = targets[0];
    for (const target of targets) {
      if (target.getBoundingClientRect().top <= offset) active = target;
      else break;
    }
    // At the very bottom the last section may never reach the offset line.
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      active = targets[targets.length - 1];
    }
    if (active.id === activeId) return;
    activeId = active.id;
    links.forEach((link) => {
      if (link.hash.slice(1) === activeId) {
        link.setAttribute("aria-current", "location");
        if (currentLabel) currentLabel.textContent = link.textContent.trim();
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function scheduleActive() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateActive);
    }
  }

  window.addEventListener("scroll", scheduleActive, { passive: true });
  window.addEventListener("resize", scheduleActive);
  scheduleActive();

  // ── Contact category presets ("Request a review copy", "Request screen materials") ──
  const category = document.getElementById("contact-category");
  document.querySelectorAll("a[data-category]").forEach((link) => {
    link.addEventListener("click", () => {
      if (!category) return;
      const value = link.getAttribute("data-category");
      if (!Array.from(category.options).some((option) => option.value === value)) return;
      category.value = value;
      category.classList.add("is-preset");
      window.setTimeout(() => category.classList.remove("is-preset"), 2400);
    });
  });
})();
