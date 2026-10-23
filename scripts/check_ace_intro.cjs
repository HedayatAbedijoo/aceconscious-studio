#!/usr/bin/env node
/* Local-only browser regression. Run with Playwright on NODE_PATH and, if
 * needed, CHROME_BIN pointing to an installed Chromium. No server or uploads. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = 'http://127.0.0.1:8765';
const output = '/tmp/ace-intro-locales-qa';
const languages = JSON.parse(fs.readFileSync(path.join(root, 'content/languages.json'), 'utf8'));
const expectedOrder = ['headline', 'reviews', 'story', 'ace', 'author', 'buy', 'community', 'contact', 'sample', 'back-cover'];

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || undefined,
    headless: true, args: ['--no-sandbox'] });
  const errors = [];
  async function context(options) {
    const ctx = await browser.newContext(options);
    await ctx.route('**/*', route => {
      const request = route.request(), url = new URL(request.url());
      if (request.method() !== 'GET') return route.abort();
      if (process.argv.includes('--fonts') && ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
      if (url.origin !== base) return route.abort();
      const file = path.join(root, decodeURIComponent(url.pathname), url.pathname.endsWith('/') ? 'index.html' : '');
      return fs.existsSync(file) ? route.fulfill({ path: file }) : route.abort();
    });
    ctx.on('page', page => page.on('pageerror', error => errors.push(error.message)));
    return ctx;
  }
  async function settled(page) {
    await page.waitForFunction(() => !document.querySelector('#stage').matches('.is-turning,.is-riffling'));
    await page.waitForTimeout(150);
  }
  async function open(page, target = '/#ace') {
    await page.goto(base + target);
    await page.waitForFunction(() => document.querySelector('#stage')?.dataset.section === 'ace');
    await settled(page);
  }
  const sheet = page => page.locator('.ace-intro-page[aria-hidden="false"]');
  const selected = page => sheet(page).locator('[role="tab"][aria-selected="true"]').getAttribute('id');
  const cases = languages.flatMap(lang => [[1366, 900], [390, 844]].map(size => [lang, ...size]));
  for (const code of ['en', 'fa']) {
    const lang = languages.find(item => item.code === code);
    cases.push([lang, 320, 568], [lang, 844, 390]);
  }
  for (const [lang, width, height] of cases) {
    const code = lang.code, rtl = lang.dir === 'rtl';
    const home = code === 'en' ? '/' : `/${code}/`;
    const copy = JSON.parse(fs.readFileSync(path.join(root, `content/book/ace-intro.${code}.json`), 'utf8'));
    const ctx = await context({ viewport: { width, height }, reducedMotion: 'reduce', hasTouch: width < 500 });
    const page = await ctx.newPage();
    await open(page, home + '#ace');
    assert.deepEqual(await page.locator('.bookmark').evaluateAll(tabs => tabs.map(tab => tab.dataset.section)), expectedOrder);
    assert.equal(await page.locator('.ace-intro [data-i18n="back"], .ace-intro-back').count(), 0);
    assert.equal(await page.locator('[data-intro-next], [data-next-label], [data-intro-group] .ace-intro-nav').count(), 0);
    // The ordinary previous/next controls follow the same order as the tabs.
    await page.locator('#previous').click();
    await settled(page);
    assert.equal(await page.locator('#stage').getAttribute('data-section'), 'story');
    await page.locator('#next').click();
    await settled(page);
    assert.equal(await page.locator('#stage').getAttribute('data-section'), 'ace');
    assert.equal(await page.locator('.ace-intro-page').count(), 4, 'ACE must stay four physical book sheets');
    assert.equal(await sheet(page).locator('h2').textContent(), copy['concepts.title']);
    assert.equal(await selected(page), 'intro-tab-agency');
    // Tab arrows must select a card, without turning the surrounding book.
    await page.locator('#intro-tab-agency').focus();
    const initialPage = await page.locator('#stage').getAttribute('data-page');
    await page.keyboard.press(rtl ? 'ArrowLeft' : 'ArrowRight');
    assert.equal(await selected(page), 'intro-tab-connection');
    assert.equal(await page.locator('#stage').getAttribute('data-page'), initialPage);
    await page.keyboard.press('End');
    assert.equal(await selected(page), 'intro-tab-exchange');
    await page.keyboard.press('Home');
    assert.equal(await selected(page), 'intro-tab-agency');
    await page.locator('#intro-tab-agency').blur();

    for (const [anchor, cards] of [
      ['ace', ['agency', 'connection', 'exchange']],
      ['ace-pdaf', ['preparation', 'decision', 'action', 'feedback']],
      ['ace-phases', ['exploration', 'stabilization', 'expansion', 'integration']],
    ]) {
      assert.equal(new URL(page.url()).hash, '#' + anchor);
      await page.screenshot({ path: `${output}/${code}-${width}-${anchor}.png` });
      for (const card of cards) {
        await sheet(page).locator('#intro-tab-' + card).click();
        assert.equal(await selected(page), 'intro-tab-' + card);
        assert.equal(new URL(page.url()).hash, '#' + anchor, 'Selecting a card keeps the current book page');
        const panel = page.locator('#intro-panel-' + card);
        assert.equal(await sheet(page).locator('[role="tabpanel"]:visible').count(), 1);
        assert.equal(await panel.locator('.ace-intro-example p').textContent(), copy[card + '.example']);
        assert.equal(await panel.locator('.ace-intro-definition').textContent(), copy[card + '.body']);
        assert.equal(await panel.locator('h3').textContent(), copy[card + '.heading']);
        assert.ok(await sheet(page).locator('[role="tab"] > span').evaluateAll(labels => labels.every(label => label.scrollWidth <= label.clientWidth + 1)), `Tab label overflow: ${code}, ${width}`);
        // Every line stays in a scrollable reading area, including narrow and
        // landscape screens; no horizontal clipping or fitted tiny text.
        assert.equal(await sheet(page).locator('.page-fit').count(), 0);
        const bounds = await sheet(page).locator('.ace-intro-reading').evaluate(el => ({
          width: el.clientWidth, content: el.scrollWidth,
          reachable: getComputedStyle(el).overflowY === 'auto',
        }));
        assert.ok(bounds.content <= bounds.width + 1, `Horizontal clipping at ${width}, ${card}`);
        assert.ok(bounds.reachable);
        await panel.locator('.ace-intro-example').scrollIntoViewIfNeeded();
      }
      await page.locator('#next').click();
      await settled(page);
    }
    assert.equal(new URL(page.url()).hash, '#ace-play');
    assert.equal(await sheet(page).locator('.ace-intro-play').getAttribute('href'), home);
    assert.ok(await sheet(page).locator('.ace-intro-play').evaluate(el => {
      const link = el.getBoundingClientRect(), paper = el.closest('.page-body').getBoundingClientRect();
      return link.top >= paper.top && link.bottom <= paper.bottom;
    }), 'The play invitation stays visible on a small screen');
    assert.equal(await sheet(page).locator('input,textarea,form').count(), 0);
    await page.screenshot({ path: `${output}/${code}-${width}-ace-play.png` });
    await page.locator('#next').click();
    await settled(page);
    assert.equal(await page.locator('#stage').getAttribute('data-section'), 'author');
    await page.locator('#previous').click();
    await settled(page);
    assert.equal(new URL(page.url()).hash, '#ace-play');
    await sheet(page).getByRole('link', { name: copy.restart }).click();
    await settled(page);
    await page.locator('#intro-tab-connection').click();
    await page.setViewportSize({ width: width + 5, height });
    await page.waitForTimeout(450);
    await settled(page);
    assert.equal(await selected(page), 'intro-tab-connection', 'A resize keeps the live card selection');
    await page.locator('#intro-tab-connection').blur();
    await page.keyboard.press(rtl ? 'ArrowLeft' : 'ArrowRight');
    await settled(page);
    assert.equal(new URL(page.url()).hash, '#ace-pdaf', 'Book keyboard navigation works outside the tabs');
    await ctx.close();
    console.log(`PASS ${code} ${width}×${height}: book order, four sheets, every translation/card, keyboard, navigation, resize, bounds.`);
  }
  // A real touch scroll must not turn the book while reading a card.
  const touch = await context({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  const phone = await touch.newPage();
  await open(phone);
  const before = await phone.locator('#stage').getAttribute('data-page');
  const cdp = await touch.newCDPSession(phone);
  const bounds = await phone.locator('#intro-panel-agency').boundingBox();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bounds.x + 50, y: bounds.y + 70 }] });
  for (let i = 1; i <= 6; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: bounds.x + 50, y: bounds.y + 70 - i * 18 }] });
    await phone.waitForTimeout(30);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert.equal(await phone.locator('#stage').getAttribute('data-page'), before);
  assert.ok(await phone.locator('[data-intro-group="concepts"] .ace-intro-reading').evaluate(el => el.scrollTop > 0));
  await touch.close();
  console.log('PASS mobile touch: card content scrolls without a page turn.');

  const nojs = await context({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await nojs.newPage();
  for (const lang of languages) {
    await page.goto(base + (lang.code === 'en' ? '/' : `/${lang.code}/`) + '#ace');
    assert.equal(await page.locator('.ace-intro-panel:visible').count(), 11);
  }
  await nojs.close();
  assert.deepEqual(errors, []);
  await browser.close();
  console.log('PASS no JavaScript: all definitions are readable. No browser errors.');
})().catch(error => { console.error(error); process.exit(1); });
