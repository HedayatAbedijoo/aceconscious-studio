/* Localized click-to-read cards. No gameplay or stored user data. */
(() => {
  const introPages = new Map(Array.from(document.querySelectorAll('.ace-intro'),
    intro => [intro.parentElement.id, intro]));
  function select(group, selected) {
    for (const tab of group.querySelectorAll('[role="tab"]')) {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      // Use the live group: the book moves these nodes when resizing.
      group.querySelector('#' + tab.getAttribute('aria-controls')).hidden = !active;
    }
    group.querySelector('.ace-intro-reading').scrollTop = 0;
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
