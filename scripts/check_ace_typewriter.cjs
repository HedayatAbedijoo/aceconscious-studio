#!/usr/bin/env node
/* Local-only checks of the paper/typewriter interaction and multilingual scripts. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = 'http://127.0.0.1:8765';
const output = '/tmp/ace-typewriter-qa';
const cases = process.argv.includes('--locales')
  ? [['fa', 1440, 1000], ['fa', 390, 844], ['ar', 1440, 1000], ['ar', 390, 844], ['hi', 390, 844], ['zh', 390, 844]]
  : [[1440, 1000], [390, 844], [320, 568], [844, 390]].map(size => ['en', ...size]);

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || undefined,
    headless: true, args: ['--no-sandbox'] });
  try {
    for (const [code, width, height] of cases) {
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 500 });
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (route.request().method() !== 'GET') return route.abort();
        if (process.argv.includes('--fonts') && ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
        if (url.origin !== base) return route.abort();
        const file = path.join(root, decodeURIComponent(url.pathname), url.pathname.endsWith('/') ? 'index.html' : '');
        return fs.existsSync(file) ? route.fulfill({ path: file }) : route.abort();
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base + (code === 'en' ? '/' : `/${code}/`) + '#ace');
      await page.waitForFunction(() => document.querySelector('#stage')?.dataset.section === 'ace'
        && !document.querySelector('#stage').matches('.is-turning,.is-riffling'));
      await page.waitForTimeout(1100); // Let the cover-to-reading transform settle.
      const sheet = page.locator('.ace-intro-page[aria-hidden="false"]');
      const surface = sheet.locator('.ace-intro-panels');
      const tablist = sheet.locator('[role="tablist"]');
      const paper = await surface.boundingBox();
      const choices = await tablist.boundingBox();
      const vertical = width < 1000 || height < 800;
      assert.ok(await sheet.locator('.ace-intro-heading').evaluate(el => el.scrollHeight <= el.clientHeight + 1),
        'The introduction fits without clipping its last lines');
      assert.equal(await tablist.getAttribute('aria-orientation'), vertical ? 'vertical' : 'horizontal');
      assert.ok(vertical ? choices.x + choices.width <= paper.x + 1 : choices.y + choices.height <= paper.y + 1);
      if (height >= 500) {
        assert.ok(await tablist.evaluate(el => {
          const rail = el.getBoundingClientRect();
          return Array.from(el.children).every(tab => tab.getBoundingClientRect().bottom <= rail.bottom + 1);
        }), 'All three concept choices fit on portrait phones');
      }
      const pageNumber = await page.locator('#stage').getAttribute('data-page');
      // A long, two-paragraph card must progressively type in the same box.
      await page.locator('#intro-tab-connection').click();
      await page.waitForTimeout(450);
      const panel = page.locator('#intro-panel-connection');
      const full = await panel.locator('.ace-intro-definition').allTextContents();
      const partial = await panel.locator('.ace-intro-typed-line').allTextContents();
      assert.ok(partial.join('').length > 0 && partial.join('').length < full.join('').length);
      const segmenter = new Intl.Segmenter(code, { granularity: 'grapheme' });
      for (let i = 0; i < full.length; i++) {
        assert.ok(full[i].startsWith(partial[i]), 'Typing preserves the translated text');
        const boundaries = [0, ...Array.from(segmenter.segment(full[i]), part => part.index + part.segment.length)];
        assert.ok(boundaries.includes(partial[i].length), 'The cursor never splits a grapheme');
      }
      assert.equal(await panel.evaluate(el => getComputedStyle(el).direction), ['fa', 'ar'].includes(code) ? 'rtl' : 'ltr');
      assert.equal(await panel.locator('.ace-intro-typescript').getAttribute('aria-hidden'), 'true');
      assert.deepEqual(await surface.boundingBox(), paper, 'Typing does not move or resize the writing surface');
      assert.equal(await panel.locator('.ace-intro-cursor').count(), 1);
      await page.screenshot({ path: `${output}/${code}-${width}-typing.png` });
      await page.waitForFunction(() => !document.querySelector('#intro-panel-connection').classList.contains('is-typing'));
      assert.deepEqual(await panel.locator('.ace-intro-typed-line').allTextContents(), full);
      const scroll = await surface.evaluate(el => ({ top: el.scrollTop, max: el.scrollHeight - el.clientHeight }));
      if (scroll.max > 2) assert.ok(scroll.top > 0, 'The cursor follows long text within the paper');
      assert.equal(await page.locator('#stage').getAttribute('data-page'), pageNumber);
      // Repeated selections cancel old work; keyboard arrows stay in the tabs.
      await page.locator('#intro-tab-agency').click();
      await page.locator('#intro-tab-connection').click();
      await page.locator('#intro-tab-exchange').click();
      await page.waitForTimeout(200);
      assert.equal(await sheet.locator('.is-typing').count(), 1);
      assert.equal(await page.locator('#intro-panel-connection .ace-intro-cursor').count(), 0);
      await page.keyboard.press(vertical ? 'ArrowUp' : 'ArrowLeft');
      assert.equal(await page.locator('#intro-tab-connection').getAttribute('aria-selected'), 'true');
      assert.equal(await page.locator('#stage').getAttribute('data-page'), pageNumber);
      await page.keyboard.press('End');
      const activeTab = await page.locator('#intro-tab-exchange').boundingBox();
      const rail = await tablist.boundingBox();
      assert.ok(activeTab.y >= rail.y - 1 && activeTab.y + activeTab.height <= rail.y + rail.height + 1,
        'Keyboard selection reveals the active choice even on a short screen');
      await page.locator('#intro-tab-connection').click();
      // Deliberate reader scrolling must win over automatic cursor following.
      await surface.dispatchEvent('wheel', { deltaY: -100 });
      await surface.evaluate(el => { el.scrollTop = 0; });
      await page.waitForFunction(() => !document.querySelector('#intro-panel-connection').classList.contains('is-typing'));
      assert.equal(await surface.evaluate(el => el.scrollTop), 0);
      // A resize keeps the chosen tab and completes its text without corruption.
      await page.locator('#intro-tab-exchange').click();
      await page.setViewportSize({ width: width + 5, height });
      await page.waitForTimeout(500);
      assert.equal(await page.locator('#intro-tab-exchange').getAttribute('aria-selected'), 'true');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.locator('#intro-tab-connection').click();
      assert.equal(await sheet.locator('.is-typing, .ace-intro-cursor').count(), 0);
      assert.deepEqual(await panel.locator('.ace-intro-typed-line').allTextContents(), full);
      await page.screenshot({ path: `${output}/${code}-${width}-complete.png` });
      if (width === 1440 || width === 320) {
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        for (const [anchor, card] of [['ace-pdaf', 'feedback'], ['ace-phases', 'integration']]) {
          await page.locator('#next').click();
          await page.waitForFunction(anchor => location.hash === '#' + anchor
            && !document.querySelector('#stage').matches('.is-turning,.is-riffling'), anchor);
          assert.equal(await sheet.locator('.is-typing').count(), 1, 'Entering a new sheet starts its selected card');
          await page.locator('#intro-tab-' + card).click();
          await page.waitForTimeout(250);
          assert.equal(await sheet.locator('.ace-intro-cursor').count(), 1);
          await page.screenshot({ path: `${output}/${code}-${width}-${anchor}.png` });
          await page.waitForFunction(card => !document.querySelector('#intro-panel-' + card).classList.contains('is-typing'), card);
          const selected = page.locator('#intro-panel-' + card);
          assert.deepEqual(await selected.locator('.ace-intro-typed-line').allTextContents(),
            await selected.locator('.ace-intro-definition').allTextContents());
        }
      }
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`PASS ${code} ${width}×${height}: layout, progressive text, graphemes, cursor, stable surface, scroll following, rapid switching, keyboard, resize, reduced motion.`);
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
