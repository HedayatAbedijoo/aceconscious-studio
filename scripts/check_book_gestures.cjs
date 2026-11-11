#!/usr/bin/env node
/* Local gesture regression. All external requests and submissions are blocked.
 * NODE_PATH supplies Playwright; CHROME_BIN selects the local browser. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..'), base = 'http://127.0.0.1:8765';
const out = '/tmp/book-gesture-qa';
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true, args: ['--no-sandbox'] });
  const errors = [];
  try {
    for (const mobile of process.argv.includes('--mobile') ? [true] : [false, true]) {
      const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1366, height: 900 }, hasTouch: mobile, isMobile: mobile });
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.origin !== base || route.request().method() !== 'GET') return route.abort();
        const file = path.join(root, decodeURIComponent(url.pathname), url.pathname.endsWith('/') ? 'index.html' : '');
        if (!fs.existsSync(file)) return route.abort();
        if (url.pathname === '/js/book.js') return route.fulfill({ contentType: 'text/javascript', body:
          'St.PageFlip = new Proxy(St.PageFlip, { construct(Type, args) { return window.testBook = new Type(...args); } });\n' + fs.readFileSync(file, 'utf8') });
        return route.fulfill({ path: file });
      });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      const cdp = mobile ? await context.newCDPSession(page) : null;
      const index = () => page.locator('#stage').getAttribute('data-page').then(Number);
      const settled = () => page.waitForFunction(() => window.testBook?.getState() === 'read'
        && !document.querySelector('#stage').matches('.is-turning,.is-riffling'));
      const tap = async (x, y) => mobile ? page.touchscreen.tap(x, y) : page.mouse.click(x, y);
      const clearSelection = () => page.evaluate(() => getSelection().removeAllRanges());
      async function swipe(x, y, dx, dy = 0, cancel = false, delay = 40) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
        await page.waitForTimeout(delay);
        for (let step = 1; step <= 5; step++) {
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * step / 5, y: y + dy * step / 5 }] });
        }
        assert.equal(await page.evaluate(() => window.testBook.getState()), 'read', 'no fold while a finger is down');
        await cdp.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] });
        await settled();
      }
      for (const code of ['en', 'fa', 'ar']) {
        const rtl = code !== 'en', home = base + (code === 'en' ? '/' : '/' + code + '/');
        async function open(anchor) {
          await page.goto(home + '#' + anchor);
          await page.waitForFunction(() => window.testBook && document.querySelector('#stage')?.dataset.page);
          await settled();
        }
        await open('synopsis');
        let box = await page.locator('#shell').boundingBox();
        const physical = f => box.x + box.width * (rtl ? 1 - f : f);
        let before = await index();
        // Both halves, including the upper half, are navigation areas.
        for (const y of [.25, .55, .8]) {
          await tap(physical(.65), box.y + box.height * y); await settled();
          assert.equal(await index(), before + 1, `${code}: next half at ${y}`);
          await tap(physical(.35), box.y + box.height * y); await settled();
          assert.equal(await index(), before, `${code}: previous half at ${y}`);
        }
        if (!mobile) {
          for (const y of [.25, .55, .8, .95]) {
            await page.mouse.move(physical(.98), box.y + box.height * y);
            await page.waitForTimeout(120);
            assert.equal(await page.evaluate(() => window.testBook.getState()), 'read', 'hover never folds paper');
            assert.equal(await page.locator('.stf__outerShadow').isVisible(), false);
          }
          const text = await page.locator('.page[aria-hidden="false"] .page-body p').first().boundingBox();
          await page.mouse.move(text.x + 5, text.y + 10);
          await page.mouse.down(); await page.mouse.move(text.x + text.width * .8, text.y + 30, { steps: 8 }); await page.mouse.up();
          assert.equal(await index(), before, 'text selection never turns paper');
          assert.ok(await page.evaluate(() => getSelection().toString().length > 0), 'text remains selectable');
          await clearSelection();
        } else {
          for (const delay of [40, 350]) {
            await swipe(physical(.75), box.y + box.height * .25, (rtl ? 1 : -1) * box.width * .5, 8, false, delay);
            assert.equal(await index(), before + 1, 'fast and slow upper swipes work');
            await swipe(physical(.25), box.y + box.height * .4, (rtl ? -1 : 1) * box.width * .5);
            assert.equal(await index(), before);
          }
          await swipe(physical(.75), box.y + box.height * .4, (rtl ? 1 : -1) * 120, 0, true);
          assert.equal(await index(), before, 'cancellation never navigates');
          await swipe(physical(.65), box.y + box.height * .6, 5, -150);
          assert.equal(await index(), before, 'vertical scrolling never navigates');
          const x = physical(.7), y = box.y + box.height * .45;
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }, { x: physical(.3), y, id: 2 }] });
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          await settled();
          assert.equal(await index(), before, 'multitouch never turns paper');
        }
        // Freeze only the animation clock to deterministically exercise input
        // that arrives before the previous turn finishes.
        await page.evaluate(() => window.testBook.getRender().stop());
        await tap(physical(.7), box.y + box.height * .4);
        await tap(physical(.3), box.y + box.height * .4);
        await page.evaluate(() => window.testBook.getRender().start());
        await page.waitForTimeout(1100); await settled();
        assert.equal(await index(), before, 'next then previous during a turn returns to the starting page');

        await open('ace');
        before = await index();
        const tabs = page.locator('.page[aria-hidden="false"] .ace-intro [role="tab"]');
        const tab = tabs.nth(1);
        await (mobile ? tab.tap() : tab.click());
        assert.equal(await tab.getAttribute('aria-selected'), 'true', 'ACE tab activates normally');
        assert.equal(await index(), before, 'ACE click does not navigate');
        await tab.focus(); await page.keyboard.press(rtl ? 'ArrowLeft' : 'ArrowRight');
        assert.equal(await tabs.nth(2).getAttribute('aria-selected'), 'true', 'ACE keyboard navigation is preserved');
        assert.equal(await index(), before);
        if (mobile) {
          const b = await tab.boundingBox();
          const selected = await tabs.nth(2).getAttribute('id');
          await swipe(b.x + b.width / 2, b.y + b.height / 2, (rtl ? 1 : -1) * 100);
          assert.equal(await index(), before + 1, 'swipe starting on an ACE button turns paper');
          await page.keyboard.press('PageUp'); await settled();
          assert.equal(await page.locator('.page[aria-hidden="false"] [role="tab"][aria-selected="true"]').getAttribute('id'), selected, 'swipe does not also activate an ACE button');
        }
        // Every live form remains usable and does not block its whole sheet.
        for (const id of ['community', 'contact']) {
          await open(id);
          const form = page.locator('#' + id + '-form');
          const target = await form.evaluate(el => Array.from(document.querySelectorAll('#book .page')).indexOf(el.closest('.page')));
          while (await index() !== target) { await page.keyboard.press('PageDown'); await settled(); }
          before = await index();
          const field = form.locator('input:not([type="hidden"]):not([tabindex="-1"]):visible').first();
          await (mobile ? field.tap() : field.click());
          await field.fill('Gesture review');
          assert.equal(await index(), before, 'field tap/edit does not navigate');
          await page.keyboard.press('ArrowLeft');
          assert.equal(await index(), before, 'editing keys stay in the field');
          await clearSelection();
          if (mobile) {
            const b = await field.boundingBox();
            await swipe(b.x + b.width / 2, b.y + b.height / 2, (rtl ? 1 : -1) * 100);
          } else {
            box = await page.locator('#shell').boundingBox();
            await tap(physical(.97), box.y + box.height * .45); await settled();
          }
          assert.equal(await index(), before + 1, `${id}: form sheet can turn`);
          await page.locator('#previous').click(); await settled();
          assert.equal(await field.inputValue(), 'Gesture review', 'draft value survives a round trip');
        }
        await open('sample');
        await page.screenshot({ path: `${out}/${code}-${mobile ? 'mobile' : 'desktop'}.png` });
        if (mobile) {
          // Traverse every actual sheet, including reviews, shops, ACE cards,
          // both forms, samples and back-cover links. No section-wide dead zones.
          await page.emulateMedia({ reducedMotion: 'reduce' });
          await open('headline');
          box = await page.locator('#shell').boundingBox();
          const count = await page.evaluate(() => window.testBook.getPageCount());
          for (const direction of [1, -1]) {
            const end = direction === 1 ? count - 1 : 1;
            while (await index() !== end) {
              const start = await index();
              await swipe(physical(direction === 1 ? .75 : .25), box.y + box.height * .55,
                (rtl ? 1 : -1) * direction * box.width * .5);
              assert.equal(await index(), start + direction, `${code}: sheet ${start} swipes ${direction}`);
            }
          }
          await page.emulateMedia({ reducedMotion: 'no-preference' });
          console.log(`PASS ${code}: all ${count - 1} reading sheets swipe in both directions`);
        }
        console.log(`PASS ${code} ${mobile ? 'mobile' : 'desktop'}: halves, hover/selection, rapid reversal, ACE, forms, gesture cancellation`);
      }
      await context.close();
    }
    assert.deepEqual(errors, [], 'no browser errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
