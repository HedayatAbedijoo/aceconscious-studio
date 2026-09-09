(function () {
  "use strict";
  // Keep the original site's navigation inside the local comparison routes.
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const language = link.dataset.setLang;
    if (language) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (window.parent !== window) {
        parent.postMessage({ type: "review-preview-language", language }, location.origin);
      } else {
        const filename = location.pathname.split("/").pop() || "index.html";
        location.assign(`/previews/reviews/view/${language}/${filename}${location.search}${location.hash}`);
      }
      return;
    }
    const target = new URL(link.href);
    if (target.origin === location.origin && target.hash) {
      const section = document.getElementById(target.hash.slice(1));
      if (section) {
        event.preventDefault();
        history.replaceState(null, "", location.pathname + location.search + target.hash);
        section.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      }
    }
  }, true);

  // Translations and webfonts can change the height of the preceding page content.
  document.fonts.ready.then(() => {
    if (location.hash === "#reviews") document.getElementById("reviews").scrollIntoView({ behavior: "instant" });
  });
})();
