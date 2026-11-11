#!/usr/bin/env node
/* Local browser regression for the page-turn corner. All remote requests and
 * form submissions are blocked. Mobile/tablet cases use device emulation. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = 'http://127.0.0.1:8765';
const languages = JSON.parse(fs.readFileSync(path.join(root, 'content/languages.json')));
const out = '/tmp/book-curl-qa';
fs.mkdirSync(out, { recursive: true });

async function settled(page) {
  await page.waitForFunction(() => document.querySelector('#stage')?.dataset.page !== undefined
    && !document.querySelector('#stage').matches('.is-turning,.is-riffling'));
  await page.locator('#book .page[aria-hidden="false"]').waitFor({ state: 'visible' });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function checkCorner(page, label) {
  const state = await page.locator('.curl').evaluate(el => {
    const paper = document.querySelector('#book .page[aria-hidden="false"]').getBoundingClientRect();
    const curl = el.getBoundingClientRect();
    const rtl = document.documentElement.dir === 'rtl';
    const style = getComputedStyle(el);
    return { paper: paper.toJSON(), curl: curl.toJSON(),
      sideGap: rtl ? curl.left - paper.left : paper.right - curl.right,
      bottomGap: paper.bottom - curl.bottom, visibility: style.visibility, opacity: style.opacity };
  });
  assert.equal(state.visibility, 'visible', label);
  assert.equal(state.opacity, '1', label);
  assert.ok(state.curl.width > 0 && state.curl.height > 0, label);
  // StPageFlip rounds paper dimensions, so allow subpixel layout differences.
  assert.ok(Math.abs(state.sideGap) < 0.6 && Math.abs(state.bottomGap) < 0.6,
    `${label}: curl must meet the physical paper corner: ${JSON.stringify(state)}`);
  return state.curl;
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN,
    headless: true, args: ['--no-sandbox'] });
  const errors = [];
  try {
    for (const [width, height, touch] of [
      [1920, 1080, false], [1366, 900, false], [900, 420, false],
      [390, 844, true], [320, 480, true], [844, 390, true], [1024, 768, true],
    ]) {
      const ctx = await browser.newContext({ viewport: { width, height },
        hasTouch: touch, isMobile: touch, deviceScaleFactor: touch ? 2 : 1, reducedMotion: 'reduce' });
      await ctx.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.origin !== base || route.request().method() !== 'GET') return route.abort();
        const file = path.join(root, decodeURIComponent(url.pathname), url.pathname.endsWith('/') ? 'index.html' : '');
        return fs.existsSync(file) ? route.fulfill({ path: file }) : route.abort();
      });
      const page = await ctx.newPage();
      page.on('pageerror', error => errors.push(error.message));
      for (const language of languages) {
        const home = base + (language.code === 'en' ? '/' : `/${language.code}/`);
        const label = `${language.code} ${width}×${height} ${touch ? 'touch' : 'desktop'}`;
        await page.goto(home + '#headline');
        await settled(page);
        const initial = await checkCorner(page, label);
        if (!touch) {
          await page.locator('#next').hover();
          await settled(page);
          const hovered = await checkCorner(page, label + ' hover');
          assert.ok(hovered.width > initial.width, label + ': hover grows inward from the corner');
        }
        const before = Number(await page.locator('#stage').getAttribute('data-page'));
        if (touch) await page.locator('#next').tap();
        else await page.locator('#next').click();
        await settled(page);
        assert.equal(Number(await page.locator('#stage').getAttribute('data-page')), before + 1, label);
        await checkCorner(page, label + ' after turn');
        await page.keyboard.press(language.dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft');
        await settled(page);
        assert.equal(Number(await page.locator('#stage').getAttribute('data-page')), before, label);
        await page.mouse.move(0, 0);
        await page.locator('#next').focus();
        await settled(page);
        await checkCorner(page, label + ' keyboard focus');

        // Check distinct paper templates as well as the shared navigation.
        for (const section of ['sample', 'appendix', 'privacy']) {
          await page.evaluate(hash => { location.hash = hash; }, section);
          await settled(page);
          await checkCorner(page, label + ' ' + section);
        }
        if (['en', 'fa', 'ar'].includes(language.code) && [1366, 390].includes(width)) {
          const paper = await page.locator('#shell').boundingBox();
          await page.screenshot({ path: `${out}/${language.code}-${width}.png`, clip: {
            x: Math.max(0, paper.x - 6), y: paper.y + paper.height - 90,
            width: paper.width + 12, height: 98,
          } });
        }
        await page.keyboard.press('End');
        await settled(page);
        assert.ok(await page.locator('.curl').isHidden(), label + ': no next-page curl on back cover');
        await page.locator('#close').click();
        await settled(page);
        assert.ok(await page.locator('.curl').isHidden(), label + ': no curl on front cover');
        console.log(`PASS ${label}: corner, navigation, templates, cover visibility${touch ? '' : ', hover'}`);
      }

      // Resize an already open book through short desktop and mobile layouts.
      if (width === 1366) {
        for (const code of ['en', 'fa', 'ar']) {
          await page.goto(base + (code === 'en' ? '/' : `/${code}/`) + '#headline');
          await settled(page);
          for (const [w, h] of [[900, 420], [390, 844], [844, 390], [1366, 900]]) {
            await page.setViewportSize({ width: w, height: h });
            await page.waitForFunction(([w, h]) => {
              const immersive = document.documentElement.classList.contains('immersive-reading');
              const paper = document.querySelector('#shell').getBoundingClientRect();
              return immersive === (w < 900) && paper.height <= h && paper.width <= w;
            }, [w, h]);
            await settled(page);
            await checkCorner(page, `${code} resized to ${w}×${h}`);
          }
          console.log(`PASS ${code}: live desktop/mobile/landscape resizing`);
        }
      }
      await ctx.close();
    }
    assert.deepEqual(errors, []);
    console.log(`PASS all ${languages.length} languages. Corner screenshots: ${out}`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
