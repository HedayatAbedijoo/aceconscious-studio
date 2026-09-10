#!/usr/bin/env python3
"""Browser checks and screenshot capture for the local review previews.

Build previews with preview-reviews.py --build-only, then use any static server.
Run with a Python environment containing Playwright:
  python scripts/check-review-previews.py [--base http://127.0.0.1:8765]
Screenshots and the QA report are written to /tmp/ace-review-previews by default.
"""
import argparse
import json
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--base", default="http://127.0.0.1:8765")
parser.add_argument("--output", default="/tmp/ace-review-previews")
parser.add_argument("--website", action="store_true", help="Check the integrated Design A on the real homepages; use previews only for extra-review fixtures")
args = parser.parse_args()
output = Path(args.output)
output.mkdir(parents=True, exist_ok=True)
results = []
layouts = ("split",) if args.website else ("split", "masthead")


def check(condition, description):
    if not condition:
        raise AssertionError(description)


def visit(page, language="en", layout="split", examples=False):
    name = ("index" if layout == "split" else "masthead") + ("-examples" if examples else "")
    path = "/" if language == "en" else f"/{language}/"
    if not args.website or examples:
        path = f"/previews/reviews/view/{language}/{name}.html"
    response = page.goto(f"{args.base}{path}#reviews", wait_until="domcontentloaded")
    if response is None:
        response = page.reload(wait_until="domcontentloaded")
    check(response.status == 200, "Preview HTML loads from a static route")
    page.wait_for_function("window.aceI18n && document.documentElement.lang === " + json.dumps(language))
    page.evaluate("document.fonts.ready")
    page.locator("#reviews").scroll_into_view_if_needed()


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=shutil.which("google-chrome") or None)
    context = browser.new_context(device_scale_factor=1)
    # The flipbook is unrelated to review rendering and can delay page loads.
    context.route("**/*heyzine.com/**", lambda route: route.abort())
    page = context.new_page()
    errors = []
    local_failures = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("response", lambda response: local_failures.append(response.url) if response.url.startswith(args.base + "/previews/reviews/") and response.status >= 400 else None)

    for language in ("en", "de", "fa"):
        for layout in layouts:
            page.set_viewport_size({"width": 320, "height": 1000})
            visit(page, language, layout, True)
            page.add_style_tag(content="html { font-size: 200%; }")
            overflow = page.locator("#reviews").evaluate("""section => [...section.querySelectorAll('*')].filter(el => {
              if (!el.getClientRects().length || el.classList.contains('reviews__sr-only')) return false;
              const r = el.getBoundingClientRect();
              return r.left < -1 || r.right > innerWidth + 1 || (!el.children.length && el.scrollWidth > el.clientWidth + 2);
            }).map(el => el.className || el.tagName)""")
            check(not overflow, f"200% text reflow: {language}/{layout}: {overflow}")
            results.append(f"200% text: {language}/{layout}")

    for language in ("en", "de", "fa"):
        for layout in layouts:
            for width in (320, 390, 768, 1024, 1440):
                page.set_viewport_size({"width": width, "height": 1000})
                visit(page, language, layout)
                section = page.locator("#reviews")
                check(section.count() == 1, "One review section")
                check(page.locator(".reviews__controls").is_visible(), "Single review shows the carousel count")
                check(page.locator(".reviews__counter").inner_text() == {"en": "1 of 2", "de": "1 von 2", "fa": "1 از 2"}[language], "Localized 1 of 2 counter")
                check(page.locator("[data-review-prev]").is_enabled() and page.locator("[data-review-next]").is_enabled(), "Two reviews enable navigation")
                check(page.locator("[data-review-id]:visible").count() == 1, "Single review visible")
                check(page.locator(".review__rating strong").inner_text() == "7.5", "Correct overall score")
                check(page.locator(".review__scores dd").all_inner_texts() == ["8", "8", "7", "7"], "Correct category scores")
                check(page.locator("[data-review-id=booklife-2026] .review__link").get_attribute("href") == "https://booklife.com/project/ace-await-110051", "Verified public source URL")
                check(page.locator(".review__source").inner_text() == "The BookLife Prize", "Required attribution")
                if layout == "split":
                    check(page.locator(".review__overall .review__source").count() == 1, "Source remains beside score")
                    check(page.locator(".review__footer .review__report, .review__footer .review__source").count() == 0, "No duplicate source block")
                check(page.locator("html").get_attribute("dir") == ("rtl" if language == "fa" else "ltr"), "Language direction")
                check(page.locator(".review__translation").is_visible() == (language != "en"), "Translation attribution")
                geometry = section.evaluate("""section => {
                  const box = section.getBoundingClientRect();
                  const overflow = [...section.querySelectorAll('*')].filter(el => {
                    if (!el.getClientRects().length || el.classList.contains('reviews__sr-only')) return false;
                    const r = el.getBoundingClientRect();
                    const textOverflow = !el.children.length && el.scrollWidth > el.clientWidth + 2;
                    return r.left < box.left - 1 || r.right > box.right + 1 || textOverflow;
                  }).map(el => el.className || el.tagName);
                  const rect = cls => { const r = section.querySelector(cls).getBoundingClientRect(); return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}; };
                  return {overflow, quote:rect('.review__quotes'), overall:rect('.review__overall'), categories:rect('.review__categories'), excerpt:rect('.review__excerpt'), footer:rect('.review__footer')};
                }""")
                check(not geometry["overflow"], f"No overflow: {language}/{layout}/{width}: {geometry['overflow']}")
                if width <= 900:
                    order = ["quote", "overall", "categories", "excerpt", "footer"] if layout == "split" else ["overall", "quote", "categories", "excerpt", "footer"]
                    check(all(geometry[a]["bottom"] <= geometry[b]["top"] + 1 for a, b in zip(order, order[1:])), f"Correct mobile order: {language}/{layout}/{width}")
                check(section.evaluate("el => el.nextElementSibling?.id === 'voices'"), "Reviews immediately before Voices")
                check(page.locator('.site-nav__links a').evaluate_all("links => links.slice(0, 3).map(link => link.hash)") == ["#reviews", "#voices", "#sample"], "Navigation follows section order")
                if args.website:
                    check(page.locator('script[src*="/previews/"]').count() == 0, "No preview scripts on homepage")
                    if width > 900:
                        check(page.locator(".site-nav__inner").evaluate("""el => {
                          const boxes = [...el.children].map(child => child.getBoundingClientRect()).sort((a,b) => a.left-b.left);
                          return boxes.every((r,i) => r.left >= -1 && r.right <= innerWidth+1 && (!i || boxes[i-1].right <= r.left+1));
                        }"""), f"Navigation fits with Reviews link: {language}/{width}")
                if width in (390, 1440):
                    section.screenshot(path=str(output / f"{layout}-{language}-{width}.png"))
                results.append(f"Responsive: {language}/{layout}/{width}")

    for language in ("en", "de", "fa"):
        for layout in layouts:
            page.set_viewport_size({"width": 390, "height": 1000})
            visit(page, language, layout, True)
            check(page.locator("[data-review-id]").count() == 4, "Two reviews and two fixture slides")
            check(page.locator(".reviews__controls").is_visible(), "Multiple reviews expose controls")
            for selector in ("[data-review-prev]", "[data-review-next]"):
                box = page.locator(selector).bounding_box()
                check(box["width"] >= 44 and box["height"] >= 44, "44px touch targets")
            page.locator("[data-review-next]").click()
            media = page.locator("[data-review-id='consciousness-2026']")
            check(media.is_visible(), "Media review occupies second position")
            check(media.locator("blockquote").count() == 3, "Both short quotes and the supplied paragraph are present")
            check(media.locator(".media-review__excerpt strong").count() == 1, "Ethical question keeps bold emphasis")
            check(media.locator(".review__rating, .review__scores").count() == 0, "Media review has no rating")
            check(media.locator(".media-review__logo").evaluate("img => img.complete && img.naturalWidth > 0"), "Official publisher logo loads")
            check(media.locator(".media-review__excerpt p").inner_text() == page.evaluate("window.aceI18n.getString('reviews.consciousness.excerpt').replace(/<[^>]*>/g, '')"), "Excerpt matches the selected language")
            page.locator("[data-review-next]").click()
            check(page.locator("[data-review-id='preview-short']").is_visible(), "Next shows unscored fixture")
            check(page.locator("[data-review-id='booklife-2026']").evaluate("el => el.inert && el.hidden && el.getAttribute('aria-hidden') === 'true'"), "Inactive slide is inaccessible")
            check(page.locator(".reviews__status").inner_text(), "Accessible slide announcement")
            check(page.locator("[data-review-next]").evaluate("el => el === document.activeElement"), "Button retains focus")
            page.keyboard.press("ArrowLeft" if language == "fa" else "ArrowRight")
            check(page.locator("[data-review-id='preview-long']").is_visible(), "Localized arrow-key navigation")
            check(page.locator("[data-review-id='preview-long'] .review__excerpt").evaluate("el => el.scrollHeight <= el.clientHeight + 1"), "Long excerpt not clipped")
            page.locator("[data-review-next]").click()
            check(page.locator("[data-review-id='booklife-2026']").is_visible(), "Next wraps to first")
            page.locator("[data-review-prev]").click()
            check(page.locator("[data-review-id='preview-long']").is_visible(), "Previous wraps to last")
            page.keyboard.press("Home")
            check(page.locator("[data-review-id='booklife-2026']").is_visible(), "Home selects first")
            page.keyboard.press("End")
            check(page.locator("[data-review-id='preview-long']").is_visible(), "End selects last")
            page.keyboard.press("Home")
            # Actual touch input through Chromium, rather than calling the controller.
            client = context.new_cdp_session(page)
            box = page.locator(".review__headline").first.bounding_box()
            y = max(130, box["y"] + 30)
            start, end = (70, 300) if language == "fa" else (300, 70)
            client.send("Input.dispatchTouchEvent", {"type":"touchStart", "touchPoints":[{"x":start,"y":y}]})
            for i in range(1, 6):
                client.send("Input.dispatchTouchEvent", {"type":"touchMove", "touchPoints":[{"x":start+(end-start)*i/5,"y":y}]})
            client.send("Input.dispatchTouchEvent", {"type":"touchEnd", "touchPoints":[]})
            check(page.locator("[data-review-id='consciousness-2026']").is_visible(), "Real touch swipe navigates to the second review")
            client.detach()
            results.append(f"Carousel, keyboard, touch: {language}/{layout}")

    page.emulate_media(reduced_motion="reduce")
    visit(page, examples=True)
    page.locator("[data-review-next]").click()
    check(page.locator("[data-review-id='preview-short']").evaluate("el => el.getAnimations().length === 0"), "Reduced motion disables animation")
    results.append("Reduced motion")

    page.set_viewport_size({"width": 390, "height": 1000})
    page.goto(args.base + "/previews/reviews/", wait_until="domcontentloaded")
    page.locator("[data-layout='masthead']").click()
    page.locator("[data-language='fa']").click()
    frame = page.frame_locator("#preview-frame")
    check(frame.locator(".reviews--masthead").count() == 1, "Comparison selects B")
    frame.locator("html[lang='fa']").wait_for()
    page.locator("#preview-content").select_option("examples")
    frame.locator(".reviews__controls").wait_for(state="visible")
    page.locator("#preview-width").select_option("320")
    check(page.locator("#preview-frame").bounding_box()["width"] == 320, "Phone width control")
    check(page.locator("body").evaluate("el => el.scrollWidth <= innerWidth"), "Comparison UI does not overflow")
    results.append("Comparison controls and mobile toolbar")

    if args.website:
        page.set_viewport_size({"width": 390, "height": 1000})
        visit(page)
        page.locator(".nav-toggle").click()
        page.locator('[data-i18n="nav.reviews"]').click()
        check(page.url.endswith("/#reviews"), "Reviews menu links to real section")
        check(page.locator(".nav-toggle").get_attribute("aria-expanded") == "false", "Mobile menu closes after navigation")
        for language in ("de", "fa", "en"):
            page.locator(f'[data-set-lang="{language}"]').click()
            page.wait_for_url(args.base + ("/" if language == "en" else f"/{language}/") + "#reviews")
            page.locator(".reviews__controls").wait_for(state="visible")
            check(page.locator("html").get_attribute("lang") == language, "Language switch keeps Reviews anchor")
        page.goto(args.base + "/404.html#reviews", wait_until="domcontentloaded")
        check(page.locator("#reviews").count() == 1, "Fallback homepage includes Reviews")
        check(page.locator(".reviews__counter").inner_text() == "1 of 2", "Fallback counter")
        results.append("Website navigation, locale switching, fallback page")

    nojs = browser.new_context(java_script_enabled=False, viewport={"width":390,"height":1000})
    nojs.route("**/*heyzine.com/**", lambda route: route.abort())
    static = nojs.new_page()
    static.goto(args.base + "/previews/reviews/view/en/index-examples.html#reviews", wait_until="domcontentloaded")
    check(static.locator("[data-review-id]:visible").count() == 4, "No-JS keeps all reviews visible")
    check(static.locator("[data-review-prev]").is_disabled() and static.locator("[data-review-next]").is_disabled(), "No-JS keeps navigation disabled")
    check(static.locator(".reviews__counter").inner_text() == "1 of 4", "No-JS fallback count matches articles")
    if args.website:
        static.goto(args.base + "/#reviews", wait_until="domcontentloaded")
        check(static.locator(".reviews__counter").inner_text() == "1 of 2", "No-JS website shows 1 of 2")
        check(static.locator(".review__link").count() == 2 and static.locator("[data-review-id]:visible").count() == 2, "No-JS keeps both reviews readable")
    results.append("No-JavaScript fallback")
    check(not errors, f"No browser errors: {errors}")
    check(not local_failures, f"No failed preview requests: {local_failures}")
    browser.close()

(output / "qa-report.json").write_text(json.dumps({"passed": results, "screenshots": sorted(p.name for p in output.glob("*.png"))}, indent=2))
print(f"Passed {len(results)} checks. Screenshots and report: {output}")
