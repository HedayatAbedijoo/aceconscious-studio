#!/usr/bin/env python3
"""Render the 10 template previews to PNG for visual comparison."""
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from gen_templates import build_all, TEMPLATES, W, H  # noqa: E402

OUT = HERE / "out" / "templates"


def render(langs=("fa", "en")):
    from playwright.sync_api import sync_playwright

    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": W, "height": H})
        for lang in langs:
            build_all(lang)
            for t in TEMPLATES:
                html = (HERE / ".render" / "templates" / f"{t['id']}-{lang}.html").resolve()
                page.goto(html.as_uri(), wait_until="networkidle")
                page.wait_for_timeout(500)
                out = OUT / f"{t['id']}-{lang}.png"
                page.locator(".card").screenshot(path=str(out), type="png")
                print(f"  {out.name}")
        browser.close()
    print(f"Done → {OUT}")


if __name__ == "__main__":
    langs = sys.argv[1:] or ["fa", "en"]
    render(tuple(langs))
