#!/usr/bin/env node
/* Local desktop grab-to-pan proof. Uses local files and read-only fonts only. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = 'http://127.0.0.1:8765';
const languages = JSON.parse(fs.readFileSync(path.join(root, 'content/languages.json')));

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, reducedMotion: 'reduce' });
  const fonts = new Map(), errors = [];
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
  const page = await ctx.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    addEventListener('pointerdown', event => { window.lastPointer = event.pointerId; }, true);
  });
  const sheet = page.locator('.page[aria-hidden="false"] .sample-sheet');
  const plus = page.locator('#sample-zoom [data-zoom-step="10"]');
  const minus = page.locator('#sample-zoom [data-zoom-step="-10"]');
  const state = () => sheet.evaluate(el => ({
    left: el.scrollLeft, top: el.scrollTop, cursor: getComputedStyle(el).cursor,
    panning: el.classList.contains('is-panning'), captured: el.hasPointerCapture(window.lastPointer),
    factor: Number(el.style.getPropertyValue('--sheet-factor')),
    selection: getSelection().toString(), page: document.querySelector('#stage').dataset.page,
    x: el.querySelector('.sample-sheet__inner').getBoundingClientRect().x,
    y: el.querySelector('.sample-sheet__inner').getBoundingClientRect().y,
  }));
  async function textPoint() {
    return sheet.evaluate(el => {
      const area = el.getBoundingClientRect();
      const walker = document.createTreeWalker(el.querySelector('.sample-sheet__body'), NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        if (!walker.currentNode.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(walker.currentNode);
        for (const rect of range.getClientRects()) {
          const left = Math.max(rect.left, area.left + 30), right = Math.min(rect.right, area.right - 100);
          if (right - left > 20 && rect.top > area.top + 30 && rect.bottom < area.bottom - 100) {
            return { x: (left + right) / 2, y: (rect.top + rect.bottom) / 2 };
          }
        }
      }
      throw new Error('Expected visible printed text to drag');
    });
  }

  for (const lang of languages) {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(base + (lang.code === 'en' ? '/' : `/${lang.code}/`) + (lang.code === 'fa' ? '#sample-04' : '#sample-02'));
    await page.waitForFunction(() => document.querySelector('#stage')?.dataset.section === 'sample');
    await page.locator('#stage').evaluate(el => Promise.all(el.getAnimations().map(animation => animation.finished.catch(() => {}))));
    assert.notEqual((await state()).cursor, 'grab', `${lang.code}: normal reading keeps its cursor`);
    await plus.evaluate(button => { for (let i = 0; i < 10; i++) button.click(); });
    await sheet.evaluate(el => {
      el.scrollLeft = (getComputedStyle(el).direction === 'rtl' ? -1 : 1) * (el.scrollWidth - el.clientWidth) / 2;
      el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
    });
    assert.equal((await state()).cursor, 'grab');
    let point = await textPoint();
    // Take hold while a zoom step is still animating. It must not fight the drag.
    if (lang.code === 'en') {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await plus.evaluate(button => button.click());
    }
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    const start = await state();
    assert.equal(start.cursor, 'grabbing');
    assert.ok(start.panning && start.captured);
    if (lang.code === 'en') assert.equal(start.factor, 2.1);
    await page.mouse.move(point.x + 65, point.y + 55, { steps: 8 });
    await page.waitForTimeout(230);
    const moved = await state();
    assert.ok(Math.abs(moved.left - (start.left - 65)) <= 1, `${lang.code}: horizontal drag follows the hand`);
    assert.ok(Math.abs(moved.top - (start.top - 55)) <= 1, `${lang.code}: vertical drag follows the hand`);
    assert.ok(Math.abs(moved.x - start.x - 65) <= 1 && Math.abs(moved.y - start.y - 55) <= 1,
      `${lang.code}: printed text moves in the same physical direction in LTR and RTL`);
    assert.equal(moved.selection, '', `${lang.code}: dragging text must not select it`);
    assert.equal(moved.page, start.page, `${lang.code}: dragging must not turn the page`);
    await page.mouse.up();
    assert.equal((await state()).cursor, 'grab');
    assert.ok(!(await state()).panning && !(await state()).captured);
    await page.mouse.move(point.x, point.y);
    assert.equal((await state()).top, moved.top, `${lang.code}: mouse release stops scrolling`);

    // Capture continues outside the book and releases cleanly there.
    point = await textPoint();
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.mouse.move(10, 10, { steps: 8 });
    assert.ok((await state()).panning && (await state()).captured);
    await page.mouse.up();
    assert.ok(!(await state()).panning && !(await state()).captured);
    assert.equal((await state()).page, start.page);

    // Cancellation must not leave the closed-hand cursor or scroll handler active.
    await sheet.evaluate(el => { el.scrollTop = (el.scrollHeight - el.clientHeight) / 2; });
    const area = await sheet.boundingBox();
    point = { x: area.x + area.width / 2, y: area.y + area.height / 2 };
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await sheet.evaluate(el => el.dispatchEvent(new PointerEvent('pointercancel', {
      bubbles: true, pointerId: window.lastPointer, pointerType: 'mouse',
    })));
    const cancelled = await state();
    assert.ok(!cancelled.panning && !cancelled.captured);
    await page.mouse.move(point.x + 20, point.y + 20);
    assert.equal((await state()).top, cancelled.top);
    await page.mouse.up();

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await minus.evaluate(button => { for (let i = 0; i < 30 && !button.disabled; i++) button.click(); });
    assert.ok(await minus.isDisabled());
    const normal = await state();
    assert.notEqual(normal.cursor, 'grab');
    assert.notEqual(normal.cursor, 'grabbing');
    assert.ok(!normal.panning && !normal.captured);
    assert.equal(normal.factor, 1);
    assert.equal(normal.top, 0);
    assert.equal(normal.left, 0);
    console.log(`PASS: ${lang.code} mouse grab, both axes, capture, cancellation and normal-size reset.`);
  }
  assert.deepEqual(errors, []);
  await browser.close();
  console.log('PASS: desktop panning in all nine languages; no text selection, accidental page turns or browser errors.');
})().catch(error => { console.error(error); process.exit(1); });
