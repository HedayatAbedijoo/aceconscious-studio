#!/usr/bin/env node
/* Local-only book voices QA. Playwright on NODE_PATH; optional CHROME_BIN and
 * --fonts for the existing public fonts. Screenshots stay under /tmp. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = 'http://127.0.0.1:8765';
const output = '/tmp/book-voices-qa';
const languages = JSON.parse(fs.readFileSync(path.join(root, 'content/languages.json')));
const characters = ['hedayat', 'anonymous', 'writer', 'ava', 'sam', 'saman', 'adam', 'god'];

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || undefined,
    headless: true, args: ['--no-sandbox'] });
  const errors = [];
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
  async function settled(page, anchor) {
    await page.waitForFunction(anchor => location.hash === '#' + anchor
      && document.querySelector('#stage')?.dataset.section === 'appendix'
      && !document.querySelector('#stage').matches('.is-turning,.is-riffling'), anchor);
  }
  const sheet = page => page.locator('.voices-page[aria-hidden="false"]');
  async function completeCopy(panel) {
    assert.deepEqual(await panel.locator('.ace-intro-typed-line').allTextContents(),
      await panel.locator('.ace-intro-definition').allTextContents());
    assert.deepEqual(await panel.locator('.ace-intro-typescript strong').allTextContents(),
      await panel.locator('.ace-intro-full-copy strong').allTextContents(), 'Inline emphasis survives typing');
    assert.equal(await panel.locator('.ace-intro-typescript').getAttribute('aria-hidden'), 'true');
    const bounds = await panel.evaluate(panel => {
      const full = panel.querySelector('.ace-intro-full-copy');
      const typed = panel.querySelector('.ace-intro-typescript');
      return [...full.children].map((p, i) => ({ full: p.getBoundingClientRect().height,
        typed: typed.children[i].getBoundingClientRect().height }));
    });
    assert.ok(bounds.every(p => Math.abs(p.full - p.typed) < 1), 'Visual and semantic text reserve identical space');
  }
  try {
    const cases = languages.flatMap(lang => [[1440, 1000], [390, 844]].map(size => [lang, ...size]));
    for (const code of ['en', 'fa']) {
      const lang = languages.find(lang => lang.code === code);
      cases.push([lang, 320, 568], [lang, 844, 390]);
    }
    for (const [lang, width, height] of cases) {
      const home = lang.code === 'en' ? '/' : `/${lang.code}/`;
      const ctx = await context({ viewport: { width, height }, hasTouch: width < 900, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      await page.goto(base + home + '#appendix');
      await settled(page, 'appendix');
      assert.equal(await page.locator('.bookmark[data-section="voices"]').count(), 0);
      assert.equal(await page.locator('.bookmark').count(), 11, 'Main navigation stays unchanged');
      const first = page.locator('.appendix-index[aria-hidden="false"] .section-index a').first();
      assert.equal(await first.getAttribute('data-jump'), 'voices');
      await first.click();
      await settled(page, 'voices');
      assert.equal(await page.locator('.voices-page').count(), 1, 'All voices share one fixed sheet');
      const surface = sheet(page).locator('.ace-intro-panels');
      const rail = sheet(page).locator('[role="tablist"]');
      const paper = await surface.boundingBox(), tabs = await rail.boundingBox();
      const vertical = width < 1000 || height < 800;
      assert.ok(paper.width >= 110 && paper.height >= 65, 'The prose always has a visible reading surface');
      assert.equal(await rail.getAttribute('aria-orientation'), vertical ? 'vertical' : 'horizontal');
      assert.ok(vertical ? tabs.x + tabs.width <= paper.x + 1 : tabs.y + tabs.height <= paper.y + 1,
        'Choices remain on the physical left or above the prose in all scripts');
      assert.equal(await surface.evaluate(el => getComputedStyle(el).direction), lang.dir);
      assert.ok(await sheet(page).locator('.ace-intro-heading').evaluate(el => el.scrollHeight <= el.clientHeight + 1),
        'The localized heading fits on the paper');
      const position = await page.locator('#stage').getAttribute('data-page');
      for (const id of characters) {
        await page.locator('#voice-tab-' + id).click();
        assert.equal(await sheet(page).locator('[role="tabpanel"]:visible').count(), 1);
        assert.equal(await page.locator('#voice-tab-' + id).getAttribute('aria-selected'), 'true');
        const panel = page.locator('#voice-panel-' + id);
        await completeCopy(panel);
        assert.equal(await surface.evaluate(el => el.scrollTop), 0, 'A new voice starts at the top');
        assert.deepEqual(await surface.boundingBox(), paper, 'Changing characters keeps the writing box in place');
        assert.ok(await surface.evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'Prose has no sideways overflow');
      }
      assert.equal(await page.locator('#stage').getAttribute('data-page'), position);
      await page.keyboard.press('Home');
      assert.equal(await page.locator('#voice-tab-hedayat').getAttribute('aria-selected'), 'true');
      await page.keyboard.press(vertical ? 'ArrowDown' : 'ArrowRight');
      assert.equal(await page.locator('#voice-tab-anonymous').getAttribute('aria-selected'), 'true');
      await page.keyboard.press('End');
      const last = await page.locator('#voice-tab-god').boundingBox(), railBounds = await rail.boundingBox();
      assert.ok(last.y >= railBounds.y - 1 && last.y + last.height <= railBounds.y + railBounds.height + 1,
        'The selected name is revealed on short screens');
      await page.locator('#voice-tab-anonymous').click();
      await page.screenshot({ path: `${output}/${lang.code}-${width}.png` });
      await surface.focus();
      await page.keyboard.press('Control+End');
      await page.waitForFunction(() => {
        const area = document.querySelector('.book-voices .ace-intro-panels');
        return area.scrollTop >= area.scrollHeight - area.clientHeight - 2;
      });
      assert.equal(await page.locator('#stage').getAttribute('data-page'), position, 'Reading keys do not turn the book');
      await page.setViewportSize({ width: width + 5, height: height + 10 });
      await page.waitForTimeout(450);
      assert.equal(await page.locator('#voice-tab-anonymous').getAttribute('aria-selected'), 'true');
      await page.locator('#previous').click();
      await settled(page, 'appendix');
      await page.locator('#next').click();
      await settled(page, 'voices');
      await page.locator('#next').click();
      await settled(page, 'contents');
      await page.goto(base + home + '#voices');
      await settled(page, 'voices');
      await sheet(page).waitFor({ state: 'visible' }); // Initial page-flip setup finishes on the next frame.
      await ctx.close();
      console.log(`PASS ${lang.code} ${width}×${height}: appendix order, all eight voices, markup, fixed surface, keyboard, RTL, resize, deep link.`);
    }

    for (const code of ['en', 'fa', 'hi']) {
      const ctx = await context({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', hasTouch: true });
      const page = await ctx.newPage();
      await page.goto(base + (code === 'en' ? '/' : `/${code}/`) + '#voices');
      await settled(page, 'voices');
      await page.clock.install({ time: 0 });
      await page.clock.pauseAt(1000);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      const panel = page.locator('#voice-panel-anonymous');
      const surface = sheet(page).locator('.ace-intro-panels');
      await page.locator('#voice-tab-anonymous').click();
      await page.clock.runFor(700);
      const partial = await panel.locator('.ace-intro-typed-line').allTextContents();
      const full = await panel.locator('.ace-intro-definition').allTextContents();
      assert.ok(partial.join('').length > 0 && partial.join('').length < full.join('').length);
      const segmenter = new Intl.Segmenter(code, { granularity: 'grapheme' });
      full.forEach((paragraph, i) => {
        assert.ok(paragraph.startsWith(partial[i]));
        const boundaries = [0, ...Array.from(segmenter.segment(paragraph), part => part.index + part.segment.length)];
        assert.ok(boundaries.includes(partial[i].length), 'Typing preserves complete graphemes');
      });
      assert.equal(await panel.locator('.ace-intro-cursor').count(), 1);
      await page.screenshot({ path: `${output}/${code}-typing.png` });
      await page.clock.runFor(60000);
      assert.equal(await panel.locator('.ace-intro-cursor').count(), 0);
      await completeCopy(panel);
      assert.ok(await surface.evaluate(el => el.scrollTop > 0), 'Long dialogue follows the caret inside the box');
      await page.locator('#voice-tab-hedayat').click();
      await page.locator('#voice-tab-anonymous').click();
      assert.equal(await sheet(page).locator('.is-typing').count(), 1, 'Rapid selection cancels the previous voice');
      await surface.dispatchEvent('wheel', { deltaY: -100 });
      await surface.evaluate(el => { el.scrollTop = 0; });
      await page.clock.runFor(60000);
      assert.equal(await surface.evaluate(el => el.scrollTop), 0, 'Manual reading takes precedence over cursor following');
      await completeCopy(panel);
      await page.locator('#voice-tab-god').click();
      await page.clock.runFor(400);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.clock.runFor(100);
      await completeCopy(page.locator('#voice-panel-god'));
      assert.equal(await sheet(page).locator('.is-typing, .ace-intro-cursor').count(), 0);
      await ctx.close();
      console.log(`PASS ${code}: progressive typing, graphemes, rich text, caret following, manual scrolling, cancellation, reduced motion.`);
    }
    const ctx = await context({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    for (const lang of languages) {
      await page.goto(base + (lang.code === 'en' ? '/' : `/${lang.code}/`) + '#voices');
      assert.equal(await page.locator('#voices .ace-intro-panel:visible').count(), 8);
      assert.equal(await page.locator('#voices [role="tab"]:visible').count(), 0);
    }
    await ctx.close();
    assert.deepEqual(errors, []);
    console.log('PASS all nine languages without JavaScript; no browser errors.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
