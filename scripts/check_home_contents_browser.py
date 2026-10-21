#!/usr/bin/env python3
"""Check the English Content disclosure, complete chapter list and layout."""
import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright

from build_locales import ROOT, apply_strings, parse

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--base", default="http://127.0.0.1:8765")
parser.add_argument("--chromium-executable")
parser.add_argument("--browsers", nargs="+", default=["chromium", "webkit", "firefox"])
parser.add_argument("--output", default="/tmp/ace-contents-qa")
args = parser.parse_args()
base = args.base.rstrip("/")
out = Path(args.output)
out.mkdir(parents=True, exist_ok=True)
original = parse((ROOT / "content/templates/home.html").read_text())
apply_strings(original, json.loads((ROOT / "content/locales/en.json").read_text()))
expected = [str(item) for item in original.select("#contents li")]

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
  const issues = [], section = document.querySelector('#contents');
  const box = section.querySelector('.container').getBoundingClientRect();
  const heading = getComputedStyle(section.querySelector('.contents-heading'));
  const reference = getComputedStyle(document.querySelector('.edition-heading'));
  const details = section.querySelector('details'), summary = details.querySelector('summary');
  const toggle = summary.getBoundingClientRect();
  if (document.documentElement.scrollWidth > innerWidth + 1)
    issues.push('Page overflows horizontally');
  if (heading.fontFamily !== reference.fontFamily || heading.fontSize !== reference.fontSize ||
      heading.letterSpacing !== reference.letterSpacing || heading.textTransform !== 'none')
    issues.push('Heading differs from approved section typography');
  if (toggle.width < 44 || toggle.height < 44) issues.push('Small disclosure touch target');
  const selectors = details.open ? 'h2, h3, p, summary, summary > span, li' : 'h2, h3, p, summary, summary > span';
  for (const el of section.querySelectorAll(selectors)) {
    if (!el.getClientRects().length) continue;
    const b = el.getBoundingClientRect();
    if (b.left < box.left - 1 || b.right > box.right + 1)
      issues.push(`${el.className || el.tagName}: outside container`);
    if (el.scrollWidth > el.clientWidth + 1)
      issues.push(`${el.className || el.tagName}: content overflows`);
    if (el.parentElement === summary && (b.top < toggle.top || b.bottom > toggle.bottom))
      issues.push('Summary content extends outside touch target');
  }
  const children = [...summary.children].filter(el => el.getClientRects().length).map(el => el.getBoundingClientRect());
  children.forEach((a, i) => children.slice(i + 1).forEach(b => {
    if (a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1)
      issues.push('Summary label, count or symbol overlaps');
  }));
  let columns = 0;
  if (details.open) {
    const list = details.querySelector('ol');
    columns = getComputedStyle(list).gridTemplateColumns.split(' ').length;
    if (columns !== (innerWidth > 900 ? 3 : innerWidth > 540 ? 2 : 1))
      issues.push('Wrong number of chapter columns');
    const items = [...list.children].map(el => el.getBoundingClientRect());
    items.forEach((a, i) => {
      if (a.top < toggle.bottom - 1 || a.bottom > list.getBoundingClientRect().bottom)
        issues.push('Chapter outside expanded list');
      if (i && (a.top < items[i - 1].top - 1 ||
          (Math.abs(a.top - items[i - 1].top) < 1 && a.left < items[i - 1].right - 1)))
        issues.push('Chapter reading order changed or rows overlap');
    });
    if (items.length !== 40) issues.push('Missing chapter/appendix');
  }
  return {issues, columns, height: section.getBoundingClientRect().height};
}"""


def record(page, name, size, state):
    report = page.evaluate(geometry)
    results.append({"browser": name, "viewport": size, "state": state, **report})
    errors.extend(f"{name} {size} {state}: {issue}" for issue in report["issues"])


def check_copy(page):
    actual = parse(page.locator("#contents").evaluate("el => el.outerHTML"))
    assert [str(item) for item in actual.select("li")] == expected
    assert actual.select_one("#contents-heading").get_text() == "Content"
    assert actual.select_one(".contents-subtitle").get_text() == "Inside the book"
    assert actual.select_one(".contents-description").get_text() == (
        "39 chapters and the ACE Manifesto. For readers who like to look behind the cover before opening it.")
    assert actual.select_one(".contents-toggle__count").get_text() == "40 entries"
    assert actual.select_one("ol")["role"] == "list"
    assert page.locator("#author + #contents + #contact").count() == 1


def set_open(page, opened):
    page.locator("#contents-details").evaluate("(el, opened) => el.open = opened", opened)


def capture(page, name, width, height, state):
    section = page.locator("#contents")
    page.set_viewport_size({"width": width, "height": max(height, int(section.bounding_box()["height"]) + 180)})
    section.evaluate("el => scrollTo({top: scrollY + el.getBoundingClientRect().top - 100, behavior: 'instant'})")
    section.screenshot(path=str(out / f"{name}-{width}-{state}.png"))
    page.set_viewport_size({"width": width, "height": height})


def local_only(route):
    if route.request.url.startswith(base + "/") and route.request.method in ("GET", "HEAD"):
        route.continue_()
    else:
        route.abort()


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
        context.route("**/*", local_only)
        page = context.new_page()
        page.on("pageerror", lambda error: errors.append(f"{name}: {error}"))
        page.goto(base + "/", wait_until="networkidle")
        page.wait_for_function("document.fonts.status === 'loaded'")
        check_copy(page)
        assert not page.locator("#contents-details").evaluate("el => el.open")
        assert not page.locator(".contents-list").is_visible()

        for width, height in viewports:
            page.set_viewport_size({"width": width, "height": height})
            for opened in (False, True):
                set_open(page, opened)
                record(page, name, [width, height], "open" if opened else "closed")
                if width in (320, 390, 768, 1440):
                    capture(page, name, width, height, "open" if opened else "closed")

        page.set_viewport_size({"width": 390, "height": 844})
        set_open(page, False)
        summary = page.locator(".contents-toggle")
        summary.focus()
        assert summary.evaluate("el => parseFloat(getComputedStyle(el).outlineWidth) >= 2")
        page.keyboard.press("Enter")
        assert page.locator(".contents-list").is_visible()
        assert page.locator(".contents-toggle__open").is_visible()
        page.keyboard.press("Space")
        assert not page.locator(".contents-list").is_visible()
        page.keyboard.press("Tab")
        assert page.locator("#contact-email").evaluate("el => el === document.activeElement")
        summary.tap()
        assert page.locator(".contents-list").is_visible()
        summary.tap()
        assert not page.locator(".contents-list").is_visible()
        check_copy(page)

        page.add_style_tag(content="html {font-size: 200%;}")
        for width in (320, 390, 768, 1440):
            page.set_viewport_size({"width": width, "height": 1000})
            for opened in (False, True):
                set_open(page, opened)
                record(page, name, [width, 1000], f"200-percent-{'open' if opened else 'closed'}")

        for locale in ("de", "ar", "fa"):
            page.set_viewport_size({"width": 390, "height": 844})
            page.goto(f"{base}/{locale}/", wait_until="networkidle")
            assert page.locator(".toc--redesign").count() == 0
            assert page.locator("#contents .toc-grid > li").count() == 40
            assert not page.evaluate("document.documentElement.scrollWidth > innerWidth + 1")
        context.close()

        nojs = browser.new_context(java_script_enabled=False, viewport={"width": 390, "height": 844})
        nojs.route("**/*", local_only)
        page = nojs.new_page()
        page.goto(base + "/", wait_until="networkidle")
        check_copy(page)
        page.locator(".contents-toggle").focus()
        record(page, name, [390, 844], "no-js-closed")
        page.keyboard.press("Enter")
        assert page.locator(".contents-list").is_visible()
        record(page, name, [390, 844], "no-js-open")
        page.keyboard.press("Space")
        assert not page.locator(".contents-list").is_visible()
        browser.close()
        print(f"{name}: {len(viewports)} sizes, full chapter list, both states, touch/keyboard, 200% text, RTL and no-JS checked.", flush=True)

(out / "results.json").write_text(json.dumps({"checks": results, "errors": errors}, indent=2) + "\n")
print(json.dumps({"checks": len(results), "errors": errors, "screenshots": str(out)}, indent=2))
if errors:
    raise SystemExit(1)
