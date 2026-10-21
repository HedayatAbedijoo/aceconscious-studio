#!/usr/bin/env python3
"""Fixed Community tab, modal and mocked submission QA. Never send real messages."""
import argparse
import json
import re
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--base", default="http://127.0.0.1:8765")
parser.add_argument("--chromium-executable")
parser.add_argument("--browsers", nargs="+", default=["chromium", "webkit", "firefox"])
parser.add_argument("--output", default="/tmp/ace-community-qa")
args = parser.parse_args()
base = args.base.rstrip("/")
out = Path(args.output)
out.mkdir(parents=True, exist_ok=True)
endpoint = re.search(r'^window\.CONTACT_FORM_ENDPOINT = "([^"]+)"',
                     (ROOT / "js/contact-config.js").read_text(), re.M).group(1)
description = "Join the ACE Reader Community for occasional letters, new stories, meetings and next steps."
phones = [(320, 568), (360, 640), (375, 667), (390, 844), (393, 852),
          (412, 915), (414, 896), (430, 932), (440, 956)]
viewports = phones + [(h, w) for w, h in phones] + [
    (540, 800), (541, 800), (600, 800), (759, 1024), (760, 1024),
    (761, 1024), (768, 1024), (820, 1180), (834, 1194), (899, 1024),
    (900, 1024), (901, 1024), (1024, 768), (1100, 900), (1101, 900),
    (1279, 800), (1280, 800), (1281, 800), (1440, 1000),
    (1800, 1000), (2560, 1440), (3840, 2160),
]
results, errors = [], []
geometry = """() => {
  const issues = [], section = document.querySelector('#community-dialog');
  const layout = section.querySelector('.community-layout'), box = layout.getBoundingClientRect();
  const left = section.querySelector('.community-copy').getBoundingClientRect();
  const right = section.querySelector('form').getBoundingClientRect();
  const heading = getComputedStyle(section.querySelector('h2'));
  const reference = getComputedStyle(document.querySelector('.edition-heading'));
  const columns = getComputedStyle(layout).gridTemplateColumns.split(' ').length;
  if (document.documentElement.scrollWidth > innerWidth + 1) issues.push('Page overflow');
  const modal = section.getBoundingClientRect();
  if (modal.left < 0 || modal.right > innerWidth || modal.top < 0 || modal.bottom > innerHeight)
    issues.push('Dialog outside viewport');
  if (section.scrollWidth > section.clientWidth + 1) issues.push('Dialog overflow');
  if (columns !== (innerWidth > 900 ? 2 : 1)) issues.push('Wrong column count');
  if (innerWidth > 900 ? left.right > right.left : left.bottom > right.top)
    issues.push('Introduction and form overlap or are out of order');
  if (heading.fontFamily !== reference.fontFamily || heading.fontSize !== reference.fontSize ||
      heading.letterSpacing !== reference.letterSpacing || heading.textTransform !== 'none')
    issues.push('Section heading differs from approved typography');
  for (const el of layout.querySelectorAll('h2,h3,p,label,#community-email,button')) {
    if (!el.getClientRects().length) continue;
    const b = el.getBoundingClientRect();
    if (b.left < box.left - 1 || b.right > box.right + 1)
      issues.push(`${el.className}: outside container`);
    if (el.matches('input,button') && b.height < 44) issues.push('Small control target');
    if (el.matches('input')) continue;
    const range = document.createRange();
    for (const node of el.childNodes) {
      range.selectNode(node);
      for (const line of range.getClientRects()) {
        if (line.left < b.left - 1 || line.right > b.right + 1)
          issues.push(`${el.className}: text clipping`);
      }
    }
  }
  const email = section.querySelector('#community-email').getBoundingClientRect();
  const submit = section.querySelector('.community-submit').getBoundingClientRect();
  const status = section.querySelector('#community-status');
  if (email.bottom > submit.top || (!status.hidden && submit.bottom > status.getBoundingClientRect().top))
    issues.push('Form controls/status overlap');
  if (parseFloat(getComputedStyle(section.querySelector('input[type=email]')).fontSize) < 16)
    issues.push('Input font would trigger mobile auto-zoom');
  return {issues, columns, formWidth: right.width, sectionHeight: section.getBoundingClientRect().height};
}"""


