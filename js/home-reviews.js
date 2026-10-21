(function () {
  "use strict";

  const region = document.querySelector(".reviews--compact");
  if (!region) return;
  const slides = Array.from(region.querySelectorAll("[data-review-id]"));
  const controls = region.querySelector(".reviews__controls");
  if (!controls) return;
  const previous = controls.querySelector("[data-review-prev]");
  const next = controls.querySelector("[data-review-next]");
  const counter = region.querySelector(".reviews__counter");
  const status = region.querySelector(".reviews__status");
  const track = region.querySelector(".reviews__slides");
  if (!slides.length || !previous || !next || !counter || !status || !track) return;

  let current = 0;
  let gesture = null;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const rtl = () => document.documentElement.dir === "rtl";
  const string = (key, fallback) => window.aceI18n?.getString(key) || fallback;

  function show(index, animate = true) {
    const next = (index + slides.length) % slides.length;
    if (next !== current && slides[current].contains(document.activeElement)) {
      region.focus({ preventScroll: true });
    }
    current = next;
    slides.forEach((slide, i) => {
      slide.getAnimations?.().forEach(animation => animation.cancel());
      slide.hidden = i !== current;
      slide.inert = i !== current;
      slide.setAttribute("aria-hidden", String(i !== current));
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-roledescription", string("reviews.slide", "review"));
    });
    const position = string("reviews.position", "{current} of {total}")
      .replace("{current}", current + 1).replace("{total}", slides.length);
    counter.textContent = position;
    status.textContent = string("reviews.announcement", "Review {position}")
      .replace("{position}", position);
    if (animate && !reducedMotion.matches && typeof slides[current].animate === "function") {
      slides[current].animate([{ opacity: .35 }, { opacity: 1 }], {
        duration: 180, easing: "ease-out",
      });
    }
  }

  controls.hidden = slides.length < 2;
  previous.disabled = next.disabled = slides.length < 2;
  region.classList.add("is-enhanced");
  region.setAttribute("tabindex", "-1");
  region.setAttribute("aria-roledescription", string("reviews.carousel", "carousel"));
  previous.addEventListener("click", () => show(current - 1));
  next.addEventListener("click", () => show(current + 1));
  region.addEventListener("keydown", event => {
    // Shortcuts belong to the carousel controls, not the article link or text.
    if (!controls.contains(event.target) ||
        event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    let next;
    if (event.key === "ArrowRight") next = current + (rtl() ? -1 : 1);
    if (event.key === "ArrowLeft") next = current + (rtl() ? 1 : -1);
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = slides.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    show(next);
  });
  track.addEventListener("pointerdown", event => {
    gesture = null;
    if (!event.isPrimary || event.pointerType !== "touch" ||
        event.target.closest("a, button, input, select, textarea") ||
        window.getSelection()?.toString()) return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }, { passive: true });
  track.addEventListener("pointermove", event => {
    if (gesture?.id === event.pointerId && Math.abs(event.clientY - gesture.y) > 35) gesture = null;
  }, { passive: true });
  track.addEventListener("pointercancel", () => { gesture = null; });
  track.addEventListener("pointerup", event => {
    const start = gesture;
    gesture = null;
    if (!start || start.id !== event.pointerId || window.getSelection()?.toString()) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    show(current + ((dx < 0) !== rtl() ? 1 : -1));
  }, { passive: true });
  show(0, false);
})();
