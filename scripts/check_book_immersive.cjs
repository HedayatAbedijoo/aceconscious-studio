#!/usr/bin/env node
/* Local responsive reading proof. All requests stay in the checkout unless
 * --fonts explicitly enables read-only font downloads. No forms are submitted. */
const { chromium } = require('playwright');
const { revealBookControls } = require('./book_browser_helpers.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = 'http://127.0.0.1:8765';
const out = '/tmp/book-immersive-proof';
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true, args: ['--no-sandbox'] });
  const errors = [];
  try {
    async function context(options) {
      const ctx = await browser.newContext(options);
      await ctx.route('**/*', route => {
        const url = new URL(route.request().url());
        if (route.request().method() !== 'GET') return route.abort();
        if (process.argv.includes('--fonts') && ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
        if (url.origin !== base) return route.abort();
        const file = path.join(root, decodeURIComponent(url.pathname), url.pathname.endsWith('/') ? 'index.html' : '');
        return fs.existsSync(file) ? route.fulfill({ path: file }) : route.abort();
      });
      ctx.on('page', page => page.on('pageerror', error => errors.push(error.message)));
      return ctx;
    }
    async function settled(page) {
      await page.waitForFunction(() => {
        const stage = document.querySelector('#stage');
        if (stage?.dataset.page === undefined || stage.matches('.is-turning,.is-riffling')) return false;
        const compact = matchMedia('(max-width: 1100px), (pointer: coarse) and (max-width: 1400px)').matches
          && !matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)').matches;
        return document.documentElement.classList.contains('immersive-reading') === (compact && Number(stage.dataset.page) > 0);
      });
      await page.locator('#stage').evaluate(el => Promise.all(el.getAnimations().map(a => a.finished.catch(() => {}))));
    }
    const index = page => page.locator('#stage').getAttribute('data-page').then(Number);
    const quiet = page => page.locator('#stage').evaluate(el => el.classList.contains('is-reading-quiet'));
    async function centerTap(page) {
      const box = await page.locator('#shell').boundingBox();
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    }
    async function checkPaper(page, width, height) {
      const box = await page.locator('#shell').boundingBox();
      assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= width && box.y + box.height <= height, 'paper stays inside display');
      assert.ok(box.width >= width - 25 && box.height >= height - 17, 'open paper uses the display');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal document overflow');
    }
    async function checkNavigation(page, sample = false) {
      const ids = ['close', 'controls', 'previous', 'next', 'folio', ...(sample ? ['sample-zoom'] : [])];
      const state = await page.evaluate(ids => ids.map(id => {
        const el = document.getElementById(id), style = getComputedStyle(el), box = el.getBoundingClientRect();
        return { id, visible: !el.hidden && style.opacity === '1' && style.visibility === 'visible' && box.width > 0 && box.height > 0,
          reachable: el.tagName !== 'BUTTON' || el.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)) };
      }), ids);
      for (const control of state) assert.ok(control.visible && control.reachable, `${control.id} stays visible and reachable with tabs hidden`);
      const fold = await page.locator('.curl').evaluate(el => {
        const corner = el.getBoundingClientRect();
        const paper = document.getElementById('shell').getBoundingClientRect();
        return {
          side: document.dir === 'rtl' ? paper.left - corner.left : corner.right - paper.right,
          bottom: corner.bottom - paper.bottom,
        };
      });
      assert.ok(Math.abs(fold.side) < 1 && Math.abs(fold.bottom) < 1, 'mobile paper fold stays attached to the page corner');
    }
    async function checkBookmarks(page) {
      const state = await page.locator('#bookmarks').evaluate(nav => {
        const active = nav.querySelector('[aria-current="true"]');
        const others = [...nav.querySelectorAll('[aria-current="false"]')];
        return {
          solid: getComputedStyle(nav).opacity === '1' && [...nav.children].every(el => getComputedStyle(el).opacity === '1'),
          prominent: getComputedStyle(active).fontWeight >= 600 && others.every(el => active.getBoundingClientRect().height > el.getBoundingClientRect().height),
        };
      });
      assert.ok(state.solid, 'all visible section tabs are opaque');
      assert.ok(state.prominent, 'selected section is larger and bold');
    }

    for (const locale of ['en', 'fa', 'ar']) {
      const ctx = await context({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      const url = base + (locale === 'en' ? '/' : `/${locale}/`);
      await page.goto(url);
      await settled(page);
      const cover = await page.locator('#shell').boundingBox();
      const coverRatio = await page.locator('#shell').evaluate(el => el.offsetHeight / el.offsetWidth);
      assert.ok(Math.abs(coverRatio - 1.6) < .01, 'cover preserves its printed ratio');
      await page.screenshot({ path: `${out}/${locale}-cover.png` });
      await page.locator('#open-label').tap();
      await settled(page);
      await checkPaper(page, 390, 844);
      assert.equal(await page.locator('#stage').getAttribute('data-section'), 'headline');
      await checkBookmarks(page);
      await page.screenshot({ path: `${out}/${locale}-tabs.png` });
      await page.waitForFunction(() => document.querySelector('#stage').classList.contains('is-reading-quiet'));
      await page.waitForTimeout(550);
      await checkNavigation(page);
      await page.screenshot({ path: `${out}/${locale}-reading.png` });
      const before = await index(page);
      await page.locator('#next').tap();
      await settled(page);
      assert.equal(await index(page), before + 1, 'next works without revealing section tabs');
      assert.equal(await quiet(page), true, 'page navigation does not reopen the section tabs');
      await page.locator('#previous').tap();
      await settled(page);
      assert.equal(await index(page), before, 'previous works without revealing section tabs');
      for (const side of ['left', 'right']) {
        await page.locator(`.reader-edge--${side}`).tap();
        assert.equal(await quiet(page), false, `${locale}: either edge reveals the tabs`);
        assert.equal(await index(page), before, 'edge tap does not turn the paper');
        await page.waitForTimeout(150);
        await centerTap(page);
        assert.equal(await quiet(page), true, 'center tap hides only section tabs');
        await checkNavigation(page);
        assert.equal(await index(page), before, 'center tap does not turn the paper');
      }
      await page.locator('#close').tap();
      await settled(page);
      assert.equal(await index(page), 0, 'cover ribbon works without revealing section tabs');
      await page.locator('#open-label').tap();
      await settled(page);
      await centerTap(page);
      // Focus must reveal controls and keep them visible for keyboard use.
      await page.keyboard.press('Tab');
      await page.locator('.bookmark[data-section="story"]').focus();
      await page.waitForTimeout(4300);
      assert.equal(await quiet(page), false, 'keyboard focus prevents auto-hide');
      await page.keyboard.press('Enter');
      await settled(page);
      assert.equal(await page.locator('#stage').getAttribute('data-section'), 'story');
      await checkBookmarks(page);
      await page.screenshot({ path: `${out}/${locale}-story-tabs.png` });
      const story = await index(page);
      await page.keyboard.press(locale === 'en' ? 'ArrowRight' : 'ArrowLeft');
      await settled(page);
      assert.equal(await index(page), story + 1, 'localized keyboard direction');
      await page.keyboard.press('Escape');
      assert.equal(await quiet(page), true, 'Escape first dismisses the section tabs');
      assert.equal(await index(page), story + 1);
      await page.keyboard.press('Escape');
      await settled(page);
      assert.equal(await index(page), 0, 'Escape then closes the book');
      const closed = await page.locator('#shell').boundingBox();
      assert.ok(Math.abs(closed.width - cover.width) < 1, 'closing restores the centered cover');

      await page.goto(url + '#sample');
      await settled(page);
      const originalText = await page.locator('.page[aria-hidden="false"] .sample-sheet__inner').textContent();
      await page.locator('#sample-zoom [data-zoom-step="10"]').tap();
      assert.equal(await page.locator('.page[aria-hidden="false"]').getAttribute('data-zoom'), '110');
      await centerTap(page);
      assert.equal(await quiet(page), true, 'zoomed sample can dismiss section tabs');
      await checkNavigation(page, true);
      await page.locator('#sample-zoom [data-zoom-step="10"]').tap();
      assert.equal(await page.locator('.page[aria-hidden="false"]').getAttribute('data-zoom'), '120');
      assert.equal(await quiet(page), true, 'zoom stays available without reopening section tabs');
      await page.locator('.reader-edge--left').tap();
      assert.equal(await quiet(page), false, 'zoomed sample retains an edge target');
      assert.equal(await page.locator('.page[aria-hidden="false"] .sample-sheet__inner').textContent(), originalText);
      await page.setViewportSize({ width: 844, height: 390 });
      await page.waitForTimeout(500);
      await settled(page);
      await checkPaper(page, 844, 390);
      assert.equal(await page.locator('#stage').getAttribute('data-section'), 'sample', 'rotation retains the section');
      await revealBookControls(page);
      await page.locator('.bookmark[data-section="back-cover"]').tap();
      await settled(page);
      assert.equal(await page.locator('#stage').getAttribute('data-section'), 'back-cover', 'scrolling tabs reaches the last section');
      await checkPaper(page, 844, 390);
      await page.screenshot({ path: `${out}/${locale}-landscape.png` });
      await ctx.close();
      console.log(`PASS ${locale}: cover, display usage, touch edges, quiet reading, keyboard, zoom, rotation and scrollable tabs`);
    }

    for (const [width, height] of [[320,568], [768,1024], [1024,768], [1366,1024]]) {
      const ctx = await context({ viewport: { width, height }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      await page.goto(base + '/fa/#synopsis');
      await settled(page);
      await checkPaper(page, width, height);
      await centerTap(page);
      await checkNavigation(page);
      await page.screenshot({ path: `${out}/fa-${width}x${height}.png` });
      await ctx.close();
    }
    const ctx = await context({ viewport: { width: 1366, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(base + '/#synopsis');
    await settled(page);
    assert.equal(await page.locator('html.immersive-reading').count(), 0, 'desktop retains the original book layout');
    const box = await page.locator('#shell').boundingBox();
    assert.ok(Math.abs(box.height / box.width - 1.6) < .01);
    assert.ok(box.height >= 900 * .95 && box.height <= 900 * .97, 'desktop paper uses nearly all of the window height');
    assert.ok(await page.locator('.bookmark').first().evaluate(el => el.clientWidth >= 110 && parseFloat(getComputedStyle(el).fontSize) >= 12), 'desktop slips are longer and legible');
    await page.waitForTimeout(4300);
    assert.equal(await quiet(page), false, 'desktop tabs stay visible');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await settled(page);
    await checkPaper(page, 768, 1024);
    await page.mouse.click(384, 512);
    assert.equal(await quiet(page), true, 'compact mouse click hides controls without turning');
    await page.mouse.click(38, 512);
    assert.equal(await quiet(page), false, 'compact mouse edge click reveals controls');
    await ctx.close();
    assert.deepEqual(errors, []);
    console.log(`PASS phone/tablet/desktop geometry and mouse behavior. Local screenshots: ${out}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
