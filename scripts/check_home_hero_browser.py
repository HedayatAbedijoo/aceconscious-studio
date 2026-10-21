#!/usr/bin/env python3
"""Responsive English hero QA. Requires Playwright and a local preview server."""
import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--base", default="http://127.0.0.1:8765")
parser.add_argument("--chromium-executable", default=None)
parser.add_argument("--browsers", nargs="+", default=["chromium", "webkit", "firefox"])
parser.add_argument("--output", default="/tmp/ace-hero-qa")
args = parser.parse_args()
base = args.base.rstrip("/")
out = Path(args.output)
out.mkdir(parents=True, exist_ok=True)
results = []
errors = []

# CSS viewport sizes: small phones, representative iPhone/Pixel sizes, larger
# phones, tablets, and desktops. Include both sides of the layout breakpoint.
phones = [(320, 568), (360, 640), (375, 667), (390, 844), (393, 852),
          (412, 915), (414, 896), (430, 932), (440, 956)]
viewports = phones + [(h, w) for w, h in phones] + [
    (600, 800), (759, 1024), (760, 1024), (761, 1024),
    (768, 1024), (820, 1180), (834, 1194), (899, 1024),
    (900, 1024), (901, 1024), (1024, 768), (1279, 800),
    (1280, 800), (1281, 800),
    (1440, 1000), (1800, 1000),
]
capture_widths = {320, 390, 440, 768, 820, 900, 901, 1280, 1440, 1800}

geometry_check = """() => {
  const issues = [];
  const hero = document.querySelector('#top').getBoundingClientRect();
  const selectors = [
    '.hero-redesign__eyebrow', '.hero-redesign__title',
    '.hero-redesign__tagline', '.hero-redesign__logline',
    '#top .book-cover__face--front', '#book-cover-peek'
  ];
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    const box = element.getBoundingClientRect();
    if (box.left < -1 || box.right > innerWidth + 1)
      issues.push(`${selector}: outside viewport`);
    if (box.top < hero.top || box.bottom > hero.bottom + 1)
      issues.push(`${selector}: outside hero`);
    if (element.tagName === 'P' || element.tagName === 'H1') {
      const range = document.createRange();
      range.selectNodeContents(element);
      for (const line of range.getClientRects()) {
        if (line.left < -1 || line.right > innerWidth + 1)
          issues.push(`${selector}: text clipped`);
      }
    }
  }
  const text = document.querySelector('.hero-redesign__text').getBoundingClientRect();
  const book = document.querySelector('#top .hero__cover-wrap').getBoundingClientRect();
  if (text.right > book.left && text.left < book.right &&
      text.bottom > book.top && text.top < book.bottom)
    issues.push('Text overlaps book');
  const button = document.querySelector('#book-cover-peek').getBoundingClientRect();
  if (button.width < 44 || button.height < 44)
    issues.push('Cover touch target is smaller than 44px');
  if (document.documentElement.scrollWidth > innerWidth + 1)
    issues.push('Horizontal page overflow');
  return issues;
}"""

layout_check = """() => {
  const issues = [];
  const grid = document.querySelector('.hero-redesign__grid');
  const bounds = grid.getBoundingClientRect();
  const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
  const stacked = innerWidth <= 900;
  if (columns !== (stacked ? 1 : 2))
    issues.push(`Expected ${stacked ? 'stacked' : 'two-column'} hero, found ${columns} columns`);
  if (!stacked) {
    const logo = document.querySelector('.site-nav__logo').getBoundingClientRect();
    const nav = document.querySelector('#nav-menu').getBoundingClientRect();
    const actions = document.querySelector('.site-nav__actions').getBoundingClientRect();
    if (logo.right > nav.left + 1 || nav.right > actions.left + 1)
      issues.push('English navigation overlaps the logo or language control');
  }
  for (const selector of ['.site-nav__inner', '#reviews > .container', '#synopsis > .container']) {
    const reference = document.querySelector(selector).getBoundingClientRect();
    if (Math.abs(bounds.left - reference.left) > 1 || Math.abs(bounds.right - reference.right) > 1)
      issues.push(`Hero is misaligned with ${selector}`);
  }
  const text = document.querySelector('.hero-redesign__text').getBoundingClientRect();
  const cover = document.querySelector('#top .hero__cover-wrap').getBoundingClientRect();
  if (stacked && cover.top < text.bottom)
    issues.push('Stacked hero must show text before the cover');
  const title = document.querySelector('.hero-redesign__title');
  const logline = document.querySelector('.hero-redesign__logline');
  const range = document.createRange();
  range.selectNodeContents(logline);
  const loglineLines = new Set([...range.getClientRects()].map(r => Math.round(r.top))).size;
  if (innerWidth >= 1280 && loglineLines !== 2)
    issues.push(`Wide desktop logline should have two lines, found ${loglineLines}`);
  return {issues, columns, titleSize: parseFloat(getComputedStyle(title).fontSize),
    coverWidth: cover.width, loglineLines};
}"""


