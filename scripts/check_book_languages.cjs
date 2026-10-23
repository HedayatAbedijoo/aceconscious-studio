/* Local-only multilingual book QA. No form submissions; only font hosts may load. */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const langs = JSON.parse(fs.readFileSync(path.join(root, 'content/languages.json')));
const base = 'http://127.0.0.1:8765';
const out = '/tmp/book-language-qa';
fs.mkdirSync(out, { recursive: true });
(async () => {
 const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true, args: ['--no-sandbox'] });
 const errors = [], overflow = [];
 const ctx = await browser.newContext({ reducedMotion: 'reduce' });
 await ctx.route('**/*', route => {
  const url = new URL(route.request().url());
  if (route.request().method() !== 'GET') return route.abort();
  if (['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname)) return route.continue();
  if (url.origin !== base) return route.abort();
  const file = path.join(root, decodeURIComponent(url.pathname), url.pathname.endsWith('/') ? 'index.html' : '');
  return fs.existsSync(file) ? route.fulfill({ path: file }) : route.abort();
 });
 const page = await ctx.newPage();
 page.on('pageerror', e => errors.push(e.message));
 async function settled() {
  await page.waitForFunction(() => document.querySelector('#stage')?.dataset.page !== undefined && !document.querySelector('#stage').matches('.is-turning,.is-riffling'));
 }
 for (const [width,height] of (process.argv.includes("--touch-only") ? [] : [[1366,900],[390,844],[320,568],[844,390]])) {
  await page.setViewportSize({ width,height });
  for (const lang of langs) {
   await page.goto(base + (lang.code === 'en' ? '/' : '/' + lang.code + '/'));
   await settled();
   assert.equal(await page.locator('#stage').getAttribute('data-page'), '0');
   assert.equal(await page.locator('#book-language-name').textContent(), lang.name);
   await page.locator('#book-language summary').click();
   const menu = await page.locator('#book-language-list').boundingBox();
   assert.ok(menu.x >= 0 && menu.y >= 0 && menu.x + menu.width <= width, `menu ${lang.code} ${width}`);
   if (['en','fa'].includes(lang.code) && width !== 320) await page.screenshot({path:`${out}/${lang.code}-${width}-menu.png`});
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('#stage').getAttribute('data-page'), '0');
   if (width === 1366 || lang.code === 'en' || lang.code === 'fa') await page.screenshot({path: `${out}/${lang.code}-${width}-cover.png`});
   await page.locator('#open-label').click();
   await settled();
   assert.ok(await page.locator('#cover-entry').isHidden());
   assert.equal(await page.locator('#stage').getAttribute('data-section'), 'headline');
   const rtl = lang.dir === 'rtl';
   const before = Number(await page.locator('#stage').getAttribute('data-page'));
   await page.keyboard.press(rtl ? 'ArrowLeft' : 'ArrowRight');
   await settled();
   assert.equal(Number(await page.locator('#stage').getAttribute('data-page')), before + 1);
   await page.keyboard.press(rtl ? 'ArrowRight' : 'ArrowLeft');
   await settled();
   await page.screenshot({path: `${out}/${lang.code}-${width}-headline.png`});
   for (const section of ['headline','reviews','story','author','buy','contact','community','sample','appendix','ace','back-cover']) {
    await page.locator(`.bookmark[data-section="${section}"]`).click();
    await settled();
    if (section === 'reviews') {
     assert.ok((await page.locator('#book .page[aria-hidden="false"] .pullquote').allTextContents()).join('').trim(),
      `Review opening stranded after its title: ${lang.code} ${width}×${height}`);
    }
    const excess = await page.locator('#book .page[aria-hidden="false"]').evaluate(el => {
     const body = el.querySelector('.page-body');
     if (!body || el.classList.contains('sample-page')) return null;
     const r = document.createRange(); r.selectNodeContents(body);
     const b = body.getBoundingClientRect(), c = r.getBoundingClientRect();
     return c.bottom > b.bottom + 3 || c.left < b.left - 3 || c.right > b.right + 3 ? { b:{left:b.left,right:b.right,bottom:b.bottom}, c:{left:c.left,right:c.right,bottom:c.bottom} } : null;
    });
    if (excess) overflow.push({lang:lang.code,width,section,...excess});
    if (lang.code === 'fa' && section === 'sample') await page.screenshot({path:`${out}/fa-${width}-sample.png`});
   }
   await page.locator('#close').click(); await settled();
   assert.ok(await page.locator('#cover-entry').isVisible());
   console.log(`PASS ${lang.code} ${width}: cover, menu, reading, keyboard, close`);
  }
 }
 // Language changes always leave reading-position hashes behind.
 await page.goto(base + '/?campaign=local'); await settled();
 for (const code of ['fa','de','ar','en']) {
  await page.locator('#book-language summary').click();
  await page.locator(`#book-language-list [data-set-lang="${code}"]`).click(); await settled();
  assert.equal(new URL(page.url()).search, '?campaign=local');
  assert.equal(await page.locator('html').getAttribute('data-locale'), code);
  assert.equal(await page.locator('#stage').getAttribute('data-section'), ['en','fa'].includes(code) ? 'cover' : 'headline');
  if (!['en','fa'].includes(code)) { await page.locator('#close').click(); await settled(); }
 }
 if (!process.argv.includes("--layout-only")) {
 // RTL touch taps, drags and swipes use the same mirrored physical direction.
 const touch = await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 await touch.route('**/*', async route => {
  const url = new URL(route.request().url());
  if (url.origin !== base || route.request().method() !== 'GET') return route.abort();
  const file = path.join(root, decodeURIComponent(url.pathname), url.pathname.endsWith('/') ? 'index.html' : '');
  return fs.existsSync(file) ? route.fulfill({path:file}) : route.abort();
 });
 const mobile = await touch.newPage();
 mobile.on('pageerror', e => errors.push(e.message));
 for (const code of ['en','fa','ar']) {
  await mobile.goto(base + (code === 'en' ? '/' : '/' + code + '/') + '#synopsis');
  await mobile.waitForFunction(() => document.querySelector('#stage')?.dataset.section === 'story');
  await mobile.waitForTimeout(1000);
  const rtl = code !== 'en', box = await mobile.locator('#shell').boundingBox();
  const index = () => mobile.locator('#stage').getAttribute('data-page').then(Number);
  let before = await index();
  await mobile.touchscreen.tap(rtl ? box.x+30 : box.x+box.width-30, box.y+box.height/2);
  await mobile.waitForTimeout(1200);
  assert.equal(await index(),before+1,code+' forward tap');
  const cdp = await touch.newCDPSession(mobile);
  for (const delay of [40,350]) {
   before = await index();
   const x = rtl ? box.x+8 : box.x+box.width-8, y=box.y+box.height-100;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   await mobile.waitForTimeout(delay);
   const steps = delay === 40 ? 1 : 8;
   const destinationX = delay === 40 ? x+(rtl?1:-1)*box.width*.8 : (rtl ? 386 : 4);
   for (let step=1;step<=steps;step++) {
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+(destinationX-x)*step/steps,y:y-15*step/steps}]});
    await mobile.waitForTimeout(delay === 40 ? 8 : 35);
   }
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await mobile.waitForTimeout(1300);
   assert.equal(await index(),before+1,code+' swipe/drag '+delay);
  }
  // Check every published sample page for bounds, including its footnotes.
  if(code === 'fa') {
   await mobile.goto(base+'/fa/#sample');
   await mobile.waitForFunction(() => document.querySelector('#stage')?.dataset.section === 'sample');
   for(let n=0;n<9;n++) {
    const violation = await mobile.locator('#book .page[aria-hidden="false"] .sample-sheet__body').evaluate(body => {
     const b=body.getBoundingClientRect();
     const bottom = Math.max(...[...body.children].filter(el=>!el.classList.contains('sample-notes')).map(el=>el.getBoundingClientRect().bottom));
     return bottom>b.bottom+2 ? {bottom,limit:b.bottom} : null;
    });
    if(violation) overflow.push({lang:code,section:'sample-'+(n+1),violation});
    if([0,1,2,3,7,8].includes(n)) await mobile.screenshot({path:`${out}/fa-sample-${n+1}.png`});
    if(n<8) {await mobile.keyboard.press('ArrowLeft');await mobile.waitForTimeout(1100);}
   }
  }
  console.log('PASS '+code+' touch tap, quick swipe, held corner drag');
 }
 await touch.close();
 }
 await ctx.close(); await browser.close();
 fs.writeFileSync(`${out}/overflow.json`, JSON.stringify(overflow,null,2));
 assert.deepEqual(errors, []);
 assert.deepEqual(overflow, [], 'Content overflow; inspect /tmp/book-language-qa/overflow.json');
 console.log('PASS language navigation and all content bounds. Screenshots: ' + out);
})().catch(error => { console.error(error); process.exit(1); });
