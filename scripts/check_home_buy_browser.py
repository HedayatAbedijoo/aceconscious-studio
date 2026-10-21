#!/usr/bin/env python3
"""Responsive English purchase QA. Requires Playwright and a local preview server."""
import argparse
import json
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--base", default="http://127.0.0.1:8765")
parser.add_argument("--chromium-executable")
parser.add_argument("--browsers", nargs="+", default=["chromium", "webkit", "firefox"])
parser.add_argument("--output", default="/tmp/ace-buy-qa")
args = parser.parse_args()
base = args.base.rstrip("/")
out = Path(args.output)
out.mkdir(parents=True, exist_ok=True)
phones = [(320, 568), (360, 640), (375, 667), (390, 844), (393, 852),
          (412, 915), (414, 896), (430, 932), (440, 956)]
viewports = phones + [(h, w) for w, h in phones] + [
    (600, 800), (759, 1024), (760, 1024), (761, 1024),
    (768, 1024), (820, 1180), (834, 1194), (899, 1024),
    (900, 1024), (901, 1024), (1024, 768), (1279, 800),
    (1280, 800), (1281, 800), (1440, 1000), (1800, 1000),
]
markets = {
    "us": "amazon.com", "uk": "amazon.co.uk", "de": "amazon.de",
    "ca": "amazon.ca", "au": "amazon.com.au", "fr": "amazon.fr",
    "es": "amazon.es", "it": "amazon.it", "nl": "amazon.nl",
    "pl": "amazon.pl", "se": "amazon.se", "be": "amazon.com.be", "ie": "amazon.ie",
    "jp": "amazon.co.jp", "in": "amazon.in", "br": "amazon.com.br", "mx": "amazon.com.mx",
}
# Exact format availability from the user's 2026-10-21 KDP pricing PDFs.
supported_markets = {
    "kindle": set(markets) - {"pl", "se", "be", "ie"},
    "paperback": set(markets) - {"in", "br", "mx"},
}
edition_ids = {"kindle": "B0H8MDM6Q5", "paperback": "391300601X"}
edition_links = {"kindle": "#buy-amazon", "paperback": "#buy-paperback"}
countries = {
    "us": "United States", "uk": "United Kingdom", "de": "Germany", "ca": "Canada",
    "au": "Australia", "fr": "France", "es": "Spain", "it": "Italy", "nl": "Netherlands",
    "pl": "Poland", "se": "Sweden", "be": "Belgium", "ie": "Ireland", "jp": "Japan",
    "in": "India", "br": "Brazil", "mx": "Mexico",
}
market_labels = {
    code: (
        "".join(chr(0x1F1E6 + ord(char) - ord("A")) for char in ("GB" if code == "uk" else code.upper()))
        + f" {countries[code]} · {domain.replace('amazon', 'Amazon')}"
    ) for code, domain in markets.items()
}
results, errors = [], []

