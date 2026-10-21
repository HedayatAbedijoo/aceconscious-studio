(function () {
  "use strict";

  const section = document.querySelector(".characters--redesign");
  if (!section) return;
  const cards = Array.from(section.querySelectorAll(".voice-card"));

  cards.forEach(card => {
    const summary = card.querySelector("summary");
    summary.addEventListener("click", () => {
      if (card.open || !cards.some(other => other !== card && other.open)) return;
      const before = summary.getBoundingClientRect().top;
      // Let the native disclosure close its sibling, then retain the reader's
      // position. This also covers Enter/Space activation without moving focus.
      requestAnimationFrame(() => {
        if (!card.open) return;
        const navBottom = document.querySelector(".site-nav")?.getBoundingClientRect().bottom || 0;
        const target = Math.min(Math.max(before, navBottom + 16), innerHeight - 44);
        const shift = summary.getBoundingClientRect().top - target;
        if (Math.abs(shift) > 1) window.scrollBy({ top: shift, behavior: "instant" });
      });
    });
  });
})();
