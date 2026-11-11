#!/usr/bin/env python3
"""Local browser regression checks for ACE/Gift; no external requests are sent.

Requires Playwright and a running local server. Use --executable for system Chrome.
"""
import argparse
import json
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright
from build_locales import LANGUAGES, ROOT, route

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base', default='http://127.0.0.1:8765')
parser.add_argument('--executable', default=None)
parser.add_argument('--output', default='/tmp/ace-home-extensions-qa')
parser.add_argument('--skip-core', action='store_true', help='Run responsive and form checks only after the core interaction checks have passed')
args = parser.parse_args()
BASE = args.base.rstrip('/')
assert urlsplit(BASE).hostname in ('localhost', '127.0.0.1', '::1'), 'Local previews only'
OUT = Path(args.output)
OUT.mkdir(parents=True, exist_ok=True)
ORDER = ['top', 'reviews', 'synopsis', 'ace-introduction', 'buy', 'gift', 'author', 'contact', 'voices', 'sample', 'contents']
NAV = ['#reviews', '#synopsis', '#ace-introduction', '#buy', '#gift', '#author', '#contact', '#voices', '#sample', '#contents']
PRIORITY = ['#reviews', '#synopsis', '#ace-introduction', '#buy', '#gift', '#contact']
checks, errors = [], []


def check_layout(page, width, code):
    links = page.locator('.site-nav__links a').evaluate_all('(els)=>els.map(a=>a.hash)')
    assert sorted(links) == sorted(NAV) and len(links) == len(set(links)), (code, width, links)
    inline = page.locator('.home-nav__primary a').evaluate_all('(els)=>els.map(a=>a.hash)')
    if width <= 900:
        assert not inline, (code, width, inline)
    elif width >= 1280:
        assert inline == PRIORITY, (code, width, inline)
    else:
        assert inline == PRIORITY[:len(inline)], (code, width, inline)
    bounds = page.locator('.home-nav__primary a, .site-nav__logo, .site-nav__actions').evaluate_all(
        '(els)=>els.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})')
    for box in bounds:
        assert box['y'] >= 0 and box['y'] + box['height'] <= 72.5, (code,width,box)
        assert box['x'] >= 0 and box['x'] + box['width'] <= width + 1, (code,width,box)
    ordered = sorted(bounds, key=lambda box:box['x'])
    for left, right in zip(ordered, ordered[1:]):
        assert left['x'] + left['width'] <= right['x'] + 1, (code,width,'header overlap')
    # The new sections must use exactly the same full container as Story/Reviews.
    reference = page.locator('#reviews > .container').bounding_box()
    for selector in ['#synopsis > .container','#ace-introduction > .container','.ace-introduction__toolbar',
                     '#ace-intro-steps','#gift > .container','#community']:
        box = page.locator(selector).bounding_box()
        assert abs(box['x'] - reference['x']) < 1 and abs(box['width'] - reference['width']) < 1, (code,width,selector,box,reference)
    assert not page.evaluate('document.documentElement.scrollWidth > innerWidth + 1'), (code,width,'page overflow')

