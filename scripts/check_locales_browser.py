#!/usr/bin/env python3
"""Optional isolated browser QA. Requires playwright and a local preview server."""
import sys,json,argparse
from pathlib import Path
from playwright.sync_api import sync_playwright
from build_locales import LANGUAGES,PAGES,route
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base',default='http://127.0.0.1:8765')
parser.add_argument('--executable',default=None)
parser.add_argument('--output',default='/tmp/ace-language-qa')
args=parser.parse_args()
BASE=args.base.rstrip('/')
OUT=Path(args.output);OUT.mkdir(parents=True,exist_ok=True)
errors=[];notes=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=args.executable,headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1440,'height':1000})
 # This test never sends real forms, analytics, or external sample requests.
 context.route('**/*',lambda r:r.continue_() if r.request.url.startswith(BASE + '/') else r.abort())
 page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 for width in [1440,390]:
  page.set_viewport_size({'width':width,'height':1000 if width==1440 else 844})
  for name in PAGES:
   for lang in LANGUAGES:
    code=lang['code'];url=BASE+route(name,code)
    page.goto(url,wait_until='load')
    assert page.locator('html').get_attribute('lang')==lang['htmlLang'],url
    summary=page.locator('#lang-menu summary')
    summary.click()
    assert page.locator('#lang-menu').get_attribute('open') is not None,url
    assert page.locator('#lang-menu a').evaluate_all('(els)=>els.map(e=>e.dataset.setLang)')==[l['code'] for l in LANGUAGES],url
    box=page.locator('.language-picker__list').bounding_box()
    if box['x'] < -1 or box['x']+box['width'] > width+1:errors.append(f'menu overflow {width} {url}: {box}')
    summary.press('Escape')
    assert page.locator('#lang-menu').get_attribute('open') is None,url
    assert summary.evaluate('(el)=>el===document.activeElement'),url
    overflow=page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 1')
    if overflow:errors.append(f'page overflow {width} {url}')
    if name=='home':
     assert page.locator('.reviews__counter').inner_text().strip()!='1 of 3' or code=='en',url
     second_id=page.locator('[data-review-id]').nth(1).get_attribute('data-review-id')
     page.locator('[data-review-next]').click()
     assert page.locator('[data-review-id]:visible').count()==1,url
     assert page.locator('[data-review-id]:visible').get_attribute('data-review-id')==second_id,url
     page.evaluate('window.scrollTo(0,0)')
    if name=='home' and code in ['en','fr','ru','zh','hi','ar','fa']:
     summary.click()
     page.screenshot(path=str(OUT/f'{code}-{width}.png'))
     summary.press('Escape')
    if name=='ace' and code in ['ru','ar','hi','zh']:
     page.screenshot(path=str(OUT/f'ace-{code}-{width}.png'))
    notes.append(f'{width} {url} OK')
  print('Checked all pages at width',width,'errors so far:',errors,flush=True)
 # Switch language first, then activate every home menu entry. Check actual
 # destinations, not just translated labels or the language picker itself.
 for width in [1440,390]:
  page.set_viewport_size({'width':width,'height':1000})
  page.emulate_media(reduced_motion='reduce')
  for lang in LANGUAGES:
   code=lang['code'];home=BASE+route('home',code)
   page.goto(BASE+'/',wait_until='load')
   page.locator('#lang-menu summary').click()
   page.locator(f'#lang-menu [data-set-lang="{code}"]').click()
   page.wait_for_url(home)
   entries=page.locator('.site-nav__links a').evaluate_all('(els)=>els.map(a=>({key:a.dataset.i18n,hash:a.hash}))')
   for entry in entries:
    if width==390:page.locator('.nav-toggle').click()
    link=page.locator(f'.site-nav__links [data-i18n="{entry["key"]}"]')
    link.focus();link.press('Enter')
    expected=home+entry['hash'] if entry['hash'] else BASE+route('ace',code)
    page.wait_for_url(expected)
    assert page.locator('html').get_attribute('lang')==lang['htmlLang'],expected
    if entry['hash']:
     assert page.locator(entry['hash']).count()==1,expected
     if width==390:assert page.locator('.nav-toggle').get_attribute('aria-expanded')=='false'
    else:page.goto(home,wait_until='load')
   notes.append(f'Navigation retains {code} at {width}px')
 print('Checked every home menu entry in all languages at desktop/mobile widths.',flush=True)
 # Field validation follows the page language, without sending any messages.
 for lang in LANGUAGES:
  page.goto(BASE+route('home',lang['code']),wait_until='load')
  page.locator('#contact-email').fill('invalid')
  expected=page.evaluate('window.aceI18n.getString("contact.invalidEmail")')
  assert page.locator('#contact-email').evaluate('(el)=>el.validationMessage')==expected
  page.locator('#contact-email').fill('reader@example.com')
  assert page.locator('#contact-email').evaluate('(el)=>el.validity.valid')
 # Language changes keep the page and section; the root ignores old preferences.
 page.goto(BASE+'/es/ace/?utm_source=test#agency',wait_until='load')
 page.locator('#lang-menu summary').click()
 page.locator('#lang-menu [data-set-lang="ru"]').click()
 page.wait_for_url('**/ru/ace/?utm_source=test#agency')
 assert page.locator('html').get_attribute('lang')=='ru'
 assert page.locator('html').get_attribute('dir')=='ltr'
 page.goto(BASE+'/fr/ace/#agency',wait_until='load')
 page.locator('#lang-menu summary').click()
 page.locator('#lang-menu [data-set-lang="ar"]').click()
 page.wait_for_url('**/ar/ace/#agency')
 assert page.locator('html').get_attribute('dir')=='rtl'
 page.evaluate('localStorage.setItem("ace-lang","fa")')
 page.goto(BASE+'/',wait_until='load')
 assert page.locator('html').get_attribute('lang')=='en'
 page.goto(BASE+'/screen/?utm_source=test&lang=hi#contact',wait_until='load')
 page.wait_for_url('**/hi/screen/?utm_source=test#contact')
 page.goto(BASE+'/ar/',wait_until='load')
 page.locator('#lang-menu summary').focus()
 page.keyboard.press('ArrowDown')
 assert page.locator('#lang-menu a').first.evaluate('(el)=>el===document.activeElement')
 page.keyboard.press('End')
 assert page.locator('#lang-menu a').last.evaluate('(el)=>el===document.activeElement')
 page.keyboard.press('Escape')
 # Content and native language switching also work without scripts.
 nojs=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
 nojs.route('**/*',lambda r:r.continue_() if r.request.url.startswith(BASE + '/') else r.abort())
 nj=nojs.new_page();nj.goto(BASE+'/zh/')
 assert '试读' in nj.locator('body').inner_text()
 nj.locator('#lang-menu summary').click()
 nj.locator('#lang-menu [data-set-lang="ru"]').click()
 assert nj.url==BASE+'/ru/'
 assert 'Сюжет' in nj.locator('body').inner_text()
 browser.close()
(OUT/'results.json').write_text(json.dumps({'checks':notes,'errors':errors},indent=2))
print(json.dumps({'pages_and_viewports':len(notes),'errors':errors,'screenshots':str(OUT)},indent=2))
if errors:raise SystemExit(1)