geometry = """() => {
  const issues = [];
  const section = document.querySelector('#buy');
  const bounds = section.getBoundingClientRect();
  const layout = section.querySelector('.edition-layout');
  const grid = layout.getBoundingClientRect();
  const direct = section.querySelector('.edition-card--direct').getBoundingClientRect();
  const amazon = section.querySelector('.edition-amazon').getBoundingClientRect();
  const marketplace = section.querySelector('.edition-marketplace').getBoundingClientRect();
  const cards = [...section.querySelectorAll('.edition-card--amazon')].map(el => el.getBoundingClientRect());
  if (document.documentElement.scrollWidth > innerWidth + 1) issues.push('Horizontal page overflow');
  if (innerWidth > 900) {
    if (direct.right > amazon.left || Math.abs(direct.top - amazon.top) > 1 ||
        Math.abs(direct.bottom - amazon.bottom) > 1) issues.push('Desktop columns overlap or are misaligned');
  } else if (direct.bottom > amazon.top || Math.abs(direct.left - amazon.left) > 1) {
    issues.push('Mobile cards are not stacked cleanly');
  }
  if (marketplace.bottom > cards[0].top + 1 || cards[0].bottom > cards[1].top + 1)
    issues.push('Amazon selector/cards overlap or are out of order');
  if (marketplace.left < amazon.left || marketplace.right > amazon.right)
    issues.push('Marketplace is outside the Amazon group');
  for (const selector of ['.hero-redesign__grid', '#reviews > .container']) {
    const reference = document.querySelector(selector).getBoundingClientRect();
    if (Math.abs(grid.left - reference.left) > 1 || Math.abs(grid.right - reference.right) > 1)
      issues.push(`Misaligned with ${selector}`);
  }
  const visible = el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
  for (const el of section.querySelectorAll('h2, h3, p, label, li, a, select, .edition-format-note, .edition-marketplace__default, .edition-marketplace__value, .edition-marketplace__identity, .edition-marketplace__domain')) {
    if (!visible(el) || el.classList.contains('edition-sr-only')) continue;
    const box = el.getBoundingClientRect();
    if (box.left < grid.left - 1 || box.right > grid.right + 1 ||
        box.top < bounds.top - 1 || box.bottom > bounds.bottom + 1)
      issues.push(`${el.className}: outside section/container`);
    if (el.matches('a, select') && (box.height < 44 || box.width < 44))
      issues.push(`${el.className}: touch target smaller than 44px`);
    if (el.tagName === 'SELECT') continue; // Native picker renders its own option list.
    const range = document.createRange();
    for (const node of el.childNodes) {
      if (node.nodeType === 1 && node.classList.contains('edition-sr-only')) continue;
      range.selectNode(node);
      for (const line of range.getClientRects()) {
        if (line.left < box.left - 1 || line.right > box.right + 1)
          issues.push(`${el.className}: text clipped`);
      }
    }
  }
  return {issues, height: bounds.height,
    columns: getComputedStyle(layout).gridTemplateColumns.split(' ').length};
}"""


def record(page, name, viewport, state):
    report = page.evaluate(geometry)
    errors.extend(f"{name} {viewport} {state}: {issue}" for issue in report["issues"])
    results.append({"browser": name, "viewport": viewport, "state": state, **report})
    if report["issues"]:
        print(errors[-len(report["issues"]):], flush=True)


def check_links(page, code):
    for edition, selector in edition_links.items():
        link = page.locator(selector)
        label = link.locator("[data-amazon-action]")
        icon = link.locator('[aria-hidden="true"]')
        newtab = link.locator(".edition-sr-only")
        if code in supported_markets[edition]:
            url = urlsplit(link.get_attribute("href"))
            assert url.scheme == "https" and url.netloc == "www." + markets[code]
            assert url.path == "/dp/" + edition_ids[edition]
            assert link.get_attribute("aria-disabled") is None
            assert link.get_attribute("tabindex") is None
            assert label.inner_text() == "View on Amazon"
            assert icon.get_attribute("hidden") is None and newtab.get_attribute("hidden") is None
            assert newtab.get_attribute("id") in link.get_attribute("aria-labelledby").split()
        else:
            assert link.get_attribute("href") is None, "Unsupported editions must not link to another market"
            assert link.get_attribute("aria-disabled") == "true"
            assert link.get_attribute("tabindex") == "-1"
            assert label.inner_text() == "Not available here"
            assert icon.get_attribute("hidden") is not None and newtab.get_attribute("hidden") is not None
            assert newtab.get_attribute("id") not in link.get_attribute("aria-labelledby").split()
    assert page.locator("#buy-direct").get_attribute("href") == "https://payhip.com/"


def check_selection(page, code):
    assert page.locator("#amazon-marketplace option:checked").text_content() == market_labels[code]
    identity, domain = market_labels[code].split(" · ")
    assert page.locator("[data-marketplace-identity]").text_content() == identity
    assert page.locator("[data-marketplace-domain]").text_content() == "· " + domain
    assert page.locator(".edition-marketplace__value").get_attribute("aria-hidden") == "true"


