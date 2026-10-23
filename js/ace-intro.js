/* Localized click-to-read cards. No gameplay or stored user data. */
(() => {
  const introPages = new Map(Array.from(document.querySelectorAll('.ace-intro'),
    intro => [intro.parentElement.id, intro]));
  const groups = Array.from(document.querySelectorAll('[data-intro-group]'));
  const navigation = new WeakMap();
  for (const group of groups) {
    const next = group.querySelector('[data-intro-next]');
    navigation.set(group, {
      destination: next.dataset.jump,
      label: next.firstElementChild.textContent,
    });
    updateNext(group);
  }

  function updateNext(group) {
    const tab = group.querySelector('[role="tab"][aria-selected="true"]');
    const next = group.querySelector('[data-intro-next]');
    const original = navigation.get(group);
    next.firstElementChild.textContent = tab.dataset.nextLabel || original.label;
    if (tab.dataset.nextLabel) {
      next.removeAttribute('data-jump');
      next.href = '#' + tab.nextElementSibling.getAttribute('aria-controls');
    } else {
      next.dataset.jump = original.destination;
      next.href = '#' + original.destination;
    }
  }

  function select(group, selected, focusPanel = false) {
    for (const tab of group.querySelectorAll('[role="tab"]')) {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      // Use the live group: the book moves these nodes when resizing.
      group.querySelector('#' + tab.getAttribute('aria-controls')).hidden = !active;
    }
    updateNext(group);
    group.querySelector('.ace-intro-reading').scrollTop = 0;
    if (focusPanel) group.querySelector('#' + selected.getAttribute('aria-controls')).focus({ preventScroll: true });
  }

  document.addEventListener('click', event => {
    const group = event.target.closest('[data-intro-group]');
    if (!group || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const tab = event.target.closest('[role="tab"]');
    if (tab) select(group, tab);
    const next = event.target.closest('[data-intro-next]');
    if (next && !next.hasAttribute('data-jump')) {
      event.preventDefault();
      // Selecting the final card adds data-jump to this same link. Keep this
      // click from also reaching the book's page-navigation listener.
      event.stopPropagation();
      const current = group.querySelector('[role="tab"][aria-selected="true"]');
      select(group, current.nextElementSibling, true);
    }
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

  // Short screens can scroll an introduction sheet without turning the paper.
  // Stop at the sheet so native button/link activation still receives events.
  for (const group of document.querySelectorAll('.ace-intro')) {
    for (const type of ['mousedown', 'touchstart', 'touchmove']) {
      group.addEventListener(type, event => event.stopPropagation(), { passive: true });
    }
  }

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
