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
    async function checkMenuPlacement(page) {
      const paper = await page.locator('#shell').boundingBox();
      const menu = await page.locator('#book-menu-toggle').boundingBox();
      const rtl = await page.locator('html').getAttribute('dir') === 'rtl';
      assert.ok(menu.x >= paper.x && menu.y >= paper.y
        && menu.x + menu.width <= paper.x + paper.width
        && menu.y + menu.height <= paper.y + paper.height, 'hamburger is inside the book');
      assert.ok(menu.y - paper.y <= 10 && menu.width <= 40 && menu.height <= 40, 'compact hamburger sits in the paper header');
      assert.ok(rtl ? menu.x - paper.x < 12 : paper.x + paper.width - menu.x - menu.width < 12,
        'hamburger follows the paper reading direction');
      const title = page.locator('.page[aria-hidden="false"] .running-head span:last-child');
      if (await title.isVisible()) {
        const box = await title.boundingBox();
        assert.ok(box.x + box.width <= menu.x || box.x >= menu.x + menu.width,
          'hamburger has its own space beside the printed section title');
      }
    }
    async function checkUpperCorners(page, touch) {
      const paper = await page.locator('#shell').boundingBox(), before = await index(page);
      const cdp = touch ? await page.context().newCDPSession(page) : null;
      for (const side of ['left', 'right']) {
        const x = side === 'left' ? paper.x + 3 : paper.x + paper.width - 3;
        const y = paper.y + 3, end = x + (side === 'left' ? 1 : -1) * paper.width * .8;
        if (touch) {
          for (const delay of [40, 350]) {
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
            await page.waitForTimeout(delay);
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: end, y: y + 20 }] });
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
            await page.waitForTimeout(300);
            // Mobile touch hit testing expands the nearby ribbon/menu buttons
            // into these extreme header corners. A drag must neither click
            // those controls nor invoke browser history navigation.
            assert.equal(await index(page), before, 'header control drags keep the current page');
          }
        } else {
          await page.mouse.move(x, y);
          await page.waitForTimeout(300);
          assert.equal(await page.locator('.stf__outerShadow').isVisible(), false, 'upper hover has no fold preview');
          await page.mouse.down();
          await page.mouse.move(end, y + 20, { steps: 8 });
          await page.mouse.up();
          await page.waitForTimeout(300);
          assert.equal(await index(page), before, 'upper mouse drag cannot turn the paper');
        }
        assert.equal(await page.locator('#stage.is-turning').count(), 0, 'upper corner leaves no active fold');
      }
      await cdp?.detach();
    }
    async function checkPaper(page, width, height) {
      const box = await page.locator('#shell').boundingBox();
      assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= width && box.y + box.height <= height, 'paper stays inside display');
      assert.ok(box.width >= width - 25 && box.height >= height - 17, 'open paper uses the display');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal document overflow');
    }
    async function checkNavigation(page) {
      const ids = ['close', 'controls', 'previous', 'next', 'folio'];
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
      assert.equal(await page.locator('#book-menu-toggle').isHidden(), true, 'closed cover has no hamburger');
      await page.screenshot({ path: `${out}/${locale}-cover.png` });
      await page.locator('#open-label').tap();
      await settled(page);
      await checkPaper(page, 390, 844);
      assert.equal(await page.locator('#stage').getAttribute('data-section'), 'headline');
      const menu = page.locator('#book-menu-toggle');
      await checkMenuPlacement(page);
      assert.equal(await quiet(page), true, 'only the hamburger opens the tabs');
      assert.equal(await page.locator('.reader-edge').count(), 0, 'paper has no menu hit areas');
      await menu.tap();
      assert.equal(await menu.getAttribute('aria-expanded'), 'true');
      await checkBookmarks(page);
      await page.screenshot({ path: `${out}/${locale}-tabs.png` });
      const opened = await index(page);
      await centerTap(page);
      await settled(page);
      assert.equal(await quiet(page), true, 'paper tap dismisses the menu');
      assert.equal(await index(page), opened, 'menu dismissal consumes the tap without turning');
      await menu.tap();
      await menu.tap();
      assert.equal(await menu.getAttribute('aria-expanded'), 'false');
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
      await page.locator('#next').tap();
      await settled(page);
      for (const side of ['left', 'right']) {
        const paper = await page.locator('#shell').boundingBox(), start = await index(page);
        await page.touchscreen.tap(side === 'left' ? paper.x + 8 : paper.x + paper.width - 8, paper.y + paper.height / 2);
        await settled(page);
        assert.equal(await quiet(page), true, `${locale}: ${side} paper edge never opens the menu`);
        assert.equal(await index(page), start + ((side === 'right') === (locale === 'en') ? 1 : -1), 'edge tap turns the paper in the localized direction');
        await menu.tap();
        const selected = await index(page);
        const next = await page.locator('#next').boundingBox();
        await page.touchscreen.tap(next.x + next.width / 2, next.y + next.height / 2);
        await settled(page);
        assert.equal(await quiet(page), true, 'a page control also dismisses the menu');
        assert.equal(await index(page), selected, 'the dismissing tap cannot activate the underlying page control');
        await page.locator('#next').tap();
        await settled(page);
        assert.equal(await index(page), selected + 1, 'the next tap retains the lower page control');
        await checkNavigation(page);
      }
      await page.locator('#close').tap();
      await settled(page);
      assert.equal(await index(page), 0, 'cover ribbon works without revealing section tabs');
      await page.locator('#open-label').tap();
      await settled(page);
      // Focus alone never opens the menu; Enter and Space activate the button.
      await menu.focus();
      assert.equal(await quiet(page), true);
      await page.keyboard.press('Enter');
      assert.equal(await quiet(page), false);
      await page.keyboard.press('Tab');
      assert.ok(await page.locator('#bookmarks').evaluate(el => el.contains(document.activeElement)), 'Tab reaches the open menu');
      await page.locator('.bookmark[data-section="story"]').focus();
      await page.waitForTimeout(4300);
      assert.equal(await quiet(page), false, 'the menu waits for an explicit dismissal');
      await page.keyboard.press('Enter');
      await settled(page);
      assert.equal(await page.locator('#stage').getAttribute('data-section'), 'story');
      assert.equal(await quiet(page), true, 'selecting a section closes the menu');
      await checkMenuPlacement(page);
      await checkUpperCorners(page, true);
      await menu.focus();
      await page.keyboard.press('Space');
      assert.equal(await quiet(page), false, 'Space reopens the menu from its button');
      await checkBookmarks(page);
      await page.screenshot({ path: `${out}/${locale}-story-tabs.png` });
      const story = await index(page);
      await page.keyboard.press(locale === 'en' ? 'ArrowRight' : 'ArrowLeft');
      await settled(page);
      assert.equal(await index(page), story + 1, 'localized keyboard direction');
      await page.keyboard.press('Escape');
      assert.equal(await quiet(page), true, 'Escape first dismisses the section tabs');
      assert.equal(await menu.evaluate(el => document.activeElement === el), true, 'Escape returns focus to the menu button');
      assert.equal(await index(page), story + 1);
      await page.keyboard.press('Escape');
      await settled(page);
      assert.equal(await index(page), 0, 'Escape then closes the book');
      const closed = await page.locator('#shell').boundingBox();
      assert.ok(Math.abs(closed.width - cover.width) < 1, 'closing restores the centered cover');

      await page.goto(url + '#sample');
      await settled(page);
      await revealBookControls(page);
      const originalText = await page.locator('.page[aria-hidden="false"] .sample-sheet__inner').textContent();
      await centerTap(page);
      assert.equal(await quiet(page), true, 'sample can dismiss section tabs');
      await checkNavigation(page);
      await menu.tap();
      assert.equal(await quiet(page), false, 'sample retains the menu button');
      await centerTap(page);
      assert.equal(await quiet(page), true, 'a click on a sample closes the menu');
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
      assert.ok(await page.locator('#close').evaluate(el => {
        const box = el.getBoundingClientRect();
        return el.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
      }), 'menu button leaves the back-cover ribbon reachable');
      await page.screenshot({ path: `${out}/${locale}-landscape.png` });
      await ctx.close();
      console.log(`PASS ${locale}: hamburger placement, touch page turns, dismissal, keyboard, rotation and scrollable tabs`);
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
    await checkMenuPlacement(page);
    await checkUpperCorners(page, false);
    await page.screenshot({ path: `${out}/en-desktop-header.png` });
    await page.waitForTimeout(4300);
    assert.equal(await quiet(page), true, 'desktop tabs wait for the hamburger');
    await page.locator('#book-menu-toggle').hover();
    assert.equal(await quiet(page), true, 'hover never opens the menu');
    await revealBookControls(page);
    assert.equal(await quiet(page), false, 'desktop hamburger opens the original tabs');
    await page.mouse.click(20, 450);
    assert.equal(await quiet(page), true, 'a click outside the book closes the menu');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await settled(page);
    await checkPaper(page, 768, 1024);
    const start = await index(page);
    await page.mouse.move(738, 512);
    assert.equal(await quiet(page), true, 'hovering the edge does not reveal controls');
    await revealBookControls(page);
    await page.mouse.click(38, 512);
    await settled(page);
    assert.equal(await quiet(page), true, 'compact mouse edge click dismisses controls');
    assert.equal(await index(page), start, 'menu dismissal cannot turn the paper with the mouse');
    await page.mouse.click(38, 512);
    await settled(page);
    assert.equal(await index(page), start - 1, 'the subsequent lower-half mouse click still turns');
    await ctx.close();
    assert.deepEqual(errors, []);
    console.log(`PASS phone/tablet/desktop geometry and mouse behavior. Local screenshots: ${out}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
