#!/usr/bin/env python3
"""Local-only ACE reader layout, keyboard, copy and typing regression checks."""
import argparse
import json
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
from build_locales import ROOT, LANGUAGES, route

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base', default='http://127.0.0.1:8765')
parser.add_argument('--executable', default=None)
parser.add_argument('--output', default='/tmp/ace-reader-qa')
args = parser.parse_args()
BASE = args.base.rstrip('/')
assert urlsplit(BASE).hostname in ('localhost','127.0.0.1','::1')
OUT = Path(args.output); OUT.mkdir(parents=True, exist_ok=True)
errors, checks = [], []

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=args.executable, args=['--no-sandbox'])
    context = browser.new_context(reduced_motion='reduce')
    context.route('**/*', lambda r:r.continue_() if r.request.url.startswith(BASE + '/') else r.abort())
    page = context.new_page()
    page.on('pageerror', lambda e:errors.append(str(e)))
    for width in [1440,768,390,320]:
        page.set_viewport_size({'width':width,'height':900})
        for language in LANGUAGES:
            code = language['code']
            strings = json.loads((ROOT/f'content/locales/{code}.json').read_text())
            page.goto(BASE + route('home',code))
            for i in range(3):
                step = page.locator('[data-ace-step]:visible')
                assert step.get_attribute('data-ace-step') == str(i)
                tabs = step.locator('[role=tab]')
                assert step.locator('[role=tablist]').get_attribute('aria-orientation') == 'vertical'
                assert tabs.first.get_attribute('aria-selected') == 'true'
                for j in range(tabs.count()):
                    tab = tabs.nth(j); tab.click()
                    panel = step.locator('[role=tabpanel]:visible')
                    assert panel.count() == 1 and panel.get_attribute('aria-labelledby') == tab.get_attribute('id')
                    for item in panel.locator('[data-i18n]').evaluate_all('(els)=>els.map(e=>({key:e.dataset.i18n,text:e.textContent}))'):
                        assert item['text'] == strings[item['key']], (code,item['key'])
                    left = step.locator('[role=tablist]').bounding_box(); right = panel.bounding_box()
                    assert left['x'] + left['width'] <= right['x'] + 1, (code,width,i,'selector must stay on physical left')
                    assert abs(left['y'] - right['y']) < 1
                    buttons = tabs.evaluate_all('(els)=>els.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})')
                    assert all(abs(b['x']-buttons[0]['x'])<1 for b in buttons)
                    assert all(a['y']+a['h'] <= b['y'] for a,b in zip(buttons,buttons[1:]))
                    assert all(b['h']>=44 for b in buttons)
                    assert panel.locator('.ace-intro-copy--visual').count() == 0
                    assert panel.locator('.ace-intro-skip').is_hidden()
                    assert not panel.evaluate('(el)=>el.scrollWidth > el.clientWidth + 1')
                    assert not page.evaluate('document.documentElement.scrollWidth > innerWidth + 1'), (code,width,i,j)
                    reader = step.locator('.ace-intro-reader').bounding_box()
                    container = page.locator('#ace-introduction > .container').bounding_box()
                    assert abs(reader['x']-container['x'])<1 and abs(reader['width']-container['width'])<1
                tabs.first.focus(); page.keyboard.press('ArrowDown')
                assert tabs.nth(1).get_attribute('aria-selected') == 'true'
                page.keyboard.press('End'); assert tabs.last.get_attribute('aria-selected') == 'true'
                page.keyboard.press('Home'); assert tabs.first.get_attribute('aria-selected') == 'true'
                page.keyboard.press('ArrowUp'); assert tabs.last.get_attribute('aria-selected') == 'true'
                assert step.locator('[role=tab][tabindex="0"]').count() == 1
                assert page.locator('[data-ace-step]:visible').get_attribute('data-ace-step') == str(i)
                if code in ['en','de','fa','ar'] and width != 768:
                    page.locator('#ace-introduction').screenshot(path=str(OUT/f'{code}-{width}-step-{i+1}.png'))
                page.locator('[data-ace-next]').click()
            assert page.locator('[data-ace-next]').is_disabled()
            page.locator('[data-ace-prev]').click()
            assert page.locator('[data-ace-step="2"] [role=tab]').last.get_attribute('aria-selected') == 'true'
            assert page.locator('[data-ace-restart], .ace-intro-contact').count() == 0
            for _ in range(2): page.locator('[data-ace-prev]').click()
            assert page.locator('#intro-tab-exchange').get_attribute('aria-selected') == 'true'
            assert page.locator('[data-ace-prev]').is_disabled()
            checks.append(f'{code} {width}px: 11 tabs, vertical selectors, exact copy, keyboard, RTL, tab memory, reduced motion')
        print(f'Passed all nine languages at {width}px.',flush=True)
    # Real animation, not just final screenshots: full accessible copy remains
    # available while a separate aria-hidden overlay types grapheme by grapheme.
    page.set_viewport_size({'width':390,'height':844})
    for language in LANGUAGES:
        code = language['code']
        page.emulate_media(reduced_motion='no-preference')
        page.goto(BASE + route('home',code))
        page.locator('#intro-tab-connection').click()
        panel = page.locator('#intro-panel-connection')
        source = panel.locator('.ace-intro-copy:not(.ace-intro-copy--visual)')
        expected = source.text_content()
        page.wait_for_function('''() => {
            const e=document.querySelector('#intro-panel-connection .ace-intro-copy--visual');
            const s=document.querySelector('#intro-panel-connection .ace-intro-copy--typing');
            return e && s && e.textContent.length > 0 && e.textContent.length < s.textContent.length;
        }''')
        height = panel.bounding_box()['height']
        assert source.evaluate('(el)=>getComputedStyle(el).opacity') == '0'
        assert not source.get_attribute('aria-hidden')
        assert panel.locator('.ace-intro-copy--visual').get_attribute('aria-hidden') == 'true'
        assert panel.locator('.ace-intro-skip').get_attribute('aria-label') == page.evaluate('aceI18n.getString("voices.showFull")')
        panel.locator('.ace-intro-skip').click()
        assert source.text_content() == expected
        assert source.evaluate('(el)=>getComputedStyle(el).opacity') == '1'
        assert abs(height-panel.bounding_box()['height'])<1, (code,'typing height shift')
        assert panel.evaluate('(el)=>el===document.activeElement')
        page.locator('#intro-tab-exchange').click()
        page.wait_for_function('!document.querySelector("#ace-introduction .is-typing")')
        assert page.locator('.ace-intro-copy--visual').count()==0
        assert page.locator('[data-ace-step]:visible').get_attribute('data-ace-step')=='0'
        # Cancel a running animation when switching tab/step or changing motion.
        page.evaluate('document.querySelector("#intro-tab-agency").click(); document.querySelector("#intro-tab-connection").click(); document.querySelector("#intro-tab-exchange").click()')
        assert page.locator('.ace-intro-copy--visual').count()==1
        assert page.locator('#intro-panel-exchange').get_attribute('class').endswith('is-typing')
        page.locator('[data-ace-next]').click()
        assert page.locator('.ace-intro-copy--visual').count()==0
        page.locator('#intro-tab-decision').click()
        assert page.locator('.ace-intro-copy--visual').count()==1
        page.emulate_media(reduced_motion='reduce')
        page.wait_for_function('!document.querySelector("#ace-introduction .is-typing")')
        assert page.locator('.ace-intro-copy--visual').count()==0
        checks.append(f'{code}: animated intermediate text, accessible copy, completion, skip, stable height, rapid switching and cancellation')
    nojs = browser.new_context(java_script_enabled=False, viewport={'width':390,'height':844})
    nojs.route('**/*', lambda r:r.continue_() if r.request.url.startswith(BASE + '/') else r.abort())
    nj = nojs.new_page()
    for language in LANGUAGES:
        nj.goto(BASE + route('home',language['code']))
        assert nj.locator('[data-ace-step]:visible').count()==4
        assert nj.locator('.ace-intro-panel:visible').count()==11
        assert not nj.evaluate('document.documentElement.scrollWidth > innerWidth + 1')
    checks.append('No-JavaScript reading fallback in all nine languages')
    browser.close()
(OUT/'results.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2)+'\n')
assert not errors,errors
print(f'Passed {len(checks)} check groups. Screenshots: {OUT}')
