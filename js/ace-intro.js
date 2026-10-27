/* Four user-controlled steps; all reading content is visible without this script. */
(() => {
  "use strict";
  const section = document.getElementById("ace-introduction");
  if (!section) return;
  const steps = [...section.querySelectorAll("[data-ace-step]")];
  const headings = steps.map(step => step.querySelector("h2"));
  const toolbar = section.querySelector(".ace-introduction__toolbar");
  const previous = section.querySelector("[data-ace-prev]");
  const next = section.querySelector("[data-ace-next]");
  const status = section.querySelector("#ace-intro-status");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const segmenter = typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter(document.documentElement.lang, { granularity: "grapheme" }) : null;
  const readers = new Map();
  let finishTyping = () => {};
  let current = 0;

  function type(panel) {
    const { body, source, skip } = readers.get(panel);
    const visual = source.cloneNode(true);
    visual.classList.add("ace-intro-copy--visual");
    visual.setAttribute("aria-hidden", "true");
    visual.querySelectorAll("[data-i18n]").forEach(element => element.removeAttribute("data-i18n"));
    const walker = document.createTreeWalker(visual, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      const text = walker.currentNode.data;
      nodes.push({ node: walker.currentNode, characters: segmenter
        ? [...segmenter.segment(text)].map(item => item.segment) : Array.from(text) });
    }
    const total = nodes.reduce((sum, item) => sum + item.characters.length, 0);
    nodes.forEach(item => { item.node.data = ""; });
    const cursor = document.createElement("span");
    cursor.className = "ace-intro-cursor";
    source.classList.add("ace-intro-copy--typing");
    panel.classList.add("is-typing");
    skip.hidden = false;
    body.append(visual);
    let frame;
    let start;
    finishTyping = () => {
      cancelAnimationFrame(frame);
      visual.remove();
      source.classList.remove("ace-intro-copy--typing");
      panel.classList.remove("is-typing");
      if (document.activeElement === skip) panel.focus({ preventScroll: true });
      skip.hidden = true;
      finishTyping = () => {};
    };
    function tick(time) {
      start ??= time;
      let remaining = Math.floor(total * Math.min(1, (time - start) / 1400));
      let active;
      for (const item of nodes) {
        const length = Math.min(item.characters.length, remaining);
        item.node.data = item.characters.slice(0, length).join("");
        remaining -= length;
        if (length) active = item.node;
      }
      if (active) active.parentNode.insertBefore(cursor, active.nextSibling);
      if (time - start >= 1400) finishTyping();
      else frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
  }

  function selectTab(group, selected, animate = true) {
    finishTyping();
    group.querySelectorAll("[data-intro-tab]").forEach(tab => {
      const active = tab === selected;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute("aria-controls")).hidden = !active;
    });
    if (animate && !reduced.matches) type(document.getElementById(selected.getAttribute("aria-controls")));
  }

  section.querySelectorAll("[data-intro-group]").forEach(group => {
    const tabs = [...group.querySelectorAll("[data-intro-tab]")];
    tabs.forEach(tab => {
      tab.setAttribute("role", "tab");
      const panel = document.getElementById(tab.getAttribute("aria-controls"));
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tab.id);
      panel.tabIndex = 0;
      const body = document.createElement("div");
      body.className = "ace-intro-panel-body";
      const source = document.createElement("div");
      source.className = "ace-intro-copy";
      source.append(...panel.querySelectorAll(".ace-intro-definition"));
      body.append(source);
      panel.append(body);
      const control = document.createElement("div");
      control.className = "ace-intro-card-control";
      const mark = panel.querySelector(".ace-intro-mark");
      mark.before(control);
      control.append(mark);
      const skip = document.createElement("button");
      skip.type = "button";
      skip.className = "ace-intro-skip";
      skip.title = window.aceI18n.getString("voices.showFull");
      skip.setAttribute("aria-label", skip.title);
      skip.innerHTML = '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="m5 6 6 6-6 6m7-12 6 6-6 6M20 5v14"/></svg>';
      skip.hidden = true;
      skip.addEventListener("click", () => finishTyping());
      body.addEventListener("click", () => finishTyping());
      control.append(skip);
      readers.set(panel, { body, source, skip });
      tab.addEventListener("click", () => selectTab(group, tab));
      tab.addEventListener("keydown", event => {
        if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        event.stopPropagation();
        let index = tabs.indexOf(tab);
        if (event.key === "Home") index = 0;
        else if (event.key === "End") index = tabs.length - 1;
        else index = (index + (event.key === "ArrowDown" ? 1 : -1) + tabs.length) % tabs.length;
        selectTab(group, tabs[index]);
        tabs[index].focus({ preventScroll: true });
      });
    });
    selectTab(group, tabs[0], false);
    group.querySelector('[role="tablist"]').hidden = false;
  });

  function showStep(index, keepControlsVisible = false) {
    finishTyping();
    // Use the same heading / rule / counter / arrow row as Reviews. Move the
    // original heading, keeping its ID and a readable no-script source layout.
    steps[current].querySelector(".ace-intro-heading").prepend(headings[current]);
    current = Math.max(0, Math.min(steps.length - 1, index));
    toolbar.prepend(headings[current]);
    steps.forEach((step, i) => { step.hidden = i !== current; });
    status.textContent = steps[current].querySelector(".ace-intro-step-progress").textContent;
    previous.disabled = current === 0;
    next.disabled = current === steps.length - 1;
    // Keep keyboard focus usable when the activated endpoint control disables.
    if (document.activeElement === previous && previous.disabled) next.focus({ preventScroll: true });
    if (document.activeElement === next && next.disabled) previous.focus({ preventScroll: true });
    if (keepControlsVisible) requestAnimationFrame(() => {
      const bounds = toolbar.getBoundingClientRect();
      const inset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 88;
      if (bounds.top < inset || bounds.bottom > innerHeight - 16) {
        toolbar.scrollIntoView({ block: "start", behavior: "instant" });
      }
    });
  }
  previous.addEventListener("click", () => showStep(current - 1, true));
  next.addEventListener("click", () => showStep(current + 1, true));
  section.classList.add("is-enhanced");
  showStep(0);
  section.querySelector(".ace-introduction__toolbar").hidden = false;
  reduced.addEventListener("change", () => { if (reduced.matches) finishTyping(); });

  document.querySelectorAll("[data-focus-form]").forEach(link => {
    link.addEventListener("click", event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const field = document.getElementById(link.dataset.focusForm);
      if (!field) return;
      event.preventDefault();
      location.hash = link.hash;
      document.querySelector(link.hash).scrollIntoView({ block: "start", behavior: "instant" });
      field.focus({ preventScroll: true });
      field.scrollIntoView({ block: "nearest", behavior: "instant" });
    });
  });
})();
