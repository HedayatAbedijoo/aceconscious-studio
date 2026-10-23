/* Local typography proof: real fonts, every review sheet, and story headings.
 * NODE_PATH supplies Playwright; CHROME_BIN selects the installed browser.
 * No form submissions or remote writes. Screenshots and a gallery stay in /tmp.
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const base = 'http://127.0.0.1:8765';
const out = process.env.BOOK_PROOF_DIR || '/tmp/book-review-proof';
const registry = JSON.parse(fs.readFileSync(path.join(root, 'content/languages.json')));
const languages = registry.filter(lang => !process.env.BOOK_PROOF_LANGS || process.env.BOOK_PROOF_LANGS.split(',').includes(lang.code));
const sizes = process.argv.includes('--smoke') ? [[599,865],[390,844]] :
  [[1366,900],[1024,768],[768,1024],[599,865],[390,844],[320,568],[844,390]];
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const fonts = new Map();
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (route.request().method() !== 'GET') return route.abort();
    if (['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname)) {
      // Request interception disables the browser cache. Reuse identical font
      // responses across the proof matrix, keeping the actual font bytes.
      if (!fonts.has(url.href)) fonts.set(url.href, route.fetch().then(async response => ({
        status: response.status(), headers: response.headers(), body: await response.body(),
      })));
      return route.fulfill(await fonts.get(url.href));
    }
    if (url.origin !== base) return route.abort();
    const file = path.join(root, decodeURIComponent(url.pathname), url.pathname.endsWith('/') ? 'index.html' : '');
    return fs.existsSync(file) ? route.fulfill({ path: file }) : route.abort();
  });
  const page = await context.newPage(), errors = [], results = [], failures = [];
  page.on('pageerror', e => errors.push(e.message));
  const settled = () => page.waitForFunction(() => document.querySelector('#stage')?.dataset.page !== undefined
    && !document.querySelector('#stage').matches('.is-turning,.is-riffling'));
  const active = () => page.locator('#book .page[aria-hidden="false"]');
  const record = (ok, message) => { if (!ok) failures.push(message); };
  const checkBounds = () => active().evaluate(el => {
    const body = el.querySelector('.page-body'), b = body.getBoundingClientRect();
    const range = document.createRange(); range.selectNodeContents(body);
    const c = range.getBoundingClientRect();
    return c.bottom <= b.bottom + 3 && c.left >= b.left - 3 && c.right <= b.right + 3;
  });

  for (const [width,height] of sizes) {
    await page.setViewportSize({ width, height });
    for (const lang of languages) {
      const label = `${lang.code} ${width}×${height}`, images = [];
      const filename = lang.code === 'en' ? 'index.html' : `${lang.code}/index.html`;
      await page.goto(base + (lang.code === 'en' ? '/' : `/${lang.code}/`) + '#reviews');
      await settled();
      await page.evaluate(() => document.fonts.ready);
      const textPreserved = await page.evaluate(html => {
        const source = new DOMParser().parseFromString(html, 'text/html');
        const normalize = text => text.replace(/\s/g, '');
        return [...source.querySelectorAll('#book-source [data-section="reviews"]')].every(item => {
          const pieces = [...document.querySelectorAll('#book .review-entry')].filter(entry => entry.dataset.reviewId === item.id);
          const text = pieces.map(entry => {
            const copy = entry.cloneNode(true);
            copy.querySelectorAll('.continued').forEach(mark => mark.remove());
            return copy.textContent;
          }).join('');
          return normalize(item.textContent) === normalize(text);
        });
      }, fs.readFileSync(path.join(root, filename), 'utf8'));
      record(textPreserved, `${label}: review text changed during pagination`);
      let reviewCount = 0, paired = false;
      while (await page.locator('#stage').getAttribute('data-section') === 'reviews') {
        const ids = await active().locator('.review-entry').evaluateAll(entries => entries.map(entry => entry.dataset.reviewId));
        record(!ids.includes('reviews') || ids.length === 1, `${label}: Kirkus shares a page`);
        paired ||= ids.includes('booklife-2026') && ids.includes('consciousness-2026');
        record(await checkBounds(), `${label}: review ${reviewCount + 1} overflows`);
        const image = `${lang.code}-${width}x${height}-review-${++reviewCount}.png`;
        await page.screenshot({ path: path.join(out, image), animations: 'disabled' });
        images.push(image);
        const before = Number(await page.locator('#stage').getAttribute('data-page'));
        await page.keyboard.press(lang.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
        await settled();
        assert.equal(Number(await page.locator('#stage').getAttribute('data-page')), before + 1, `${label}: keyboard direction`);
        if (reviewCount > 15) throw Error(`${label}: review navigation did not end`);
      }
      const book = await page.locator('#shell').boundingBox();
      if (book.width >= 400 && book.height >= 700) record(paired, `${label}: short reviews should share the full-size sheet`);
      await page.locator('.bookmark[data-section="story"]').click();
      await settled();
      const titleClear = await active().locator('.story-heading').evaluate(el => {
        const range = document.createRange(); range.selectNodeContents(el.querySelector('h2'));
        const t = range.getBoundingClientRect(), y = el.querySelector('.story-year').getBoundingClientRect();
        return t.right <= y.left || t.left >= y.right || t.bottom <= y.top || t.top >= y.bottom;
      });
      record(titleClear, `${label}: story title overlaps 2313`);
      record(await checkBounds(), `${label}: story overflows`);
      const storyImage = `${lang.code}-${width}x${height}-story.png`;
      await page.screenshot({ path: path.join(out, storyImage), animations: 'disabled' });
      images.push(storyImage);
      results.push({ lang: lang.code, width, height, reviewCount, paired, titleClear, textPreserved, images });
      console.log(`${label}: ${reviewCount} review sheets; paired=${paired}; heading clear=${titleClear}; text intact=${textPreserved}`);
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ results, errors, failures }, null, 2));
  fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Book typography proof</title>
    <style>body{margin:24px;background:#e8e3da;color:#332f28;font:16px system-ui}section{margin:32px 0}h2{font-size:18px}.pages{display:flex;gap:12px;overflow:auto}img{height:580px;max-width:100%;object-fit:contain;object-position:top}a{color:inherit}p{max-width:75ch}</style>
    <h1>Book typography proof</h1><p>Local screenshots with the actual web fonts. Each group contains every review page, followed by the story heading. English is the first reference in each viewport group.</p>
    ${results.map(row => `<section><h2>${row.lang} · ${row.width} × ${row.height} · ${row.reviewCount} review pages</h2><div class="pages">${row.images.map(src => `<a href="${src}"><img loading="lazy" src="${src}" alt="${src}"></a>`).join('')}</div></section>`).join('')}`);
  assert.deepEqual(errors, [], 'Browser errors');
  assert.deepEqual(failures, [], 'Typography proof failures');
  console.log(`PASS ${results.length} language/viewport combinations. Proof: ${out}/index.html`);
})().catch(error => { console.error(error); process.exit(1); });
