(function () {
  "use strict";

  document.querySelectorAll("[data-book-reader]").forEach((reader) => {
    const pages = Array.from(reader.querySelectorAll(".book-reader__page"));
    const prevBtn = reader.querySelector("[data-reader-prev]");
    const nextBtn = reader.querySelector("[data-reader-next]");
    const counterEl = reader.querySelector("[data-reader-counter]");

    if (!pages.length || !prevBtn || !nextBtn || !counterEl) return;

    let current = 0;

    function formatCounter(pageIndex) {
      const template = reader.dataset.counterTemplate || "{current} / {total}";
      return template
        .replace("{current}", String(pageIndex + 1))
        .replace("{total}", String(pages.length));
    }

    function showPage(index) {
      current = Math.max(0, Math.min(index, pages.length - 1));

      pages.forEach((page, i) => {
        const active = i === current;
        page.classList.toggle("is-active", active);
        page.setAttribute("aria-hidden", String(!active));
      });

      prevBtn.disabled = current === 0;
      nextBtn.disabled = current === pages.length - 1;
      counterEl.textContent = formatCounter(current);
      reader.setAttribute("data-current-page", String(current + 1));
    }

    prevBtn.addEventListener("click", () => showPage(current - 1));
    nextBtn.addEventListener("click", () => showPage(current + 1));

    reader.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPage(current - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showPage(current + 1);
      }
    });

    showPage(0);
  });
})();
