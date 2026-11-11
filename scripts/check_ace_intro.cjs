#!/usr/bin/env node
/* Local-only browser regression. Run with Playwright on NODE_PATH and, if
 * needed, CHROME_BIN pointing to an installed Chromium. No server or uploads. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = 'http://127.0.0.1:8765';
const output = '/tmp/ace-intro-locales-qa';
const languages = JSON.parse(fs.readFileSync(path.join(root, 'content/languages.json'), 'utf8'));
const expectedOrder = ['headline', 'reviews', 'story', 'ace', 'buy', 'community', 'author', 'contact', 'sample', 'appendix', 'back-cover'];
const proseSelector = '.ace-intro-lead, .ace-intro-definition, .ace-intro-typed-line, .ace-intro-panel h3, .ace-intro-example p, .ace-intro-note, .ace-intro-play-body, .ace-intro-signup';
const typography = el => {
  const style = getComputedStyle(el);
  return [style.fontFamily, style.fontSize, style.fontWeight, style.lineHeight, style.letterSpacing, style.color];
};

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || undefined,
    headless: true, args: ['--no-sandbox'] });
  const errors = [];
  async function context(options) {
    const ctx = await browser.newContext(options);
    await ctx.route('**/*', route => {
      const request = route.request(), url = new URL(request.url());
      if (request.method() !== 'GET') return route.abort();
      if (process.argv.includes('--fonts') && ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
      if (url.origin !== base) return route.abort();
      const file = path.join(root, decodeURIComponent(url.pathname), url.pathname.endsWith('/') ? 'index.html' : '');
      return fs.existsSync(file) ? route.fulfill({ path: file }) : route.abort();
    });
    ctx.on('page', page => page.on('pageerror', error => errors.push(error.message)));
    return ctx;
  }
  async function settled(page) {
    await page.waitForFunction(() => !document.querySelector('#stage').matches('.is-turning,.is-riffling'));
    await page.waitForTimeout(150);
  }
  async function open(page, target = '/#ace') {
    await page.goto(base + target);
    await page.waitForFunction(() => document.querySelector('#stage')?.dataset.section === 'ace');
    await settled(page);
  }
  const sheet = page => page.locator('.ace-intro-page[aria-hidden="false"]');
  const readingSelector = '.is-typewriter .ace-intro-panels, .ace-intro:not(.is-typewriter) .ace-intro-reading';
  const selected = page => sheet(page).locator('[role="tab"][aria-selected="true"]').getAttribute('id');
  async function checkScrollCue(page, label) {
    const reading = sheet(page).locator(readingSelector);
    const cue = sheet(page).locator('.ace-intro-scroll');
    const overflow = await reading.evaluate(el => el.scrollHeight - el.clientHeight > 2);
    if (!overflow) {
      assert.equal(await cue.isVisible(), false, `No unnecessary scroll cue: ${label}`);
      return;
    }
    await cue.waitFor({ state: 'visible' });
    const before = await cue.boundingBox();
    const paper = await sheet(page).locator('.page-body').boundingBox();
    assert.ok(before.x >= paper.x + paper.width - 20 && before.x + before.width <= paper.x + paper.width,
      `Cue stays on the physical right, including RTL: ${label}`);
    assert.ok(before.y >= paper.y && before.y + before.height <= paper.y + paper.height,
      `Cue remains inside the visible paper: ${label}`);
    const initialPage = await page.locator('#stage').getAttribute('data-page');
    const initialThumb = await cue.locator('.ace-intro-scroll-thumb').boundingBox();
    // Keyboard scrolling must reach the bottom without turning the book.
    await reading.focus();
    await page.keyboard.press('Control+End');
    await page.waitForFunction(() => {
      const el = document.querySelector('.ace-intro-page[aria-hidden="false"] .is-typewriter .ace-intro-panels, .ace-intro-page[aria-hidden="false"] .ace-intro:not(.is-typewriter) .ace-intro-reading');
      return el.scrollTop >= el.scrollHeight - el.clientHeight - 2;
    });
    await page.waitForFunction(() => document.querySelector('.ace-intro-page[aria-hidden="false"] .ace-intro-scroll').classList.contains('at-bottom'));
    assert.equal(await page.locator('#stage').getAttribute('data-page'), initialPage);
    const after = await cue.boundingBox();
    const finalThumb = await cue.locator('.ace-intro-scroll-thumb').boundingBox();
    assert.deepEqual(after, before, `Cue does not scroll away: ${label}`);
    assert.ok(finalThumb.y > initialThumb.y, `Thumb tracks reading progress: ${label}`);
    await reading.evaluate(el => { el.scrollTop = 0; });
    await page.waitForFunction(() => document.querySelector('.ace-intro-page[aria-hidden="false"] .ace-intro-scroll').classList.contains('at-top'));
    await reading.blur();
  }
  const cases = languages.flatMap(lang => [[1366, 900], [390, 844]].map(size => [lang, ...size]));
  for (const code of ['en', 'fa']) {
    const lang = languages.find(item => item.code === code);
    cases.push([lang, 320, 568], [lang, 844, 390]);
  }
  for (const [lang, width, height] of process.argv.includes('--touch-only') ? [] : cases) {
    const code = lang.code, rtl = lang.dir === 'rtl';
    const home = code === 'en' ? '/' : `/${code}/`;
    const copy = JSON.parse(fs.readFileSync(path.join(root, `content/book/ace-intro.${code}.json`), 'utf8'));
    const ctx = await context({ viewport: { width, height }, reducedMotion: 'reduce', hasTouch: width < 500 });
    const page = await ctx.newPage();
    await open(page, home + '#ace');
    assert.deepEqual(await page.locator('.bookmark').evaluateAll(tabs => tabs.map(tab => tab.dataset.section)), expectedOrder);
    assert.equal(await page.locator('.ace-intro [data-i18n="back"], .ace-intro-back').count(), 0);
    assert.equal(await page.locator('[data-intro-next], [data-next-label], [data-intro-group] .ace-intro-nav').count(), 0);
    // The ordinary previous/next controls follow the same order as the tabs.
    await page.locator('#previous').click();
    await settled(page);
    assert.equal(await page.locator('#stage').getAttribute('data-section'), 'story');
    await page.locator('#next').click();
    await settled(page);
    assert.equal(await page.locator('#stage').getAttribute('data-section'), 'ace');
    assert.equal(await page.locator('.ace-intro-page').count(), 4, 'ACE must stay four physical book sheets');
    assert.equal(await page.locator('.ace-intro-page .ace-intro.is-typewriter').count(), 3, 'Every edition uses typewriter cards');
    assert.equal(await sheet(page).locator('h2').textContent(), copy['concepts.title']);
    assert.equal(await page.locator('.ace-intro-kicker').count(), 0, 'Red kicker headings are removed');
    const referenceTypography = await sheet(page).locator('.ace-intro-lead').evaluate(typography);
    assert.equal(await sheet(page).locator('.ace-intro-note, .ace-intro-duration').count(), 0);
    assert.equal(await selected(page), 'intro-tab-agency');
    // Tab arrows must select a card, without turning the surrounding book.
    await page.locator('#intro-tab-agency').focus();
    const initialPage = await page.locator('#stage').getAttribute('data-page');
    await page.keyboard.press('ArrowRight');
    assert.equal(await selected(page), 'intro-tab-connection');
    assert.equal(await page.locator('#stage').getAttribute('data-page'), initialPage);
    await page.keyboard.press('End');
    assert.equal(await selected(page), 'intro-tab-exchange');
    await page.keyboard.press('Home');
    assert.equal(await selected(page), 'intro-tab-agency');
    await page.locator('#intro-tab-agency').blur();

    for (const [anchor, cards] of [
      ['ace', ['agency', 'connection', 'exchange']],
      ['ace-pdaf', ['preparation', 'decision', 'action', 'feedback']],
      ['ace-phases', ['exploration', 'stabilization', 'expansion', 'integration']],
    ]) {
      assert.equal(new URL(page.url()).hash, '#' + anchor);
      const sectionKey = { ace: 'concepts', 'ace-pdaf': 'pdaf', 'ace-phases': 'phases' }[anchor];
      assert.equal(await sheet(page).locator('h2').textContent(), copy[sectionKey + '.title']);
      assert.equal(await sheet(page).locator('.ace-intro-progress').textContent(), copy[sectionKey + '.progress']);
      const positions = await sheet(page).locator('[role="tab"]').evaluateAll(tabs => tabs.map(tab => {
        const box = tab.getBoundingClientRect();
        return { id: tab.id, x: box.x, y: box.y };
      }));
      assert.deepEqual(positions.map(tab => tab.id), cards.map(card => 'intro-tab-' + card));
      const vertical = await sheet(page).locator('[role="tablist"]').getAttribute('aria-orientation') === 'vertical';
      assert.ok(positions.every((tab, i) => !i || tab[vertical ? 'y' : 'x'] > positions[i - 1][vertical ? 'y' : 'x']),
        `${code}: ACE/PDAF/phases retain their physical LTR/top-to-bottom order`);
      assert.equal(await sheet(page).locator('.ace-intro-panels').evaluate(el => getComputedStyle(el).direction), lang.dir,
        'The text retains the edition direction');
      if (vertical) {
        const rail = await sheet(page).locator('[role="tablist"]').boundingBox();
        const paper = await sheet(page).locator('.ace-intro-panels').boundingBox();
        assert.ok(rail.x + rail.width <= paper.x + 1, 'The choices stay on the physical left in every language');
      }
      await page.screenshot({ path: `${output}/${code}-${width}-${anchor}.png` });
      for (const card of cards) {
        await sheet(page).locator('#intro-tab-' + card).click();
        assert.equal(await selected(page), 'intro-tab-' + card);
        assert.equal(new URL(page.url()).hash, '#' + anchor, 'Selecting a card keeps the current book page');
        const panel = page.locator('#intro-panel-' + card);
        assert.equal(await sheet(page).locator('[role="tabpanel"]:visible').count(), 1);
        if (anchor === 'ace') {
          assert.equal(await panel.locator('.ace-intro-example, h3').count(), 0, 'Concept cards contain only uniform definitions');
          assert.deepEqual(await panel.locator('.ace-intro-definition').allTextContents(),
            [copy[card + '.heading'], copy[card + '.body']].filter(Boolean));
          const typography = await panel.locator('.ace-intro-definition').evaluateAll(items => items.map(el => {
            const style = getComputedStyle(el);
            return [style.fontFamily, style.fontSize, style.fontWeight, style.lineHeight];
          }));
          assert.ok(typography.every(style => JSON.stringify(style) === JSON.stringify(typography[0]) && parseFloat(style[1]) >= 17),
            'Concept sentences use the same readable typography');
          assert.ok(await sheet(page).locator('.ace-intro-lead').evaluate(el => parseFloat(getComputedStyle(el).fontSize) >= 17),
            'The ACE introduction remains readable on mobile');
        } else if (anchor === 'ace-pdaf') {
          assert.equal(await panel.locator('.ace-intro-example, h3').count(), 0, 'PDAF cards contain only the original definition');
          assert.equal(await panel.locator('.ace-intro-definition').textContent(), copy[card + '.body']);
          assert.equal(await sheet(page).locator('.ace-intro-note').count(), 0, 'The PDAF cycle footer is removed');
          assert.equal(await sheet(page).locator('.ace-intro-lead').count(), 0, 'The PDAF introductory sentence is removed');
          if (['action', 'feedback'].includes(card) && ['en', 'fa'].includes(code)) {
            await page.screenshot({ path: `${output}/${code}-${width}-${card}.png` });
          }
          if (card === 'decision') {
            const decision = await panel.locator('.ace-intro-definition').textContent();
            const phaseNames = ['exploration', 'stabilization', 'expansion', 'integration'].map(name => copy[name + '.name']);
            assert.ok(decision.includes('\n'), 'The four phases follow the opening sentence on a new line');
            assert.ok(phaseNames.every(name => decision.split('\n')[1].includes(name)), 'Decision lists all four localized phase names');
            if (code === 'en' || code === 'fa') await page.screenshot({ path: `${output}/${code}-${width}-decision.png` });
          }
        } else {
          assert.equal(await sheet(page).locator('.ace-intro-lead').count(), 0, 'The phase introduction is removed');
          assert.equal(await panel.locator('.ace-intro-example, h3').count(), 0, 'Each phase contains only its concise definition');
          assert.equal(await panel.locator('.ace-intro-definition').textContent(), copy[card + '.body']);
          if (['en', 'fa'].includes(code)) {
            await page.screenshot({ path: `${output}/${code}-${width}-${card}.png` });
          }
        }
        assert.ok(await sheet(page).locator('[role="tab"] > span').evaluateAll(labels => labels.every(label => label.scrollWidth <= label.clientWidth + 1)), `Tab label overflow: ${code}, ${width}`);
        // Every line stays in a scrollable reading area, including narrow and
        // landscape screens; no horizontal clipping or fitted tiny text.
        assert.equal(await sheet(page).locator('.page-fit').count(), 0);
        const bounds = await sheet(page).locator(readingSelector).evaluate(el => ({
          width: el.clientWidth, content: el.scrollWidth,
          reachable: getComputedStyle(el).overflowY === 'auto',
        }));
        assert.ok(bounds.content <= bounds.width + 1, `Horizontal clipping at ${width}, ${card}`);
        assert.ok(bounds.reachable);
        for (const text of await sheet(page).locator(proseSelector).all()) {
          assert.deepEqual(await text.evaluate(typography), referenceTypography, `${code} ${width}: all ACE copy matches What is ACE?`);
        }
        await checkScrollCue(page, `${code} ${width} ${card}`);
        await panel.locator('.ace-intro-definition').last().scrollIntoViewIfNeeded();
      }
      await page.locator('#next').click();
      await settled(page);
    }
    assert.equal(new URL(page.url()).hash, '#ace-play');
    for (const text of await sheet(page).locator(proseSelector).all()) {
      assert.deepEqual(await text.evaluate(typography), referenceTypography, `${code} ${width}: invitation copy matches What is ACE?`);
    }
    assert.equal(await sheet(page).locator('h2').textContent(), copy['play.title']);
    assert.equal(await sheet(page).locator('.ace-intro-progress').textContent(), copy['play.progress']);
    assert.equal(await sheet(page).locator('.ace-intro-play-lead, .ace-intro-novel').count(), 0);
    assert.equal(await sheet(page).locator('.ace-intro-fan > span').count(), 3, 'The decorative cards remain');
    assert.equal(await sheet(page).locator('.ace-intro-play-body').textContent(), copy['play.body']);
    assert.equal(await sheet(page).locator('.ace-intro-signup').textContent(), copy['play.signup']);
    assert.equal(await sheet(page).locator('.ace-intro-play').getAttribute('href'), '#community');
    assert.equal(await page.locator('.ace-intro-nav, .ace-intro-contact, .ace-intro-revisit').count(), 0);
    if (code === 'en') assert.equal(await sheet(page).locator('h2').textContent(), 'Play ACE');
    assert.ok(await sheet(page).locator('.ace-intro-play').evaluate(el => {
      const link = el.getBoundingClientRect(), paper = el.closest('.page-body').getBoundingClientRect();
      return link.top >= paper.top && link.bottom <= paper.bottom;
    }), 'The play invitation stays visible on a small screen');
    assert.equal(await sheet(page).locator('input,textarea,form').count(), 0);
    await page.screenshot({ path: `${output}/${code}-${width}-ace-play.png` });
    for (const [selector, destination] of [['.ace-intro-play', 'community']]) {
      await sheet(page).locator(selector).focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(section => document.querySelector('#stage')?.dataset.section === section, destination);
      await settled(page);
      assert.equal(new URL(page.url()).hash, '#' + destination, 'The signup link stays inside the current edition');
      await page.waitForFunction(() => !!document.activeElement.closest('#book .page[aria-hidden="false"]'));
      if (destination === 'community') {
        assert.equal(await page.locator('#community-email').evaluate(el => el === document.activeElement), true, 'Signup opens the real Community form');
      }
      await open(page, home + '#ace-play');
    }
    await page.locator('#next').click();
    await settled(page);
    assert.equal(await page.locator('#stage').getAttribute('data-section'), 'buy');
    await page.locator('#previous').click();
    await settled(page);
    assert.equal(new URL(page.url()).hash, '#ace-play');
    for (let i = 0; i < 3; i++) {
      await page.locator('#previous').click();
      await settled(page);
    }
    assert.equal(new URL(page.url()).hash, '#ace', 'Ordinary pagination returns to ACE without a duplicate footer menu');
    await page.locator('#intro-tab-connection').click();
    await page.setViewportSize({ width: width + 5, height });
    await page.waitForTimeout(450);
    await settled(page);
    assert.equal(await selected(page), 'intro-tab-connection', 'A resize keeps the live card selection');
    await page.locator('#intro-tab-connection').blur();
    await page.keyboard.press(rtl ? 'ArrowLeft' : 'ArrowRight');
    await settled(page);
    assert.equal(new URL(page.url()).hash, '#ace-pdaf', 'Book keyboard navigation works outside the tabs');
    await ctx.close();
    console.log(`PASS ${code} ${width}×${height}: book order, four sheets, every translation/card, keyboard, navigation, resize, bounds.`);
  }
  // A real touch scroll must not turn the book while reading a card.
  const touch = await context({ viewport: { width: 320, height: 568 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  const phone = await touch.newPage();
  const cdp = await touch.newCDPSession(phone);
  for (const home of ['/', '/fa/']) {
    await open(phone, home + '#ace');
    // Agency can now fit without scrolling after removing the novel examples.
    // Use the longer Connection definition to exercise a real touch scroll.
    await phone.locator('#intro-tab-connection').click();
    const before = await phone.locator('#stage').getAttribute('data-page');
    const bounds = await sheet(phone).locator(readingSelector).boundingBox();
    const cue = sheet(phone).locator('.ace-intro-scroll');
    await cue.waitFor({ state: 'visible' });
    const cueBefore = await cue.boundingBox();
    const x = bounds.x + bounds.width / 2, y = bounds.y + bounds.height * .8;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 6; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - i * 18 }] });
      await phone.waitForTimeout(30);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.equal(await phone.locator('#stage').getAttribute('data-page'), before);
    assert.ok(await sheet(phone).locator(readingSelector).evaluate(el => el.scrollTop > 0));
    assert.deepEqual(await cue.boundingBox(), cueBefore, 'The cue remains visible during a real touch scroll');
    await phone.screenshot({ path: `${output}/${home === '/' ? 'en' : 'fa'}-320-touch-scroll.png` });
  }
  await touch.close();
  console.log('PASS small mobile touch, LTR and RTL: content scrolls without a page turn and the cue stays visible.');

  const nojs = await context({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await nojs.newPage();
  for (const lang of languages) {
    await page.goto(base + (lang.code === 'en' ? '/' : `/${lang.code}/`) + '#ace');
    assert.equal(await page.locator('[data-section="ace"] .ace-intro-panel:visible').count(), 11);
    assert.equal(await page.locator('.ace-intro-play').getAttribute('href'), '#community');
    assert.equal(await page.locator('.ace-intro-nav, .ace-intro-contact, .ace-intro-revisit').count(), 0);
    const referenceTypography = await page.locator('[data-intro-group="concepts"] .ace-intro-lead').evaluate(typography);
    for (const text of await page.locator('[data-section="ace"] .ace-intro').locator(proseSelector).all()) {
      assert.deepEqual(await text.evaluate(typography), referenceTypography, `${lang.code}: consistent copy without JavaScript`);
    }
  }
  await nojs.close();
  assert.deepEqual(errors, []);
  await browser.close();
  console.log('PASS no JavaScript: all definitions are readable. No browser errors.');
})().catch(error => { console.error(error); process.exit(1); });
