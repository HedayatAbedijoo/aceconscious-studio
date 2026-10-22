#!/usr/bin/env python3
"""Optional isolated browser QA. Requires playwright and a local preview server."""
import sys,json,argparse
from pathlib import Path
from urllib.parse import urlsplit, unquote
from playwright.sync_api import sync_playwright
from build_locales import ROOT,LANGUAGES,PAGES,route,template_for
from book import SECTIONS
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base',default='http://127.0.0.1:8765')
parser.add_argument('--executable',default=None)
parser.add_argument('--output',default='/tmp/ace-language-qa')
parser.add_argument('--local-files',action='store_true',help='Serve repository files through browser interception; no preview server needed')
args=parser.parse_args()
BASE=args.base.rstrip('/')
OUT=Path(args.output);OUT.mkdir(parents=True,exist_ok=True)
errors=[];notes=[]

def local_request(request):
 if request.request.method != 'GET' or not request.request.url.startswith(BASE + '/'):
  return request.abort()
 if not args.local_files:
  return request.continue_()
 path=unquote(urlsplit(request.request.url).path)
 target=ROOT / path.lstrip('/')
 if path.endswith('/'):target=target / 'index.html'
 return request.fulfill(path=str(target)) if target.is_file() else request.abort()

with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=args.executable,headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce')
 # This test never sends real forms, analytics, or external sample requests.
 context.route('**/*',local_request)
 page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 for width in [1440,390]:
  page.set_viewport_size({'width':width,'height':1000 if width==1440 else 844})
  for name in PAGES:
   for lang in LANGUAGES:
    code=lang['code'];url=BASE+route(name,code)
    page.goto(url,wait_until='load')
    assert page.locator('html').get_attribute('lang')==lang['htmlLang'],url
    if template_for(name,code)=='book':
     page.wait_for_function('document.querySelector("#stage")?.dataset.page === "0"')
     assert page.locator('#lang-menu').count()==0,url
     assert page.locator('.bookmark').evaluate_all('(els)=>els.map(el=>el.dataset.section)')==list(SECTIONS),url
     page.locator('#open').focus();page.keyboard.press('Enter')
     page.wait_for_function('document.querySelector("#stage").dataset.section === "headline"')
     page.locator('.bookmark[data-section="sample"]').focus();page.keyboard.press('Enter')
     page.wait_for_function('document.querySelector("#stage").dataset.section === "sample"')
     page.wait_for_timeout(150)
     zoom=page.locator('.page[aria-hidden="false"] .sample-zoom')
     zoom.click();assert zoom.get_attribute('aria-pressed')=='true'
     page.keyboard.press('ArrowRight');page.keyboard.press('ArrowLeft')
     assert zoom.get_attribute('aria-pressed')=='false'
     page.screenshot(path=str(OUT/f'{code}-{width}.png'))
     notes.append(f'{width} {url} book OK')
     continue
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
 # Field validation follows the page language, without sending any messages.
 for lang in LANGUAGES:
  page.goto(BASE+route('home',lang['code'])+('#contact' if lang['code']=='en' else ''),wait_until='load')
  if lang['code']=='en':
   page.wait_for_function('document.querySelector("#stage")?.dataset.section === "contact"')
   target=page.locator('#contact-form').evaluate('(el)=>Array.from(document.querySelectorAll("#book .page")).indexOf(el.closest(".page"))')
   while int(page.locator('#stage').get_attribute('data-page'))<target:
    page.keyboard.press('ArrowRight')
   page.wait_for_timeout(150)
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
 nojs.route('**/*',local_request)
 nj=nojs.new_page();nj.goto(BASE+'/zh/')
 assert '试读' in nj.locator('body').inner_text()
 nj.locator('#lang-menu summary').click()
 nj.locator('#lang-menu [data-set-lang="ru"]').click()
 assert nj.url==BASE+'/ru/'
 assert 'Сюжет' in nj.locator('body').inner_text()
 nj.goto(BASE+'/')
 assert nj.locator('.sample-sheet').first.evaluate('(el)=>el.firstElementChild.getBoundingClientRect().width <= el.getBoundingClientRect().width + 1')
 browser.close()
(OUT/'results.json').write_text(json.dumps({'checks':notes,'errors':errors},indent=2))
print(json.dumps({'pages_and_viewports':len(notes),'errors':errors,'screenshots':str(OUT)},indent=2))
if errors:raise SystemExit(1)
