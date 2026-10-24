#!/usr/bin/env node
/* Run with Playwright on NODE_PATH; CHROME_BIN selects an installed browser.
 * Files are served from this checkout by interception. Form responses are mocks.
 * Optional --fonts permits read-only Google Fonts requests for visual QA.
 */
const { chromium } = require('playwright');
const { revealBookControls } = require('./book_browser_helpers.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = 'http://127.0.0.1:8765';

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_BIN || undefined,
    headless: true,
    args: ['--no-sandbox'],
  });
  const errors = [];
  async function context(options) {
    const ctx = await browser.newContext(options);
    await ctx.route('**/*', route => {
      const request = route.request(), url = new URL(request.url());
      if (request.method() !== 'GET') return route.abort();
      if (process.argv.includes('--fonts') && ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) {
        return route.continue();
      }
      if (url.origin !== base) return route.abort();
      const file = path.join(root, decodeURIComponent(url.pathname), url.pathname.endsWith('/') ? 'index.html' : '');
      return fs.existsSync(file) ? route.fulfill({ path: file }) : route.abort();
    });
    ctx.on('page', page => page.on('pageerror', error => errors.push(error.message)));
    return ctx;
  }
  const index = page => page.locator('#stage').getAttribute('data-page').then(Number);
  async function settled(page) {
    await page.waitForFunction(() => !document.querySelector('#stage').matches('.is-turning,.is-riffling'));
    await page.waitForTimeout(180);
  }
  async function open(page, anchor) {
    await page.goto(base + '/#' + anchor);
    await page.waitForFunction(() => document.querySelector('#stage')?.dataset.page);
    await settled(page);
  }
  async function showForm(page, id) {
    const target = await page.locator('#' + id + '-form').evaluate(el =>
      Array.from(document.querySelectorAll('#book .page')).indexOf(el.closest('.page')));
    for (let current = await index(page); current !== target; current = await index(page)) {
      await page.keyboard.press(current < target ? 'ArrowRight' : 'ArrowLeft');
    }
    await settled(page);
  }

  // Each rebuild must replace, rather than accumulate, the renderer loop.
  const ctx = await context({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => {
    const native = requestAnimationFrame.bind(window), ids = new WeakMap();
    let serial = 0;
    window.frameCounts = {};
    window.requestAnimationFrame = callback => {
      if (!ids.has(callback)) ids.set(callback, ++serial);
      return native(time => {
        const id = ids.get(callback);
        window.frameCounts[id] = (window.frameCounts[id] || 0) + 1;
        callback(time);
      });
    };
  });
  const page = await ctx.newPage();
  await open(page, 'sample');
  for (const width of [390, 400, 410, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.waitForTimeout(450);
    await page.evaluate(() => { window.frameCounts = {}; });
    await page.waitForTimeout(600);
    assert.equal(await page.evaluate(() => Object.values(window.frameCounts).filter(n => n > 10).length), 1,
      'A resize left more than one renderer running');
  }
  const zoom = page.locator('#sample-zoom');
  const zoomIn = zoom.locator('[data-zoom-step="10"]');
  const zoomOut = zoom.locator('[data-zoom-step="-10"]');
  await revealBookControls(page);
  await zoomIn.click();
  assert.equal(await zoom.locator('output').textContent(), '110');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowLeft');
  await settled(page);
  assert.equal(await zoom.locator('output').textContent(), '110');
  assert.equal(await zoomOut.isDisabled(), false);
  await revealBookControls(page);
  await zoomIn.click();
  await page.setViewportSize({ width: 400, height: 844 });
  await page.waitForTimeout(450);
  assert.equal(await zoom.locator('output').textContent(), '100', 'Resize must also reset zoom controls');
  await ctx.close();
  console.log('PASS: one render loop across resizes; zoom persists between sample pages and resets on resize.');

  // Both a cancelled delayed touch and a cancelled active fold must recover.
  const touch = await context({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const mobile = await touch.newPage();
  await open(mobile, 'synopsis');
  const cdp = await touch.newCDPSession(mobile);
  for (const delay of [80, 350]) {
    const box = await mobile.locator('#shell').boundingBox();
    const point = { x: box.x + box.width - 8, y: box.y + box.height - 20 };
    const before = await index(mobile);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    await mobile.waitForTimeout(delay);
    if (delay > 250) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: point.x - 80, y: point.y - 30 }] });
      await mobile.waitForTimeout(80);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await mobile.waitForTimeout(400);
    await settled(mobile);
    assert.equal(await index(mobile), before, 'Cancelled fold should keep its original page');
    await mobile.keyboard.press('ArrowRight');
    await settled(mobile);
    assert.equal(await index(mobile), before + 1, 'Navigation remains usable after cancellation');
  }
  // Retain tap and press-and-hold behavior after the vendor lifecycle changes.
  await revealBookControls(mobile);
  const next = await mobile.locator('#next').boundingBox();
  const point = { x: next.x + 20, y: next.y + 20 }, before = await index(mobile);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
  await mobile.waitForTimeout(800);
  assert.equal(await index(mobile), before);
  await mobile.waitForTimeout(1400);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await settled(mobile);
  const after = await index(mobile);
  assert.ok(after >= before + 4, 'Hold should turn several pages');
  await mobile.waitForTimeout(400);
  assert.equal(await index(mobile), after, 'Release stops repeated turns');
  await touch.close();
  console.log('PASS: cancelled touches recover; touch hold and release remain functional.');

  for (const [width, height] of [[1366, 900], [390, 844], [320, 568], [844, 390]]) {
    const forms = await context({ viewport: { width, height }, reducedMotion: 'reduce' });
    await forms.addInitScript(() => {
      window.mockRequests = 0;
      window.mockSuccess = true;
      window.fetch = async () => {
        window.mockRequests++;
        return { ok: window.mockSuccess, json: async () => ({ type: 'ace-contact-form', status: window.mockSuccess ? 'success' : 'error' }) };
      };
    });
    const formPage = await forms.newPage();
    await open(formPage, 'contact');
    for (const id of ['contact', 'community']) {
      await showForm(formPage, id);
      for (const success of [true, false]) {
        await formPage.evaluate(value => { window.mockSuccess = value; }, success);
        await formPage.locator('#' + id + '-email').fill('preview@example.com');
        if (id === 'contact') await formPage.locator('#contact-message').fill('Local mock only.');
        await formPage.locator('#' + id + '-form button[type="submit"]').click();
        await formPage.waitForFunction(id => !document.getElementById(id + '-status').hidden, id);
        const result = await formPage.locator('#' + id + '-status').evaluate(el => {
          const box = el.getBoundingClientRect(), body = el.closest('.page-body').getBoundingClientRect();
          return { text: el.textContent, fits: box.bottom <= body.bottom + 1 && box.top >= body.top - 1 };
        });
        assert.ok(result.text && result.fits, `${id} ${success ? 'success' : 'error'} clipped at ${width}×${height}`);
      }
    }
    assert.equal(await formPage.evaluate(() => window.mockRequests), 4);
    // Compact reference typography must preserve every word through reflow,
    // and leave each heading with the beginning of its following paragraph.
    const appendix = await formPage.evaluate(html => {
      const source = new DOMParser().parseFromString(html, 'text/html');
      return Array.from(source.querySelectorAll('#book-source [data-section="appendix"]'), item => {
        const sheets = Array.from(document.querySelectorAll('#book .appendix-page'))
          .filter(sheet => sheet.getAttribute('aria-label') === item.dataset.title);
        const bodies = sheets.map(sheet => sheet.querySelector('.page-body').cloneNode(true));
        bodies.forEach(body => body.querySelectorAll('.continued').forEach(mark => mark.remove()));
        const normalize = text => text.replace(/\s/g, '');
        return {
          id: item.id,
          preserved: normalize(bodies.map(body => body.textContent).join('')) === normalize(item.textContent),
          orphan: bodies.some(body => /^H[234]$/.test(body.lastElementChild?.tagName || '')),
        };
      });
    }, fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
    assert.equal(appendix.length, 5);
    // A break at a page boundary may disappear; reflow must never add breaks.
    assert.ok(await formPage.locator('#book .appendix-page[aria-label="Impressum"] br').count() <= 7,
      'Impressum must not acquire extra blank lines from invalid closing br tags');
    for (const item of appendix) {
      assert.ok(item.preserved, `${item.id} lost text at ${width}×${height}`);
      assert.ok(!item.orphan, `${item.id} orphaned a heading at ${width}×${height}`);
    }
    await forms.close();
  }
  console.log('PASS: mocked success/error responses stay visible at all four viewport sizes.');

  const nojs = await context({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const fallback = await nojs.newPage();
  await fallback.goto(base);
  assert.ok(await fallback.locator('.sample-sheet').first().evaluate(el =>
    el.querySelector('.sample-sheet__inner').getBoundingClientRect().width <= el.getBoundingClientRect().width + 1));
  await nojs.close();
  assert.deepEqual(errors, []);
  await browser.close();
  console.log('PASS: no-JavaScript sample fits the page; no browser errors; no real forms sent.');
})().catch(error => { console.error(error); process.exit(1); });
