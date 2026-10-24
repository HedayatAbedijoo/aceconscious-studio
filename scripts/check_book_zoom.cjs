#!/usr/bin/env node
/* Local-only zoom proof: all locales, mobile, RTL, keyboard and touch.
 * Run with Playwright on NODE_PATH and CHROME_BIN pointing at Chrome.
 * Only local files and read-only font requests are allowed; no forms are sent.
 */
const { chromium } = require('playwright');
const { revealBookControls } = require('./book_browser_helpers.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const languages = JSON.parse(fs.readFileSync(path.join(root, 'content/languages.json')));
const base = 'http://127.0.0.1:8765';
const out = '/tmp/book-zoom-header-proof';
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true, args: ['--no-sandbox'] });
  const errors = [], fonts = new Map();
  async function context(options) {
    const ctx = await browser.newContext(options);
    await ctx.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (request.method() !== 'GET') return route.abort();
      if (['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) {
        if (!fonts.has(url.href)) {
          const response = await route.fetch();
          fonts.set(url.href, { status: response.status(), headers: response.headers(), body: await response.body() });
        }
        return route.fulfill(fonts.get(url.href));
      }
      if (url.origin !== base) return route.abort();
      const file = path.join(root, decodeURIComponent(url.pathname), url.pathname.endsWith('/') ? 'index.html' : '');
      return fs.existsSync(file) ? route.fulfill({ path: file }) : route.abort();
    });
    ctx.on('page', page => page.on('pageerror', error => errors.push(error.message)));
    return ctx;
  }
  const visible = '.page[aria-hidden="false"]';
  const plus = '#sample-zoom [data-zoom-step="10"]';
  const minus = '#sample-zoom [data-zoom-step="-10"]';
  const index = page => page.locator('#stage').getAttribute('data-page');
  async function open(page, lang) {
    await page.goto(base + (lang === 'en' ? '/' : `/${lang}/`) + '#sample');
    await page.waitForFunction(() => document.querySelector('#stage')?.dataset.section === 'sample');
    await page.waitForFunction(() => !document.querySelector('#stage').matches('.is-turning,.is-riffling'));
    // The cover's slight rotation also animates away on initial load. Wait for
    // it before comparing physical text widths across the zoom animation.
    await page.locator('#stage').evaluate(el => Promise.all(el.getAnimations().map(animation => animation.finished.catch(() => {}))));
  }
  async function measure(page) {
    return page.locator(visible).evaluate(el => {
      const sheet = el.querySelector('.sample-sheet'), inner = sheet.querySelector('.sample-sheet__inner');
      const rect = el => { const { x, y, width, height } = el.getBoundingClientRect(); return { x, y, width, height }; };
      return { paper: rect(el), sheet: rect(sheet), inner: rect(inner), zoom: rect(document.querySelector('#sample-zoom')),
        body: rect(inner.querySelector('.sample-sheet__body')), folio: rect(document.querySelector('#folio')),
        title: rect(el.querySelector('.sample-sheet__head > span')), ribbon: rect(document.querySelector('#close')),
        previous: rect(document.querySelector('#previous')), next: rect(document.querySelector('#next')),
        left: sheet.scrollLeft, top: sheet.scrollTop, scrollWidth: sheet.scrollWidth, scrollHeight: sheet.scrollHeight,
        text: inner.textContent, value: document.querySelector('#sample-zoom output').textContent };
    });
  }
  const ctx = await context({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  for (const [width, height] of (process.argv.includes('--touch-only') ? [] : [[1366, 900], [390, 844], [320, 568], [844, 390]])) {
    await page.setViewportSize({ width, height });
    for (const lang of languages) {
      const label = `${lang.code} ${width}×${height}`;
      await open(page, lang.code);
      const start = await measure(page), original = await index(page);
      assert.ok(await page.locator(minus).isDisabled(), `${label}: 100% is the minimum`);
      assert.ok(start.inner.width <= start.sheet.width + 1 && start.body.y + start.body.height <= start.sheet.y + start.sheet.height + 1,
        `${label}: the complete text area and footnotes must fit at 100%`);
      assert.ok(Math.abs(start.scrollWidth - start.sheet.width) <= 1, `${label}: no blank horizontal overflow at 100%`);
      assert.ok(start.zoom.width <= (width <= 1100 ? 110 : 70) && start.zoom.height <= 22, `${label}: slim controls`);
      assert.ok(Math.abs((start.zoom.x + start.zoom.width / 2) - (start.paper.x + start.paper.width / 2)) < 1,
        `${label}: centered on the header in LTR and RTL: ${JSON.stringify({paper:start.paper, zoom:start.zoom})}`);
      assert.ok(start.zoom.y >= start.paper.y + 2, `${label}: inside the top paper edge`);
      assert.ok(start.title.y >= start.paper.y + 2, `${label}: running title stays inside the paper`);
      assert.ok(start.title.y + start.title.height + 4 <= start.zoom.y + start.zoom.height / 2,
        `${label}: running title sits above the header rule`);
      assert.ok(start.title.x >= start.ribbon.x + start.ribbon.width
        || start.title.x + start.title.width <= start.ribbon.x
        || start.title.y >= start.ribbon.y + start.ribbon.height,
        `${label}: running title and printed folio clear the ribbon`);
      assert.ok(start.zoom.y + start.zoom.height + 1 <= start.sheet.y, `${label}: scrolling text stays below controls`);
      assert.ok(start.sheet.y + start.sheet.height <= start.folio.y - 1, `${label}: footer has its own space`);
      for (const control of [start.next, start.previous, start.ribbon]) {
        assert.ok(start.zoom.x >= control.x + control.width || start.zoom.x + start.zoom.width <= control.x
          || start.zoom.y + start.zoom.height <= control.y,
          `${label}: clear of navigation touch targets`);
      }
      await page.locator('#sample-zoom output').click();
      assert.equal(await index(page), original, `${label}: percentage must not turn the paper`);
      for (const percentage of [110, 120, 130]) {
        await revealBookControls(page);
        await page.locator(plus).click();
        const current = await measure(page);
        assert.ok(Math.abs(current.inner.width / start.inner.width - percentage / 100) < 0.002,
          `${label}: + must enlarge exactly 10 percentage points (${current.inner.width} / ${start.inner.width} at ${percentage}, display ${current.value})`);
        assert.equal(current.value, new Intl.NumberFormat(lang.code, { useGrouping: false }).format(percentage));
        assert.equal(current.text, start.text, `${label}: preserve the original sample`);
        assert.equal(await index(page), original, `${label}: zoom must not turn pages`);
      }
      if (['en', 'fa', 'ar', 'de'].includes(lang.code) && [1366, 390].includes(width)) {
        await page.screenshot({ path: `${out}/${lang.code}-${width}-130.png` });
      }
      const forward = ['fa', 'ar'].includes(lang.code) ? 'ArrowLeft' : 'ArrowRight';
      const backward = ['fa', 'ar'].includes(lang.code) ? 'ArrowRight' : 'ArrowLeft';
      async function assertZoom(percentage, message) {
        // Moving off the corner lets the renderer discard its hover-fold copy.
        await page.mouse.move(0, 0);
        await page.waitForFunction(() => document.querySelectorAll('.page[aria-hidden="false"]').length === 1
          && !document.querySelector('#stage').matches('.is-turning,.is-riffling'));
        const state = await measure(page);
        assert.equal(state.value, new Intl.NumberFormat(lang.code, { useGrouping: false }).format(percentage), `${label}: ${message}`);
        assert.ok(Math.abs(state.inner.width / start.inner.width - percentage / 100) < 0.002,
          `${label}: ${message}, rendered scale`);
      }
      await page.locator('#next').click();
      assert.equal(Number(await index(page)), Number(original) + 1);
      await assertZoom(130, 'next page preserves zoom');
      await page.locator(minus).click();
      await page.keyboard.press(backward);
      assert.equal(await index(page), original);
      await assertZoom(120, 'previous page uses the latest zoom');
      await page.keyboard.press(forward);
      await assertZoom(120, 'keyboard next preserves zoom');
      await page.locator('#previous').click();
      await assertZoom(120, 'previous button preserves zoom');
      await revealBookControls(page);
      await page.locator(plus).click();
      await page.locator(minus).focus();
      await page.keyboard.press('Enter');
      await page.keyboard.press('Space');
      await page.locator(minus).click();
      const normal = await measure(page);
      assert.ok(await page.locator(minus).isDisabled(), `${label}: keyboard returns to 100%`);
      assert.ok(Math.abs(normal.inner.width - start.inner.width) < 0.1, `${label}: exact normal size restored`);
      assert.equal(normal.top, 0);
      assert.equal(normal.left, 0);
      if (['en', 'fa'].includes(lang.code) && [1366, 390].includes(width)) {
        await page.screenshot({ path: `${out}/${lang.code}-${width}-100.png` });
      }
      // The exact note-heavy pages reported by the reader, including small
      // landscape: prove that long chapter titles and footnotes remain clear.
      if (['en', 'fa'].includes(lang.code)) {
        await page.goto(base + (lang.code === 'en' ? '/' : '/fa/') + '#sample-' + (lang.code === 'fa' ? '04' : '02'));
        await page.locator(`${visible} .sample-notes`).waitFor({ state: 'visible' });
        const notes = await page.locator(`${visible} .sample-notes`).boundingBox();
        const normalNotes = await measure(page);
        assert.ok(normalNotes.title.y + normalNotes.title.height + 4 <= normalNotes.zoom.y + normalNotes.zoom.height / 2,
          `${label}: long chapter name sits above the header rule`);
        assert.ok(notes.y + notes.height < normalNotes.sheet.y + normalNotes.sheet.height, `${label}: complete footnotes at 100%`);
        await page.screenshot({path: `${out}/${lang.code}-${width}-notes-100.png`});
        await page.locator(plus).evaluate(button => { for (let i = 0; i < 10; i++) button.click(); });
        await page.locator(`${visible} .sample-sheet`).evaluate(sheet => { sheet.scrollTop = sheet.scrollHeight; });
        const enlargedNotes = await page.locator(`${visible} .sample-notes`).boundingBox();
        const zoomedNotes = await measure(page);
        assert.ok(enlargedNotes.y > zoomedNotes.sheet.y
          && enlargedNotes.y + enlargedNotes.height < zoomedNotes.sheet.y + zoomedNotes.sheet.height,
          `${label}: zoomed footnotes remain accessible within the reading area`);
        await page.screenshot({path: `${out}/${lang.code}-${width}-notes-200.png`});
      }
      await revealBookControls(page);
      await page.locator(plus).click();
      await page.locator('.bookmark[data-section="story"]').click();
      await page.waitForFunction(() => document.querySelector('#stage').dataset.section === 'story');
      assert.ok(await page.locator('#sample-zoom').isHidden(), `${label}: no zoom controls on other sections`);
      await page.locator('.bookmark[data-section="sample"]').click();
      await page.waitForFunction(() => document.querySelector('#stage').dataset.section === 'sample');
      await assertZoom(100, 'returning from another section resets zoom');
      assert.ok(await page.locator(minus).isDisabled());
    }
    console.log(`PASS: all nine languages at ${width}×${height}; 10% steps, minimum, placement and keyboard.`);
  }
  await ctx.close();

  const touch = await context({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mobile = await touch.newPage();
  for (const lang of ['en', 'fa', 'ar']) {
    await open(mobile, lang);
    const initial = await measure(mobile), original = await index(mobile);
    const frames = await mobile.locator(plus).evaluate(button => new Promise(resolve => {
      const inner = document.querySelector('.page[aria-hidden="false"] .sample-sheet__inner');
      const widths = [inner.getBoundingClientRect().width], start = performance.now();
      button.click();
      const sample = now => {
        widths.push(inner.getBoundingClientRect().width);
        if (now - start < 230) requestAnimationFrame(sample);
        else resolve(widths);
      };
      requestAnimationFrame(sample);
    }));
    assert.ok(frames.some(width => width > frames[0] * 1.001 && width < frames[0] * 1.099),
      `${lang}: animate through intermediate sizes`);
    assert.ok(Math.abs(frames.at(-1) / frames[0] - 1.1) < 0.002, `${lang}: smooth step ends at 110%: ${JSON.stringify(frames)}`);
    await mobile.locator(minus).tap();
    await mobile.waitForTimeout(230);
    // Rapid input must accumulate steps, even while the prior step is animating.
    await mobile.locator(plus).evaluate(button => { for (let i = 0; i < 20; i++) button.click(); });
    await mobile.waitForTimeout(230);
    const enlarged = await measure(mobile);
    assert.ok(Math.abs(enlarged.inner.width / initial.inner.width - 3) < 0.002);
    assert.equal(await index(mobile), original);
    assert.notEqual(await mobile.locator(`${visible} .sample-sheet`).evaluate(el => getComputedStyle(el).cursor), 'grab',
      `${lang}: touch retains its native cursor and scrolling`);
    const box = enlarged.sheet;
    const cdp = await touch.newCDPSession(mobile);
    const sign = lang === 'fa' ? 1 : -1;
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 6; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + sign * i * 12, y: y - i * 15 }] });
      await mobile.waitForTimeout(24);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await mobile.waitForTimeout(300);
    const scrolled = await measure(mobile);
    assert.ok(Math.abs(scrolled.left - enlarged.left) > 20 && scrolled.top > enlarged.top + 20,
      `${lang}: enlarged sample scrolls in both axes on touch`);
    assert.equal(await index(mobile), original, `${lang}: scrolling must not turn pages`);
    assert.equal(await mobile.locator('.sample-sheet.is-panning').count(), 0, `${lang}: touch does not start mouse panning`);
    await mobile.locator(minus).tap();
    await mobile.waitForTimeout(230);
    assert.ok(Math.abs((await measure(mobile)).inner.width / initial.inner.width - 2.9) < 0.002);
    await mobile.keyboard.press(lang === 'en' ? 'ArrowRight' : 'ArrowLeft');
    await mobile.waitForTimeout(1000);
    assert.equal(Number(await index(mobile)), Number(original) + 1);
    assert.ok(Math.abs((await measure(mobile)).inner.width / initial.inner.width - 2.9) < 0.002,
      `${lang}: mobile next preserves zoom`);
    await mobile.keyboard.press(lang === 'en' ? 'ArrowLeft' : 'ArrowRight');
    await mobile.waitForTimeout(1000);
    assert.ok(Math.abs((await measure(mobile)).inner.width / initial.inner.width - 2.9) < 0.002,
      `${lang}: mobile previous preserves zoom`);
    await revealBookControls(mobile);
    await mobile.locator('.bookmark[data-section="story"]').tap();
    await mobile.waitForFunction(() => document.querySelector('#stage').dataset.section === 'story'
      && !document.querySelector('#stage').matches('.is-turning,.is-riffling'));
    await revealBookControls(mobile);
    await mobile.locator('.bookmark[data-section="sample"]').tap();
    await mobile.waitForFunction(() => document.querySelector('#stage').dataset.section === 'sample'
      && !document.querySelector('#stage').matches('.is-turning,.is-riffling'));
    assert.ok(await mobile.locator(minus).isDisabled(), `${lang}: leaving the sample resets zoom`);
    await cdp.detach();
  }
  await touch.close();
  assert.deepEqual(errors, []);
  await browser.close();
  console.log(`PASS: smooth rapid input, touch scrolling, zoom persistence within samples, section-exit reset and zero browser errors. Proofs: ${out}`);
})().catch(error => { console.error(error); process.exit(1); });
