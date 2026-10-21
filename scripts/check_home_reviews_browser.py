#!/usr/bin/env python3
"""Responsive review-strip QA. Requires Playwright and a local preview server."""
import argparse
import json
from pathlib import Path

from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--base", default="http://127.0.0.1:8765")
parser.add_argument("--chromium-executable")
parser.add_argument("--browsers", nargs="+", default=["chromium", "webkit", "firefox"])
parser.add_argument("--output", default="/tmp/ace-reviews-qa")
args = parser.parse_args()
base = args.base.rstrip("/")
out = Path(args.output)
out.mkdir(parents=True, exist_ok=True)
root = Path(__file__).resolve().parent.parent
draft = json.loads((root / "content/locales/en-home-redesign.json").read_text())
source = BeautifulSoup((root / "content/reviews.html").read_text(), "html.parser")
ids = ["kirkus-2026", "booklife-2026", "consciousness-2026"]
quotes = [draft[f"reviews.redesign.{name}Quote"] for name in ("kirkus", "booklife", "consciousness")]
urls = [source.select_one(f'[data-review-id="{id}"] .review__link')["href"] for id in ids]
phones = [(320, 568), (360, 640), (375, 667), (390, 844), (393, 852),
          (412, 915), (414, 896), (430, 932), (440, 956)]
viewports = phones + [(h, w) for w, h in phones] + [
    (600, 800), (759, 1024), (760, 1024), (761, 1024),
    (768, 1024), (820, 1180), (834, 1194), (899, 1024),
    (900, 1024), (901, 1024), (1024, 768), (1279, 800),
    (1280, 800), (1281, 800), (1440, 1000), (1800, 1000),
]
results, errors = [], []

geometry_check = """() => {
  const issues = [];
  const region = document.querySelector('#reviews');
  const bounds = region.getBoundingClientRect();
  const container = region.querySelector('.container').getBoundingClientRect();
  const hero = document.querySelector('.hero-redesign__grid').getBoundingClientRect();
  const visible = el => getComputedStyle(el).visibility !== 'hidden' && el.getClientRects().length;
  if (document.documentElement.scrollWidth > innerWidth + 1) issues.push('Horizontal page overflow');
  if (Math.abs(container.left - hero.left) > 1 || Math.abs(container.right - hero.right) > 1)
    issues.push('Review and hero containers misaligned');
  for (const slide of region.querySelectorAll('[data-review-id]')) {
    if (!visible(slide)) continue;
    const publisher = slide.querySelector('.review-strip__publisher').getBoundingClientRect();
    const quote = slide.querySelector('blockquote').getBoundingClientRect();
    const reading = slide.querySelector('.review-strip__reading').getBoundingClientRect();
    if (innerWidth > 900) {
      if (publisher.right > quote.left || quote.right > reading.left)
        issues.push('Desktop columns overlap or are out of order');
    } else if (publisher.right > reading.left || quote.top < Math.max(publisher.bottom, reading.bottom) - 1) {
      issues.push('Mobile publisher/link row overlaps quote');
    }
    for (const el of slide.querySelectorAll('cite, .review-strip__type, blockquote p, a')) {
      const box = el.getBoundingClientRect();
      if (box.left < container.left - 1 || box.right > container.right + 1 ||
          box.top < bounds.top - 1 || box.bottom > bounds.bottom + 1)
        issues.push(`${el.className}: outside section/container`);
      const range = document.createRange();
      // Exclude the intentionally clipped screen-reader hint.
      for (const child of el.childNodes) {
        if (child.nodeType === 1 && child.classList.contains('reviews__sr-only')) continue;
        range.selectNode(child);
        for (const line of range.getClientRects()) {
          if (line.left < box.left - 1 || line.right > box.right + 1)
            issues.push(`${el.className}: text clipped or overflowing`);
        }
      }
    }
  }
  for (const target of region.querySelectorAll('a, button')) {
    if (!visible(target)) continue;
    const box = target.getBoundingClientRect();
    if (box.width < 44 || box.height < 44) issues.push('Touch target smaller than 44px');
    if (box.bottom > bounds.bottom + 1) issues.push('Control outside review strip');
  }
  const counter = region.querySelector('.reviews__counter');
  if (visible(counter)) {
    const box = counter.getBoundingClientRect();
    if (box.width < 30 || box.height < 10) issues.push('Review count is visually hidden');
    if (box.left < container.left - 1 || box.right > container.right + 1)
      issues.push('Review count outside container');
    const previous = region.querySelector('[data-review-prev]').getBoundingClientRect();
    const next = region.querySelector('[data-review-next]').getBoundingClientRect();
    if (box.right > previous.left || previous.right > next.left)
      issues.push('Pagination controls overlap');
  }
  return {issues, height: bounds.height};
}"""


