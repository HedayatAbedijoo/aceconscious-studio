(function () {
  'use strict';
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const language = link.dataset.setLang;
    if (language && ['en', 'de', 'fa'].includes(language)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (parent !== window) parent.postMessage({ type: 'media-preview-language', language }, location.origin);
      else location.assign(`/previews/media-reviews/view/${language}/${location.pathname.split('/').pop()}${location.search}${location.hash}`);
      return;
    }
    const target = new URL(link.href);
    if (target.origin === location.origin && target.hash) {
      const section = document.getElementById(target.hash.slice(1));
      if (section) {
        event.preventDefault();
        history.replaceState(null, '', location.pathname + location.search + target.hash);
        section.scrollIntoView({ behavior: 'instant' });
      }
    }
  }, true);
  document.addEventListener('DOMContentLoaded', () => {
    const section = document.getElementById('reviews');
    if (new URLSearchParams(location.search).get('review') === '2') section.querySelector('[data-review-next]').click();
    const sync = () => {
      const review = section.querySelector('[data-review-id="consciousness-2026"]').hidden ? '1' : '2';
      const params = new URLSearchParams(location.search);
      params.set('review', review);
      history.replaceState(null, '', location.pathname + '?' + params + location.hash);
      if (parent !== window) parent.postMessage({ type: 'media-preview-review', review }, location.origin);
    };
    new MutationObserver(sync).observe(section.querySelector('.reviews__counter'), { childList: true, characterData: true, subtree: true });
    document.fonts.ready.then(() => {
      if (location.hash === '#reviews') section.scrollIntoView({ behavior: 'instant' });
    });
  });
})();
