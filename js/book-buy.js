/* Amazon marketplace selector for the book's Buy pages.
 *
 * Each edition keeps its own identifier (Kindle ASIN, paperback ISBN/ASIN) and
 * only the Amazon host changes, exactly as on the website's Buy section. A
 * marketplace that does not list an edition never links to another country's
 * storefront, and choosing a country never changes the language of the site.
 */
(function () {
  "use strict";

  const select = document.getElementById("amazon-marketplace");
  if (!select) return;
  const cards = Array.from(document.querySelectorAll(".store-card[data-edition]"));
  if (!cards.length) return;

  const editions = cards.map(card => ({
    card,
    edition: card.dataset.edition,
    url: new URL(card.href),
    format: card.querySelector(".store-card__format"),
    formatLabel: card.querySelector(".store-card__format").textContent,
  }));

  function update() {
    const option = select.selectedOptions[0];
    if (!option || !option.dataset.host) return;
    const available = new Set((option.dataset.editions || "").split(" "));
    editions.forEach(({ card, edition, url, format, formatLabel }) => {
      if (available.has(edition)) {
        const destination = new URL(url);
        destination.hostname = option.dataset.host;
        card.href = destination.href;
        card.removeAttribute("aria-disabled");
        card.removeAttribute("tabindex");
        format.textContent = formatLabel;
      } else {
        card.removeAttribute("href");
        card.setAttribute("aria-disabled", "true");
        card.setAttribute("tabindex", "-1");
        format.textContent = select.dataset.unavailable;
      }
    });
  }

  update();
  select.addEventListener("change", update);
  window.addEventListener("pageshow", update);
})();
