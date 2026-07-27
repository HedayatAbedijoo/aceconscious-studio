#!/usr/bin/env python3
"""Render all 50 quotes × FA/EN into Instagram posts using V2 templates.
One random template per quote (same for both languages). Template designs unchanged;
optional soft thematic accents layered on top based on quote content."""
from __future__ import annotations

import json
import random
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from gen_templates_v2 import (  # noqa: E402
    BUILDERS,
    TEMPLATES,
    W,
    H,
    shell,
)

OUT = HERE / "out" / "quotes-ig"
RENDER = HERE / ".render" / "quotes-ig"
MANIFEST = OUT / "assignments.json"
SEED = 20260726


def load_quotes():
    data = json.loads((HERE / "quotes-50.json").read_text(encoding="utf-8"))
    return sorted(data["selected"], key=lambda x: (-x["score"], x["chapter"]))


def assign_templates(quotes, seed=SEED):
    rng = random.Random(seed)
    ids = [t["id"] for t in TEMPLATES]
    # Shuffle a deck so distribution is even-ish across 50 quotes
    deck = []
    while len(deck) < len(quotes):
        batch = ids[:]
        rng.shuffle(batch)
        deck.extend(batch)
    return {i + 1: deck[i] for i in range(len(quotes))}


def accent_for(quote: dict, lang: str) -> str:
    """Soft thematic SVG overlay — does not alter the base template layout."""
    themes = " ".join(quote.get("themes") or [])
    text = (quote.get(lang) or "") + " " + themes
    t = text.lower()

    kind = None
    if any(k in text for k in ("پروانه", "butterfly", "butterflies")):
        kind = "butterfly"
    elif any(k in text for k in ("الگوریتم", "هوش", "artificial", "algorithm", "ai ", "ai.", "ربات")):
        kind = "network"
    elif any(k in text for k in ("عشق", "love", "قلب", "heart")):
        kind = "heart"
    elif any(k in text for k in ("زمان", "time", "آینده", "future")):
        kind = "spiral"
    elif any(k in text for k in ("آینه", "mirror", "خود")) and "آینه" in text:
        kind = "mirror"
    elif "هوش مصنوعی" in themes or "آینده" in themes:
        kind = "network"
    elif "فلسفی" in themes:
        kind = "horizon"

    if not kind:
        return ""

    # Very soft, edge-biased so quote stays dominant
    svgs = {
        "butterfly": '''
<svg viewBox="0 0 1080 1350" style="position:absolute;inset:0;width:100%;height:100%;z-index:4;opacity:0.14;pointer-events:none;" fill="none">
  <g stroke="currentColor" stroke-width="2.2" transform="translate(720,180) scale(0.55)" color="#888">
    <path d="M120 80 C40 0 -40 20 -20 100 C-5 150 60 140 100 110"/>
    <path d="M120 80 C200 0 280 20 260 100 C245 150 180 140 140 110"/>
    <path d="M120 95 C110 150 110 200 120 240"/>
  </g>
</svg>''',
        "network": '''
<svg viewBox="0 0 1080 1350" style="position:absolute;inset:0;width:100%;height:100%;z-index:4;opacity:0.12;pointer-events:none;" fill="none">
  <g stroke="#888" stroke-width="1.6">
    <circle cx="160" cy="220" r="5" fill="#888"/><circle cx="280" cy="160" r="4" fill="#888"/>
    <circle cx="900" cy="240" r="5" fill="#888"/><circle cx="980" cy="360" r="4" fill="#888"/>
    <circle cx="140" cy="1100" r="4" fill="#888"/><circle cx="260" cy="1200" r="5" fill="#888"/>
    <line x1="160" y1="220" x2="280" y2="160"/><line x1="900" y1="240" x2="980" y2="360"/>
    <line x1="140" y1="1100" x2="260" y2="1200"/>
  </g>
</svg>''',
        "heart": '''
<svg viewBox="0 0 1080 1350" style="position:absolute;inset:0;width:100%;height:100%;z-index:4;opacity:0.11;pointer-events:none;" fill="none">
  <path d="M860 1080 C780 1000 760 940 800 900 C830 870 860 880 870 910 C880 880 910 870 940 900 C980 940 960 1000 870 1080" stroke="#888" stroke-width="2.5"/>
</svg>''',
        "spiral": '''
<svg viewBox="0 0 1080 1350" style="position:absolute;inset:0;width:100%;height:100%;z-index:4;opacity:0.12;pointer-events:none;" fill="none">
  <path d="M180 1180 C180 1140 220 1140 220 1180 C220 1230 150 1230 150 1170 C150 1090 250 1090 250 1190 C250 1310 110 1310 110 1170" stroke="#888" stroke-width="2.2"/>
</svg>''',
        "mirror": '''
<svg viewBox="0 0 1080 1350" style="position:absolute;inset:0;width:100%;height:100%;z-index:4;opacity:0.12;pointer-events:none;" fill="none">
  <path d="M140 900 C80 980 80 1100 140 1180" stroke="#888" stroke-width="2"/>
  <path d="M220 900 C280 980 280 1100 220 1180" stroke="#888" stroke-width="2"/>
  <line x1="180" y1="880" x2="180" y2="1200" stroke="#888" stroke-width="1.5" stroke-dasharray="3 14"/>
</svg>''',
        "horizon": '''
<svg viewBox="0 0 1080 1350" style="position:absolute;inset:0;width:100%;height:100%;z-index:4;opacity:0.12;pointer-events:none;" fill="none">
  <path d="M80 1180 C260 1120 420 1220 600 1160 C780 1100 920 1200 1040 1140" stroke="#888" stroke-width="2"/>
  <circle cx="900" cy="200" r="28" stroke="#888" stroke-width="1.5" stroke-dasharray="3 10"/>
</svg>''',
    }
    return svgs.get(kind, "")


