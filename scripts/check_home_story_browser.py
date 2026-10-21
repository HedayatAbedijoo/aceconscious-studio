#!/usr/bin/env python3
"""English Story QA: exact copy, responsive columns and native disclosure."""
import argparse
import json
from pathlib import Path

from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--base", default="http://127.0.0.1:8765")
parser.add_argument("--chromium-executable")
parser.add_argument("--browsers", nargs="+", default=["chromium", "webkit", "firefox"])
parser.add_argument("--output", default="/tmp/ace-story-qa")
args = parser.parse_args()
base = args.base.rstrip("/")
out = Path(args.output)
out.mkdir(parents=True, exist_ok=True)
root = Path(__file__).resolve().parent.parent
source = json.loads((root / "content/locales/en.json").read_text())
pitch = BeautifulSoup(source["hero.pitch"], "html.parser")
expected_paragraphs = [p.get_text() for p in pitch.select("p:not(.hero__pitch-ace)")]
expected_ace = pitch.select_one(".hero__pitch-ace")
expected_ace_title = expected_ace.a.get_text()
expected_ace_link = expected_ace.a["href"]
expected_ace.a.extract()
expected_ace.br.extract()
expected_ace_text = expected_ace.get_text()
phones = [(320, 568), (360, 640), (375, 667), (390, 844), (393, 852),
          (412, 915), (414, 896), (430, 932), (440, 956)]
viewports = phones + [(h, w) for w, h in phones] + [
    (600, 800), (759, 1024), (760, 1024), (761, 1024),
    (768, 1024), (820, 1180), (834, 1194), (899, 1024),
    (900, 1024), (901, 1024), (1024, 768), (1279, 800),
    (1280, 800), (1281, 800), (1440, 1000), (1800, 1000),
    (2560, 1440), (3840, 2160),
]
results, errors = [], []

geometry = """() => {
  const issues = [];
  const section = document.querySelector('#synopsis');
  const layout = section.querySelector('.story-layout');
  const grid = layout.getBoundingClientRect();
  const left = section.querySelector('.story-synopsis').getBoundingClientRect();
  const right = section.querySelector('.story-ace').getBoundingClientRect();
  const heading = section.querySelector('.story-heading');
  const headingBox = heading.getBoundingClientRect();
  const details = section.querySelector('details');
  const reference = document.querySelector('.edition-heading');
  const headingStyle = getComputedStyle(heading);
  const referenceStyle = getComputedStyle(reference);
  if (document.documentElement.scrollWidth > innerWidth + 1) issues.push('Page overflows horizontally');
  if (headingStyle.fontFamily !== referenceStyle.fontFamily ||
      headingStyle.fontSize !== referenceStyle.fontSize ||
      headingStyle.letterSpacing !== referenceStyle.letterSpacing ||
      headingStyle.textTransform !== 'none') issues.push('Story heading differs from approved Buy typography');
  if (headingBox.bottom > grid.top || Math.abs(headingBox.left - grid.left) > 1)
    issues.push('Story heading overlaps or is misaligned');
  for (const selector of ['.edition-layout', '#reviews > .container', '.hero-redesign__grid']) {
    const box = document.querySelector(selector).getBoundingClientRect();
    if (Math.abs(box.left - grid.left) > 1 || Math.abs(box.right - grid.right) > 1)
      issues.push(`Story width differs from ${selector}`);
  }
  if (innerWidth > 900) {
    if (left.right > right.left || Math.abs(left.top - right.top) > 1)
      issues.push('Desktop synopsis/ACE columns overlap or are out of order');
  } else if (left.bottom > right.top || Math.abs(left.left - right.left) > 1) {
    issues.push('Mobile ACE must follow the entire synopsis');
  }
  const label = details.querySelector(details.open ? '.story-toggle__open' : '.story-toggle__closed');
  if (!label.getClientRects().length) issues.push('Disclosure state label is hidden');
  for (const el of section.querySelectorAll('h2, h3, p, summary, a')) {
    if (!el.getClientRects().length || (el.closest('details:not([open])') && !el.closest('summary'))) continue;
    const box = el.getBoundingClientRect();
    if (box.left < grid.left - 1 || box.right > grid.right + 1)
      issues.push(`${el.className || el.tagName}: outside container`);
    if (el.matches('a, summary') && (box.height < 44 || box.width < 44))
      issues.push(`${el.tagName}: touch target below 44px`);
    const range = document.createRange();
    for (const node of el.childNodes) {
      range.selectNode(node);
      for (const line of range.getClientRects()) {
        if (line.left < box.left - 1 || line.right > box.right + 1)
          issues.push(`${el.className || el.tagName}: text clipped`);
      }
    }
  }
  return {issues, columns: getComputedStyle(layout).gridTemplateColumns.split(' ').length,
    open: details.open, synopsisHeight: left.height, aceHeight: right.height,
    headingSize: headingStyle.fontSize};
}"""


def record(page, browser, viewport, state):
    report = page.evaluate(geometry)
    errors.extend(f"{browser} {viewport} {state}: {issue}" for issue in report["issues"])
    results.append({"browser": browser, "viewport": viewport, "state": state, **report})
    if report["issues"]:
        print(errors[-len(report["issues"]):], flush=True)


