(function () {
  "use strict";
  const params = new URLSearchParams(location.search);
  let layout = params.get("layout") === "masthead" ? "masthead" : "split";
  let language = ["en", "de", "fa"].includes(params.get("language")) ? params.get("language") : "en";
  const frame = document.getElementById("preview-frame");
  const width = document.getElementById("preview-width");
  const content = document.getElementById("preview-content");
  if (["320", "390", "768"].includes(params.get("width"))) width.value = params.get("width");
  if (params.get("examples") === "1") content.value = "examples";

  function update(reload = true) {
    document.querySelectorAll("[data-layout]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.layout === layout)));
    document.querySelectorAll("[data-language]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.language === language)));
    const search = new URLSearchParams({ layout, language, width: width.value });
    if (content.value === "examples") search.set("examples", "1");
    history.replaceState(null, "", "?" + search);
    const name = (layout === "split" ? "index" : "masthead") + (content.value === "examples" ? "-examples" : "");
    const src = `/previews/reviews/view/${language}/${name}.html?${search}#reviews`;
    frame.style.width = width.value === "window" ? "100%" : width.value + "px";
    frame.title = `ACE.await review design ${layout === "split" ? "A" : "B"}, ${language}`;
    if (reload && frame.getAttribute("src") !== src) frame.src = src;
    document.getElementById("open-preview").href = src;
    document.getElementById("preview-description").textContent = layout === "split"
      ? "A · Quotes beside a compact score card."
      : "B · A score ribbon above centered quotes.";
  }
  document.querySelectorAll("[data-layout]").forEach((button) => button.addEventListener("click", () => { layout = button.dataset.layout; update(); }));
  document.querySelectorAll("[data-language]").forEach((button) => button.addEventListener("click", () => { language = button.dataset.language; update(); }));
  width.addEventListener("change", () => update(false));
  content.addEventListener("change", () => update());
  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
    if (event.data?.type === "review-preview-language" && ["en", "de", "fa"].includes(event.data.language)) {
      language = event.data.language;
      update();
    }
  });
  update();
})();