def record(page, browser, viewport, slide, enlarged=False):
    report = page.evaluate(geometry_check)
    if not enlarged and viewport[0] >= 1280 and report["height"] > 240:
        report["issues"].append("Desktop strip lost the prototype's compact height")
    errors.extend(f"{browser} {viewport} slide {slide}: {issue}" for issue in report["issues"])
    if report["issues"]:
        print(f"{browser} {viewport} slide {slide}: {report['issues']}", flush=True)
    results.append({"browser": browser, "viewport": viewport, "slide": slide,
                    "enlarged": enlarged, **report})
    return report["height"]


def current(page):
    return page.locator("[data-review-id]:visible").get_attribute("data-review-id")


def select_review(page, index, touch=False):
    for _ in range((index - ids.index(current(page))) % len(ids)):
        button = page.locator("[data-review-next]")
        button.tap() if touch else button.click()


def finish_fade(page):
    page.locator("#reviews").evaluate("(el) => el.getAnimations({subtree: true}).forEach(a => a.finish())")


def swipe(page, dx, dy):
    # Synthetic pointer sequences cover the gesture logic on all three engines.
    # Chromium additionally receives a real emulated touch sequence below.
    track = page.locator(".reviews__slides")
    event = {"pointerId": 42, "isPrimary": True, "pointerType": "touch", "clientX": 200, "clientY": 300}
    track.dispatch_event("pointerdown", event)
    track.dispatch_event("pointermove", {**event, "clientX": 200 + dx, "clientY": 300 + dy})
    track.dispatch_event("pointerup", {**event, "clientX": 200 + dx, "clientY": 300 + dy})