def check_copy(page):
    assert page.locator(".story-copy > p").all_text_contents() == expected_paragraphs
    assert page.locator("#story-ace-heading").inner_text() == expected_ace_title
    assert page.locator("#story-ace-heading a").get_attribute("href") == expected_ace_link
    assert page.locator(".story-ace__text").text_content() == expected_ace_text
    assert page.locator("#synopsis-heading").inner_text() == "Story"
    assert page.locator(".story-synopsis h3").inner_text() == "Synopsis"


def capture(page, name, width, height, state):
    # A tall component capture avoids stitching the fixed nav across the section.
    capture_height = max(height, int(page.locator("#synopsis").bounding_box()["height"]) + 180)
    page.set_viewport_size({"width": width, "height": capture_height})
    page.locator("#synopsis").evaluate("""el => window.scrollTo({
      top: scrollY + el.getBoundingClientRect().top - 100, behavior: 'instant'})""")
    page.locator("#synopsis").screenshot(path=str(out / f"{name}-{width}-{state}.png"))
    page.set_viewport_size({"width": width, "height": height})


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
        context.route("**/*", lambda r: r.continue_() if r.request.url.startswith(base + "/") else r.abort())
        page = context.new_page()
        page.on("pageerror", lambda error: errors.append(f"{name}: {error}"))
        page.goto(base + "/", wait_until="networkidle")
        page.wait_for_function("document.fonts.status === 'loaded'")
        assert page.locator("#buy + #synopsis + #sample + #voices").count() == 1
        assert page.locator(".story-layout > *").evaluate_all(
            "(els) => els.map(el => el.className)") == ["story-synopsis", "story-ace"]
        check_copy(page)
        details = page.locator("#story-details")
        summary = details.locator("summary")
        assert not details.evaluate("el => el.open")
        assert page.locator(".story-toggle__closed").first.is_visible()
        assert not page.locator(".story-copy--extended").is_visible()

        for width, height in viewports:
            page.set_viewport_size({"width": width, "height": height})
            for opened in (False, True):
                details.evaluate("(el, opened) => el.open = opened", opened)
                state = "open" if opened else "closed"
                record(page, name, [width, height], state)
                if (width in (320, 390, 768, 900, 901, 1440) and not opened) or (
                        width in (320, 1440) and opened):
                    capture(page, name, width, height, state)

        page.set_viewport_size({"width": 390, "height": 844})
        details.evaluate("el => el.open = false")
        summary.focus()
        assert summary.evaluate("el => parseFloat(getComputedStyle(el).outlineWidth) >= 2")
        page.keyboard.press("Enter")
        assert details.evaluate("el => el.open")
        assert page.get_by_text("Hide extended synopsis", exact=True).is_visible()
        assert page.locator(".story-copy--extended").is_visible()
        check_copy(page)
        page.keyboard.press("Space")
        assert not details.evaluate("el => el.open")
        summary.tap()
        assert details.evaluate("el => el.open")
        summary.tap()
        assert not details.evaluate("el => el.open")
        summary.focus()
        page.keyboard.press("Tab")
        assert page.locator("#story-ace-heading a").evaluate("el => el === document.activeElement")
        page.locator(".nav-toggle").tap()
        page.locator('#nav-menu a[href="#synopsis"]').tap()
        assert page.url.endswith("#synopsis")
        assert page.locator(".nav-toggle").get_attribute("aria-expanded") == "false"

        page.add_style_tag(content="html { font-size: 200%; }")
        for width in (320, 390, 768, 1440):
            page.set_viewport_size({"width": width, "height": 1000})
            for opened in (False, True):
                details.evaluate("(el, opened) => el.open = opened", opened)
                record(page, name, [width, 1000], f"200-percent-{'open' if opened else 'closed'}")

        for locale in ("de", "fa", "ar"):
            page.set_viewport_size({"width": 390, "height": 844})
            page.goto(f"{base}/{locale}/", wait_until="networkidle")
            assert page.locator(".synopsis--redesign").count() == 0
            assert page.locator("#synopsis #book-cover").count() == 1
            assert page.locator("#synopsis .hero__pitch").count() == 1
            assert page.locator("html").get_attribute("dir") == ("ltr" if locale == "de" else "rtl")
            assert not page.evaluate("document.documentElement.scrollWidth > innerWidth + 1")
        context.close()

        nojs = browser.new_context(java_script_enabled=False, viewport={"width": 390, "height": 844})
        nojs.route("**/*", lambda r: r.continue_() if r.request.url.startswith(base + "/") else r.abort())
        page = nojs.new_page()
        page.goto(base + "/", wait_until="networkidle")
        check_copy(page)
        summary = page.locator("#story-details > summary")
        summary.focus()
        record(page, name, [390, 844], "no-js-closed")
        page.keyboard.press("Enter")
        assert page.get_by_text("Hide extended synopsis", exact=True).is_visible()
        assert page.locator(".story-copy--extended").is_visible()
        record(page, name, [390, 844], "no-js-open")
        page.keyboard.press("Space")
        assert not page.locator(".story-copy--extended").is_visible()
        nojs.close()
        print(f"{name} {browser.version}: {len(viewports)} viewports, both disclosure states, exact copy, keyboard/touch, text zoom and no-JS passed.", flush=True)
        browser.close()

(out / "results.json").write_text(json.dumps({"checks": results, "errors": errors}, indent=2) + "\n")
print(json.dumps({"checks": len(results), "errors": errors, "screenshots": str(out)}, indent=2))
if errors:
    raise SystemExit(1)
