(function () {
  'use strict';
  const params = new URLSearchParams(location.search);
  const design = 'a';
  let language = ['en', 'de', 'fa'].includes(params.get('language')) ? params.get('language') : 'en';
  const frame = document.getElementById('preview-frame');
  const width = document.getElementById('preview-width');
  const review = document.getElementById('preview-review');
  if (['390', '320', '768'].includes(params.get('width'))) width.value = params.get('width');
  if (params.get('review') === '1') review.value = '1';
  function update(reload = true) {
    document.querySelectorAll('[data-language]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.language === language)));
    history.replaceState(null, '', '?' + new URLSearchParams({ design, language, width: width.value, review: review.value }));
    const src = `/previews/media-reviews/view/${language}/${design}.html?review=${review.value}#reviews`;
    frame.style.width = width.value === 'window' ? '100%' : width.value + 'px';
    frame.title = `ACE.await · Design ${design.toUpperCase()} · ${language} · Review ${review.value}`;
    if (reload && frame.getAttribute('src') !== src) frame.src = src;
    document.getElementById('open-preview').href = src;
  }
  document.querySelectorAll('[data-language]').forEach(b => b.addEventListener('click', () => { language = b.dataset.language; update(); }));
  width.addEventListener('change', () => update(false));
  review.addEventListener('change', () => update());
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
    if (event.data?.type === 'media-preview-language' && ['en', 'de', 'fa'].includes(event.data.language)) {
      language = event.data.language;
      update();
    }
    if (event.data?.type === 'media-preview-review' && ['1', '2'].includes(event.data.review)) {
      review.value = event.data.review;
      update(false);
    }
  });
  update();
})();