with sync_playwright() as playwright:
    for name in args.browsers:
        options = {"headless": True}
        if name == "chromium":
            options["args"] = ["--no-sandbox"]
            if args.chromium_executable:
                options["executable_path"] = args.chromium_executable
        browser = getattr(playwright, name).launch(**options)
        context = browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True)
        context.route("**/*", lambda r: r.continue_() if r.request.url.startswith(base + "/") else r.abort())
        page = context.new_page()
        page.on("pageerror", lambda error: errors.append(f"{name}: {error}"))
        page.goto(base + "/", wait_until="networkidle")
        page.wait_for_function("document.fonts.status === 'loaded'")
        assert page.locator("[data-review-id]").count() == 3
        assert page.locator(".review-strip__name").all_text_contents() == [
            "Kirkus Reviews", "BookLife", "The Consciousness AI"]
        assert page.evaluate("""() => [...document.fonts].some(f =>
            f.family.replaceAll('"', '') === 'Playfair Display' && f.weight === '700' && f.status === 'loaded')""")
        previous = page.get_by_role("button", name="Previous review", exact=True)
        next_button = page.get_by_role("button", name="Next review", exact=True)
        assert previous.is_enabled() and next_button.is_enabled()
        assert page.locator("[data-review-select]").count() == 0
        for width, height in viewports:
            page.set_viewport_size({"width": width, "height": height})
            heights = []
            for index, review_id in enumerate(ids):
                select_review(page, index, touch=True)
                finish_fade(page)
                assert current(page) == review_id
                slide = page.locator("[data-review-id]:visible")
                assert slide.locator("blockquote p").inner_text() == f"“{quotes[index]}”"
                link = slide.locator("[data-review-source]")
                assert link.get_attribute("href") == urls[index]
                assert link.locator("[data-i18n='reviews.redesign.fullArticle']").inner_text() == "Full article"
                assert slide.locator("blockquote").get_attribute("cite") == urls[index]
                assert page.locator(".reviews__counter").inner_text() == f"{index + 1} of 3"
                assert page.locator('[data-review-id][hidden][inert][aria-hidden="true"]').count() == 2
                heights.append(record(page, name, [width, height], index))
                if width in (320, 390, 768, 901, 1440) and height >= 568:
                    page.locator("#reviews").screenshot(path=str(out / f"{name}-{width}-{index}.png"))
            assert max(heights) - min(heights) < 1, (name, width, heights)

        page.set_viewport_size({"width": 390, "height": 844})
        previous.focus()
        for key, index in [("Home", 0), ("ArrowLeft", 2), ("ArrowRight", 0), ("End", 2), ("Home", 0)]:
            page.keyboard.press(key)
            assert current(page) == ids[index]
            assert previous.evaluate("(el) => el === document.activeElement")
            assert page.locator(".reviews__status").inner_text() == f"Review {index + 1} of 3"
        page.keyboard.press("Tab")
        assert next_button.evaluate("(el) => el === document.activeElement")
        page.keyboard.press("Space")
        assert current(page) == ids[1]
        previous.click()
        assert current(page) == ids[0]
        previous.tap()
        assert current(page) == ids[2], "Previous should wrap from the first review"
        next_button.tap()
        assert current(page) == ids[0], "Next should wrap from the last review"
        page.locator("[data-review-id]:visible a").focus()
        for key in ("ArrowRight", "ArrowLeft", "Home", "End"):
            page.keyboard.press(key)
            assert current(page) == ids[0], "Article links must keep native key behavior"
            assert page.locator("[data-review-id]:visible a").evaluate("el => el === document.activeElement")
        next_button.focus()
        page.keyboard.press("ArrowRight")
        assert current(page) == ids[1]
        swipe(page, -100, 5)
        assert current(page) == ids[2]
        swipe(page, 100, 80)
        assert current(page) == ids[2], "Vertical scroll changed the review"
        swipe(page, 100, 5)
        assert current(page) == ids[1]
        page.locator("[data-review-id]:visible a").focus()
        # Hidden article links must never enter the tab sequence.
        page.keyboard.press("Tab")
        assert previous.evaluate("(el) => el === document.activeElement")

        if name == "chromium":
            select_review(page, 0, touch=True)
            quote = page.locator("[data-review-id]:visible blockquote")
            quote.scroll_into_view_if_needed()
            box = quote.bounding_box()
            x, y = box["x"] + box["width"] * .8, box["y"] + 10
            cdp = context.new_cdp_session(page)
            cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x, "y": y}]})
            for delta in (25, 55, 90, 120):
                cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": x - delta, "y": y}]})
            cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
            assert current(page) == ids[1], "Emulated horizontal touch swipe failed"
            cdp.detach()

        page.emulate_media(reduced_motion="reduce")
        select_review(page, 2)
        assert page.locator("#reviews").evaluate("(el) => el.getAnimations({subtree: true}).length") == 0
        page.add_style_tag(content="html { font-size: 200%; }")
        for width in (320, 390, 768, 1440):
            page.set_viewport_size({"width": width, "height": 1000})
            for index in range(3):
                select_review(page, index)
                record(page, name, [width, 1000], index, enlarged=True)
            if width == 320:
                page.locator("#reviews").screenshot(path=str(out / f"{name}-200-percent.png"))

        for locale in ("de", "fa", "ar"):
            page.goto(f"{base}/{locale}/", wait_until="networkidle")
            assert page.locator(".reviews--compact").count() == 0
            assert page.locator('html').get_attribute("dir") == ("ltr" if locale == "de" else "rtl")
            page.locator("[data-review-next]").click()
            assert current(page) == ids[1]
            page.locator("[data-review-prev]").click()
            assert current(page) == ids[0]

        nojs = browser.new_context(java_script_enabled=False, viewport={"width": 320, "height": 568})
        nojs.route("**/*", lambda r: r.continue_() if r.request.url.startswith(base + "/") else r.abort())
        fallback = nojs.new_page()
        fallback.goto(base + "/", wait_until="networkidle")
        assert fallback.locator("[data-review-id]:visible").count() == 3
        assert not fallback.locator(".reviews__controls").is_visible()
        assert fallback.locator("[data-review-source]:visible").count() == 3
        record(fallback, name, [320, 568], "no-js")
        nojs.close()
        context.close()
        print(f"{name} {browser.version}: 102 slide/viewports, enlarged text, interactions, RTL and no-JS complete.", flush=True)
        browser.close()

(out / "results.json").write_text(json.dumps({"checks": results, "errors": errors}, indent=2) + "\n")
print(json.dumps({"checks": len(results), "errors": errors, "screenshots": str(out)}, indent=2))
if errors:
    raise SystemExit(1)
