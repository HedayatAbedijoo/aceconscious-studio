#!/usr/bin/env node
/* Local sample visibility regression; also run with an older CHROME_BIN.
 * Local files only. --fonts permits the site's existing public font assets. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = 'http://127.0.0.1:8765';

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || undefined,
    headless: true, args: ['--no-sandbox'] });
  const version = await browser.version();
  const output = '/tmp/book-sample-qa/' + version;
  fs.mkdirSync(output, { recursive: true });
  const errors = [];
  try {
    for (const locale of ['en', 'fa', 'ar']) {
      const original = locale === 'fa' ? 'fa' : 'en';
      const sample = JSON.parse(fs.readFileSync(path.join(root, `content/book/sample-${original}.json`)));
      for (const [width, height] of [[390, 844], [768, 1024], [1440, 900], [320, 568], [844, 390]]) {
        const ctx = await browser.newContext({ viewport: { width, height },
          hasTouch: width < 900, reducedMotion: 'reduce' });
        await ctx.route('**/*', route => {
          const url = new URL(route.request().url());
          if (route.request().method() !== 'GET') return route.abort();
          if (process.argv.includes('--fonts') && ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
          if (url.origin !== base) return route.abort();
          const file = path.join(root, decodeURIComponent(url.pathname), url.pathname.endsWith('/') ? 'index.html' : '');
          return fs.existsSync(file) ? route.fulfill({ path: file }) : route.abort();
        });
        const page = await ctx.newPage();
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(base + (locale === 'en' ? '/' : `/${locale}/`) + '#sample');
        await page.waitForFunction(() => document.querySelector('#stage')?.dataset.section === 'sample');
        assert.equal(await page.locator('#book .sample-page').count(), sample.pages.length);
        async function checkVisible() {
          await page.waitForFunction(() => !!document.querySelector('#book .sample-page[aria-hidden="false"]'));
          const metrics = await page.locator('#book .sample-page[aria-hidden="false"]').evaluate(sheet => {
            const rect = el => {
              const r = el.getBoundingClientRect();
              return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
            };
            const reading = sheet.querySelector('.sample-sheet');
            const body = sheet.querySelector('.sample-sheet__body');
            const range = document.createRange();
            range.selectNodeContents(body);
            return { sheet: rect(sheet), reading: rect(reading), canvas: rect(sheet.querySelector('.sample-sheet__canvas')),
              head: rect(sheet.querySelector('.sample-page__head')), ink: rect(range), text: body.textContent.trim(),
              scale: Number(getComputedStyle(sheet).getPropertyValue('--sheet-scale')), direction: reading.dir,
              typedDivision: CSS.supports('transform', 'scale(calc(300px / 600px))') };
          });
          assert.ok(metrics.text.length > 40, 'Published sample text is present');
          assert.ok(metrics.scale > 0 && Number.isFinite(metrics.scale), 'The scale must be a resolved number on every engine');
          assert.ok(metrics.reading.width > 100 && metrics.reading.height > 80, 'The sample viewport must not collapse');
          assert.ok(metrics.canvas.width > 100 && metrics.canvas.height > 100, 'Printed canvas must not collapse');
          assert.ok(metrics.ink.width > 0 && metrics.ink.height > 0, 'Text has visible ink');
          assert.ok(metrics.ink.top < metrics.reading.bottom && metrics.ink.bottom > metrics.reading.top
            && metrics.ink.left < metrics.reading.right && metrics.ink.right > metrics.reading.left,
          'Text must intersect its visible clipping area');
          assert.ok(metrics.head.top >= metrics.sheet.top + 40 && metrics.head.bottom < metrics.reading.top + 1,
            'The printed running title remains visible below the ribbon row');
          assert.equal(metrics.direction || 'ltr', original === 'fa' ? 'rtl' : 'ltr');
          return metrics;
        }
        const metrics = await checkVisible();
        await page.screenshot({ path: `${output}/${locale}-${width}.png` });
        // Inspect every published page in each actual sample, not just its opening.
        const count = width === 390 && locale !== 'ar' ? sample.pages.length : 2;
        for (let n = 1; n < count; n++) {
          await page.locator('#next').click();
          await page.waitForFunction(hash => location.hash === hash, '#sample-' + String(n + 1).padStart(2, '0'));
          await checkVisible();
        }
        const selected = await page.locator('#stage').getAttribute('data-page');
        await page.keyboard.press(locale === 'en' ? 'ArrowLeft' : 'ArrowRight');
        await page.waitForFunction(n => Number(document.querySelector('#stage').dataset.page) === n - 1, Number(selected));
        await checkVisible();
        const anchor = new URL(page.url()).hash;
        await page.setViewportSize({ width: width + 5, height: height + 40 });
        await page.waitForTimeout(450);
        assert.equal(new URL(page.url()).hash, anchor, 'Resizing retains the selected sample page');
        await checkVisible();
        await ctx.close();
        console.log(`PASS Chrome ${version} ${locale} ${width}×${height}: sample visible, ${count} pages, keyboard, resize (typed CSS division: ${metrics.typedDivision}).`);
      }
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