def open_home(page, wait_fonts=True):
    response = page.goto(base + "/", wait_until="networkidle")
    assert response.status == 200
    if wait_fonts:
        page.wait_for_function("document.fonts.status === 'loaded'")
    page.locator('#top .hero__cover').first.wait_for(state="visible")


with sync_playwright() as playwright:
    for name in args.browsers:
        options = {"headless": True}
        if name == "chromium":
            options["args"] = ["--no-sandbox"]
            if args.chromium_executable:
                options["executable_path"] = args.chromium_executable
        browser = getattr(playwright, name).launch(**options)
        context = browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True)
        # Never submit forms or send analytics. Allow the site's existing Google
        # Fonts; the new hero fonts are local and must also work fully offline.
        context.route("**/*", lambda r: r.continue_() if r.request.url.startswith(
            (base + "/", "https://fonts.googleapis.com/", "https://fonts.gstatic.com/")
        ) else r.abort())
        page = context.new_page()
        page.on("pageerror", lambda error: errors.append(f"{name}: {error}"))
        font_requests = []
        hero_fonts = ("PlayfairDisplay-Regular-latin.woff2", "DMSans-Regular-latin.woff2", "DMMono-Regular-latin.woff2")
        page.on("request", lambda request: font_requests.append(request.url)
                if any(font in request.url for font in hero_fonts) else None)
        open_home(page)
        for font in hero_fonts:
            preload = page.locator(f'link[rel="preload"][as="font"][href*="{font}"]')
            assert preload.count() == 1
            assert preload.get_attribute("crossorigin") is not None
            assert font_requests.count(base + preload.get_attribute("href")) == 1, font_requests
        assert page.locator('#nav-menu a[href^="#"]').evaluate_all("els => els.map(el => el.hash)") == [
            "#reviews", "#buy", "#synopsis", "#sample", "#voices", "#author", "#contents", "#contact"]
        assert page.locator('#nav-menu a[href="#contents"]').text_content() == "Content"
        assert page.locator("#book-cover").count() == 1
        assert page.locator("#top a, #top .btn").count() == 0
        assert page.locator("#top .hero__cover").first.evaluate(
            "(image) => image.complete && image.naturalWidth > 0")
        assert page.evaluate("""() => ['Playfair Display', 'DM Sans', 'DM Mono']
            .every(name => [...document.fonts].some(f => f.family.replaceAll('"', '') === name
                && f.status === 'loaded'))""")

        browser_layouts = {}
        for width, height in viewports:
            page.set_viewport_size({"width": width, "height": height})
            page.evaluate("window.scrollTo(0, 0)")
            problems = page.evaluate(geometry_check)
            layout = page.evaluate(layout_check)
            problems.extend(layout.pop("issues"))
            browser_layouts[width] = layout
            errors.extend(f"{name} {width}x{height}: {problem}" for problem in problems)
            results.append({"browser": name, "viewport": [width, height], **layout, "errors": problems})
            if width in capture_widths and height >= 568:
                page.screenshot(path=str(out / f"{name}-{width}x{height}.png"))
                page.locator("#top").screenshot(path=str(out / f"{name}-{width}x{height}-hero.png"))

        # Catch the original regression: a larger display must not suddenly
        # make the title or cover smaller at the tablet/layout breakpoints.
        for previous, current in zip(sorted(browser_layouts), sorted(browser_layouts)[1:]):
            for metric in ("titleSize", "coverWidth"):
                before, after = browser_layouts[previous][metric], browser_layouts[current][metric]
                if after + 1 < before:
                    errors.append(f"{name} {previous}→{current}: {metric} shrinks {before:.1f}→{after:.1f}")

        # Touch, keyboard and the existing navigation must remain usable.
        page.set_viewport_size({"width": 390, "height": 844})
        button = page.locator("#book-cover-peek")
        button.tap()
        assert button.get_attribute("aria-pressed") == "true"
        assert "front" in button.get_attribute("aria-label")
        button.focus()
        page.keyboard.press("Enter")
        assert button.get_attribute("aria-pressed") == "false"
        page.keyboard.press("Space")
        assert button.get_attribute("aria-pressed") == "true"
        page.keyboard.press("Enter")
        assert button.get_attribute("aria-pressed") == "false"
        page.evaluate("window.scrollTo(0, 0)")
        menu = page.locator("#lang-menu summary")
        menu.focus()
        page.keyboard.press("ArrowDown")
        assert page.locator("#lang-menu a").first.evaluate("(a) => a === document.activeElement")
        page.keyboard.press("Escape")
        assert page.locator("#lang-menu").get_attribute("open") is None
        page.locator(".nav-toggle").tap()
        assert page.locator(".nav-toggle").get_attribute("aria-expanded") == "true"
        page.locator('#nav-menu a[href="#synopsis"]').tap()
        assert page.locator(".nav-toggle").get_attribute("aria-expanded") == "false"

        for width, height in ((390, 844), (844, 390), (568, 320)):
            page.set_viewport_size({"width": width, "height": height})
            page.locator(".nav-toggle").tap()
            page.wait_for_function("getComputedStyle(document.querySelector('#nav-menu')).transform === 'none'")
            last_link = page.locator("#nav-menu a").last
            last_link.focus()
            assert last_link.evaluate("""el => {
                const b = el.getBoundingClientRect();
                return b.top >= document.querySelector('.site-nav').getBoundingClientRect().bottom
                    && b.bottom <= innerHeight + 1 && b.height >= 44;
            }"""), (name, width, height, "Last menu link is unreachable")
            page.locator('#nav-menu a[href="#author"]').tap()
            assert page.url.endswith("#author")
            assert page.locator(".nav-toggle").get_attribute("aria-expanded") == "false"
        page.set_viewport_size({"width": 390, "height": 844})

        page.emulate_media(reduced_motion="reduce")
        page.evaluate("window.scrollTo(0, 0)")
        assert page.locator(".book-cover__peek-icon").evaluate(
            "(el) => getComputedStyle(el).animationName") == "none"
        page.add_style_tag(content="html { font-size: 200%; }")
        page.evaluate("window.scrollTo(0, 0)")
        errors.extend(f"{name} enlarged text: {problem}" for problem in page.evaluate(geometry_check))
        page.screenshot(path=str(out / f"{name}-enlarged-text.png"))

        for locale in ("de", "fa", "ar"):
            page.goto(f"{base}/{locale}/", wait_until="networkidle")
            assert page.locator(".hero--redesign").count() == 0
            assert page.locator("#synopsis #book-cover").count() == 1
            assert page.locator("html").get_attribute("dir") == ("ltr" if locale == "de" else "rtl")
        offline = browser.new_context(java_script_enabled=False, viewport={"width": 320, "height": 568})
        offline.route("**/*", lambda r: r.continue_() if r.request.url.startswith(base + "/") else r.abort())
        nojs = offline.new_page()
        open_home(nojs, wait_fonts=False)
        errors.extend(f"{name} no JavaScript: {problem}" for problem in nojs.evaluate(geometry_check))
        assert nojs.locator("#top .hero__cover").first.evaluate("(img) => img.naturalWidth > 0")
        offline.close()
        context.close()
        print(f"{name} {browser.version}: {len(viewports)} viewports and interaction checks complete.", flush=True)
        browser.close()

(out / "results.json").write_text(json.dumps({"checks": results, "errors": errors}, indent=2) + "\n")
print(json.dumps({"viewports_checked": len(results), "errors": errors, "screenshots": str(out)}, indent=2))
if errors:
    raise SystemExit(1)
