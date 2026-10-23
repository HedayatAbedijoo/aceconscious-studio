/* Format support follows Amazon's marketplace distribution lists, not live stock:
 * https://kdp.amazon.com/en_US/help/topic/G200652410 (Kindle)
 * https://kdp.amazon.com/en_US/help/topic/G201834280 (paperback)
 * Product URLs are rendered for the page's book language (Persian only on fa).
 * Changing marketplace changes the host, never the edition's product identifier.
 */
(() => {
  "use strict";
  const section = document.querySelector(".buy--marketplaces");
  if (!section) return;
  const select = section.querySelector("#amazon-marketplace");
  const status = section.querySelector(".purchase-status");
  const editions = Array.from(section.querySelectorAll("[data-edition]"), card => ({
    card,
    edition: card.dataset.edition,
    url: new URL(card.href),
    label: card.querySelector(".purchase-card__store").textContent.trim(),
    format: card.querySelector(".purchase-card__format"),
    formatLabel: card.querySelector(".purchase-card__format").textContent.trim(),
  }));

  function update(announce = false) {
    const option = select.selectedOptions[0];
    if (!option?.dataset.host) return;
    const available = new Set(option.dataset.editions.split(" "));
    editions.forEach(({ card, edition, url, label, format, formatLabel }) => {
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
      card.setAttribute("aria-label", `${label} — ${option.textContent.trim()}${available.has(edition) ? "" : ` — ${select.dataset.unavailable}`}`);
    });
    if (announce) {
      status.textContent = `${option.textContent.trim()}. ${editions.map(({ edition, label }) => `${label}: ${available.has(edition) ? section.dataset.available : select.dataset.unavailable}`).join(". ")}.`;
    }
  }

  update();
  section.querySelector(".purchase-marketplace").hidden = false;
  select.addEventListener("change", () => update(true));
  window.addEventListener("pageshow", () => update());
})();
