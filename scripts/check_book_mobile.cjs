#!/usr/bin/env node
/* Local-only mobile regressions. No form requests or remote assets are sent.
 * --baseline records the original failures without requiring a passing result.
 * These are browser/device emulations, not physical Android/iOS keyboard tests.
 */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = 'http://127.0.0.1:8765';
const baseline = process.argv.includes('--baseline');
const interactionsOnly = process.argv.includes('--interactions-only');
const layoutOnly = process.argv.includes('--layout-only');
const smoke = process.argv.includes('--smoke');
const out = path.join(root, 'docs/mobile-qa', baseline ? 'before' : 'vertical');
fs.mkdirSync(out, { recursive: true });
const results = [], errors = [];
const settled = async page => {
  await page.waitForFunction(() => document.querySelector('#stage')?.dataset.page !== undefined
    && !document.querySelector('#stage').matches('.is-turning,.is-riffling'));
  await page.waitForTimeout(100);
};
async function menuState(page) {
  return page.locator('#bookmarks').evaluate(nav => {
    const bounds = nav.getBoundingClientRect();
    const buttons = [...nav.children].map(button => {
      const b = button.getBoundingClientRect();
      const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
      return { section: button.dataset.section, x: b.x, y: b.y, width: b.width, height: b.height,
        visible: b.top >= Math.max(0, bounds.top) && b.bottom <= Math.min(innerHeight, bounds.bottom) + 1
          && b.left >= 0 && b.right <= innerWidth,
        clickable: button.contains(hit) };
    });
    const singleColumn = buttons.every((b, i) => Math.abs(b.x - buttons[0].x) < 1
      && (!i || b.y >= buttons[i - 1].y + buttons[i - 1].height));
    // Inspect actual canvas text drawing, including wrapped labels and script
    // ascenders/descenders, rather than just the surrounding button boxes.
    const ink = [...window.bookmarkInk.values()].slice(-buttons.length).flat();
    const clippedInk = ink.filter(line => line.top < 0 || line.bottom > line.height);
    return { width: innerWidth, height: innerHeight, scroll: nav.scrollHeight - nav.clientHeight,
      singleColumn, clippedInk, buttons };
  });
}
function checkMenu(state, name) {
  assert.equal(state.buttons.length, 10, name);
  assert.ok(state.singleColumn, `${name}: paper bookmarks must stay in one vertical stack`);
  assert.ok(state.buttons.every(b => b.visible && b.clickable), `${name}: clipped/unreachable menus: ${JSON.stringify(state)}`);
  assert.deepEqual(state.clippedInk, [], `${name}: clipped lettering on paper`);
}
async function showForm(page, id) {
  const target = await page.locator(`#${id}-form`).evaluate(el =>
    [...document.querySelectorAll('#book .page')].indexOf(el.closest('.page')));
  for (let i = 0; i < 30; i++) {
    const current = Number(await page.locator('#stage').getAttribute('data-page'));
    if (target === current) return;
    await page.locator(current < target ? '#next' : '#previous').click();
    await settled(page);
  }
  throw new Error(`Could not reach ${id}`);
}
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true, args: ['--no-sandbox'] });
  async function context(width, height, mobile = true) {
    const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: mobile, isMobile: mobile,
      deviceScaleFactor: mobile ? 2 : 1, reducedMotion: 'reduce' });
    await ctx.addInitScript(() => {
      window.bookmarkInk = new Map();
      const drawText = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
        if (!this.canvas.isConnected && this.textBaseline === 'middle') {
          const metrics = this.measureText(text);
          if (!bookmarkInk.has(this.canvas)) bookmarkInk.set(this.canvas, []);
          bookmarkInk.get(this.canvas).push({ text, font: this.font,
            top: y - metrics.actualBoundingBoxAscent, bottom: y + metrics.actualBoundingBoxDescent,
            height: this.canvas.height / this.getTransform().d });
        }
        return drawText.apply(this, arguments);
      };
    });
    await ctx.route('**/*', route => {
      const u = new URL(route.request().url());
      if (route.request().method() !== 'GET' || u.origin !== base) return route.abort();
      const file = path.join(root, decodeURIComponent(u.pathname), u.pathname.endsWith('/') ? 'index.html' : '');
      return fs.existsSync(file) ? route.fulfill({ path: file }) : route.abort();
    });
    ctx.on('page', page => page.on('pageerror', e => errors.push(e.message)));
    return ctx;
  }
  try {
    if (!interactionsOnly) {
      // Height changes and redundant window resize events reproduce keyboard blur.
      const ctx = await context(412, 915), page = await ctx.newPage();
      await page.goto(base + '/#contact');
      await settled(page);
      await showForm(page, 'contact');
      await page.locator('#contact-email').tap();
      await page.keyboard.type('local@example.com');
      await page.evaluate(() => {
        window.originalBook = document.querySelector('#book');
        window.originalField = document.activeElement;
        window.fieldBlurs = 0;
        originalField.addEventListener('blur', () => window.fieldBlurs++);
      });
      await page.setViewportSize({ width: 412, height: 560 });
      await page.waitForTimeout(500);
      const focus = await page.evaluate(() => ({ active: document.activeElement.id,
        sameBook: originalBook === document.querySelector('#book'), blurs: fieldBlurs,
        value: originalField.value, sameField: originalField === document.querySelector('#contact-email') }));
      results.push({ test: 'keyboard-layout-resize', ...focus });
      await page.screenshot({ path: path.join(out, 'keyboard-layout-resize.png') });
      if (!baseline) {
        assert.equal(focus.active, 'contact-email');
        assert.equal(focus.blurs, 0);
        assert.ok(focus.sameBook && focus.sameField);
      }
      await ctx.close();
      const languages = baseline ? ['en', 'fa'] : smoke ? ['en', 'fr', 'fa', 'ar']
        : JSON.parse(fs.readFileSync(path.join(root, 'content/languages.json'))).map(l => l.code);
      const sizes = baseline ? [[320, 568], [844, 390]] : smoke ? [[320, 480], [568, 320], [844, 390]] : [
        [320, 480], [320, 568], [360, 640], [375, 667], [390, 844], [412, 915], [430, 932],
        [568, 320], [667, 375], [844, 390], [915, 412], [768, 1024], [1024, 768],
      ];
      for (const [width, height] of sizes) {
        const ctx = await context(width, height), page = await ctx.newPage();
        for (const lang of languages) {
          await page.goto(base + (lang === 'en' ? '/' : `/${lang}/`) + '#headline');
          await settled(page);
          await page.locator('#book-menu-toggle').tap();
          await page.waitForTimeout(100);
          const state = await menuState(page);
          const name = `${lang}-${width}x${height}`;
          results.push({ test: 'menu', name, ...state });
          await page.screenshot({ path: path.join(out, name + '.png') });
          if (!baseline) {
            checkMenu(state, name);
          }
          console.log(`${baseline ? 'BASELINE' : 'PASS'} ${name}: ${state.buttons.filter(b => b.visible && b.clickable).length}/10 visible`);
        }
        await ctx.close();
      }
    }
    if (!baseline && !layoutOnly) {
      for (const lang of ['en', 'fa', 'ar']) {
        for (const [width, height] of [[360, 640], [412, 915], [768, 1024]]) {
          const ctx = await context(width, height), page = await ctx.newPage();
          const url = base + (lang === 'en' ? '/' : `/${lang}/`);
          await page.goto(url + '#contact');
          await settled(page);
          for (const form of ['contact', 'community']) {
            await page.goto(url + (form === 'contact' ? '#contact' : '#community'));
            await settled(page);
            await showForm(page, form);
            const fields = form === 'contact' ? ['contact-email', 'contact-message'] : ['community-email'];
            for (const id of fields) {
              await page.locator('#' + id).tap();
              await page.evaluate(() => {
                window.savedBook = document.querySelector('#book');
                window.savedField = document.activeElement;
                window.resizeBlurs = 0;
                savedField.addEventListener('blur', () => window.resizeBlurs++);
              });
              await page.keyboard.type(id.endsWith('email') ? 'proof@example.com' : 'Local keyboard proof');
              const typed = await page.locator('#' + id).inputValue();
              // Layout resize and redundant window/visual-viewport notifications
              // during simulated keyboard opening, animation and closing.
              for (const h of [height, height - 240, height - 280, height]) {
                await page.setViewportSize({ width, height: h });
                await page.evaluate(() => {
                  window.dispatchEvent(new Event('resize'));
                  window.visualViewport?.dispatchEvent(new Event('resize'));
                });
                await page.waitForTimeout(300);
                const state = await page.evaluate(() => ({ active: document.activeElement.id,
                  sameBook: savedBook === document.querySelector('#book'), blurs: resizeBlurs,
                  value: savedField.value, caret: savedField.selectionStart }));
                assert.equal(state.active, id, `${lang} ${width} ${id} focus`);
                assert.ok(state.sameBook, 'keyboard must not detach live forms');
                assert.equal(state.blurs, 0);
                assert.equal(state.value, typed);
                if (id.endsWith('message')) assert.equal(state.caret, typed.length);
              }
              await page.keyboard.type('x');
              assert.equal(await page.locator('#' + id).inputValue(), typed + 'x');
              results.push({ test: 'typing-resize-cycle', lang, width, height, field: id, passed: true });
            }
            // A real orientation change is deferred until focus leaves, then
            // applies once. Values and event listeners stay on the live nodes.
            await page.setViewportSize({ width: height, height: width });
            await page.waitForTimeout(300);
            assert.equal(await page.evaluate(() => savedField === document.activeElement), true);
            await page.evaluate(() => document.activeElement.blur());
            await page.waitForTimeout(500);
            assert.equal(await page.evaluate(() => savedBook === document.querySelector('#book')), false);
            assert.equal(await page.evaluate(() => savedField.isConnected), true);
            await page.setViewportSize({ width, height });
            await page.waitForTimeout(500);
            await settled(page);
          }
          console.log(`PASS typing, field switching and deferred rotation: ${lang} ${width}x${height}`);
          await ctx.close();
        }
        for (const [width, height] of [[320, 568], [844, 390], [412, 915]]) {
          const ctx = await context(width, height), page = await ctx.newPage();
          await page.goto(base + (lang === 'en' ? '/' : `/${lang}/`) + '#headline');
          await settled(page);
          const sections = await page.locator('.bookmark').evaluateAll(els => els.map(el => el.dataset.section));
          for (const section of sections) {
            await page.locator('#book-menu-toggle').tap();
            await page.locator(`.bookmark[data-section="${section}"]`).tap();
            await settled(page);
            assert.equal(await page.locator('#stage').getAttribute('data-section'), section);
            assert.equal(await page.locator('#book-menu-toggle').getAttribute('aria-expanded'), 'false');
          }
          // Back cover mirrors the menu again, so check its bounds too.
          await page.locator('#book-menu-toggle').tap();
          const back = await menuState(page);
          checkMenu(back, `back cover ${lang} ${width}x${height}`);
          await page.keyboard.press('Escape');
          assert.equal(await page.evaluate(() => document.activeElement.id), 'book-menu-toggle');
          await page.keyboard.press('Enter');
          for (const section of sections) {
            await page.keyboard.press('Tab');
            assert.equal(await page.evaluate(() => document.activeElement.dataset.section), section);
          }
          await page.keyboard.press('Enter');
          await settled(page);
          await page.keyboard.press('Escape');
          await settled(page);
          assert.equal(await page.locator('#stage').getAttribute('data-page'), '0');
          results.push({ test: 'touch-all-sections-keyboard-back-cover', lang, width, height, passed: true });
          console.log(`PASS all 10 touch targets, back cover and keyboard: ${lang} ${width}x${height}`);
          await ctx.close();
        }
      }
      for (const [width, height] of [[900, 500], [1366, 600], [1440, 900], [1920, 1080]]) {
        const ctx = await context(width, height, false), page = await ctx.newPage();
        for (const lang of ['en', 'fa']) {
          await page.goto(base + (lang === 'en' ? '/' : '/fa/') + '#headline');
          await settled(page);
          await page.locator('#book-menu-toggle').click();
          const state = await menuState(page);
          checkMenu(state, `desktop ${lang} ${width}x${height}`);
          results.push({ test: 'desktop-menu', lang, ...state });
          await page.screenshot({ path: path.join(out, `desktop-${lang}-${width}x${height}.png`) });
        }
        await ctx.close();
      }
    }
    assert.deepEqual(errors, []);
  } finally {
    fs.writeFileSync(path.join(out, interactionsOnly ? 'interaction-results.json' : 'results.json'), JSON.stringify({ browser: browser.version(), baseline, results, errors }, null, 2));
    await browser.close();
  }
  console.log(`Local proof: ${out}`);
})().catch(e => { console.error(e); process.exitCode = 1; });
