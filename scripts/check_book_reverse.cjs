#!/usr/bin/env node
/* Local-only regression: the incoming paper must retrace the outgoing curl. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = 'http://127.0.0.1:8765';
const languages = JSON.parse(fs.readFileSync(path.join(root, 'content/languages.json')));
const out = '/tmp/book-reverse-qa';
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_BIN || undefined,
    headless: true,
    args: ['--no-sandbox'],
  });
  const errors = [];
  try {
    for (const mobile of [false, true]) {
      const context = await browser.newContext({
        viewport: mobile ? { width: 390, height: 844 } : { width: 1366, height: 900 },
        hasTouch: mobile, isMobile: mobile,
      });
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.origin !== base || route.request().method() !== 'GET') return route.abort();
        const file = path.join(root, decodeURIComponent(url.pathname), url.pathname.endsWith('/') ? 'index.html' : '');
        if (!fs.existsSync(file)) return route.abort();
        if (url.pathname === '/js/book.js') {
          return route.fulfill({ contentType: 'text/javascript', body:
            'St.PageFlip = new Proxy(St.PageFlip, { construct(Type, args) { return window.testBook = new Type(...args); } });\n' + fs.readFileSync(file, 'utf8') });
        }
        return route.fulfill({ path: file });
      });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      const settled = async () => {
        await page.waitForFunction(() => window.testBook?.getState() === 'read'
          && document.querySelector('#stage')?.dataset.section === 'story'
          && !document.querySelector('#stage').matches('.is-turning,.is-riffling'));
        // Completion changes state before the next paint clears folded copies.
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      };
      const index = () => page.locator('#stage').getAttribute('data-page').then(Number);

      for (const language of languages) {
        const rtl = language.dir === 'rtl';
        await page.goto(base + (language.code === 'en' ? '/' : `/${language.code}/`) + '#synopsis');
        await settled();
        await page.waitForTimeout(350); // Finish the responsive reading-layout rebuild.
        const before = await index();

        // Freeze the actual renderer and inspect intermediate frames of both
        // keyboard turns, including their clipped faces and paper shadows.
        await page.evaluate(() => window.testBook.getRender().stop());
        await page.keyboard.press(rtl ? 'ArrowLeft' : 'ArrowRight');
        const forwardTiming = await page.evaluate(() => {
          const engine = window.testBook, animation = engine.getRender().animation;
          return {
            duration: animation.duration,
            expected: Math.min(1, animation.frames.length / 1000) * (engine.getSettings().flippingTime / 2),
          };
        });
        assert.equal(forwardTiming.duration, forwardTiming.expected, language.code + ': forward uses the approved faster duration');
        const forward = await page.evaluate(() => {
          const engine = window.testBook, render = engine.getRender();
          return [0.25, 0.5, 0.75].map(fraction => {
            const frames = render.animation.frames;
            frames[Math.round((frames.length - 1) * fraction)]();
            render.drawFrame();
            const calc = engine.getFlipController().getCalculation();
            return { position: calc.getPosition(), angle: calc.getAngle(), rect: calc.getRect() };
          });
        });
        await page.evaluate(() => window.testBook.getRender().finishAnimation());
        assert.equal(await index(), before + 1);
        await page.keyboard.press(rtl ? 'ArrowRight' : 'ArrowLeft');
        assert.equal(await page.evaluate(() => window.testBook.getRender().animation.duration),
          forwardTiming.duration, language.code + ': backward and forward take the same time');
        const backward = await page.evaluate(() => {
          const engine = window.testBook, render = engine.getRender();
          return [0.75, 0.5, 0.25].map(fraction => {
            const frames = render.animation.frames;
            frames[Math.round((frames.length - 1) * fraction)]();
            render.drawFrame();
            const calc = engine.getFlipController().getCalculation();
            return {
              position: calc.getPosition(), angle: calc.getAngle(), rect: calc.getRect(),
              direction: render.getDirection(),
              stationary: render.rightPage === engine.getPage(engine.getCurrentPageIndex() - 1),
              underneath: render.bottomPage === engine.getPage(engine.getCurrentPageIndex()),
              copy: render.flippingPage === render.rightPage.getTemporaryCopy(),
              clip: render.flippingPage.getElement().style.clipPath,
              shadow: render.outerShadow.style.display,
            };
          });
        });
        for (let i = 0; i < forward.length; i++) {
          const a = forward[i], b = backward[i], label = `${language.code} ${mobile ? 'mobile' : 'desktop'} frame ${i}`;
          assert.equal(b.direction, 0, label + ': reverse must use the forward geometry');
          assert.ok(b.stationary && b.underneath && b.copy, label + ': both paper faces must be present');
          assert.ok(b.clip.startsWith('polygon(') && b.shadow === 'block', label + ': curl and shadow');
          assert.ok(Math.abs(a.angle - b.angle) < 0.01, label + ': reverse angle');
          for (const point of ['position', ...Object.keys(a.rect)]) {
            const p = point === 'position' ? a.position : a.rect[point];
            const q = point === 'position' ? b.position : b.rect[point];
            assert.ok(Math.hypot(p.x - q.x, p.y - q.y) < 2, label + ': reverse ' + point);
          }
        }
        if (['en', 'fa'].includes(language.code)) {
          await page.evaluate(() => {
            const render = window.testBook.getRender(), frames = render.animation.frames;
            frames[Math.floor(frames.length / 2)]();
            render.drawFrame();
          });
          await page.screenshot({ path: `${out}/${language.code}-${mobile ? 'mobile' : 'desktop'}-reverse.png` });
        }
        await page.evaluate(() => {
          const render = window.testBook.getRender();
          render.finishAnimation(); render.start();
        });
        await settled();
        assert.equal(await index(), before);

        if (mobile) {
          const box = await page.locator('#shell').boundingBox();
          const physical = fraction => box.x + box.width * (rtl ? 1 - fraction : fraction);
          const y = box.y + box.height - 100;
          await page.touchscreen.tap(physical(0.1), box.y + box.height * 0.65);
          await page.waitForFunction(n => Number(document.querySelector('#stage').dataset.page) === n - 1
            && window.testBook.getState() === 'read', before);
          await page.keyboard.press(rtl ? 'ArrowLeft' : 'ArrowRight');
          await settled();
          const cdp = await context.newCDPSession(page);
          for (const cancel of [true, false]) {
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: physical(0.08), y }] });
            await page.waitForTimeout(300);
            for (const fraction of [0.2, 0.4, 0.6, 0.85]) {
              await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: physical(fraction), y: y - 15 }] });
              await page.waitForTimeout(30);
            }
            assert.equal(await page.evaluate(() => window.testBook.getState()), 'read',
              language.code + ': no live fold or temporary copy while the finger is down');
            await cdp.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] });
            await page.waitForFunction(() => window.testBook.getState() === 'read');
            assert.equal(await index(), before - (cancel ? 0 : 1), language.code + ': drag completion/cancellation');
          }
          await cdp.detach();
        }
        console.log(`PASS ${language.code} ${mobile ? 'mobile: matching faster timing, frames, keyboard, tap, swipe, cancel' : 'desktop: matching faster timing, frames, keyboard'}`);
      }
      await context.close();
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
