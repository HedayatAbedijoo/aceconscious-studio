(function () {
  "use strict";

  const section = document.querySelector(".buy--redesign");
  if (!section) return;
  const select = section.querySelector("#amazon-marketplace");
  const fallback = section.querySelector("[data-marketplace-default]");
  const control = section.querySelector("[data-marketplace-control]");
  const identity = section.querySelector("[data-marketplace-identity]");
  const domain = section.querySelector("[data-marketplace-domain]");
  const links = Array.from(section.querySelectorAll("[data-amazon-edition]"));
  if (!select || !fallback || !control || !identity || !domain || !links.length) return;
  const editions = links.map(link => ({
    link,
    url: new URL(link.href),
    label: link.querySelector("[data-amazon-action]"),
    defaultLabel: link.querySelector("[data-amazon-action]").textContent,
    labelledBy: link.getAttribute("aria-labelledby"),
    icon: link.querySelector('[aria-hidden="true"]'),
    newTab: link.querySelector(".edition-sr-only"),
  }));

  function updateMarketplace() {
    const option = select.selectedOptions[0];
    if (!option?.dataset.amazonHost) return;
    // Mirror the native selection so the full label can wrap on small screens.
    const [country, marketplace] = option.textContent.split(" · ");
    identity.textContent = country;
    domain.textContent = `· ${marketplace}`;
    const supported = new Set((option.dataset.amazonEditions || "").split(" "));
    editions.forEach(({ link, url, label, defaultLabel, labelledBy, icon, newTab }) => {
      const available = supported.has(link.dataset.amazonEdition);
      if (available) {
        const destination = new URL(url);
        destination.hostname = option.dataset.amazonHost;
        link.href = destination.href;
        link.removeAttribute("aria-disabled");
        link.removeAttribute("role");
        link.removeAttribute("tabindex");
        link.setAttribute("aria-labelledby", labelledBy);
      } else {
        // Never route an unsupported edition to another country's storefront.
        link.removeAttribute("href");
        link.setAttribute("aria-disabled", "true");
        link.setAttribute("role", "link");
        link.setAttribute("tabindex", "-1");
        link.setAttribute("aria-labelledby", labelledBy.split(" ").filter(id => id !== newTab.id).join(" "));
      }
      label.textContent = available ? defaultLabel : link.dataset.unavailableLabel;
      icon.hidden = !available;
      newTab.hidden = !available;
    });
  }

  select.value = "us";
  updateMarketplace();
  control.hidden = false;
  fallback.hidden = true;
  select.addEventListener("change", updateMarketplace);
  window.addEventListener("pageshow", updateMarketplace);
})();
