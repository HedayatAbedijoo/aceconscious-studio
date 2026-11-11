/* Localized paper/typewriter cards for ACE and the character voices. */
(() => {
  const introPages = new Map(Array.from(document.querySelectorAll('.ace-intro'),
    intro => [intro.parentElement.id, intro]));
  const formDestinations = new Map([
    ['community', document.getElementById('community-form')],
    ['contact', document.getElementById('contact-form')],
  ]);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const segmenter = typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(document.documentElement.lang, { granularity: 'grapheme' }) : null;
  const typists = new Map();
  const readingArea = intro => intro.querySelector(intro.classList.contains('is-typewriter')
    ? '.ace-intro-panels' : '.ace-intro-reading');
  function revealTab(tab) {
    const rail = tab.closest('[role="tablist"]');
    const item = tab.getBoundingClientRect(), bounds = rail.getBoundingClientRect();
    if (item.top < bounds.top) rail.scrollTop -= bounds.top - item.top + 3;
    else if (item.bottom > bounds.bottom) rail.scrollTop += item.bottom - bounds.bottom + 3;
  }

  for (const intro of introPages.values()) {
    if (!intro.hasAttribute('data-intro-typewriter')) continue;
    intro.classList.add('is-typewriter');
    const scroller = readingArea(intro);
    scroller.tabIndex = -1;
    intro.querySelector('.ace-intro-reading').tabIndex = -1;
    const tabs = intro.querySelector('[role="tablist"]');
    const panels = new Map();
    let timer = 0, active = null, follow = true;
    for (const panel of intro.querySelectorAll('[role="tabpanel"]')) {
      const prose = document.createElement('div');
      prose.className = 'ace-intro-prose';
      const copy = document.createElement('div');
      copy.className = 'ace-intro-full-copy';
      copy.append(...panel.querySelectorAll('.ace-intro-definition'));
      // Keep complete, semantic text available to assistive technology. The
      // visual layer reserves that same space and never announces each letter.
      const visual = document.createElement('div');
      visual.className = 'ace-intro-typescript';
      visual.setAttribute('aria-hidden', 'true');
      const runs = [];
      for (const paragraph of copy.children) {
        // Type through the original inline markup so names/emphasis keep their
        // typography and reserve the same space as the accessible full copy.
        const element = paragraph.cloneNode(true);
        element.className = 'ace-intro-typed-line';
        for (const node of [element, ...element.querySelectorAll('*')]) {
          node.removeAttribute('id');
          for (const attribute of Array.from(node.attributes)) {
            if (attribute.name.startsWith('data-')) node.removeAttribute(attribute.name);
          }
        }
        visual.append(element);
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const text = walker.currentNode;
          if (!text.data) continue;
          const letters = segmenter
            ? Array.from(segmenter.segment(text.data), part => part.segment)
            : Array.from(text.data);
          runs.push({ text, letters });
        }
      }
      prose.append(copy, visual);
      panel.append(prose);
      panels.set(panel, runs);
    }
    const cursor = document.createElement('span');
    cursor.className = 'ace-intro-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    function finish() {
      clearTimeout(timer);
      if (active) {
        for (const run of panels.get(active)) run.text.data = run.letters.join('');
        active.classList.remove('is-typing');
      }
      cursor.remove();
      active = null;
    }
    function keepCursorVisible() {
      if (!follow || !cursor.isConnected) return;
      const mark = cursor.getBoundingClientRect();
      const area = scroller.getBoundingClientRect();
      if (mark.bottom > area.bottom - 16) scroller.scrollTop += mark.bottom - area.bottom + 16;
    }
    function start(panel) {
      finish();
      scroller.scrollTop = 0;
      follow = true;
      const runs = panels.get(panel);
      if (motion.matches || !runs.length) return;
      active = panel;
      active.classList.add('is-typing');
      cursor.classList.remove('is-idle');
      for (const run of runs) run.text.data = '';
      let row = 0, column = 0;
      runs[0].text.after(cursor);
      function type() {
        const run = runs[row];
        const letter = run.letters[column++];
        run.text.appendData(letter);
        keepCursorVisible();
        if (column === run.letters.length) {
          if (++row === runs.length) {
            cursor.classList.add('is-idle');
            timer = setTimeout(finish, 1000);
            return;
          }
          column = 0;
          runs[row].text.after(cursor);
          keepCursorVisible();
        }
        const pause = /[.!?؟。！？।\n]/.test(letter) ? 150 : /[,;:،؛，、]/.test(letter) ? 80 : 19 + column % 4 * 4;
        timer = setTimeout(type, pause);
      }
      timer = setTimeout(type, 100);
    }
    // If the reader scrolls deliberately, let them read without pulling them
    // back to the cursor. A new selection resumes automatic following.
    for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown']) {
      scroller.addEventListener(event, () => { follow = false; }, { passive: true });
    }
    const orient = () => {
      const vertical = getComputedStyle(tabs).gridTemplateColumns.split(' ').length === 1;
      tabs.setAttribute('aria-orientation', vertical ? 'vertical' : 'horizontal');
      revealTab(tabs.querySelector('[aria-selected="true"]'));
      keepCursorVisible();
    };
    new ResizeObserver(orient).observe(tabs);
    motion.addEventListener('change', () => { if (motion.matches) finish(); });
    typists.set(intro, { start, finish });
  }
  // A persistent cue sits outside the scrolling text. Native mobile scrollbars
  // disappear at rest, and an arrow inside the text would scroll out of view.
  const scrollUpdates = new Map();
  for (const intro of introPages.values()) {
    const reading = readingArea(intro);
    const indicator = document.createElement('div');
    indicator.className = 'ace-intro-scroll';
    indicator.setAttribute('aria-hidden', 'true');
    indicator.hidden = true;
    const track = document.createElement('span');
    track.className = 'ace-intro-scroll-track';
    const thumb = document.createElement('span');
    thumb.className = 'ace-intro-scroll-thumb';
    track.append(thumb);
    indicator.append(track);
    intro.append(indicator);
    let frame = 0;
    const update = () => {
      frame = 0;
      const maximum = reading.scrollHeight - reading.clientHeight;
      const overflowing = reading.clientHeight > 0 && maximum > 2;
      indicator.hidden = !overflowing;
      if (!overflowing) return;
      if (intro.classList.contains('is-typewriter')) {
        const area = reading.getBoundingClientRect(), bounds = intro.getBoundingClientRect();
        indicator.style.top = area.top - bounds.top + 'px';
        indicator.style.bottom = bounds.bottom - area.bottom + 'px';
      }
      const progress = Math.min(1, Math.max(0, reading.scrollTop / maximum));
      const height = Math.min(track.clientHeight, Math.max(28,
        track.clientHeight * reading.clientHeight / reading.scrollHeight));
      thumb.style.height = height + 'px';
      thumb.style.transform = `translateY(${progress * (track.clientHeight - height)}px)`;
      indicator.classList.toggle('at-top', reading.scrollTop <= 2);
      indicator.classList.toggle('at-bottom', reading.scrollTop >= maximum - 2);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    scrollUpdates.set(intro, schedule);
    reading.addEventListener('scroll', schedule, { passive: true });
    // These live nodes survive the book's resize/rebuild. Observe both the
    // viewport and its content, including font loading and card changes.
    const observer = new ResizeObserver(schedule);
    observer.observe(intro);
    observer.observe(reading);
    for (const child of reading.querySelectorAll(':scope > *, .ace-intro-workspace > *')) observer.observe(child);
    schedule();
  }
  function select(group, selected) {
    for (const tab of group.querySelectorAll('[role="tab"]')) {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      // Use the live group: the book moves these nodes when resizing.
      group.querySelector('#' + tab.getAttribute('aria-controls')).hidden = !active;
    }
    readingArea(group).scrollTop = 0;
    if (typists.has(group)) revealTab(selected);
    typists.get(group)?.start(group.querySelector('#' + selected.getAttribute('aria-controls')));
    scrollUpdates.get(group)?.();
  }

  document.addEventListener('click', event => {
    const group = event.target.closest('[data-intro-group]');
    if (!group || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const tab = event.target.closest('[role="tab"]');
    if (tab) select(group, tab);
  }, true);

  // Arrow/Home/End keys switch cards while focus is in a tablist; elsewhere
  // the existing book keyboard navigation keeps working.
  document.addEventListener('keydown', event => {
    const tab = event.target.closest('.ace-intro [role="tab"]');
    if (!tab) return;
    const vertical = tab.closest('[role="tablist"]').getAttribute('aria-orientation') === 'vertical';
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', ...(vertical ? ['ArrowUp', 'ArrowDown'] : [])].includes(event.key)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const group = tab.closest('[data-intro-group]');
    const tabs = Array.from(group.querySelectorAll('[role="tab"]'));
    let index = tabs.indexOf(tab);
    if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = tabs.length - 1;
    else {
      const forward = getComputedStyle(tab.closest('[role="tablist"]')).direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
      index = (index + (event.key === forward || event.key === 'ArrowDown' ? 1 : -1) + tabs.length) % tabs.length;
    }
    select(group, tabs[index]);
    tabs[index].focus({ preventScroll: true });
  }, true);

  // Vertical reading keys belong to the focused scroll area. Left/right still
  // turn the book, and the tablist retains its own Home/End behavior above.
  document.addEventListener('keydown', event => {
    const intro = event.target.closest('.ace-intro');
    const reading = intro && readingArea(intro);
    if (!reading || !['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)
      || event.target.closest('button,a,input,textarea,select,[contenteditable]')) return;
    event.stopImmediatePropagation();
  }, true);

  // Keep keyboard focus on the new sheet after an introduction navigation link.
  let focusNextSheet = null;
  document.addEventListener('click', event => {
    const link = event.target.closest('.ace-intro [data-jump]');
    if (!event.defaultPrevented && link) {
      focusNextSheet = introPages.get(link.dataset.jump) || formDestinations.get(link.dataset.jump);
    }
  }, true);
  const stage = document.querySelector('#stage');
  let visibleIntro = null;
  const syncTypewriter = () => {
    if (stage.matches('.is-turning,.is-riffling')) return;
    const current = Array.from(typists.keys()).find(intro => intro.closest('.page[aria-hidden="false"]'));
    if (current === visibleIntro) return;
    typists.get(visibleIntro)?.finish();
    visibleIntro = current;
    if (current) typists.get(current).start(current.querySelector('[role="tabpanel"]:not([hidden])'));
  };
  new MutationObserver(() => {
    syncTypewriter();
    if (!focusNextSheet || stage.matches('.is-turning,.is-riffling')) return;
    requestAnimationFrame(() => {
      if (!focusNextSheet || stage.matches('.is-turning,.is-riffling')) return;
      if (!focusNextSheet.closest('.page[aria-hidden="false"]')) {
        // On a short sheet the Contact heading may precede the form itself.
        // Keep keyboard focus on that visible opening, never on a hidden field.
        const section = focusNextSheet.id === 'contact-form' ? 'contact' : 'community';
        if (!focusNextSheet.matches('form') || stage.dataset.section !== section) return;
        const opening = document.querySelector('#book .page[aria-hidden="false"] h2');
        if (opening) {
          opening.tabIndex = -1;
          opening.focus({ preventScroll: true });
        }
        focusNextSheet = null;
        return;
      }
      // Focus the live sheet, never the page-turn animation's temporary copy.
      if (focusNextSheet.matches('form')) {
        const email = focusNextSheet.querySelector('input[type="email"]');
        email.focus({ preventScroll: true });
        email.scrollIntoView({ block: 'nearest' });
      } else {
        focusNextSheet.querySelector('h2').focus({ preventScroll: true });
        focusNextSheet.querySelector('.ace-intro-reading').scrollTop = 0;
      }
      focusNextSheet = null;
    });
  }).observe(stage, { attributes: true, attributeFilter: ['data-page', 'class'] });
  requestAnimationFrame(syncTypewriter);
})();
