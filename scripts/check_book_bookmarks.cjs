#!/usr/bin/env node
/* Physical bookmark proof, local files only. Optional --fonts reads font hosts.
 * Capture the real opening/closing motion, hover and native touch scrolling. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = 'http://127.0.0.1:8765';
const out = '/tmp/book-bookmark-proof';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true, args: ['--no-sandbox'] });
  const errors = [];
  try {
    async function context(options) {
      const ctx = await browser.newContext(options);
      await ctx.route('**/*', route => {
        const u = new URL(route.request().url());
        if (route.request().method() !== 'GET') return route.abort();
        if (process.argv.includes('--fonts') && ['fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname)) return route.continue();
        if (u.origin !== base) return route.abort();
        const file = path.join(root, decodeURIComponent(u.pathname), u.pathname.endsWith('/') ? 'index.html' : '');
        return fs.existsSync(file) ? route.fulfill({ path: file }) : route.abort();
      });
      ctx.on('page', page => page.on('pageerror', e => errors.push(e.message)));
      return ctx;
    }
    const quiet = page => page.locator('#stage').evaluate(el => el.classList.contains('is-reading-quiet'));
    const state = page => page.locator('#bookmarks').evaluate(nav => [...nav.children].map(button => {
      const canvas = button.querySelector('.bookmark-canvas'), box = canvas.getBoundingClientRect();
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      let left = canvas.width, right = 0;
      for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
        if (pixels[(y * canvas.width + x) * 4 + 3] > 200) { left = Math.min(left, x); right = Math.max(right, x); }
      }
      const scale = box.width / canvas.width;
      return { section: button.dataset.section, width: (right - left + 1) * scale, x: box.x + left * scale, right: box.x + (right + 1) * scale,
        label: button.textContent.trim(), canvas: getComputedStyle(canvas).display,
        current: button.getAttribute('aria-current') === 'true', grow: Number(button.style.getPropertyValue('--tab-grow')) };
    }));
    async function settled(page) {
      await page.waitForFunction(() => document.querySelector('#stage')?.dataset.page !== undefined
        && !document.querySelector('#stage').matches('.is-turning,.is-riffling'));
    }
    for (const lang of ['en','fa']) {
      const ctx = await context({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
      const page = await ctx.newPage();
      await page.addInitScript(() => {
        const clear = CanvasRenderingContext2D.prototype.clearRect;
        CanvasRenderingContext2D.prototype.clearRect = function (...args) {
          if (this.canvas.classList.contains('bookmark-canvas')) window.bookmarkPaints = (window.bookmarkPaints || 0) + 1;
          return clear.apply(this, args);
        };
      });
      await page.goto(base + (lang === 'en' ? '/' : '/fa/') + '#synopsis');
      await settled(page);
      await page.waitForFunction(() => document.querySelector('#stage').classList.contains('is-reading-quiet'));
      await page.waitForTimeout(900);
      const folded = await state(page), before = await page.locator('#stage').getAttribute('data-page');
      assert.ok(folded.every(tab => tab.width >= 3 && tab.width <= 12), 'closed slips leave narrow coloured edges, not compressed text');
      assert.ok(folded.every(tab => tab.x >= 0 && tab.right <= 390), 'paper edges stay in the display');
      assert.ok(folded.find(tab => tab.current).width > folded.find(tab => !tab.current).width, 'current section has a wider folded edge');
      const restingPaints = await page.evaluate(() => window.bookmarkPaints);
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(() => window.bookmarkPaints), restingPaints, 'folded paper stops painting while the reader reads');
      await page.screenshot({ path: `${out}/${lang}-closed.png` });
      const edge = page.locator(`.reader-edge--${lang === 'en' ? 'right' : 'left'}`);
      const box = await edge.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      assert.equal(await quiet(page), false, 'mouse hover unfolds the paper');
      // Short intermediate captures prove this is a hinged fold, not a jump.
      const widths = [];
      for (let frame = 0; frame < 9; frame++) {
        widths.push((await state(page))[0].width);
        await page.screenshot({ path: `${out}/${lang}-open-${frame}.png` });
        await page.waitForTimeout(65);
      }
      const open = await state(page);
      assert.ok(widths.some(w => w > folded[0].width + 3 && w < open[0].width - 3), 'unfolding passes through intermediate paper angles');
      assert.ok(open.every(tab => tab.width > 65 && tab.canvas === 'block' && tab.label), 'unfolded paper carries its translated label');
      assert.equal(await page.locator('#stage').getAttribute('data-page'), before, 'hover never selects a section');
      await edge.click();
      assert.equal(await page.locator('#stage').getAttribute('data-page'), before, 'a click on the hinge cannot hit a newly revealed section');
      const review = page.locator('.bookmark[data-section="reviews"]');
      await review.hover();
      await page.waitForTimeout(850);
      const nearby = await state(page);
      assert.ok(nearby.find(t => t.section === 'reviews').grow > .04, 'hover gently enlarges the nearest tab');
      assert.ok(nearby.find(t => t.section === 'reviews').width > open.find(t => t.section === 'reviews').width + 2, 'the actual paper surface grows under the pointer');
      assert.ok(nearby.find(t => t.section === 'headline').grow > 0, 'neighboring tab responds more softly');
      assert.ok(nearby.find(t => t.section === 'sample').grow === 0, 'far tabs stay still');
      await page.screenshot({ path: `${out}/${lang}-hover.png` });
      await page.locator('.bookmark[data-section="author"]').click();
      await page.waitForFunction(() => document.querySelector('#stage').dataset.section === 'author'
        && !document.querySelector('#stage').matches('.is-turning,.is-riffling'));
      assert.equal(await page.locator('.bookmark[aria-current="true"]').getAttribute('data-section'), 'author');
      await page.mouse.click(195, 420);
      assert.equal(await quiet(page), true, 'center click folds the section slips away');
      for (let frame = 0; frame < 9; frame++) {
        await page.screenshot({ path: `${out}/${lang}-fold-${frame}.png` });
        await page.waitForTimeout(65);
      }
      assert.ok((await state(page)).every(tab => tab.width <= 22));
      for (const id of ['close', 'controls', 'folio']) assert.equal(await page.locator('#' + id).evaluate(el => getComputedStyle(el).opacity), '1');
      await page.locator('.bookmark[data-section="story"]').focus();
      assert.equal(await quiet(page), false, 'keyboard focus reveals a folded section');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.mouse.click(195, 420);
      await page.waitForTimeout(60);
      assert.ok((await state(page)).every(tab => tab.width <= 22), 'reduced motion folds immediately');
      assert.equal(await page.locator('#bookmarks').evaluate(el => el.getAnimations({ subtree: true }).length), 0, 'reduced motion disables flutter and transition');
      await edge.click();
      await page.waitForTimeout(100);
      const stillPaints = await page.evaluate(() => window.bookmarkPaints);
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(() => window.bookmarkPaints), stillPaints, 'reduced-motion paper has no rendering loop even while open');
      await ctx.close();
      console.log(`PASS ${lang}: visible paper edges, 3D fold, hover, proximity, selection, fixed navigation, keyboard and reduced motion`);
    }
    const ctx = await context({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    await page.goto(base + '/fa/#synopsis');
    await settled(page);
    await page.waitForTimeout(1000);
    const before = await page.locator('#stage').getAttribute('data-page');
    const box = await page.locator('#bookmarks').boundingBox();
    const cdp = await ctx.newCDPSession(page);
    const x = box.x + box.width / 2, y = box.y + box.height - 35;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 8; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - i * 22 }] });
      await page.waitForTimeout(35);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(600);
    assert.ok(await page.locator('#bookmarks').evaluate(el => el.scrollTop > 60), 'short-screen tabs still scroll naturally');
    assert.equal(await page.locator('#stage').getAttribute('data-page'), before, 'sliding a finger never selects a section');
    assert.ok((await state(page)).every(tab => tab.grow === 0), 'touch release clears magnification');
    await page.screenshot({ path: `${out}/fa-touch-scroll.png` });
    await ctx.close();
    assert.deepEqual(errors, []);
    console.log(`PASS native touch scroll. Local motion frames: ${out}`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