def record(page, browser, size, state):
    report = page.evaluate(geometry)
    results.append({"browser": browser, "viewport": size, "state": state, **report})
    errors.extend(f"{browser} {size} {state}: {issue}" for issue in report["issues"])


def capture(page, browser, width, height):
    page.screenshot(path=str(out / f"{browser}-{width}x{height}-dialog.png"))


def reveal_community(page):
    if page.locator('.community-tab').bounding_box()['x'] < -1:
        page.evaluate("""() => {
          const max = document.documentElement.scrollHeight - innerHeight;
          scrollTo({top: scrollY < max - 1 ? scrollY + 1 : scrollY - 1, behavior: 'instant'});
        }""")
        page.wait_for_function("document.querySelector('.community-tab').getBoundingClientRect().left >= -1")


def open_community(page):
    reveal_community(page)
    page.locator('.community-tab').click()
    assert page.locator('#community-dialog').is_visible()


def close_community(page):
    page.locator('.community-close').click()
    assert page.locator('#community-dialog').is_hidden()
    assert page.locator('.community-tab').evaluate('el => el === document.activeElement')


def wait_status(page, state):
    page.wait_for_function("""state => document.querySelector('#community-status').dataset.state === state
      && !document.querySelector('.community-submit').disabled""", arg=state)


def check_scroll_visibility(context, browser):
    page = context.new_page()
    page.clock.install()
    page.goto(base + '/', wait_until='networkidle')
    tab = page.locator('.community-tab')

    def retracted():
        return tab.evaluate('el => el.getBoundingClientRect().right <= 4.5')

    def expanded():
        return tab.evaluate('el => Math.abs(el.getBoundingClientRect().left) < 1')

    def scroll_to(y):
        page.evaluate("y => scrollTo({top: y, behavior: 'instant'})", y)
        page.wait_for_function('y => scrollY === y', arg=y)
        page.wait_for_function("document.querySelector('.community-tab').hasAttribute('data-scroll-active')")

    assert retracted(), 'Mobile tab must start outside the reading area'
    assert tab.evaluate('el => getComputedStyle(el).boxShadow') == 'none'
    page.screenshot(path=str(out / f'{browser}-mobile-idle.png'))

    # The collapsed edge can be discovered without scrolling. Hover only reveals
    # the tab; a click or tap activates its dialog, including inside the gutter.
    edge_y = tab.bounding_box()['y'] + tab.bounding_box()['height'] / 2
    page.mouse.move(12, edge_y)
    page.wait_for_function("document.querySelector('.community-tab').getBoundingClientRect().left >= -1")
    page.clock.fast_forward(2000)
    assert expanded(), 'Keep the tab open while the pointer is over it'
    assert page.locator('#community-dialog').is_hidden(), 'Hover must not open the modal'
    page.mouse.move(200, 20)
    page.clock.fast_forward(600)
    assert expanded()
    page.clock.fast_forward(500)
    assert retracted(), 'Retract 1 second after the pointer leaves'
    for activate in (page.mouse.click, page.touchscreen.tap):
        activate(12, edge_y)
        assert expanded(), 'Clicking/tapping the collapsed edge must reveal the tab'
        assert page.locator('#community-dialog').is_visible()
        close_community(page)
        page.clock.fast_forward(1100)
        assert retracted(), 'Do not retain hover state after a touch activation'

    for y in (100, 200, 100):
        scroll_to(y)
        assert expanded(), 'Both scroll directions must reveal the tab'
        page.clock.fast_forward(600)
        assert expanded(), 'Keep the tab available for a full second after movement'
    page.screenshot(path=str(out / f'{browser}-mobile-scrolling.png'))
    page.clock.fast_forward(600)
    assert retracted(), 'Retract once the 1-second idle window ends'

    # A touch/press near the timeout must not lose its target.
    scroll_to(200)
    page.clock.fast_forward(600)
    box = tab.bounding_box()
    page.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2)
    page.mouse.down()
    page.clock.fast_forward(3000)
    assert expanded()
    page.mouse.up()
    assert page.locator('#community-dialog').is_visible()
    close_community(page)
    page.clock.fast_forward(1100)
    assert retracted(), 'Pointer dismissal must not leave the tab permanently open'

    # Keyboard access remains available even while the tab is retracted.
    page.locator('footer a').last.focus()
    page.keyboard.press('Tab')
    assert tab.evaluate('el => el === document.activeElement')
    assert expanded()
    page.clock.fast_forward(3000)
    assert expanded(), 'Never hide a keyboard-focused control'
    page.keyboard.press('Enter')
    assert page.locator('#community-dialog').is_visible()
    page.keyboard.press('Escape')
    assert tab.evaluate('el => el === document.activeElement')
    page.evaluate('document.activeElement.blur()')
    page.clock.fast_forward(1100)
    assert retracted()

    page.set_viewport_size({'width': 1440, 'height': 1000})
    page.wait_for_function('matchMedia("(min-width: 1025px)").matches')
    assert expanded()
    page.clock.fast_forward(5000)
    assert expanded(), 'Desktop tab must stay expanded while idle'
    for width, height in ((956, 440), (1024, 768)):
        page.set_viewport_size({'width': width, 'height': height})
        page.clock.fast_forward(1100)
        assert retracted(), 'Landscape phones and smaller screens should retract too'
        reveal_community(page)
        assert expanded()
        page.clock.fast_forward(1100)
        assert retracted()

    # Check the real animated state as well as the reduced-motion path above.
    page.set_viewport_size({'width': 412, 'height': 924})
    page.emulate_media(reduced_motion='no-preference')
    assert tab.evaluate('el => getComputedStyle(el).transitionDuration.split(",")[0]') == '0.24s'
    reveal_community(page)
    page.clock.fast_forward(1100)
    page.wait_for_function("document.querySelector('.community-tab').getBoundingClientRect().right <= 4.5")
    edge_y = tab.bounding_box()['y'] + tab.bounding_box()['height'] / 2
    page.touchscreen.tap(12, edge_y)
    assert page.locator('#community-dialog').is_visible(), 'A tap must survive the reveal animation'
    close_community(page)
    page.close()


