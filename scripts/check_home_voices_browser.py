#!/usr/bin/env python3
"""Check full character copy, native disclosures and responsive Voices cards."""
import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright

from build_locales import ROOT, apply_strings, parse

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--base", default="http://127.0.0.1:8765")
parser.add_argument("--chromium-executable")
parser.add_argument("--browsers", nargs="+", default=["chromium", "webkit", "firefox"])
parser.add_argument("--output", default="/tmp/ace-voices-qa")
args = parser.parse_args()
base = args.base.rstrip("/")
out = Path(args.output)
out.mkdir(parents=True, exist_ok=True)
original = parse((ROOT / "content/templates/home.html").read_text())
apply_strings(original, json.loads((ROOT / "content/locales/en.json").read_text()))
expected = {}
for card in original.select("#voices .character-card"):
    name = card.select_one(".character-card__name")
    expected[name["data-i18n"]] = {
        "name": name.get_text(),
        "role": card.select_one(".character-card__role").get_text(),
        "paragraphs": [str(p) for p in card.select(".character-card__body > p")],
    }

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
  const issues = [], section = document.querySelector('#voices');
  const grid = section.querySelector('.voice-grid'), box = grid.getBoundingClientRect();
  const heading = getComputedStyle(section.querySelector('.voices-heading'));
  const reference = getComputedStyle(document.querySelector('.edition-heading'));
  const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
  if (columns !== (innerWidth > 1100 ? 4 : innerWidth > 540 ? 2 : 1))
    issues.push('Wrong column count');
  if (document.documentElement.scrollWidth > innerWidth + 1)
    issues.push('Page overflows horizontally');
  if (heading.fontFamily !== reference.fontFamily || heading.fontSize !== reference.fontSize ||
      heading.letterSpacing !== reference.letterSpacing || heading.textTransform !== 'none')
    issues.push('Section heading differs from approved typography');
  const summaries = [...section.querySelectorAll('summary')].map(el => el.getBoundingClientRect());
  const textZoom = parseFloat(getComputedStyle(document.documentElement).fontSize) > 16;
  summaries.forEach((b, i) => {
    if (b.width < 44 || b.height < 44) issues.push(`Card ${i}: small touch target`);
    if (!textZoom && Math.abs(b.width - b.height) > 2) issues.push(`Card ${i}: not square`);
    if (!textZoom && b.width > 321) issues.push(`Card ${i}: oversized at a breakpoint`);
  });
  for (const el of grid.querySelectorAll('summary, .voice-content, p, .voice-name, .voice-role, .voice-action')) {
    if (!el.getClientRects().length || (el.closest('details:not([open])') && !el.closest('summary'))) continue;
    const b = el.getBoundingClientRect();
    if (b.left < box.left - 1 || b.right > box.right + 1)
      issues.push(`${el.className || el.tagName}: outside grid`);
    if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).display !== 'inline')
      issues.push(`${el.className || el.tagName}: content overflows`);
    if (el.matches('summary')) {
      const children = [...el.querySelector('.voice-summary').children].map(c => c.getBoundingClientRect());
      children.forEach((child, i) => {
        if (child.top < b.top - 1 || child.bottom > b.bottom + 1 ||
            (i && child.top < children[i - 1].bottom - 1))
          issues.push('Summary elements overlap or overflow');
      });
    }
  }
  const cards = [...section.querySelectorAll('.voice-entry')].map(el => el.getBoundingClientRect());
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const a = cards[i], b = cards[j];
      if (a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1)
        issues.push(`Cards ${i}/${j} overlap`);
    }
  }
  return {issues, columns, cardWidth: summaries[0].width, cardHeight: summaries[0].height};
}"""


def record(page, name, size, state):
    report = page.evaluate(geometry)
    results.append({"browser": name, "viewport": size, "state": state, **report})
    errors.extend(f"{name} {size} {state}: {issue}" for issue in report["issues"])


def check_copy(page):
    cards = page.locator(".voice-card")
    assert cards.count() == 8
    assert page.locator("#voices-heading").inner_text() == "Voices of the Characters"
    assert page.locator(".voices-hint").inner_text() == "Click any card to open ↘"
    for card in cards.all():
        name = card.locator(".voice-name")
        source = expected[name.get_attribute("data-i18n")]
        assert name.inner_text() == source["name"]
        assert card.get_by_role("heading", name=source["name"], exact=True).count() == 1
        assert card.locator(".voice-role").inner_text() == source["role"]
        actual = card.locator(".voice-content > p").evaluate_all("(els) => els.map(el => el.outerHTML)")
        assert [str(parse(p).p) for p in actual] == source["paragraphs"], source["name"]


def set_open(page, opened):
    page.locator(".voice-card").evaluate_all("""(els, opened) => {
        els.forEach(el => el.open = false);
        if (opened) els[0].open = true;
    }""", opened)


def capture(page, name, width, height, state):
    section = page.locator("#voices")
    capture_height = max(height, int(section.bounding_box()["height"]) + 180)
    page.set_viewport_size({"width": width, "height": capture_height})
    section.evaluate("el => scrollTo({top: scrollY + el.getBoundingClientRect().top - 100, behavior: 'instant'})")
    section.screenshot(path=str(out / f"{name}-{width}-{state}.png"))
    page.set_viewport_size({"width": width, "height": height})


def check_switch_position(page):
    # Open a long voice, then activate another row. Closing the earlier row
    # must not move the selected card hundreds of pixels above the viewport.
    for width in (390, 540, 541, 768, 1100, 1101, 1440):
        page.set_viewport_size({"width": width, "height": 844})
        columns = 4 if width > 1100 else 2 if width > 540 else 1
        for keyboard in (False, True):
            set_open(page, True)
            for index in (columns, 0, 7):
                summary = page.locator(".voice-card summary").nth(index)
                summary.evaluate("el => scrollTo({top: scrollY + el.getBoundingClientRect().top - 160, behavior: 'instant'})")
                if keyboard:
                    summary.focus()
                before = summary.bounding_box()["y"]
                if keyboard:
                    page.keyboard.press("Enter")
                else:
                    summary.tap()
                page.evaluate("() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))")
                after = summary.bounding_box()["y"]
                assert abs(before - after) < 2, (width, index, keyboard, before, after)
                assert page.locator(".voice-card[open]").count() == 1
                assert summary.locator("..").evaluate("el => el.open")


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
        assert page.locator("#sample + #voices + #author + #contents").count() == 1
        check_copy(page)
        assert page.locator(".voice-card[open]").count() == 0
        assert not page.locator(".voice-content").first.is_visible()
        for width, height in viewports:
            page.set_viewport_size({"width": width, "height": height})
            for opened in (False, True):
                set_open(page, opened)
                record(page, name, [width, height], "open" if opened else "closed")
            if width in (320, 390, 768, 1440):
                set_open(page, False)
                capture(page, name, width, height, "closed")
                page.locator(".voice-card").first.evaluate("el => el.open = true")
                capture(page, name, width, height, "hedayat-open")

        page.set_viewport_size({"width": 390, "height": 844})
        set_open(page, False)
        for card in page.locator(".voice-card").all():
            summary = card.locator("summary")
            summary.focus()
            page.keyboard.press("Enter")
            assert card.evaluate("el => el.open")
            assert page.locator(".voice-card[open]").count() == 1
            assert card.locator(".voice-content").is_visible()
            assert card.locator(".voice-action__open").is_visible()
            page.keyboard.press("Space")
            assert not card.evaluate("el => el.open")
            summary.tap()
            assert card.evaluate("el => el.open")
            assert page.locator(".voice-card[open]").count() == 1, "Opening a voice must close the previous voice"
        # Other native disclosures are outside the Voices group.
        page.locator("#story-details").evaluate("el => el.open = true")
        first = page.locator(".voice-card summary").first
        first.tap()
        assert page.locator(".voice-card[open]").count() == 1
        assert page.locator(".voice-card").first.evaluate("el => el.open")
        assert page.locator("#story-details").evaluate("el => el.open")
        first.tap()
        assert page.locator(".voice-card[open]").count() == 0
        first.focus()
        page.keyboard.press("Tab")
        assert page.locator(".voice-card summary").nth(1).evaluate("el => el === document.activeElement")
        assert page.locator(".voice-card summary").nth(1).evaluate(
            "el => parseFloat(getComputedStyle(el).outlineWidth) >= 2")
        page.locator(".nav-toggle").tap()
        page.locator('#nav-menu a[href="#voices"]').tap()
        assert page.url.endswith("#voices")
        assert page.locator(".nav-toggle").get_attribute("aria-expanded") == "false"
        check_copy(page)

        check_switch_position(page)

        page.add_style_tag(content="html { font-size: 200%; }")
        for width in (320, 390, 768, 1440):
            page.set_viewport_size({"width": width, "height": 1000})
            for opened in (False, True):
                set_open(page, opened)
                record(page, name, [width, 1000], f"200-percent-{'open' if opened else 'closed'}")

        for locale in ("de", "ar", "fa"):
            page.set_viewport_size({"width": 390, "height": 844})
            page.goto(f"{base}/{locale}/", wait_until="networkidle")
            assert page.locator(".characters--redesign").count() == 0
            assert page.locator("#voices .character-card").count() == 8
            assert not page.evaluate("document.documentElement.scrollWidth > innerWidth + 1")
        context.close()

        nojs = browser.new_context(java_script_enabled=False, viewport={"width": 390, "height": 844})
        nojs.route("**/*", lambda r: r.continue_() if r.request.url.startswith(base + "/") else r.abort())
        page = nojs.new_page()
        page.goto(base + "/", wait_until="networkidle")
        check_copy(page)
        summary = page.locator(".voice-card summary").first
        summary.focus()
        record(page, name, [390, 844], "no-js-closed")
        page.keyboard.press("Enter")
        assert page.locator(".voice-content").first.is_visible()
        record(page, name, [390, 844], "no-js-open")
        second = page.locator(".voice-card summary").nth(1)
        second.focus()
        page.keyboard.press("Enter")
        assert page.locator(".voice-card[open]").count() == 1
        assert not page.locator(".voice-content").first.is_visible()
        assert page.locator(".voice-content").nth(1).is_visible()
        page.keyboard.press("Space")
        assert page.locator(".voice-card[open]").count() == 0
        browser.close()
        print(f"{name}: {len(viewports)} sizes, full copy, all eight disclosures, touch, keyboard, text zoom, RTL and no-JS checked.", flush=True)

(out / "results.json").write_text(json.dumps({"checks": results, "errors": errors}, indent=2) + "\n")
print(json.dumps({"checks": len(results), "errors": errors, "screenshots": str(out)}, indent=2))
if errors:
    raise SystemExit(1)