MOCK = r'''
window.__requests = [];
window.__mode = 'success';
const realFetch = window.fetch.bind(window);
window.fetch = (url, options) => {
  if (!String(url).includes('/macros/s/')) return realFetch(url, options);
  window.__requests.push({url, method: options.method, headers: options.headers,
    credentials: options.credentials, body: JSON.parse(options.body)});
  const mode = window.__mode;
  if (mode === 'network') return Promise.reject(new TypeError('Mock offline'));
  if (mode === 'pending') return new Promise((resolve, reject) => {
    window.__resolve = () => resolve(new Response(JSON.stringify({type:'ace-contact-form',status:'success'})));
    options.signal.addEventListener('abort', () => reject(new DOMException('Mock timeout', 'AbortError')));
  });
  const data = {type: mode === 'type' ? 'other' : 'ace-contact-form',
    status: mode === 'status' ? 'error' : 'success'};
  return Promise.resolve(new Response(mode === 'malformed' ? 'invalid json' : JSON.stringify(data),
    {status: mode === 'http' ? 500 : 200}));
};
'''

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=args.executable, headless=True, args=['--no-sandbox'])
    context = browser.new_context(viewport={'width':1440,'height':1000}, reduced_motion='reduce')
    # This routing guard applies even if a test or mock fails.
    context.route('**/*', lambda r: r.continue_() if r.request.url.startswith(BASE + '/') else r.abort())
    context.add_init_script(MOCK)
    page = context.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))
    for width in ([] if args.skip_core else [1440, 390, 320]):
        page.set_viewport_size({'width':width, 'height':1000 if width == 1440 else 844})
        for lang in LANGUAGES:
            code = lang['code']
            strings = json.loads((ROOT / f'content/locales/{code}.json').read_text())
            page.goto(BASE + route('home', code), wait_until='load')
            assert page.locator('main > section').evaluate_all('(els)=>els.map(e=>e.id)') == ORDER
            ids = page.locator('[id]').evaluate_all('(els)=>els.map(e=>e.id)')
            assert len(ids) == len(set(ids))
            assert page.locator('#lang-menu summary').inner_text() == 'language'
            assert page.locator('#community-email').get_attribute('dir') == 'ltr'
            assert page.locator('#community-email').is_enabled()
            check_layout(page, width, code)
            if page.locator('.nav-toggle').is_visible():
                page.locator('.nav-toggle').click()
                page.locator('#nav-menu a').first.focus()
                page.keyboard.press('Escape')
                assert page.locator('.nav-toggle').get_attribute('aria-expanded') == 'false'
                assert page.locator('.nav-toggle').evaluate('(el)=>el===document.activeElement')
            else:
                for box in page.locator('.site-nav__links a').evaluate_all('(els)=>els.map(e=>({top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom}))'):
                    assert box['top'] >= 0 and box['bottom'] <= 72, (code,width,box)
            if code in ['en','de','ar','fa']:
                page.screenshot(path=str(OUT/f'opening-{code}-{width}.png'))
            # New visible strings, including intentional newlines, equal their source.
            for item in page.locator('#ace-introduction [data-i18n], #gift [data-i18n]').evaluate_all(
                '(els)=>els.filter(e=>e.id!=="community-status").map(e=>({key:e.dataset.i18n,text:e.textContent}))'):
                assert item['text'] == strings[item['key']], (code, item['key'])
            assert page.locator('[data-ace-prev]').is_disabled()
            for i, group in enumerate(['concepts','pdaf','phases','play']):
                step = page.locator('[data-ace-step]:visible')
                assert step.count() == 1
                assert step.get_attribute('data-ace-step') == str(i)
                assert page.locator('#ace-intro-status').inner_text() == strings[f'aceIntro.{group}.progress']
                if i < 3:
                    tabs = step.locator('[role="tab"]')
                    assert tabs.first.get_attribute('aria-selected') == 'true'
                    for j in range(tabs.count()):
                        tabs.nth(j).click()
                        assert tabs.nth(j).get_attribute('aria-selected') == 'true'
                        assert step.locator('[role="tabpanel"]:visible').count() == 1
                        assert step.locator('[role="tabpanel"]:visible').get_attribute('aria-labelledby') == tabs.nth(j).get_attribute('id')
                    # Vertical arrows and Home/End stay inside the tablist.
                    tabs.first.focus()
                    tabs.first.press('ArrowDown')
                    assert tabs.nth(1).get_attribute('aria-selected') == 'true'
                    assert page.locator('[data-ace-step]:visible').get_attribute('data-ace-step') == str(i)
                    page.keyboard.press('End')
                    assert tabs.last.get_attribute('aria-selected') == 'true'
                    assert tabs.last.evaluate('(el)=>el===document.activeElement')
                    page.keyboard.press('Home')
                    assert tabs.first.get_attribute('aria-selected') == 'true'
                    tabs.last.click()
                assert not page.evaluate('document.documentElement.scrollWidth > innerWidth + 1'), (code,width,i,'overflow')
                if i == 0 and code in ['en','de','ar','fa']:
                    page.locator('#ace-introduction').screenshot(path=str(OUT/f'ace-{code}-{width}.png'))
                if i < 3:
                    page.locator('[data-ace-next]').click()
                    page.evaluate('() => new Promise(requestAnimationFrame)')
                    assert page.locator('.ace-introduction__toolbar').bounding_box()['y'] >= 72, (code,width,i)
            assert page.locator('[data-ace-next]').is_disabled()
            page.locator('[data-ace-prev]').click()
            assert page.locator('[data-ace-step="2"] [role="tab"]').last.get_attribute('aria-selected') == 'true'
            page.locator('[data-ace-next]').click()
            if code == 'en':
                page.locator('#ace-introduction').screenshot(path=str(OUT/f'play-{width}.png'))
            assert page.locator('[data-ace-restart], .ace-intro-contact').count() == 0
            for _ in range(3): page.locator('[data-ace-prev]').click()
            assert page.locator('[data-ace-step]:visible').get_attribute('data-ace-step') == '0'
            assert page.locator('#intro-tab-exchange').get_attribute('aria-selected') == 'true'
            assert page.locator('[data-ace-prev]').is_disabled()
            for _ in range(3): page.locator('[data-ace-next]').click()
            page.locator('.ace-intro-play').click()
            assert page.url.endswith('#community')
            assert page.locator('#community-email').evaluate('(el)=>el===document.activeElement')
            assert page.locator('#community-email').bounding_box()['y'] >= 72
            assert page.evaluate('window.__requests.length') == 0
            if code in ['en','ar','fa']:
                page.locator('#gift').screenshot(path=str(OUT/f'gift-{code}-{width}.png'))
            page.locator('#contact-message').fill('Keep this existing draft.')
            page.locator('.gift-community__link').click()
            assert page.url.endswith('#contact')
            assert page.locator('#contact-email').evaluate('(el)=>el===document.activeElement')
            assert page.locator('#contact-message').input_value() == 'Keep this existing draft.'
            assert page.evaluate('window.__requests.length') == 0
            # Reviews, character reader and sample preview remain available.
            page.locator('[data-review-next]').click()
            assert page.locator('[data-review-id]:visible').count() == 1
            assert page.locator('[data-review-id]:visible').get_attribute('data-review-id') == 'booklife-2026'
            assert page.locator('#sample iframe').count() == 1
            page.locator('#voices [role="tab"]').nth(1).click()
            assert page.locator('#voices [role="tabpanel"]:visible').get_attribute('id') == 'voice-panel-1'
            # Every header shortcut retains its locale and target.
            entries = page.locator('.site-nav__links a').evaluate_all('(els)=>els.map(a=>({key:a.dataset.i18n,hash:a.hash}))')
            for entry in entries:
                link = page.locator(f'.site-nav__links [data-i18n="{entry["key"]}"]')
                if not link.is_visible(): page.locator('.nav-toggle').click()
                link.focus(); link.press('Enter')
                expected = BASE + route('home',code) + entry['hash'] if entry['hash'] else BASE + route('ace',code)
                page.wait_for_url(expected)
                if not entry['hash']: page.goto(BASE + route('home',code))
            # Validate and confirm localized requests using an in-page fetch mock.
            email = page.locator('#community-email')
            submit = page.locator('#community-form button')
            for invalid in ['', 'invalid', 'reader@example']:
                email.fill(invalid); submit.click()
                assert email.evaluate('(el)=>el.validationMessage') == strings['giftCommunity.invalidEmail']
                assert page.evaluate('window.__requests.length') == 0
            email.fill(' reader@example.com '); submit.click()
            page.wait_for_function('document.querySelector("#community-status").dataset.state === "success"')
            assert page.locator('#community-status').inner_text() == strings['giftCommunity.circleSuccess']
            request = page.evaluate('window.__requests[0]')
            assert request['method'] == 'POST' and request['credentials'] == 'omit'
            assert request['headers'] == {'Content-Type':'text/plain;charset=utf-8'}
            assert request['body'] == {'email':'reader@example.com','message':'Community join request\n\n'+strings['giftCommunity.circleRequestMessage']+'\n\nPage: '+route('home',code)+'#community','origin':BASE,'website':''}
            assert email.input_value() == ''
            checks.append(f'{code} at {width}px: order, exact copy, tabs, arrows, tab memory, focus, navigation, validation, mocked success')
        print(f'Passed all nine languages at {width}px', flush=True)
    # Resize the same live page repeatedly, exercising both sides of breakpoints,
    # long translations, a short landscape viewport and restoration to desktop.
    for lang in LANGUAGES:
        code = lang['code']
        page.goto(BASE + route('home', code))
        for width, height in [(1920,1080),(1280,900),(1180,820),(1024,768),(901,768),(900,768),
                              (768,1024),(600,844),(375,812),(320,568),(844,390),(1440,1000)]:
            page.set_viewport_size({'width':width,'height':height})
            page.evaluate('() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
            check_layout(page, width, code)
            toggle = page.locator('.nav-toggle')
            toggle.focus(); toggle.press('ArrowDown')
            assert page.locator('#nav-menu a').first.evaluate('(el)=>el===document.activeElement')
            box = page.locator('#nav-menu').bounding_box()
            assert box['x'] >= 0 and box['x'] + box['width'] <= width, (code,width,box)
            assert box['y'] >= 70 and box['y'] + box['height'] <= height, (code,width,height,box)
            page.locator('#nav-menu a').last.focus()
            last = page.locator('#nav-menu a').last.bounding_box()
            assert last['y'] >= box['y'] and last['y'] + last['height'] <= height, (code,width,'last menu link clipped')
            page.keyboard.press('Escape')
            assert toggle.get_attribute('aria-expanded') == 'false'
            assert page.locator('#nav-menu').get_attribute('inert') is not None
            toggle.click()
            page.locator('.site-nav__logo').click()
            assert toggle.get_attribute('aria-expanded') == 'false'
        checks.append(f'{code}: 12 responsive widths, single-row header, aligned sections, menu keyboard/resize/scroll/outside-click')
    print('Passed the additional 108 responsive/landscape checks.', flush=True)
    # Detailed form failure modes; the guard still aborts all external requests.
    page.goto(BASE + '/')
    form = page.locator('#community-form')
    email = page.locator('#community-email')
    submit = form.locator('button')
    status = page.locator('#community-status')
    for mode in ['http','status','type','malformed','network']:
        page.evaluate('(mode)=>window.__mode=mode', mode)
        email.fill('reader@example.com'); submit.click()
        page.wait_for_function('document.querySelector("#community-status").dataset.state === "error"')
        assert status.inner_text() == form.get_attribute('data-error')
        assert email.input_value() == 'reader@example.com'
        assert submit.is_enabled() and not form.get_attribute('aria-busy')
        checks.append(f'Form error: {mode}')
    page.evaluate('window.__mode="pending"; window.__requests=[]')
    submit.click()
    assert form.get_attribute('aria-busy') == 'true' and submit.is_disabled()
    assert email.get_attribute('readonly') is not None
    page.evaluate('document.querySelector("#community-form").requestSubmit()')
    assert page.evaluate('window.__requests.length') == 1
    assert status.inner_text() == form.get_attribute('data-sending')
    page.evaluate('window.__resolve()')
    page.wait_for_function('document.querySelector("#community-status").dataset.state === "success"')
    assert email.input_value() == ''
    checks.append('Duplicate requests blocked while pending; confirmed success releases busy state')
    page.clock.install()
    email.fill('timeout@example.com'); submit.click()
    page.clock.fast_forward(19999)
    assert form.get_attribute('aria-busy') == 'true'
    page.clock.fast_forward(1)
    page.wait_for_function('document.querySelector("#community-status").dataset.state === "error"')
    assert email.input_value() == 'timeout@example.com' and submit.is_enabled()
    page.evaluate('window.__mode="success"')
    submit.click()
    page.wait_for_function('document.querySelector("#community-status").dataset.state === "success"')
    checks.append('20-second timeout retains email and permits successful retry')
    page.evaluate('window.__requests=[]; document.querySelector("#community-form [name=website]").value="trap"')
    email.fill('bot@example.com'); submit.click()
    assert page.evaluate('window.__requests.length') == 0
    checks.append('Honeypot never sends a request')
    # Existing Contact works independently with the same mock.
    page.locator('#contact-email').fill('contact@example.com')
    page.locator('#contact-message').fill('Local mock only')
    page.locator('#contact-form [type=submit]').click()
    page.wait_for_function('document.querySelector("#contact-message").value === ""')
    assert page.evaluate('window.__requests[0].body.message') == 'Local mock only'
    checks.append('Independent existing Contact form submits to mock')
    page.close()
    missing = context.new_page()
    missing.route('**/js/contact-config.js*', lambda r:r.fulfill(status=200,content_type='application/javascript',body='window.CONTACT_FORM_ENDPOINT="";'))
    missing.goto(BASE + '/fa/')
    assert missing.locator('#community-status').inner_text() == missing.locator('#community-form').get_attribute('data-unavailable')
    missing.locator('#community-email').fill('reader@example.com')
    assert missing.locator('#community-status').inner_text() == missing.locator('#community-form').get_attribute('data-unavailable')
    missing.locator('#community-form button').click()
    assert missing.evaluate('window.__requests.length') == 0
    assert missing.locator('#community-email').input_value() == 'reader@example.com'
    checks.append('Missing configuration shows localized unavailable state without sending')
    # No JavaScript, and an individual failed enhancement script, preserve reading.
    for nojs in [True,False]:
        fallback = browser.new_context(java_script_enabled=not nojs,viewport={'width':390,'height':844})
        fallback.route('**/*', lambda r:r.continue_() if r.request.url.startswith(BASE + '/') else r.abort())
        if not nojs:
            fallback.route('**/js/ace-intro.js*', lambda r:r.abort())
            fallback.route('**/js/community.js*', lambda r:r.abort())
        nj = fallback.new_page(); nj.goto(BASE + '/ar/')
        assert nj.locator('[data-ace-step]:visible').count() == 4
        assert nj.locator('.ace-intro-panel:visible').count() == 11
        assert nj.locator('#community-email').is_disabled()
        assert nj.locator('#community-status').is_visible()
        assert nj.locator('[data-ace-next]').is_hidden()
        fallback.close()
    checks.append('No-JS and script-load-failure fallback: all ACE copy readable, community disabled')
    browser.close()
(OUT/'results.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2)+'\n')
assert not errors, errors
print(f'Passed {len(checks)} groups of checks. Screenshots and results: {OUT}')
