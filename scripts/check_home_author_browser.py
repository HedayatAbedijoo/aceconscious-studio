#!/usr/bin/env python3
"""Check the English Author copy, compact layout and native disclosure."""
import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright

from build_locales import ROOT, apply_strings, parse

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--base", default="http://127.0.0.1:8765")
parser.add_argument("--chromium-executable")
parser.add_argument("--browsers", nargs="+", default=["chromium", "webkit", "firefox"])
parser.add_argument("--output", default="/tmp/ace-author-qa")
args = parser.parse_args()
base = args.base.rstrip("/")
out = Path(args.output)
out.mkdir(parents=True, exist_ok=True)
original = parse((ROOT / "content/templates/home.html").read_text())
apply_strings(original, json.loads((ROOT / "content/locales/en.json").read_text()))
original = original.select_one("#author")

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
  const issues = [], section = document.querySelector('#author');
  const grid = section.querySelector('.author-layout'), box = grid.getBoundingClientRect();
  const heading = getComputedStyle(section.querySelector('.author-heading'));
  const reference = getComputedStyle(document.querySelector('.edition-heading'));
  const photo = section.querySelector('.author__photo').getBoundingClientRect();
  const verse = section.querySelector('.author__verse').getBoundingClientRect();
  const bio = section.querySelector('.author__bio').getBoundingClientRect();
  const summary = section.querySelector('summary').getBoundingClientRect();
  if (document.documentElement.scrollWidth > innerWidth + 1)
    issues.push('Page overflows horizontally');
  if (heading.fontFamily !== reference.fontFamily || heading.fontSize !== reference.fontSize ||
      heading.letterSpacing !== reference.letterSpacing || heading.textTransform !== 'none')
    issues.push('Heading differs from approved section typography');
  const maxPortrait = innerWidth > 900 ? 224 : innerWidth > 540 ? 160 : 144;
  if (photo.width > maxPortrait + 1 || Math.abs(photo.height / photo.width - 4 / 3) > .01)
    issues.push('Portrait size or original aspect ratio changed');
  if (summary.width < 44 || summary.height < 44) issues.push('Small disclosure touch target');
  if (innerWidth > 900) {
    if (verse.left < photo.right || Math.abs(verse.top - photo.top) > 1 ||
        Math.abs(bio.left - verse.left) > 1) issues.push('Desktop portrait/poem alignment');
  } else if (bio.top < Math.max(photo.bottom, verse.bottom) + 20) {
    issues.push('Mobile biography should follow portrait and poem');
  }
  for (const el of section.querySelectorAll('h2, h3, p, blockquote, summary, .author-extended, .author-links')) {
    if (!el.getClientRects().length || (el.closest('details:not([open])') && !el.closest('summary'))) continue;
    const b = el.getBoundingClientRect();
    if (b.left < box.left - 1 || b.right > box.right + 1)
      issues.push(`${el.className || el.tagName}: outside container`);
    if (el.scrollWidth > el.clientWidth + 1)
      issues.push(`${el.className || el.tagName}: content overflows`);
  }
  const blocks = [photo, verse, bio];
  blocks.forEach((a, i) => blocks.slice(i + 1).forEach(b => {
    if (a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1)
      issues.push('Portrait, poem or biography overlaps');
  }));
  return {issues, portraitWidth: photo.width, height: section.getBoundingClientRect().height};
}"""


def record(page, name, size, state):
    report = page.evaluate(geometry)
    results.append({"browser": name, "viewport": size, "state": state, **report})
    errors.extend(f"{name} {size} {state}: {issue}" for issue in report["issues"])


def check_copy(page):
    actual = parse(page.locator("#author").evaluate("el => el.outerHTML"))
    for selector in [".author__photo", ".author__verse"] + [
        f'[data-i18n-html="author.p{i}"]' for i in range(1, 8)
    ]:
        assert str(actual.select_one(selector)) == str(original.select_one(selector)), selector
    assert [str(a) for a in actual.select("a")] == [str(a) for a in original.select("a")]
    assert len(actual.select("[data-author-intro] > p")) == 1
    assert len(actual.select("details [data-author-extended] > p")) == 6
    assert actual.select_one("#author-heading").get_text() == original.select_one(".section-label").get_text()
    assert actual.select_one(".author-name").get_text() == original.select_one(".section-title").get_text()
    assert page.locator("#voices + #author + #contents").count() == 1
    assert page.locator("#author .author-links a").count() == 2


def set_open(page, opened):
    page.locator("#author-details").evaluate("(el, opened) => el.open = opened", opened)


def capture(page, name, width, height, state):
    section = page.locator("#author")
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
        assert not page.locator("#author-details").evaluate("el => el.open")
        assert not page.locator(".author-extended").is_visible()
        page.locator(".author__photo-img").scroll_into_view_if_needed()
        page.wait_for_function("document.querySelector('.author__photo-img').naturalWidth > 0")
        assert page.locator(".author__photo-img").evaluate("el => el.complete && el.naturalWidth > 0")
        assert page.locator(".author__photo-img").evaluate("el => getComputedStyle(el).animationName") == "none"
        page.emulate_media(reduced_motion="no-preference")
        assert page.locator(".author__photo-img").evaluate(
            "el => getComputedStyle(el).animationName") == "author-color-spectra"
        page.emulate_media(reduced_motion="reduce")

        for width, height in viewports:
            page.set_viewport_size({"width": width, "height": height})
            for opened in (False, True):
                set_open(page, opened)
                record(page, name, [width, height], "open" if opened else "closed")
            if width in (320, 390, 768, 1440):
                set_open(page, False)
                capture(page, name, width, height, "closed")
                if width in (390, 1440):
                    set_open(page, True)
                    capture(page, name, width, height, "open")

        page.set_viewport_size({"width": 390, "height": 844})
        set_open(page, False)
        summary = page.locator(".author-toggle")
        summary.focus()
        page.keyboard.press("Enter")
        assert page.locator(".author-extended").is_visible()
        assert page.locator(".author-toggle__open").first.inner_text() == "Read less"
        page.keyboard.press("Tab")
        assert page.locator('.author-extended a[href="/ace/"]').evaluate("el => el === document.activeElement")
        summary.focus()
        page.keyboard.press("Space")
        assert not page.locator(".author-extended").is_visible()
        page.keyboard.press("Tab")
        assert page.locator(".author-links a").first.evaluate("el => el === document.activeElement")
        assert page.locator(".author-links a").first.evaluate(
            "el => parseFloat(getComputedStyle(el).outlineWidth) >= 2")
        summary.tap()
        assert page.locator(".author-extended").is_visible()
        summary.tap()
        assert not page.locator(".author-extended").is_visible()
        page.locator(".nav-toggle").tap()
        page.locator('#nav-menu a[href="#author"]').tap()
        assert page.url.endswith("#author")
        assert page.locator(".nav-toggle").get_attribute("aria-expanded") == "false"
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
            assert page.locator(".author--redesign").count() == 0
            assert page.locator("#author .author__bio > p[data-i18n-html]").count() == 7
            assert not page.evaluate("document.documentElement.scrollWidth > innerWidth + 1")
        context.close()

        nojs = browser.new_context(java_script_enabled=False, viewport={"width": 390, "height": 844})
        nojs.route("**/*", local_only)
        page = nojs.new_page()
        page.goto(base + "/", wait_until="networkidle")
        check_copy(page)
        page.locator(".author-toggle").focus()
        record(page, name, [390, 844], "no-js-closed")
        page.keyboard.press("Enter")
        assert page.locator(".author-extended").is_visible()
        record(page, name, [390, 844], "no-js-open")
        page.keyboard.press("Space")
        assert not page.locator(".author-extended").is_visible()
        browser.close()
        print(f"{name}: {len(viewports)} sizes, both states, full copy, keyboard/touch, 200% text, RTL and no-JS checked.", flush=True)

(out / "results.json").write_text(json.dumps({"checks": results, "errors": errors}, indent=2) + "\n")
print(json.dumps({"checks": len(results), "errors": errors, "screenshots": str(out)}, indent=2))
if errors:
    raise SystemExit(1)
