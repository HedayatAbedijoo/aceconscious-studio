/* Localized click-to-read cards. No gameplay or stored user data. */
(() => {
  const introPages = new Map(Array.from(document.querySelectorAll('.ace-intro'),
    intro => [intro.parentElement.id, intro]));
  // A persistent cue sits outside the scrolling text. Native mobile scrollbars
  // disappear at rest, and an arrow inside the text would scroll out of view.
  const scrollUpdates = new Map();
  for (const intro of introPages.values()) {
    const reading = intro.querySelector('.ace-intro-reading');
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
    observer.observe(reading);
    for (const child of reading.children) observer.observe(child);
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
    group.querySelector('.ace-intro-reading').scrollTop = 0;
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
    if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const group = tab.closest('[data-intro-group]');
    const tabs = Array.from(group.querySelectorAll('[role="tab"]'));
    let index = tabs.indexOf(tab);
    if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = tabs.length - 1;
    else {
      const forward = getComputedStyle(group).direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
      index = (index + (event.key === forward ? 1 : -1) + tabs.length) % tabs.length;
    }
    select(group, tabs[index]);
    tabs[index].focus({ preventScroll: true });
  }, true);

  // Vertical reading keys belong to the focused scroll area. Left/right still
  // turn the book, and the tablist retains its own Home/End behavior above.
  document.addEventListener('keydown', event => {
    const reading = event.target.closest('.ace-intro-reading');
    if (!reading || reading.scrollHeight <= reading.clientHeight + 2
      || !['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)
      || event.target.closest('button,a,input,textarea,select,[contenteditable]')) return;
    event.stopImmediatePropagation();
  }, true);

  // Keep keyboard focus on the new sheet after an introduction navigation link.
  let focusNextSheet = null;
  document.addEventListener('click', event => {
    const link = event.target.closest('.ace-intro [data-jump]');
    if (!event.defaultPrevented && link) focusNextSheet = introPages.get(link.dataset.jump);
  }, true);
  const stage = document.querySelector('#stage');
  new MutationObserver(() => {
    if (!focusNextSheet || stage.matches('.is-turning,.is-riffling')) return;
    requestAnimationFrame(() => {
      if (!focusNextSheet || stage.matches('.is-turning,.is-riffling')
        || !focusNextSheet.closest('.page[aria-hidden="false"]')) return;
      // Focus the live sheet, never the page-turn animation's temporary copy.
      focusNextSheet.querySelector('h2').focus({ preventScroll: true });
      focusNextSheet.querySelector('.ace-intro-reading').scrollTop = 0;
      focusNextSheet = null;
    });
  }).observe(stage, { attributes: true, attributeFilter: ['data-page', 'class'] });
})();
