#!/usr/bin/env python3
"""Render 200 quote PNGs (50 quotes × fa/en × ig/li) via Playwright screenshots."""
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
RENDER = HERE / ".render"
OUT = HERE / "out"

# Ensure generator is importable
sys.path.insert(0, str(HERE))
from gen_slides import build_all, SIZES, load_selected  # noqa: E402


def render_all(only_ranks=None):
    """Render PNGs. only_ranks: optional set/list of 1-based ranks for QA samples."""
    build_all()
    from playwright.sync_api import sync_playwright

    sel = load_selected()
    ranks = list(range(1, len(sel) + 1))
    if only_ranks is not None:
        ranks = [r for r in ranks if r in set(only_ranks)]

    OUT.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        # Wait for Google Fonts (Literata / JetBrains Mono)
        context = browser.new_context()
        page = context.new_page()

        count = 0
        for lang in ("fa", "en"):
            for platform in ("ig", "li"):
                w, h = SIZES[platform]
                html_path = (RENDER / f"slides-{lang}-{platform}.html").resolve()
                page.set_viewport_size({"width": w, "height": h})
                page.goto(html_path.as_uri(), wait_until="networkidle")
                # Give webfonts a moment after networkidle
                page.wait_for_timeout(400)

                for rank in ranks:
                    page.evaluate(f'location.hash = "#{rank}"')
                    page.wait_for_timeout(50)
                    slide = page.locator(f"#s{rank}")
                    slide.wait_for(state="visible")
                    out_path = OUT / f"q{rank:02d}-{lang}-{platform}.png"
                    slide.screenshot(path=str(out_path), type="png")
                    count += 1
                    if count % 20 == 0:
                        print(f"  … {count} PNGs")

        browser.close()
    print(f"Done: {count} PNGs in {OUT}")


if __name__ == "__main__":
    ranks = None
    if len(sys.argv) > 1:
        ranks = [int(x) for x in sys.argv[1:]]
    render_all(only_ranks=ranks)
