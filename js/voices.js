/* Progressively enhanced character reader using the page's translated content. */
(function () {
  'use strict';
  const rtl = document.documentElement.dir === 'rtl';
  const section = document.getElementById('voices');
  const player = section?.querySelector('.characters-grid');
  if (!player) return;
  const cards = Array.from(player.querySelectorAll('.character-card'));
  if (!cards.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 900px)');
  const tabs = document.createElement('div');
  tabs.className = 'voices-player__tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', window.aceI18n.getString('voices.label'));
  const segmenter = typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(document.documentElement.lang, {granularity:'grapheme'}) : null;
  let finishTyping = () => {};
  const sources = [];
  const buttons = cards.map((card, i) => {
    const name = card.querySelector('.character-card__name');
    const role = card.querySelector('.character-card__role');
    const body = card.querySelector('.character-card__body');
    const copy = document.createElement('div');
    copy.className = 'voices-player__copy';
    copy.append(...body.childNodes);
    body.append(copy);
    sources.push(copy);
    const identity = document.createElement('div');
    name.before(identity);
    identity.append(name, role);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'voices-player__tab';
    button.id = `voice-tab-${i}`;
    button.textContent = name.textContent;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', `voice-panel-${i}`);
    card.id = `voice-panel-${i}`;
    card.setAttribute('role', 'tabpanel');
    card.setAttribute('aria-labelledby', button.id);
    body.tabIndex = 0;
    body.setAttribute('role', 'region');
    body.setAttribute('aria-label', `${name.textContent} — ${role.textContent}`);
    const skip = document.createElement('button');
    skip.type = 'button';
    skip.className = 'voices-player__skip';
    skip.textContent = window.aceI18n.getString('voices.showFull');
    skip.hidden = true;
    skip.addEventListener('click', () => { finishTyping(); body.focus({preventScroll:true}); });
    card.querySelector('header').append(skip);
    button.addEventListener('click', () => select(i));
    tabs.append(button);
    return button;
  });

  function type(card, source) {
    const body = source.parentElement;
    const skip = card.querySelector('.voices-player__skip');
    const visual = source.cloneNode(true);
    visual.setAttribute('aria-hidden', 'true');
    source.classList.add('voices-player__copy--accessible');
    body.append(visual);
    const walker = document.createTreeWalker(visual, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      const text = walker.currentNode.data;
      const characters = segmenter ? Array.from(segmenter.segment(text), item => item.segment) : Array.from(text);
      nodes.push({node:walker.currentNode, text:characters});
    }
    const total = nodes.reduce((sum, item) => sum + item.text.length, 0);
    nodes.forEach(item => { item.node.data = ''; });
    const cursor = document.createElement('span');
    cursor.className = 'voices-player__cursor';
    let frame;
    let start;
    skip.hidden = false;
    finishTyping = () => {
      cancelAnimationFrame(frame);
      visual.remove();
      source.classList.remove('voices-player__copy--accessible');
      if (document.activeElement === skip) body.focus({preventScroll:true});
      skip.hidden = true;
      finishTyping = () => {};
    };
    function tick(time) {
      start ??= time;
      let remaining = Math.floor(total * Math.min(1, (time - start) / 1400));
      let active;
      for (const item of nodes) {
        const length = Math.min(item.text.length, remaining);
        item.node.data = item.text.slice(0, length).join('');
        remaining -= length;
        if (length) active = item.node;
      }
      if (active) active.parentNode.insertBefore(cursor, active.nextSibling);
      if (time - start >= 1400) finishTyping();
      else frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
  }

  function select(index, animate = true) {
    finishTyping();
    cards.forEach((card, i) => {
      card.hidden = i !== index;
      buttons[i].setAttribute('aria-selected', String(i === index));
      buttons[i].tabIndex = i === index ? 0 : -1;
    });
    sources[index].parentElement.scrollTop = 0;
    if (animate && !reduced.matches) type(cards[index], sources[index]);
  }
  tabs.addEventListener('keydown', event => {
    const index = buttons.indexOf(event.target);
    if (index < 0) return;
    let next;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = cards.length - 1;
    if (event.key === (narrow.matches ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight')) next = (index + 1) % cards.length;
    if (event.key === (narrow.matches ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft')) next = (index - 1 + cards.length) % cards.length;
    if (next === undefined) return;
    event.preventDefault();
    buttons[next].focus({preventScroll:true});
    select(next);
  });
  function orientation() { tabs.setAttribute('aria-orientation', narrow.matches ? 'vertical' : 'horizontal'); }
  narrow.addEventListener('change', orientation);
  reduced.addEventListener('change', () => { if (reduced.matches) finishTyping(); });
  orientation();
  player.prepend(tabs);
  player.classList.add('voices-player');
  select(0, false);
})();
