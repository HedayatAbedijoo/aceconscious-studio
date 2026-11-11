/* Shared language navigation; page text is translated at build time. */
(function () {
  "use strict";
  const root = document.documentElement;
  const lang = root.dataset.locale || "en";
  const menu = document.getElementById("lang-menu");
  const data = document.getElementById("locale-data");
  const strings = data ? JSON.parse(data.textContent) : {};
  const links = menu ? Array.from(menu.querySelectorAll("[data-set-lang]")) : [];
  const paths = new Map(links.map(link => [link.dataset.setLang, link.getAttribute("href")]));

  // Old ?lang= links still work. Root visits always open English, regardless of
  // browser language or a preference stored by an older version of the site.
  const params = new URLSearchParams(location.search);
  const legacy = params.get("lang");
  if (legacy && paths.has(legacy)) {
    params.delete("lang");
    const search = params.toString();
    location.replace(paths.get(legacy) + (search ? "?" + search : "") + location.hash);
    return;
  }

  function updateLinks() {
    const query = new URLSearchParams(location.search);
    query.delete("lang");
    const search = query.toString();
    links.forEach(link => {
      link.href = paths.get(link.dataset.setLang) + (search ? "?" + search : "") + location.hash;
    });
  }
  updateLinks();
  window.addEventListener("hashchange", updateLinks);

  if (menu) {
    const summary = menu.querySelector("summary");
    document.addEventListener("click", event => {
      if (menu.open && !menu.contains(event.target)) menu.open = false;
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && menu.open) {
        event.preventDefault();
        menu.open = false;
        summary.focus();
      }
    });
    menu.addEventListener("focusout", event => {
      if (event.relatedTarget && !menu.contains(event.relatedTarget)) menu.open = false;
    });
    // Details/summary also works with touch, Enter/Space and without JavaScript.
    summary.addEventListener("keydown", event => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      event.stopPropagation();
      menu.open = true;
      (event.key === "ArrowDown" ? links[0] : links[links.length - 1]).focus();
    });
    menu.addEventListener("keydown", event => {
      const index = links.indexOf(document.activeElement);
      if (index < 0) return;
      let next;
      if (event.key === "ArrowDown") next = (index + 1) % links.length;
      if (event.key === "ArrowUp") next = (index + links.length - 1) % links.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = links.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        links[next].focus();
      }
    });
  }

  window.aceI18n = {
    getLang: () => lang,
    getString: key => strings[key] || "",
    applyLanguage: next => {
      if (paths.has(next)) location.assign(paths.get(next) + location.search + location.hash);
    },
  };
})();