def inject_accent(card_html: str, accent: str) -> str:
    if not accent:
        return card_html
    # Insert accent just before the closing </section>
    return card_html.replace("</section>", accent + "\n</section>", 1)


def build_card(template_id: str, lang: str, quote_text: str, accent: str) -> str:
    builder = BUILDERS[template_id]
    inner = builder(lang, quote=quote_text)
    inner = inject_accent(inner, accent)
    return shell(f"{template_id}-{lang}", inner, lang)


def render_all(seed=SEED):
    from playwright.sync_api import sync_playwright

    quotes = load_quotes()
    assignments = assign_templates(quotes, seed=seed)
    OUT.mkdir(parents=True, exist_ok=True)
    RENDER.mkdir(parents=True, exist_ok=True)

    manifest = []
    jobs = []
    for rank, q in enumerate(quotes, 1):
        tid = assignments[rank]
        entry = {
            "rank": rank,
            "id": q["id"],
            "template": tid,
            "themes": q.get("themes", []),
            "files": {},
        }
        for lang in ("fa", "en"):
            text = q[lang]
            accent = accent_for(q, lang)
            html = build_card(tid, lang, text, accent)
            html_path = RENDER / f"q{rank:02d}-{lang}.html"
            html_path.write_text(html, encoding="utf-8")
            out_name = f"q{rank:02d}-{lang}-ig.png"
            entry["files"][lang] = out_name
            jobs.append((html_path, OUT / out_name))
        manifest.append(entry)

    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": W, "height": H})
        for i, (html_path, out_path) in enumerate(jobs, 1):
            page.goto(html_path.resolve().as_uri(), wait_until="networkidle")
            page.wait_for_timeout(350)
            page.locator(".card").screenshot(path=str(out_path), type="png")
            if i % 20 == 0 or i == len(jobs):
                print(f"  … {i}/{len(jobs)}")
        browser.close()

    # Distribution summary
    from collections import Counter
    c = Counter(a["template"] for a in manifest)
    print("Template distribution:")
    for tid, n in sorted(c.items()):
        print(f"  {tid}: {n}")
    print(f"Done: {len(jobs)} PNGs → {OUT}")
    print(f"Manifest: {MANIFEST}")


if __name__ == "__main__":
    seed = int(sys.argv[1]) if len(sys.argv) > 1 else SEED
    render_all(seed=seed)