with sync_playwright() as playwright:
    for name in args.browsers:
        options = {"headless": True}
        if name == "chromium":
            options["args"] = ["--no-sandbox"]
            if args.chromium_executable:
                options["executable_path"] = args.chromium_executable
        browser = getattr(playwright, name).launch(**options)
        context = browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True)
        destinations = []

        def route_request(route):
            url = route.request.url
            if url.startswith(base + "/"):
                route.continue_()
            elif route.request.is_navigation_request() and urlsplit(url).hostname in (
                {"payhip.com"} | {"www." + domain for domain in markets.values()}
            ):
                # Exercise new-tab navigation without contacting retailers or checkout services.
                # Ignore unrelated lazy iframe navigation from Sample Chapters.
                destinations.append(url)
                route.fulfill(status=200, content_type="text/html", body="<title>QA destination</title>")
            else:
                route.abort()

        context.route("**/*", route_request)
        page = context.new_page()
        page.on("pageerror", lambda error: errors.append(f"{name}: {error}"))
        page.goto(base + "/", wait_until="networkidle")
        page.wait_for_function("document.fonts.status === 'loaded'")
        assert page.locator("#buy").count() == 1
        assert page.locator("#reviews + #buy + #synopsis").count() == 1
        assert page.locator("#buy > .edition-layout > *").count() == 2
        assert page.locator("#buy .section-label, #buy .section-title, #buy .section-lead").count() == 0
        assert page.locator("#buy h2").all_text_contents() == ["Buy the Novel"]
        assert page.locator("#buy h3").all_text_contents() == ["The digital edition.", "Kindle eBook", "Paperback"]
        assert page.locator(".edition-card--direct .edition-description").inner_text() == (
            "One purchase. Two open formats. Read on your phone, tablet, computer, or an EPUB-compatible e-reader.")
        select = page.get_by_label("Amazon Marketplace", exact=True)
        assert select.input_value() == "us"
        assert select.locator("option").evaluate_all("(els) => els.map(el => el.value)") == list(markets)
        assert select.locator("option").all_text_contents() == list(market_labels.values())
        check_selection(page, "us")
        for link in page.locator("#buy a").all():
            assert link.get_attribute("target") == "_blank"
            assert {"noopener", "noreferrer"} <= set(link.get_attribute("rel").split())
        for width, height in viewports:
            page.set_viewport_size({"width": width, "height": height})
            for code in ("us", "uk", "be"):
                select.select_option(code)
                check_links(page, code)
                check_selection(page, code)
                record(page, name, [width, height], code)
            select.select_option("us")
            if width in (320, 390, 768, 900, 901, 1440) and height >= 568:
                # Fit the complete section in a taller viewport for its
                # component capture, keeping the tested width unchanged.
                capture_height = max(height, int(page.locator("#buy").bounding_box()["height"]) + 180)
                page.set_viewport_size({"width": width, "height": capture_height})
                page.locator("#buy").evaluate("""el => window.scrollTo({
                    top: scrollY + el.getBoundingClientRect().top - 100, behavior: 'instant'})""")
                page.locator("#buy").screenshot(path=str(out / f"{name}-{width}.png"))
                page.set_viewport_size({"width": width, "height": height})
        for width in (320, 1440):
            page.set_viewport_size({"width": width, "height": 1000})
            for code in markets:
                select.select_option(code)
                check_links(page, code)
                check_selection(page, code)
                record(page, name, [width, 1000], code + "-full-label")
            select.select_option("uk")
            page.locator("[data-marketplace-control]").screenshot(path=str(out / f"{name}-{width}-selection.png"))
        assert len(context.pages) == 1 and not destinations, "Selecting a country opened a destination"
        page.set_viewport_size({"width": 390, "height": 844})
        select.select_option("us")
        page.locator("#buy-direct").focus()
        for selector in ("#amazon-marketplace", "#buy-amazon", "#buy-paperback"):
            page.keyboard.press("Tab")
            assert page.locator(selector).evaluate("(el) => el === document.activeElement")
        select.focus()
        assert page.locator("[data-marketplace-control]").evaluate(
            "el => parseFloat(getComputedStyle(el).outlineWidth) >= 2")
        page.keyboard.press("ArrowDown")
        page.keyboard.press("Enter")
        assert select.input_value() == "uk", (name, "Keyboard marketplace selection failed")
        check_links(page, "uk")
        check_selection(page, "uk")
        # The real native select remains the touch target, including its arrow area.
        select.tap()
        page.keyboard.press("Escape")
        assert select.input_value() == "uk"

        for selector, url, keyboard in [
            ("#buy-direct", "https://payhip.com/", True),
            ("#buy-amazon", "https://www.amazon.co.uk/dp/B0H8MDM6Q5", False),
            ("#buy-paperback", "https://www.amazon.co.uk/dp/391300601X", False),
        ]:
            with page.expect_popup() as opened:
                if keyboard:
                    page.locator(selector).focus()
                    page.keyboard.press("Enter")
                else:
                    page.locator(selector).tap()
            popup = opened.value
            popup.wait_for_load_state()
            assert popup.url == url and popup.evaluate("window.opener === null")
            popup.close()
        assert len(destinations) == 3
        assert page.url == base + "/"

        # Exercise every supported edition URL, including restoration after a
        # disabled state. No requests reach Amazon or send a purchase request.
        for code in markets:
            select.select_option(code)
            check_links(page, code)
            for edition, selector in edition_links.items():
                if code in supported_markets[edition]:
                    with page.expect_popup() as opened:
                        page.locator(selector).tap()
                    popup = opened.value
                    popup.wait_for_load_state()
                    assert popup.url == f"https://www.{markets[code]}/dp/{edition_ids[edition]}"
                    assert popup.evaluate("window.opener === null")
                    popup.close()
                else:
                    previous = len(destinations)
                    page.locator(selector).tap(force=True)
                    assert len(context.pages) == 1 and len(destinations) == previous
        assert len(destinations) == 30  # Direct/UK checks above, plus 27 KDP destinations.
        for code, first_link in (("be", "#buy-paperback"), ("in", "#buy-amazon")):
            select.select_option(code)
            select.focus()
            page.keyboard.press("Tab")
            assert page.locator(first_link).evaluate("el => el === document.activeElement")
        select.select_option("pl")
        page.evaluate("window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: true}))")
        check_links(page, "pl")
        select.select_option("us")
        check_links(page, "us")

        # Existing navigation still reaches this section after its explicit move.
        page.locator(".nav-toggle").tap()
        page.locator('#nav-menu a[href="#buy"]').tap()
        assert page.locator(".nav-toggle").get_attribute("aria-expanded") == "false"
        assert page.url.endswith("#buy")
        page.emulate_media(reduced_motion="reduce")
        select.select_option("in")
        check_links(page, "in")
        page.add_style_tag(content="html { font-size: 200%; }")
        for width in (320, 390, 768, 1440):
            page.set_viewport_size({"width": width, "height": 1000})
            for code in ("uk", "be", "in"):
                select.select_option(code)
                check_links(page, code)
                check_selection(page, code)
                record(page, name, [width, 1000], code + "-200-percent")
        page.set_viewport_size({"width": 320, "height": 1000})
        page.locator("#buy").screenshot(path=str(out / f"{name}-200-percent.png"))

        for locale in ("de", "fa", "ar"):
            page.goto(f"{base}/{locale}/", wait_until="networkidle")
            assert page.locator(".buy--redesign").count() == 0
            assert page.locator("#buy .buy-card").count() == 1
            assert page.locator("html").get_attribute("dir") == ("ltr" if locale == "de" else "rtl")
            assert not page.evaluate("document.documentElement.scrollWidth > innerWidth + 1")
        nojs = browser.new_context(java_script_enabled=False, viewport={"width": 320, "height": 568})
        nojs.route("**/*", lambda r: r.continue_() if r.request.url.startswith(base + "/") else r.abort())
        fallback = nojs.new_page()
        fallback.goto(base + "/", wait_until="networkidle")
        assert fallback.locator("[data-marketplace-default]").is_visible()
        assert fallback.locator("[data-marketplace-default]").text_content() == market_labels["us"]
        assert not fallback.locator("#amazon-marketplace").is_visible()
        assert fallback.locator("#buy a:visible").count() == 3
        check_links(fallback, "us")
        record(fallback, name, [320, 568], "no-js")
        nojs.close()
        context.close()
        print(f"{name} {browser.version}: {len(viewports)} viewports, {len(markets)} markets, new-tab links, keyboard, text zoom and no-JS complete.", flush=True)
        browser.close()

(out / "results.json").write_text(json.dumps({"checks": results, "errors": errors}, indent=2) + "\n")
print(json.dumps({"checks": len(results), "errors": errors, "screenshots": str(out)}, indent=2))
if errors:
    raise SystemExit(1)
