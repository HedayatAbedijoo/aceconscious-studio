/* ACE.await — each locale reads as a book.
 *
 * The page ships every section as ordinary HTML inside #book-source so the
 * content works without scripting and stays readable for crawlers. This script
 * reflows that markup into paper sheets, hands them to StPageFlip, and keeps
 * the real forms (contact, reader circle) alive by moving their nodes rather
 * than copying them. Every localized home page loads it.
 */
(function () {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const stage = $("#stage");
  const shell = $("#shell");
  const tabs = $("#bookmarks");
  const menuToggle = $("#book-menu-toggle");
  const menuDismiss = $("#book-menu-dismiss");
  const source = $("#book-source");
  if (!stage || !shell || !tabs || !menuToggle || !menuDismiss || !source || typeof St === "undefined") return;

  const strings = JSON.parse($("#book-strings").textContent);
  const rtl = document.documentElement.dir === "rtl";
  const locale = document.documentElement.dataset.locale || "en";
  const languageMenu = $("#book-language");
  const zoomControls = $("#sample-zoom");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const compactScreen = matchMedia("(max-width: 1100px), (pointer: coarse) and (max-width: 1400px)");
  const desktopScreen = matchMedia("(min-width: 900px) and (hover: hover) and (pointer: fine)");
  const normalFlipTime = 850;
  const interactive = "a,button,input,textarea,select,label,summary,[contenteditable]:not([contenteditable='false']),[role='button'],[role='tab'],.sample-zoom";

  let logical = [];
  let pages = [];
  let pageFlip = null;
  let current = 0;
  let busy = false;
  let rebuilding = false;
  let pendingPage = null;
  let turningTo = null;
  let paperGesture = null;
  let paperClickUntil = 0;
  let sectionTurn = null;
  let navigationFrame = 0;
  let resizeTimer = 0;
  let heldTurn = null;
  let suppressedClick = null;
  let readingLayout = false;
  let sizedForReading = false;
  let layoutFrame = 0;
  let bookmarksVisible = false;
  let bookmarkHoverFrame = 0;
  let bookmarkHoverY = null;
  let bookmarkPaper = null;

  const number = (value, pad = false) => new Intl.NumberFormat(locale, { useGrouping: false, minimumIntegerDigits: pad ? 2 : 1 }).format(value);

  /* ------------------------------------------------------------- the model */

  function readSource() {
    const items = [];
    for (const section of source.querySelectorAll("[data-page]")) {
      const blocks = [];
      for (const child of Array.from(section.children)) {
        blocks.push({
          node: child,
          live: child.hasAttribute("data-live"),
          keepTogether: child.hasAttribute("data-keep-together"),
        });
      }
      items.push({
        id: section.id || section.dataset.page,
        section: section.dataset.section,
        title: section.dataset.title || "",
        classes: section.dataset.class || "",
        image: section.dataset.image || "",
        alt: section.dataset.alt || "",
        fixed: section.hasAttribute("data-fixed"),
        blocks,
      });
    }
    // The source keeps living in memory; its nodes move onto the sheets.
    source.remove();
    return items;
  }

  /* --------------------------------------------------------- paper sheets */

  function pageElement(item, classes) {
    const el = document.createElement("article");
    el.className = "page " + classes;
    el.setAttribute("aria-label", item.title);
    if (classes.includes("cover")) {
      el.dataset.density = "hard";
      return el;
    }
    const head = document.createElement("header");
    head.className = "running-head";
    head.innerHTML =
      '<span class="book-name" dir="ltr">ACE.await</span><span></span>';
    head.lastElementChild.textContent = item.title;
    const body = document.createElement("div");
    body.className = "page-body";
    if (classes.includes("gift-page")) body.tabIndex = 0;
    el.append(head, body);
    return el;
  }

  function continuedMark() {
    const mark = document.createElement("span");
    mark.className = "continued";
    mark.textContent = strings.continued;
    return mark;
  }

  // Word-level slicing that keeps links, emphasis and footnote marks intact.
  function paragraphWords(node) {
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    const runs = [];
    const breaks = [];
    let total = 0;
    while (walker.nextNode()) {
      if (walker.currentNode.nodeType === 1) {
        if (walker.currentNode.tagName === "BR") breaks.push({ node: walker.currentNode, at: total });
        continue;
      }
      const text = walker.currentNode.nodeValue;
      const characterMode = locale === "zh";
      const words = characterMode ? Array.from(text) : (text.match(/\S+/g) || []);
      runs.push({
        node: walker.currentNode,
        characterMode,
        words,
        start: total,
        lead: !characterMode && /^\s/.test(text),
        trail: !characterMode && /\s$/.test(text),
      });
      total += words.length;
    }
    return { runs, breaks, total };
  }

  function sliceParagraph(node, from, to) {
    const clone = node.cloneNode(true);
    const { runs, breaks } = paragraphWords(clone);
    for (const line of breaks) {
      if (line.at <= from || line.at >= to) line.node.remove();
    }
    for (const run of runs) {
      const kept = run.words.filter((word, index) => {
        const position = run.start + index;
        return position >= from && position < to;
      });
      run.node.nodeValue = kept.length
        ? (run.lead && run.start >= from ? " " : "") + kept.join(run.characterMode ? "" : " ") + (run.trail ? " " : "")
        : "";
    }
    for (const element of Array.from(clone.querySelectorAll("*"))) {
      if (["BR", "IMG", "INPUT"].includes(element.tagName)) continue;
      if (!element.textContent.trim() && !element.querySelector("img,br")) element.remove();
    }
    return clone;
  }

  // Every block is flowed into the sheet, splitting it when it does not fit:
  // paragraphs by word, lists and other containers by their children, so a long
  // passage continues on the next page instead of being cut off.
  function paginate(items) {
    const probe = pageElement({ title: "", classes: "" }, "");
    probe.classList.add("measure");
    document.body.append(probe);
    const probeBody = $(".page-body", probe);
    // A few pixels of padding keep descenders off the foot of the page.
    probeBody.style.paddingBottom = "6px";
    // Gift keeps its invitation and live form on one scrollable sheet.
    const overflows = () => !probe.classList.contains("gift-page")
      && probeBody.scrollHeight > probeBody.clientHeight + 1;
    const output = [];

    let item = null;
    let stack = [];       // wrappers a block is flowing inside, outermost first
    let placed = 0;       // blocks already resting on the sheet being filled
    let continued = false;
    let sheets = 0;
    let markerless = false;
    let fit = 0;

    const target = () => (stack.length ? stack[stack.length - 1].element : probeBody);

    const shrinkToFit = () => {
      probeBody.classList.add("is-fitted");
      const ratio = Math.max(0.5, (probeBody.clientHeight - 6) / probeBody.scrollHeight);
      probeBody.classList.remove("is-fitted");
      return ratio;
    };

    const wrapper = (frame, parent) => {
      frame.element = frame.template.cloneNode(false);
      frame.element.dataset.wrapper = "1";
      if (frame.continued && frame.template.tagName === "LI") {
        frame.element.classList.add("runs-on");
      }
      if (frame.template.tagName === "OL" && frame.start > 1) {
        frame.element.setAttribute("start", String(frame.start));
      }
      parent.append(frame.element);
      return frame.element;
    };

    const openWrappers = () => {
      let parent = probeBody;
      for (const frame of stack) parent = wrapper(frame, parent);
    };

    const emit = () => {
      // An item whose text moved to the next sheet must not leave a bare
      // list marker behind. Prune inside out, including nested empty lists.
      for (const frame of stack) {
        if (frame.template.tagName === "LI" && frame.element.textContent.trim()) {
          frame.continued = true;
        }
      }
      for (const node of Array.from(probeBody.querySelectorAll("[data-wrapper]")).reverse()) {
        if (!node.textContent.trim() && !node.querySelector("img,svg,input")) node.remove();
      }
      // Last word on a sheet: whatever is still too tall is brought down to it,
      // so a page may be a shade smaller but never loses a line.
      if (!fit && overflows()) fit = shrinkToFit();
      const sheet = pageElement(item, item.classes);
      const body = $(".page-body", sheet);
      if (continued && !markerless) body.append(continuedMark());
      for (const node of Array.from(probeBody.children)) {
        node.remove();
        if (node.classList.contains("continued")) continue;
        if (node.dataset.wrapper && !node.children.length) continue;
        body.append(node);
      }
      if (fit) {
        const fitted = document.createElement("div");
        fitted.className = "page-fit";
        body.classList.add("is-fitted");
        fitted.style.setProperty("--fit", fit.toFixed(3));
        while (body.firstChild) fitted.append(body.firstChild);
        body.append(fitted);
      }
      output.push({ ...item, el: sheet, continued });
      sheets += 1;
      continued = true;
      placed = 0;
      markerless = false;
      fit = 0;
      probeBody.append(continuedMark());
      openWrappers();
    };

    // A container can carry its children across sheets only when the children
    // hold all of its content: loose text or line breaks must stay together.
    const flowable = node => {
      if (!["UL", "OL", "LI", "BLOCKQUOTE", "DIV", "DL", "FIGURE"].includes(node.tagName)) return false;
      if (!node.children.length) return false;
      for (const child of node.childNodes) {
        if (child.nodeType === 3 && child.nodeValue.trim()) return false;
        if (child.nodeType === 1 && ["BR", "IMG"].includes(child.tagName)) return false;
      }
      return true;
    };

    // Anything whose content is only text and inline marks reads like a
    // paragraph and can be divided word by word: a list item, a quotation, a verse.
    const inline = new Set(["A", "EM", "STRONG", "SPAN", "B", "I", "SUP", "SUB", "CITE",
      "DFN", "BDI", "CODE", "SMALL", "TIME", "BR", "ABBR", "Q", "MARK", "U", "S"]);
    const inlineOnly = node => Array.from(node.children).every(child => inline.has(child.tagName));

    const placeParagraph = (node) => {
      const info = paragraphWords(node);
      // A few long translated words can already fill several quote lines.
      // Keep that opening with its review title on a narrow sheet.
      const minimumSlice = locale !== "en" && locale !== "zh"
        && node.classList.contains("pullquote") ? 3 : 8;
      if (info.total <= minimumSlice) return false;
      let from = 0;
      while (from < info.total) {
        let low = 1;
        let high = info.total - from;
        let best = 0;
        while (low <= high) {
          const middle = Math.ceil((low + high) / 2);
          const candidate = sliceParagraph(node, from, from + middle);
          target().append(candidate);
          const fitting = !overflows();
          candidate.remove();
          if (fitting) {
            best = middle;
            low = middle + 1;
          } else {
            high = middle - 1;
          }
        }
        if (!best && !placed) best = 1;             // never stall on an empty sheet
        if (!best || (best < minimumSlice && placed)) {
          emit();
          continue;
        }
        const slice = sliceParagraph(node, from, from + best);
        // A list item that runs on does not repeat its bullet or its number.
        if (from && slice.tagName === "LI") slice.classList.add("runs-on");
        target().append(slice);
        placed += 1;
        from += best;
        if (from < info.total) emit();
      }
      return true;
    };

    const placeBlock = (node, live) => {
      target().append(node);
      if (!overflows()) {
        placed += 1;
        return;
      }
      node.remove();
      // Keep each short screen pitch with its heading. A genuinely long item
      // still flows normally instead of being shrunk to fit a small viewport.
      if (placed && node.tagName === "LI" && item.classes.includes("screen-page")) {
        const fresh = probe.cloneNode(false);
        const body = probeBody.cloneNode(false);
        fresh.append(body);
        body.append(continuedMark());
        let parent = body;
        for (const frame of stack) {
          const container = frame.template.cloneNode(false);
          parent.append(container);
          parent = container;
        }
        parent.append(node.cloneNode(true));
        document.body.append(fresh);
        const fits = body.scrollHeight <= body.clientHeight + 1;
        fresh.remove();
        if (fits) {
          emit();
          target().append(node);
          placed += 1;
          return;
        }
      }
      if (!live && inlineOnly(node) && placeParagraph(node)) return;
      if (!live && flowable(node)) {
        const frame = { template: node, element: null, start: 1 };
        wrapper(frame, target());
        stack.push(frame);
        let index = 0;
        for (const child of Array.from(node.children)) {
          index += 1;
          frame.start = index;
          placeBlock(child.cloneNode(true), false);
        }
        stack.pop();
        if (frame.element && !frame.element.children.length) frame.element.remove();
        return;
      }
      // Nothing left to divide: give it a sheet of its own.
      if (placed) emit();
      target().append(node);
      placed += 1;
      if (overflows()) {
        const mark = probeBody.firstElementChild;
        if (mark && mark.classList.contains("continued")) {
          mark.remove();
          markerless = true;
        }
      }
      if (overflows()) fit = shrinkToFit();
    };

    for (const entry of items) {
      item = entry;
      if (item.image) {
        const el = pageElement(item, item.classes);
        item.blocks.forEach(block => el.append(block.node));
        const artwork = el.querySelector("img");
        if (artwork) artwork.draggable = false;
        output.push({ ...item, el });
        continue;
      }
      probe.className = "page measure " + item.classes;
      probeBody.textContent = "";
      stack = [];
      placed = 0;
      continued = false;
      sheets = 0;
      markerless = false;
      fit = 0;
      for (const [blockIndex, block] of item.blocks.entries()) {
        if (item.fixed) {
          probeBody.append(block.node);
          placed += 1;
          continue;
        }
        // Reference headings travel with the start of their text. Measure a
        // short preview so long legal paragraphs can still flow across pages.
        if (item.classes.includes("appendix-page") && placed
          && /^H[234]$/.test(block.node.tagName)
          && !block.node.classList.contains("appendix-title")) {
          const preview = [];
          let next = blockIndex;
          while (next < item.blocks.length && /^H[234]$/.test(item.blocks[next].node.tagName)) {
            preview.push(item.blocks[next++].node.cloneNode(true));
          }
          const following = item.blocks[next]?.node;
          if (following) {
            if (inlineOnly(following)) {
              const words = paragraphWords(following);
              preview.push(sliceParagraph(following, 0, Math.min(12, words.total)));
            } else {
              const first = following.cloneNode(false);
              if (following.firstElementChild) first.append(following.firstElementChild.cloneNode(true));
              preview.push(first);
            }
          }
          probeBody.append(...preview);
          const needsPage = overflows();
          preview.forEach(node => node.remove());
          if (needsPage) emit();
        }
        placeBlock(block.node, block.live || block.keepTogether);
      }
      if (item.fixed && overflows()) fit = shrinkToFit();
      if (placed || !sheets) emit();
    }

    probe.remove();
    return packReviews(output);
  }

  // Short reviews stay intact, but need not occupy a sheet of their own.
  // Measure the full pair, including their separator, at the current book size.
  // Never shrink text just to make two reviews share a page.
  function packReviews(sheets) {
    const probe = pageElement({ title: "" }, "review-page short-review-page shared-reviews measure");
    const probeBody = $(".page-body", probe);
    probeBody.style.paddingBottom = "6px";
    document.body.append(probe);
    const packed = [];

    for (const sheet of sheets) {
      if (sheet.section !== "reviews") {
        packed.push(sheet);
        continue;
      }
      const body = $(".page-body", sheet.el);
      const content = $(".page-fit", body) || body;
      const entry = document.createElement("section");
      entry.className = "review-entry";
      entry.dataset.reviewId = sheet.id;
      entry.setAttribute("aria-label", sheet.title);
      while (content.firstChild) entry.append(content.firstChild);
      content.append(entry);
      sheet.reviewStarts = sheet.continued ? [] : [sheet.id];

      const previous = packed[packed.length - 1];
      const previousBody = previous?.section === "reviews" && $(".page-body", previous.el);
      if (sheet.fixed && previous?.fixed && !sheet.continued && previousBody
        && !body.classList.contains("is-fitted") && !previousBody.classList.contains("is-fitted")) {
        probeBody.replaceChildren(...Array.from(previousBody.children, node => node.cloneNode(true)),
          entry.cloneNode(true));
        if (probeBody.scrollHeight <= probeBody.clientHeight + 1) {
          previousBody.append(entry);
          previous.el.classList.add("shared-reviews");
          previous.reviewStarts.push(...sheet.reviewStarts);
          previous.title += " · " + sheet.title;
          previous.el.setAttribute("aria-label", previous.title);
          $(".running-head", previous.el).lastElementChild.textContent = strings.sections.reviews;
          continue;
        }
      }
      packed.push(sheet);
    }
    probe.remove();
    return packed;
  }

  const canonicalId = id => ({ "contact-write": "contact", links: "back-cover", appendix: "back-cover" }[id] || id);
  const containsId = (page, id) => page.id === canonicalId(id) || page.reviewStarts?.includes(id);


  /* ------------------------------------------------------------ the sample */

  const zoomFrames = new WeakMap();
  const zoomNumber = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  const mousePanAvailable = matchMedia("(any-hover: hover) and (any-pointer: fine)");
  let samplePan = null;

  function stopSamplePan() {
    if (!samplePan) return;
    const { sheet, pointerId } = samplePan;
    samplePan = null;
    sheet.classList.remove("is-panning");
    if (sheet.hasPointerCapture(pointerId)) sheet.releasePointerCapture(pointerId);
  }

  function syncZoomControls(page) {
    zoomControls.hidden = !page.classList.contains("sample-page");
    if (zoomControls.hidden) return;
    const percentage = Number(page.dataset.zoom || 100);
    $("output", zoomControls).textContent = number(percentage);
    $("output", zoomControls).setAttribute("aria-label", zoomNumber.format(percentage / 100));
    $('[data-zoom-step="-10"]', zoomControls).disabled = percentage === 100;
  }

  function fitSampleSheets() {
    const width = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--book-w"));
    const height = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--book-h"));
    const scale = Math.min(width / 594, height / 918);
    document.documentElement.style.setProperty("--sheet-scale", scale.toFixed(4));
  }

  function setZoom(page, percentage, animate = false) {
    cancelAnimationFrame(zoomFrames.get(page));
    const sheet = $(".sample-sheet", page);
    if (samplePan?.sheet === sheet) stopSamplePan();
    const canvas = $(".sample-sheet__canvas", page);
    const from = Number(sheet.style.getPropertyValue("--sheet-factor")) || 1;
    percentage = Math.max(100, percentage);
    const to = percentage / 100;
    // Keep the same reading position through each small step, including the
    // negative horizontal scroll coordinates of the original Persian sample.
    const direction = getComputedStyle(sheet).direction === "rtl" ? -1 : 1;
    const anchorX = (Math.abs(sheet.scrollLeft) + sheet.clientWidth / 2
      - Math.max(0, (sheet.clientWidth - canvas.offsetWidth) / 2)) / from;
    const anchorY = (sheet.scrollTop + sheet.clientHeight / 2
      - canvas.offsetTop) / from;
    page.dataset.zoom = String(percentage);
    if (page === pages[current]?.el) syncZoomControls(page);
    page.classList.toggle("is-zoomed", to > 1 || from > 1);

    const render = factor => {
      sheet.style.setProperty("--sheet-factor", factor.toFixed(6));
      sheet.scrollLeft = direction * (anchorX * factor - sheet.clientWidth / 2
        + Math.max(0, (sheet.clientWidth - canvas.offsetWidth) / 2));
      sheet.scrollTop = anchorY * factor - sheet.clientHeight / 2
        + canvas.offsetTop;
    };
    const finish = () => {
      zoomFrames.delete(page);
      page.classList.toggle("is-zoomed", to > 1);
      if (to === 1) sheet.scrollTo(0, 0);
    };
    if (!animate || reducedMotion.matches) {
      render(to);
      finish();
      return;
    }
    const start = performance.now();
    const tick = now => {
      const progress = Math.min(1, (now - start) / 180);
      render(from + (to - from) * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) zoomFrames.set(page, requestAnimationFrame(tick));
      else finish();
    };
    zoomFrames.set(page, requestAnimationFrame(tick));
  }

  /* --------------------------------------------------------------- the book */

  function sizeBook(reading) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const desktop = desktopScreen.matches || !compactScreen.matches;
    readingLayout = !desktop && reading;
    sizedForReading = reading;
    document.documentElement.classList.toggle("immersive-reading", readingLayout);
    document.documentElement.classList.toggle("desktop-book", desktop);
    stage.dataset.layout = readingLayout ? "reading" : "cover";
    // Desktop keeps the printed proportion at almost the full window height.
    // The cover reserves its entry line; touch reading uses the safe-area box.
    const verticalSpace = height < 550 ? 68 : 110;
    const room = getComputedStyle($(".reading-room"));
    const desktopHeight = reading ? Math.min(height * .965, height - 20) : Math.min(height * .96, height - 56);
    const bookWidth = desktop
      ? Math.floor(Math.min(width - 320, desktopHeight / 1.6))
      : readingLayout
      ? Math.floor(width - parseFloat(room.paddingLeft) - parseFloat(room.paddingRight))
      : Math.floor(Math.min(494, width - (width <= 600 ? 48 : 180), (height - verticalSpace) / 1.6));
    const bookHeight = readingLayout
      ? Math.floor(height - parseFloat(room.paddingTop) - parseFloat(room.paddingBottom))
      : bookWidth * 1.6;
    document.documentElement.style.setProperty("--book-w", bookWidth + "px");
    document.documentElement.style.setProperty("--book-h", bookHeight + "px");
    document.documentElement.style.setProperty("--desktop-type-scale", desktop ? Math.max(1, bookWidth / 494).toFixed(4) : "1");
    document.documentElement.classList.toggle("small-book", bookWidth < 290);
    fitSampleSheets();
    return { width: bookWidth, height: bookHeight };
  }

  function scheduleLayout() {
    cancelAnimationFrame(layoutFrame);
    if (rebuilding || busy || sectionTurn || sizedForReading === (current > 0)) return;
    layoutFrame = requestAnimationFrame(() => {
      if (busy || sectionTurn || rebuilding) return;
      const page = pages[current];
      build({ id: page.id, offset: current - pages.findIndex(item => item.id === page.id) });
    });
  }

  function hideBookmarks() {
    if (tabs.contains(document.activeElement)) menuToggle.focus({ preventScroll: true });
    bookmarksVisible = false;
    menuDismiss.hidden = true;
    tabs.inert = true;
    clearBookmarkProximity();
    stage.classList.add("is-reading-quiet");
    bookmarkPaper?.setOpen(false);
    menuToggle.setAttribute("aria-expanded", "false");
  }

  function showBookmarks() {
    if (pageFlip?.getState() === "fold_corner") pageFlip.cancelUserTouch();
    bookmarksVisible = true;
    menuDismiss.hidden = false;
    tabs.inert = false;
    stage.classList.remove("is-reading-quiet");
    bookmarkPaper?.setOpen(true);
    menuToggle.setAttribute("aria-expanded", "true");
  }

  function clearBookmarkProximity() {
    cancelAnimationFrame(bookmarkHoverFrame);
    bookmarkHoverFrame = 0;
    bookmarkHoverY = null;
    for (const tab of tabs.children) {
      tab.style.removeProperty("--tab-grow");
      tab.style.removeProperty("--tab-curl");
    }
    bookmarkPaper?.proximity();
  }

  function highlightBookmarks(y) {
    if ((!readingLayout && !document.documentElement.classList.contains("desktop-book")) || !bookmarksVisible || reducedMotion.matches) return;
    bookmarkHoverY = y;
    if (bookmarkHoverFrame) return;
    bookmarkHoverFrame = requestAnimationFrame(() => {
      bookmarkHoverFrame = 0;
      const top = tabs.getBoundingClientRect().top - tabs.scrollTop;
      for (const tab of tabs.children) {
        // Measure the stationary button, not its moving paper face.
        const distance = Math.abs(bookmarkHoverY - (top + tab.offsetTop + tab.offsetHeight / 2));
        const nearby = Math.max(0, 1 - distance / (tab.offsetHeight * 1.6));
        tab.style.setProperty("--tab-grow", (.065 * nearby * nearby).toFixed(4));
        tab.style.setProperty("--tab-curl", (5 * nearby).toFixed(2) + "deg");
      }
      bookmarkPaper?.proximity();
    });
  }

  function markSection(section) {
    tabs.dataset.activeSection = section;
    tabs.querySelectorAll("button").forEach(el => {
      el.setAttribute("aria-current", String(el.dataset.section === section));
    });
    bookmarkPaper?.refresh();
  }

  function sync(index) {
    if (index !== current) stopSamplePan();
    current = index;
    const page = pages[index];
    if (!page) return;
    const cover = index === 0;
    stage.classList.toggle("is-closed", cover);
    stage.classList.toggle("is-back-cover", page.id === "back-cover");
    const focusFromCover = !cover && (document.activeElement === $("#open") || $("#cover-entry").contains(document.activeElement));
    const focusFromClose = cover && (document.activeElement === $("#close")
      || document.activeElement === menuToggle || tabs.contains(document.activeElement));
    $("#open").hidden = !cover;
    $("#cover-entry").hidden = !cover || Boolean(sectionTurn);
    if (!cover || sectionTurn) languageMenu.open = false;
    $("#controls").hidden = cover;
    $("#close").hidden = cover;
    if (cover) hideBookmarks();
    menuToggle.hidden = cover;
    tabs.inert = cover || !bookmarksVisible;
    if (focusFromCover) $("#close").focus({ preventScroll: true });
    if (focusFromClose) $("#open-label").focus({ preventScroll: true });
    $("#previous").disabled = Boolean(sectionTurn) || index === 0;
    $("#next").disabled = Boolean(sectionTurn) || index === pages.length - 1;
    $("#next").style.visibility = index === pages.length - 1 ? "hidden" : "";
    const peers = pages.filter(item => item.section === page.section);
    const position = peers.indexOf(page) + 1;
    $("#folio").textContent = page.classes.includes("cover")
      ? "ACE.await"
      : `${number(position, true)}  /  ${number(peers.length, true)}`;
    if (!sectionTurn) {
      $("#announcement").textContent =
        `${page.title} — ${strings.page} ${number(position)} ${strings.of} ${number(peers.length)}`;
    }
    markSection(sectionTurn ? pages[sectionTurn.target].section : page.section);
    pages.forEach((item, position) => {
      item.el.inert = position !== index;
      item.el.setAttribute("aria-hidden", String(position !== index));
      if (page.section !== "sample" && item.el.classList.contains("is-zoomed")) setZoom(item.el, 100);
    });
    syncZoomControls(page.el);
    [index, index + 1, index + 2].forEach(position => {
      const image = pages[position] && $("img", pages[position].el);
      if (image) image.loading = "eager";
    });
    stage.dataset.page = String(index);
    stage.dataset.section = page.section;
    const requestedAnchor = decodeURIComponent(location.hash.slice(1));
    // A shared sheet has more than one valid review anchor. Keep the requested
    // review through the turn as well as when its sheet is already visible.
    const requestedReview = page.reviewStarts?.includes(requestedAnchor)
      || (sectionTurn && pages[sectionTurn.target].reviewStarts?.includes(requestedAnchor));
    const anchor = requestedReview
      ? requestedAnchor : page.continued ? null : page.id;
    if (anchor && location.hash.slice(1) !== anchor) {
      // Keep whatever brought the reader here, campaign parameters included.
      history.replaceState(null, "",
        anchor === "cover" ? location.pathname + location.search : "#" + anchor);
    }
    scheduleLayout();
  }

  function stopSectionTurn() {
    cancelAnimationFrame(navigationFrame);
    navigationFrame = 0;
    sectionTurn = null;
    stage.classList.remove("is-riffling");
    shell.removeAttribute("aria-busy");
    if (pageFlip) {
      pageFlip.getSettings().flippingTime = normalFlipTime;
    }
  }

  function advanceSectionTurn() {
    navigationFrame = 0;
    const turn = sectionTurn;
    if (!turn || !pageFlip || busy) return;
    if (current === turn.target || reducedMotion.matches) {
      const target = turn.target;
      stopSectionTurn();
      pageFlip.cancelUserTouch();
      if (current !== target) pageFlip.turnToPage(target);
      sync(target);
      return;
    }
    if (!turn.route) {
      const distance = turn.target - current;
      const steps = Math.min(10, Math.abs(distance));
      // A few real paper curls traverse long sections without a lengthy wait.
      turn.route = Array.from({ length: steps }, (unused, index) =>
        current + Math.round(distance * (index + 1) / steps));
      turn.deadline = performance.now() + Math.min(2000, steps * 210);
    }
    const duration = Math.max(80, (turn.deadline - performance.now()) / turn.route.length - 16);
    const bounds = pageFlip.getBoundsRect();
    // StPageFlip scales its duration by the curl path length, up to 1,000 frames.
    const pathLength = Math.floor(Math.max(2 * bounds.pageWidth - bounds.height / 10, bounds.height / 10)) + 1;
    pageFlip.getSettings().flippingTime = duration / Math.min(1, pathLength / 1000);
    pageFlip.flip(turn.route.shift(), "bottom");
  }

  function goToSection(index) {
    if (!pageFlip || index < 0 || index >= pages.length) return;
    stopPaperGesture();
    stopHeldTurn();
    cancelAnimationFrame(navigationFrame);
    navigationFrame = 0;
    pendingPage = null;
    if (pages[index].id === "back-cover"
      || (pages[current].id === "back-cover" && pages[index].section === "appendix")) {
      // The back cover and its reference links open directly, without riffling.
      stopSectionTurn();
      pageFlip.cancelUserTouch();
      pageFlip.turnToPage(index);
      sync(index);
      return;
    }
    // The newest choice always wins, even mid-riffle.
    sectionTurn = { target: index, route: null, deadline: 0 };
    stage.classList.add("is-riffling");
    shell.setAttribute("aria-busy", "true");
    pageFlip.getSettings().showPageCorners = false;
    sync(current);
    if (!busy) navigationFrame = requestAnimationFrame(advanceSectionTurn);
  }

  function go(index) {
    if (!pageFlip || index < 0 || index >= pages.length) return;
    stopPaperGesture();
    cancelAnimationFrame(navigationFrame);
    navigationFrame = 0;
    stopHeldTurn();
    stopSectionTurn();
    sync(current);
    if (busy) {
      pendingPage = index;
      return;
    }
    pendingPage = null;
    if (index === current) return;
    if (reducedMotion.matches) {
      // Clear any in-flight paper before switching to reduced-motion output.
      pageFlip.cancelUserTouch();
      pageFlip.turnToPage(index);
      sync(index);
    } else {
      turningTo = index;
      pageFlip.flip(index, "bottom");
    }
  }

  function turnPage(direction) {
    // Resolve rapid alternating gestures against the destination already in
    // flight, rather than the old page that remains visible during its curl.
    const origin = pendingPage ?? turningTo ?? current;
    go(Math.max(0, Math.min(pages.length - 1, origin + direction)));
  }

  function indexOfId(id) {
    id = canonicalId(id);
    return pages.findIndex(page => (page.id === id && !page.continued) || page.reviewStarts?.includes(id));
  }

  function jump(id, riffle = true) {
    const index = indexOfId(id);
    if (index < 0) return false;
    if (riffle) goToSection(index);
    else go(index);
    return true;
  }

  function build(keep) {
    cancelAnimationFrame(layoutFrame);
    clearBookmarkProximity();
    const previousBounds = stage.getBoundingClientRect();
    const wasReading = readingLayout;
    stopHeldTurn();
    stopSamplePan();
    stopPaperGesture();
    rebuilding = true;
    busy = false;
    pendingPage = null;
    turningTo = null;
    stopSectionTurn();
    stage.classList.remove("is-turning");
    const size = sizeBook(Boolean(keep && keep.id !== "cover"));
    if (pageFlip) {
      pages.filter(item => item.el.classList.contains("sample-page"))
        .forEach(item => setZoom(item.el, 100));
      pageFlip.getRender().finishAnimation();
      pageFlip.destroy();
      pageFlip = null;
    }
    shell.innerHTML = '<div class="book" id="book"></div>';
    const book = $("#book");
    pages = paginate(logical);
    pages.forEach(item => {
      const sample = $(".sample-sheet", item.el);
      if (sample) {
        // Keep the printed running title above the fixed header rule, outside
        // the clipped reading area, while preserving its original text.
        const head = $(".sample-sheet__head", sample).cloneNode(true);
        head.classList.add("sample-page__head");
        head.lang = sample.lang || "en";
        head.dir = sample.dir || "ltr";
        $(".page-body", item.el).prepend(head);
      }
      if (rtl) {
        const face = document.createElement("div");
        face.className = "page-face";
        while (item.el.firstChild) face.append(item.el.firstChild);
        item.el.append(face);
      }
      book.append(item.el);
      if (item.el.classList.contains("sample-page")) setZoom(item.el, 100);
    });
    pageFlip = new St.PageFlip(book, {
      ...size,
      size: "fixed",
      usePortrait: true,
      autoSize: false,
      showCover: false,
      drawShadow: true,
      maxShadowOpacity: 0.32,
      flippingTime: normalFlipTime,
      // One input owner: the reader below handles taps and swipes. The engine
      // only animates completed navigation requests, never hover/live drags.
      useMouseEvents: false,
      mobileScrollSupport: true,
      showPageCorners: false,
    });
    pageFlip.on("flip", event => {
      if (!rebuilding) sync(event.data);
    });
    pageFlip.on("changeState", event => {
      if (rebuilding) return;
      busy = event.data === "flipping" || event.data === "user_fold";
      stage.classList.toggle("is-turning", busy);
      if (event.data !== "read") return;
      turningTo = null;
      scheduleLayout();
      cancelAnimationFrame(navigationFrame);
      if (sectionTurn) {
        navigationFrame = requestAnimationFrame(advanceSectionTurn);
      } else if (pendingPage !== null) {
        navigationFrame = requestAnimationFrame(() => {
          const destination = pendingPage;
          pendingPage = null;
          if (destination !== null) go(destination);
        });
      }
    });
    pageFlip.loadFromHTML(pages.map(item => item.el));
    let index = 0;
    if (keep) {
      const first = pages.findIndex(item => containsId(item, keep.id));
      const last = pages.findLastIndex(item => containsId(item, keep.id));
      if (first >= 0) index = Math.min(first + keep.offset, last);
    }
    current = Math.max(0, index);
    pageFlip.turnToPage(current);
    rebuilding = false;
    fitSampleSheets();
    sync(current);
    if (wasReading !== readingLayout && !reducedMotion.matches) {
      const bounds = stage.getBoundingClientRect();
      stage.animate([
        { transform: `translate(${previousBounds.x + previousBounds.width / 2 - bounds.x - bounds.width / 2}px, ${previousBounds.y + previousBounds.height / 2 - bounds.y - bounds.height / 2}px) scale(${previousBounds.width / bounds.width}, ${previousBounds.height / bounds.height})` },
        { transform: getComputedStyle(stage).transform },
      ], { duration: 420, easing: "cubic-bezier(.2,.7,.2,1)" });
    }
  }

  /* ------------------------------------------------------------ interaction */

  menuToggle.addEventListener("click", () => {
    if (bookmarksVisible) hideBookmarks();
    else showBookmarks();
  });
  document.addEventListener("click", event => {
    if (bookmarksVisible && !menuToggle.contains(event.target)) hideBookmarks();
  });
  for (const type of ["pointerdown", "pointermove"]) {
    tabs.addEventListener(type, event => highlightBookmarks(event.clientY), { passive: true });
  }
  tabs.addEventListener("pointerleave", event => {
    if (event.pointerType === "mouse") clearBookmarkProximity();
  });
  // Keep the gentle emphasis under a finger during native vertical scrolling;
  // the browser still owns scrolling and cancels accidental tap activation.
  tabs.addEventListener("touchmove", event => {
    if (event.touches.length === 1) highlightBookmarks(event.touches[0].clientY);
  }, { passive: true });
  tabs.addEventListener("scroll", () => {
    if (bookmarkHoverY !== null) highlightBookmarks(bookmarkHoverY);
  }, { passive: true });
  for (const type of ["touchend", "touchcancel"]) tabs.addEventListener(type, clearBookmarkProximity, { passive: true });

  function stopHeldTurn() {
    const hold = heldTurn;
    if (!hold) return;
    heldTurn = null;
    clearTimeout(hold.delay);
    clearInterval(hold.repeat);
    if (hold.active) suppressedClick = hold.button;
    if (hold.button.hasPointerCapture(hold.pointerId)) {
      hold.button.releasePointerCapture(hold.pointerId);
    }
    if (pageFlip) {
      pageFlip.getSettings().flippingTime = normalFlipTime;
    }
  }

  function repeatHeldTurn() {
    if (!heldTurn?.active || !pageFlip || rebuilding || busy) return;
    const destination = current + heldTurn.direction;
    if (destination < 0 || destination >= pages.length) {
      stopHeldTurn();
      return;
    }
    // Turn each sheet, without queuing another animation after release.
    if (reducedMotion.matches) {
      pageFlip.turnToPage(destination);
      sync(destination);
    } else {
      const bounds = pageFlip.getBoundsRect();
      const pathLength = Math.floor(Math.max(2 * bounds.pageWidth - bounds.height / 10, bounds.height / 10)) + 1;
      pageFlip.getSettings().flippingTime = 130 / Math.min(1, pathLength / 1000);
      turningTo = destination;
      pageFlip.flip(destination, "bottom");
    }
  }

  function bindPageControl(button, direction) {
    button.addEventListener("pointerdown", event => {
      if (!event.isPrimary || event.button !== 0 || button.disabled) return;
      stopHeldTurn();
      suppressedClick = null;
      const hold = { button, direction, pointerId: event.pointerId, active: false, delay: 0, repeat: 0 };
      heldTurn = hold;
      button.setPointerCapture(event.pointerId);
      hold.delay = setTimeout(() => {
        if (heldTurn !== hold) return;
        hold.active = true;
        stopSectionTurn();
        pendingPage = null;
        pageFlip.getSettings().showPageCorners = false;
        hold.repeat = setInterval(repeatHeldTurn, 190);
        repeatHeldTurn();
      }, 1000);
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
      button.addEventListener(type, event => {
        if (heldTurn?.pointerId === event.pointerId) stopHeldTurn();
      });
    }
    button.addEventListener("contextmenu", event => event.preventDefault());
    button.addEventListener("click", event => {
      if (event.detail !== 0 && suppressedClick === button) {
        suppressedClick = null;
        event.preventDefault();
        return;
      }
      turnPage(direction);
    });
  }

  const stopPointerInteractions = () => {
    stopHeldTurn();
    stopSamplePan();
    stopPaperGesture();
    clearBookmarkProximity();
  };
  window.addEventListener("blur", stopPointerInteractions);
  window.addEventListener("pagehide", stopPointerInteractions);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopPointerInteractions();
  });

  document.addEventListener("click", event => {
    const zoom = event.target.closest(".sample-zoom button[data-zoom-step]");
    if (zoom) {
      event.preventDefault();
      const page = pages[current].el;
      const percentage = Number(page.dataset.zoom || 100) + Number(zoom.dataset.zoomStep);
      // Prepare every sample sheet at the chosen size before it is revealed
      // by a page turn. Only leaving the sample section resets this zoom.
      for (const item of pages.filter(item => item.section === "sample")) {
        setZoom(item.el, percentage, item.el === page);
        if (item.el !== page) $(".sample-sheet", item.el).scrollTo(0, 0);
      }
      return;
    }
    const marker = event.target.closest(".bookmark");
    if (marker) {
      goToSection(pages.findIndex(page => page.section === marker.dataset.section));
      return;
    }
    const destination = event.target.closest("[data-jump]");
    if (destination) {
      event.preventDefault();
      jump(destination.dataset.jump);
    }
  });

  // A real mouse grabs the enlarged printed sheet. Touch keeps its native
  // scrolling, and the browser's scrollbars remain available on desktop.
  shell.addEventListener("pointerdown", event => {
    if (event.pointerType !== "mouse" || !event.isPrimary || event.button !== 0
      || !mousePanAvailable.matches || busy || rebuilding) return;
    const sheet = event.target.closest(".sample-page.is-zoomed .sample-sheet");
    if (!sheet || event.target.closest("a,button,input,textarea,select,label")) return;
    const page = sheet.closest(".page");
    if (page !== pages[current]?.el || Number(page.dataset.zoom) <= 100) return;
    const bounds = sheet.getBoundingClientRect();
    const x = event.clientX - bounds.left, y = event.clientY - bounds.top;
    if (x < sheet.clientLeft || x >= sheet.clientLeft + sheet.clientWidth
      || y < sheet.clientTop || y >= sheet.clientTop + sheet.clientHeight) return;
    // Finish a pending 10% step before taking hold, so its animation cannot
    // fight the mouse for the scroll position.
    if (zoomFrames.has(page)) setZoom(page, Number(page.dataset.zoom));
    stopSamplePan();
    event.preventDefault();
    event.stopPropagation();
    samplePan = {
      sheet, pointerId: event.pointerId, x: event.clientX, y: event.clientY,
      left: sheet.scrollLeft, top: sheet.scrollTop,
    };
    sheet.classList.add("is-panning");
    sheet.setPointerCapture(event.pointerId);
  }, { capture: true });

  shell.addEventListener("pointermove", event => {
    if (!samplePan || event.pointerId !== samplePan.pointerId) return;
    if (!(event.buttons & 1)) {
      stopSamplePan();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const { sheet, x, y, left, top } = samplePan;
    // Physical drag deltas work for both LTR and RTL's negative scrollLeft.
    sheet.scrollLeft = left - (event.clientX - x);
    sheet.scrollTop = top - (event.clientY - y);
  }, { capture: true });

  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    shell.addEventListener(type, event => {
      if (event.pointerId === samplePan?.pointerId) stopSamplePan();
    }, { capture: true });
  }

  // Recognize a gesture before starting any paper animation. Native taps on
  // controls still activate them; horizontal swipes may start on those same
  // controls. Vertical scrolling, selection and enlarged samples stay native.
  function stopPaperGesture() {
    const gesture = paperGesture;
    paperGesture = null;
    if (gesture && shell.hasPointerCapture(gesture.id)) shell.releasePointerCapture(gesture.id);
  }

  window.addEventListener("pointerdown", event => {
    paperClickUntil = 0;
    if (!event.isPrimary) stopPaperGesture();
  }, { capture: true });

  shell.addEventListener("pointerdown", event => {
    stopPaperGesture();
    if (!event.isPrimary || event.button !== 0 || !pageFlip || rebuilding || sectionTurn
      || current === 0 || bookmarksVisible || samplePan
      || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey
      || event.target.closest(".is-zoomed .sample-sheet")) return;
    paperGesture = {
      id: event.pointerId, kind: event.pointerType, x: event.clientX, y: event.clientY,
      at: performance.now(), bounds: shell.getBoundingClientRect(), moved: false, axis: null,
      control: Boolean(event.target.closest(interactive)),
    };
  }, { capture: true });

  window.addEventListener("pointermove", event => {
    const gesture = paperGesture;
    if (!gesture || event.pointerId !== gesture.id) return;
    const dx = Math.abs(event.clientX - gesture.x), dy = Math.abs(event.clientY - gesture.y);
    if (Math.max(dx, dy) <= 10) return;
    gesture.moved = true;
    // Mouse drags select text (or pan a zoomed sample); only clicks turn paper.
    if (gesture.kind === "mouse") return;
    if (!gesture.axis) {
      if (dy >= dx) gesture.axis = "vertical";
      else if (dx > dy * 1.35) gesture.axis = "horizontal";
    }
    if (gesture.axis === "horizontal") {
      if (event.cancelable) event.preventDefault();
      if (!shell.hasPointerCapture(event.pointerId)) shell.setPointerCapture(event.pointerId);
    }
  }, { capture: true, passive: false });

  window.addEventListener("pointerup", event => {
    const gesture = paperGesture;
    if (!gesture || event.pointerId !== gesture.id) return;
    stopPaperGesture();
    if (rebuilding || sectionTurn || bookmarksVisible || window.getSelection()?.isCollapsed === false) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    const swipe = gesture.kind !== "mouse" && gesture.axis === "horizontal"
      && Math.abs(dx) >= Math.min(60, Math.max(32, gesture.bounds.width * .1))
      && Math.abs(dx) > Math.abs(dy) * 1.35;
    const tap = !gesture.control && !gesture.moved && Math.hypot(dx, dy) <= 10
      && performance.now() - gesture.at < 500;
    // Swiping a button must never also click it, even if the drag is too short
    // to turn. The window capture listener runs before delegated ACE handlers.
    if (swipe || tap || gesture.axis === "horizontal") {
      paperClickUntil = performance.now() + 700;
      if (event.cancelable) event.preventDefault();
    }
    if (!swipe && !tap) return;
    const physicalForward = swipe ? dx < 0 : event.clientX >= gesture.bounds.left + gesture.bounds.width / 2;
    hideBookmarks();
    turnPage(physicalForward !== rtl ? 1 : -1);
  }, { capture: true });

  for (const type of ["pointercancel", "lostpointercapture"]) {
    window.addEventListener(type, event => {
      // Touch starts with implicit capture on the text/button under the finger.
      // Transferring it to the shell is not cancellation of the swipe.
      if (event.pointerId === paperGesture?.id
        && (type === "pointercancel" || event.target === shell)) stopPaperGesture();
    }, { capture: true });
  }
  shell.addEventListener("contextmenu", stopPaperGesture);
  window.addEventListener("click", event => {
    if (event.detail && performance.now() < paperClickUntil) {
      paperClickUntil = 0;
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, { capture: true });

  $("#open").addEventListener("click", () => go(1));
  $("#open-label").addEventListener("click", () => go(1));
  if (rtl) {
    $("#previous").textContent = "→";
    $("#next").firstChild.textContent = "←";
  }
  // Selecting a cover always starts at that cover; other editions reveal the
  // translated headline immediately. Keep campaign parameters, never a stale page.
  languageMenu.querySelectorAll("a").forEach(link => {
    const target = new URL(link.href);
    const params = new URLSearchParams(location.search);
    params.delete("lang");
    target.search = params.toString();
    link.href = target.pathname + target.search + target.hash;
  });
  document.addEventListener("click", event => {
    if (!languageMenu.contains(event.target)) languageMenu.open = false;
  });
  languageMenu.addEventListener("focusout", event => {
    if (event.relatedTarget && !languageMenu.contains(event.relatedTarget)) languageMenu.open = false;
  });
  languageMenu.addEventListener("keydown", event => {
    event.stopPropagation();
    const links = [...languageMenu.querySelectorAll("a")];
    const index = links.indexOf(document.activeElement);
    if (event.key === "Escape") {
      event.preventDefault();
      languageMenu.open = false;
      languageMenu.querySelector("summary").focus();
    } else if (["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      languageMenu.open = true;
      let next = event.key === "ArrowUp" ? (index < 0 ? links.length - 1 : (index - 1 + links.length) % links.length) : (index + 1) % links.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = links.length - 1;
      links[next].focus();
    }
  });
  $("#close").addEventListener("click", () => go(0));
  bindPageControl($("#previous"), -1);
  bindPageControl($("#next"), 1);

  document.addEventListener("keydown", event => {
    if (event.target.closest("input,textarea,select,[contenteditable]:not([contenteditable='false'])")) return;
    if (event.key === " " && event.target.closest("button,a")) return;
    if (["ArrowRight", "ArrowLeft", "PageDown", "PageUp", "Home", "End", "Escape", " "].includes(event.key)) {
      event.preventDefault();
    }
    if (event.key === "Escape" && bookmarksVisible) {
      hideBookmarks();
      menuToggle.focus({ preventScroll: true });
      return;
    }
    if ([rtl ? "ArrowLeft" : "ArrowRight", "PageDown", " "].includes(event.key)) turnPage(1);
    else if ([rtl ? "ArrowRight" : "ArrowLeft", "PageUp"].includes(event.key)) turnPage(-1);
    else if (["Home", "Escape"].includes(event.key)) go(0);
    else if (event.key === "End") go(pages.length - 1);
  });

  window.addEventListener("resize", () => {
    stopHeldTurn();
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!pages.length) return;
      const index = sectionTurn?.target ?? pendingPage ?? current;
      const requestedAnchor = decodeURIComponent(location.hash.slice(1));
      const id = pages[index].reviewStarts?.includes(requestedAnchor) ? requestedAnchor : pages[index].id;
      const first = pages.findIndex(page => containsId(page, id));
      build({ id, offset: index - first });
    }, 220);
  });

  window.addEventListener("hashchange", () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id) jump(id);
  });

  reducedMotion.addEventListener("change", () => {
    if (!reducedMotion.matches || !sectionTurn) return;
    const target = sectionTurn.target;
    stopSectionTurn();
    pageFlip.getRender().finishAnimation();
    pageFlip.turnToPage(target);
    sync(target);
  });

  logical = readSource();
  tabs.innerHTML = "";
  const sections = [];
  for (const item of logical) {
    if (!strings.sections[item.section] || sections.includes(item.section)) continue;
    sections.push(item.section);
    const button = document.createElement("button");
    button.className = "bookmark";
    button.type = "button";
    button.dataset.section = item.section;
    button.setAttribute("aria-current", "false");
    button.style.setProperty("--tab-index", sections.length - 1);
    const paper = document.createElement("span");
    paper.className = "bookmark-paper";
    const label = document.createElement("span");
    label.className = "bookmark-label";
    label.textContent = strings.sections[item.section] || item.section;
    paper.append(label);
    button.append(paper);
    tabs.append(button);
  }
  bookmarkPaper = window.createBookmarkPaper?.({ nav: tabs, stage, reducedMotion }) || null;
  hideBookmarks();

  const faces = [
    `400 1em ${getComputedStyle(document.body).fontFamily}`,
    "400 1em 'EB Garamond'", "italic 400 1em 'EB Garamond'", "500 1em 'EB Garamond'",
    "600 1em 'EB Garamond'", "400 1em 'Cormorant Garamond'", "500 1em 'Cormorant Garamond'",
    "600 1em 'Cormorant Garamond'", "italic 400 1em 'Cormorant Garamond'",
    "400 1em 'Literata'", "700 1em 'Literata'", "italic 400 1em 'Literata'",
    "400 1em 'JetBrains Mono'",
  ];
  // Load the actual script and heading weights before measuring pages. A font
  // request with the default space only loads Latin subsets of Unicode fonts.
  const localeFamily = getComputedStyle(document.body).fontFamily;
  const localeText = [...new Set(logical.flatMap(item => item.blocks.map(block => block.node.textContent)).join(""))].join("");
  const localeFaces = locale === "en" ? [] : [400, 500, 600].map(weight =>
    document.fonts.load(`${weight} 1em ${localeFamily}`, localeText).catch(() => null));
  Promise.all([...faces.map(face => document.fonts.load(face).catch(() => null)), ...localeFaces])
    .then(() => document.fonts.ready)
    .then(() => {
      // A shared link opens the book straight at its page.
      const id = decodeURIComponent(location.hash.slice(1));
      build(id ? { id, offset: 0 } : null);
    });
})();