with sync_playwright() as playwright:
    for name in args.browsers:
        options = {"headless": True}
        if name == "chromium":
            options["args"] = ["--no-sandbox"]
            if args.chromium_executable:
                options["executable_path"] = args.chromium_executable
        browser = getattr(playwright, name).launch(**options)
        context = browser.new_context(viewport={"width": 390, "height": 844},
                                      has_touch=True, reduced_motion="reduce")
        requests, pending = [], []
        mode = "success"

        def route(request):
            url = request.request.url
            if url.startswith(base + "/"):
                request.continue_()
            elif url == endpoint and request.request.method == "POST":
                requests.append({"body": request.request.post_data_json, "headers": request.request.headers})
                if mode == "pending":
                    pending.append(request)
                elif mode == "offline":
                    request.abort()
                else:
                    payload = {"type": "ace-contact-form", "status": "success"}
                    if mode == "error":
                        payload["status"] = "error"
                    if mode == "wrong-type":
                        payload["type"] = "unexpected"
                    request.fulfill(status=503 if mode == "http-error" else 200,
                                    content_type="application/json",
                                    headers={"Access-Control-Allow-Origin": "*"},
                                    body="not json" if mode == "malformed" else json.dumps(payload))
            else:
                request.abort()

        context.route("**/*", route)
        check_scroll_visibility(context, name)
        page = context.new_page()
        page.on("pageerror", lambda error: errors.append(f"{name}: {error}"))
        page.goto(base + "/", wait_until="networkidle")
        page.wait_for_function("document.fonts.status === 'loaded'")
        assert page.locator("#voices + #author + #contents").count() == 1
        assert page.locator("main #community, #nav-menu a[href='#community']").count() == 0
        assert page.locator('#community-dialog').is_hidden()
        assert page.locator('.community-tab').inner_text() == 'Community'
        open_community(page)
        assert page.locator("#community-heading").inner_text() == "Join the Community"
        assert page.locator(".community-description").inner_text() == description
        assert " ".join(page.locator(".community-tagline").inner_text().split()) == "The story ends. The conversation doesn't."
        assert "Demo only" not in page.locator("#community").inner_text()
        assert "What is one decision" not in page.locator("#community").inner_text()
        form = page.locator("#community-form")
        email = page.locator("#community-email")
        button = page.locator(".community-submit")
        assert not button.is_disabled()
        assert form.get_attribute("method") == "post"
        assert not requests, "No submission before user action"

        for width, height in viewports:
            close_community(page)
            page.set_viewport_size({"width": width, "height": height})
            # The tab stays on the physical left at the same viewport height throughout the page.
            positions = []
            for fraction in (0, .5, 1):
                page.evaluate("fraction => scrollTo({top: fraction * document.documentElement.scrollHeight, behavior: 'instant'})", fraction)
                reveal_community(page)
                tab = page.locator('.community-tab').bounding_box()
                assert tab['x'] == 0 and tab['width'] >= 44 and tab['height'] >= 44
                assert tab['y'] >= 0 and tab['y'] + tab['height'] <= height
                positions.append(tab['y'])
            assert max(positions) - min(positions) <= 1
            if width in (320, 390, 1440):
                page.screenshot(path=str(out / f"{name}-{width}x{height}-tab.png"))
            before = page.evaluate('scrollY')
            open_community(page)
            assert page.evaluate('scrollY') == before
            assert page.locator('.community-close').evaluate('el => el === document.activeElement')
            record(page, name, [width, height], "ready")
            if width in (320, 390, 768, 900, 901, 1440):
                capture(page, name, width, height)

        page.set_viewport_size({"width": 390, "height": 844})
        close_community(page)
        page.locator("#contact-email").fill("contact-reader@example.com")
        page.locator("#contact-message").fill("Keep the existing contact form independent.")
        tab = page.locator('.community-tab')
        tab.focus()
        page.keyboard.press('Enter')
        assert page.locator('#community-dialog').is_visible()
        before = page.evaluate('scrollY')
        page.mouse.move(2, 2)
        page.mouse.wheel(0, -600)
        page.wait_for_timeout(100)
        assert page.evaluate('scrollY') == before, 'Background must not scroll behind the modal'
        for _ in range(7):
            page.keyboard.press('Tab')
            # Native dialogs may let Tab visit browser chrome (activeElement becomes body),
            # but must never focus interactive content in the page behind the modal.
            assert page.evaluate("document.activeElement === document.body || document.querySelector('#community-dialog').contains(document.activeElement)")
        page.locator('#contact-email').evaluate('el => el.focus()')
        assert not page.locator('#contact-email').evaluate('el => el === document.activeElement')
        page.locator('.community-close').focus()
        page.keyboard.press('Escape')
        assert page.locator('#community-dialog').is_hidden()
        assert tab.evaluate('el => el === document.activeElement')
        assert page.evaluate('scrollY') == before
        tab.tap()
        email.fill('keep-draft@example.com')
        close_community(page)
        open_community(page)
        assert email.input_value() == 'keep-draft@example.com'
        for invalid in ("", "not-an-email", "reader@localhost", "two@example.com,three@example.com"):
            email.fill(invalid)
            button.tap()
            assert not email.evaluate("el => el.validity.valid")
            assert email.get_attribute("aria-invalid") == "true"
            assert email.evaluate("el => el === document.activeElement")
        assert not requests, "Invalid emails must not be sent"

        email.fill(" reader+circle@example.com ")
        email.focus()
        page.keyboard.press("Tab")
        assert button.evaluate("el => el === document.activeElement")
        assert button.evaluate("el => parseFloat(getComputedStyle(el).outlineWidth) >= 2")
        page.keyboard.press("Enter")
        wait_status(page, "success")
        assert len(requests) == 1
        body = requests[-1]["body"]
        assert body["email"] == "reader+circle@example.com"
        assert body["message"] == (
            "Community join request\n\nPlease add me to the ACE Reader Community for occasional letters, "
            "new stories, meetings and next steps.\n\nPage: /#community")
        assert body["origin"] == base and body["website"] == ""
        assert requests[-1]["headers"]["content-type"] == "text/plain;charset=utf-8"
        assert email.input_value() == ""
        assert form.get_attribute("aria-busy") is None
        assert "request to join has been sent" in page.locator("#community-status").inner_text()

        for width in (320, 390, 768, 1440):
            page.set_viewport_size({"width": width, "height": 1000})
            record(page, name, [width, 1000], "success")
        for failure in ("error", "wrong-type", "malformed", "http-error", "offline"):
            mode = failure
            email.fill("retry@example.com")
            button.tap()
            wait_status(page, "error")
            assert email.input_value() == "retry@example.com"
            assert not email.evaluate("el => el.readOnly")
        for width in (320, 390, 768, 1440):
            page.set_viewport_size({"width": width, "height": 1000})
            record(page, name, [width, 1000], "error")

        mode = "pending"
        count = len(requests)
        email.fill("pending@example.com")
        button.click()
        page.wait_for_timeout(100)
        assert button.is_disabled() and email.evaluate("el => el.readOnly")
        assert form.get_attribute("aria-busy") == "true"
        form.evaluate("el => { el.requestSubmit(); el.requestSubmit(); }")
        assert len(requests) == count + 1 and len(pending) == 1
        pending.pop().fulfill(content_type="application/json", headers={"Access-Control-Allow-Origin": "*"},
                              body=json.dumps({"type": "ace-contact-form", "status": "success"}))
        wait_status(page, "success")

        mode = "success"
        count = len(requests)
        email.fill("bot@example.com")
        form.locator('[name="website"]').evaluate("el => el.value = 'spam'")
        button.click()
        wait_status(page, "success")
        assert len(requests) == count, "Honeypot must stop the request"
        assert page.locator("#contact-email").input_value() == "contact-reader@example.com"
        assert page.locator("#contact-message").input_value() == "Keep the existing contact form independent."
        assert page.locator("#contact-status").is_hidden()

        # Existing Contact still uses its original message, status and endpoint.
        close_community(page)
        page.locator('#contact-form [type="submit"]').click()
        page.wait_for_function("document.querySelector('#contact-status').classList.contains('contact-form__status--success')")
        assert requests[-1]["body"]["message"] == "Keep the existing contact form independent."

        page.add_style_tag(content="html { font-size: 200%; }")
        open_community(page)
        for width in (320, 390, 768, 1440):
            page.set_viewport_size({"width": width, "height": 1000})
            record(page, name, [width, 1000], "200-percent")
        page.goto(base + "/", wait_until="networkidle")
        open_community(page)
        mode = "pending"
        page.clock.install()
        page.locator("#community-email").fill("timeout@example.com")
        page.locator(".community-submit").click()
        page.wait_for_timeout(100)
        page.clock.fast_forward(21000)
        wait_status(page, "error")
        assert page.locator("#community-email").input_value() == "timeout@example.com"
        assert not page.locator("#community-email").evaluate("el => el.readOnly")
        # Release the intercepted route after the client's abort, before teardown.
        pending.pop().abort()

        unavailable = context.new_page()
        unavailable.add_init_script("Object.defineProperty(window, 'CONTACT_FORM_ENDPOINT', {get: () => '', set: () => {}})")
        unavailable.goto(base + "/", wait_until="networkidle")
        open_community(unavailable)
        count = len(requests)
        unavailable.locator("#community-email").fill("reader@example.com")
        unavailable.locator(".community-submit").click()
        wait_status(unavailable, "error")
        assert "unavailable" in unavailable.locator("#community-status").inner_text()
        assert len(requests) == count
        unavailable.close()
        page.close()

        page = context.new_page()
        for locale in ("de", "ar", "fa"):
            page.goto(f"{base}/{locale}/", wait_until="networkidle")
            assert page.locator("#community").count() == 0
            assert page.locator("#contact-form").count() == 1
            assert not page.evaluate("document.documentElement.scrollWidth > innerWidth + 1")
        context.close()

        nojs = browser.new_context(java_script_enabled=False, viewport={"width": 390, "height": 844})
        nojs.route("**/*", route)
        page = nojs.new_page()
        page.goto(base + "/", wait_until="networkidle")
        open_community(page)
        assert page.locator("#community-email").is_disabled()
        assert page.locator(".community-submit").is_disabled()
        assert page.get_by_text("Please enable JavaScript to send your request.", exact=True).is_visible()
        record(page, name, [390, 844], "no-js")
        close_community(page)
        nojs.close()
        browser.close()
        print(f"{name}: {len(viewports)} sizes; validation, success/error/timeout, duplicate guard, honeypot, contact isolation, keyboard/touch, text zoom, RTL and no-JS checked.", flush=True)

(out / "results.json").write_text(json.dumps({"checks": results, "errors": errors}, indent=2) + "\n")
print(json.dumps({"checks": len(results), "errors": errors, "screenshots": str(out)}, indent=2))
if errors:
    raise SystemExit(1)
