#!/usr/bin/env python3
"""Render V2 artistic templates (with book logo) — does not touch v1 outputs."""
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from gen_templates_v2 import build_all, TEMPLATES, W, H, RENDER  # noqa: E402

OUT = HERE / "out" / "templates-v2"


def render(langs=("fa", "en")):
    from playwright.sync_api import sync_playwright

    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": W, "height": H})
        for lang in langs:
            build_all(lang)
            for t in TEMPLATES:
                html = (RENDER / f"{t['id']}-{lang}.html").resolve()
                page.goto(html.as_uri(), wait_until="networkidle")
                page.wait_for_timeout(600)
                out = OUT / f"{t['id']}-{lang}.png"
                page.locator(".card").screenshot(path=str(out), type="png")
                print(f"  {out.name}")
        browser.close()
    print(f"Done → {OUT}")


if __name__ == "__main__":
    langs = tuple(sys.argv[1:]) if len(sys.argv) > 1 else ("fa", "en")
    render(langs)
