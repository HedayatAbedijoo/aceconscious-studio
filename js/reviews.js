(function () {
  "use strict";

  // Articles are the content source. Without this enhancement they all stay readable.
  document.querySelectorAll(".reviews").forEach((region) => {
    const slides = Array.from(region.querySelectorAll("[data-review-id]"));
    const controls = region.querySelector(".reviews__controls");
    const counter = region.querySelector(".reviews__counter");
    const status = region.querySelector(".reviews__status");
    const track = region.querySelector(".reviews__slides");
    const previous = controls?.querySelector("[data-review-prev]");
    const next = controls?.querySelector("[data-review-next]");
    if (!slides.length || !controls || !counter || !status || !track || !previous || !next) return;

    let current = 0;
    let gesture = null;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const rtl = () => document.documentElement.dir === "rtl";
    const string = (key, fallback) => window.aceI18n?.getString(key) || fallback;
    const position = () => string("reviews.position", "{current} of {total}")
      .replace("{current}", current + 1).replace("{total}", slides.length);

    function updateLabels() {
      counter.textContent = position();
      status.textContent = string("reviews.announcement", "Review {position}").replace("{position}", position());
      if (slides.length > 1) {
        region.setAttribute("aria-roledescription", string("reviews.carousel", "carousel"));
        slides.forEach((slide) => {
          slide.setAttribute("aria-roledescription", string("reviews.slide", "review"));
        });
      }
    }

    function show(index, animate = true) {
      const next = (index + slides.length) % slides.length;
      if (next !== current && slides[current].contains(document.activeElement)) {
        region.focus({ preventScroll: true });
      }
      current = next;
      slides.forEach((slide, i) => {
        slide.hidden = i !== current;
        slide.inert = i !== current;
        slide.setAttribute("aria-hidden", String(i !== current));
      });
      updateLabels();
      if (animate && !reducedMotion.matches && typeof slides[current].animate === "function") {
        slides[current].getAnimations().forEach((animation) => animation.cancel());
        slides[current].animate([{ opacity: .35 }, { opacity: 1 }], { duration: 180, easing: "ease-out" });
      }
    }

    controls.hidden = false;
    previous.disabled = next.disabled = slides.length === 1;
    updateLabels();

    if (slides.length > 1) {
      region.classList.add("is-enhanced");
      region.setAttribute("tabindex", "-1");
      slides.forEach((slide) => slide.setAttribute("role", "group"));
      previous.addEventListener("click", () => show(current - 1));
      next.addEventListener("click", () => show(current + 1));
      region.addEventListener("keydown", (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
            event.target.closest("input, textarea, select, [contenteditable='true']")) return;
        let next;
        if (event.key === "ArrowRight") next = current + (rtl() ? -1 : 1);
        if (event.key === "ArrowLeft") next = current + (rtl() ? 1 : -1);
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = slides.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        show(next);
      });
      track.addEventListener("pointerdown", (event) => {
        gesture = null;
        if (!event.isPrimary || event.pointerType !== "touch" ||
            event.target.closest("a, button, input, select, textarea") || window.getSelection()?.toString()) return;
        gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
      }, { passive: true });
      track.addEventListener("pointermove", (event) => {
        if (gesture?.id === event.pointerId && Math.abs(event.clientY - gesture.y) > 35) gesture = null;
      }, { passive: true });
      track.addEventListener("pointercancel", () => { gesture = null; });
      track.addEventListener("pointerup", (event) => {
        const start = gesture;
        gesture = null;
        if (!start || start.id !== event.pointerId || window.getSelection()?.toString()) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        show(current + ((dx < 0) !== rtl() ? 1 : -1));
      }, { passive: true });
      show(0, false);
    }
    document.addEventListener("languagechange", updateLabels);
  });
})();
