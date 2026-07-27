#!/usr/bin/env python3
"""Compose FA/EN quotes onto the PNG templates in templates/.
Templates stay as-is (English branding). Output → out/quotes-from-templates/"""
from __future__ import annotations

import json
import random
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
TEMPLATES_DIR = HERE / "templates"
OUT = HERE / "out" / "quotes-from-templates"
RENDER = HERE / ".render" / "quotes-from-templates"
FONT_DIR = (HERE / ".." / ".." / "assets" / "fonts").resolve()
SEED = 20260726

W, H = 1122, 1402

# Per-template: ink color + quote box (left, top, width, height) + align
# Boxes keep clear of branding / logo / footer.
CONFIG = {
    1: dict(ink="#2C241C", box=(90, 290, 940, 900), align="center", dark=False),
    2: dict(ink="#F2EDE6", box=(64, 280, 600, 900), align="start", dark=True),
    3: dict(ink="#3A4550", box=(130, 300, 860, 860), align="center", dark=False),
    4: dict(ink="#1A1512", box=(150, 300, 820, 820), align="start", dark=False),
    5: dict(ink="#E8C76A", box=(150, 340, 820, 740), align="center", dark=True),
    6: dict(ink="#2F3844", box=(80, 280, 720, 900), align="start", dark=False),
    7: dict(ink="#1F1A16", box=(60, 300, 580, 880), align="start", dark=False),
    8: dict(ink="#3D3228", box=(100, 280, 820, 860), align="center", dark=False),
    9: dict(ink="#EDE8E0", box=(180, 360, 760, 720), align="center", dark=True),
}


def fonts_css() -> str:
    return f"""
@font-face {{ font-family:"Vazirmatn"; src:url("file://{FONT_DIR}/Vazirmatn-Regular.woff2") format("woff2"); font-weight:400; }}
@font-face {{ font-family:"Vazirmatn"; src:url("file://{FONT_DIR}/Vazirmatn-Medium.woff2") format("woff2"); font-weight:500; }}
@font-face {{ font-family:"Vazirmatn"; src:url("file://{FONT_DIR}/Vazirmatn-SemiBold.woff2") format("woff2"); font-weight:600; }}
"""


def load_quotes():
    data = json.loads((HERE / "quotes-50.json").read_text(encoding="utf-8"))
    return sorted(data["selected"], key=lambda x: (-x["score"], x["chapter"]))


def assign_templates(quotes, seed=SEED):
    """Random assignment; long/dense quotes prefer roomier templates."""
    rng = random.Random(seed)
    roomy = [1, 3, 4, 5, 8, 9]
    narrow = [2, 6, 7]
    all_ids = list(range(1, 10))
    assignments = {}
    # Build balanced deck for normal quotes
    deck = []
    while len(deck) < len(quotes) + 20:
        batch = all_ids[:]
        rng.shuffle(batch)
        deck.extend(batch)
    di = 0
    for rank, q in enumerate(quotes, 1):
        text = q["fa"] if len(q["fa"]) >= len(q["en"]) else q["en"]
        dense = text.count("\n") >= 12 or len(text) > 400
        if dense:
            assignments[rank] = rng.choice(roomy)
        else:
            # skip if deck would force dense onto narrow later — just take next
            tid = deck[di]
            di += 1
            # lightly re-roll narrow for medium-long
            if tid in narrow and len(text) > 220 and rng.random() < 0.55:
                tid = rng.choice(roomy)
            assignments[rank] = tid
    return assignments


def font_size(text: str, lang: str, box_h: int, box_w: int) -> int:
    n = len(text)
    lines = text.count("\n") + 1
    if lang == "fa":
        if lines > 20 or n > 700: return 24
        if lines > 14 or n > 450: return 30
        if lines > 8 or n > 280: return 38
        if n > 160: return 48
        if n > 90: return 56
        if n > 50: return 64
        return 72
    else:
        if lines > 20 or n > 800: return 22
        if lines > 14 or n > 500: return 28
        if lines > 8 or n > 320: return 36
        if n > 180: return 46
        if n > 100: return 54
        if n > 55: return 62
        return 68


def build_html(template_id: int, lang: str, quote: str, scale: float = 1.0) -> str:
    import html as html_mod

    cfg = CONFIG[template_id]
    tpl = (TEMPLATES_DIR / f"{template_id}.png").resolve()
    left, top, bw, bh = cfg["box"]
    fa = lang == "fa"
    fs = max(18, int(round(font_size(quote, lang, bh, bw) * scale)))
    body = "<br>".join(html_mod.escape(l) for l in quote.split("\n"))
    align = cfg["align"]
    if fa and align == "start":
        text_align = "right"
    elif align == "start":
        text_align = "left"
    else:
        text_align = "center"
    justify = "center" if align == "center" else ("flex-end" if fa else "flex-start")
    font = "Vazirmatn" if fa else "Literata"
    weight = 600 if fa else 500
    lines = quote.count("\n") + 1
    if lines > 14:
        lh = 1.42 if fa else 1.28
    elif lines > 8:
        lh = 1.55 if fa else 1.35
    else:
        lh = 1.72 if fa else 1.42

    return f'''<!doctype html>
<html lang="{lang}" dir="{"rtl" if fa else "ltr"}">
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,400;7..72,500;7..72,600&display=swap" rel="stylesheet">
<style>
{fonts_css()}
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ background:#111; }}
.card {{
  position:relative; width:{W}px; height:{H}px; overflow:hidden;
  background:#000 url("file://{tpl}") center / cover no-repeat;
}}
.quote {{
  position:absolute; left:{left}px; top:{top}px; width:{bw}px; height:{bh}px;
  display:flex; align-items:center; justify-content:{justify};
  z-index:2; overflow:hidden;
}}
.quote p {{
  font-family:"{font}", Georgia, serif;
  font-size:{fs}px; font-weight:{weight}; line-height:{lh};
  color:{cfg["ink"]}; text-align:{text_align};
  max-width:100%; width:100%;
  text-shadow: {"0 1px 10px rgba(0,0,0,0.45)" if cfg["dark"] else "0 1px 0 rgba(255,255,255,0.15)"};
}}
</style>
</head>
<body>
<section class="card">
  <div class="quote" id="qbox"><p id="qtext">{body}</p></div>
</section>
</body>
</html>'''


def measure_overflow(page) -> bool:
    return page.evaluate("""() => {
      const box = document.getElementById('qbox');
      const p = document.getElementById('qtext');
      if (!box || !p) return true;
      return p.scrollHeight > box.clientHeight + 2 || p.scrollWidth > box.clientWidth + 2;
    }""")


def render_one(page, template_id: int, lang: str, quote: str, out_path: Path, max_tries: int = 8) -> dict:
    """Render with auto font shrink on overflow. Returns QA meta."""
    scale = 1.0
    for attempt in range(1, max_tries + 1):
        html = build_html(template_id, lang, quote, scale=scale)
        html_path = RENDER / f"_tmp-{out_path.stem}.html"
        html_path.write_text(html, encoding="utf-8")
        page.goto(html_path.resolve().as_uri(), wait_until="networkidle")
        page.wait_for_timeout(280)
        overflow = measure_overflow(page)
        if not overflow:
            page.locator(".card").screenshot(path=str(out_path), type="png")
            return {"ok": True, "attempts": attempt, "scale": scale, "overflow": False}
        scale *= 0.86
    page.locator(".card").screenshot(path=str(out_path), type="png")
    return {"ok": False, "attempts": max_tries, "scale": scale, "overflow": True}


def render_all(seed=SEED, only_ranks=None):
    from playwright.sync_api import sync_playwright

    quotes = load_quotes()
    assignments = assign_templates(quotes, seed=seed)
    OUT.mkdir(parents=True, exist_ok=True)
    RENDER.mkdir(parents=True, exist_ok=True)

    ranks = list(range(1, len(quotes) + 1))
    if only_ranks:
        ranks = [r for r in ranks if r in set(only_ranks)]

    manifest = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": W, "height": H})
        for rank in ranks:
            q = quotes[rank - 1]
            tid = assignments[rank]
            entry = {
                "rank": rank,
                "id": q["id"],
                "template": tid,
                "files": {},
                "qa": {},
            }
            for lang in ("fa", "en"):
                out_name = f"q{rank:02d}-{lang}-t{tid}.png"
                out_path = OUT / out_name
                meta = render_one(page, tid, lang, q[lang], out_path)
                entry["files"][lang] = out_name
                entry["qa"][lang] = meta
                status = "OK" if meta["ok"] else "OVERFLOW"
                print(f"q{rank:02d}-{lang} t{tid} [{status}] scale={meta['scale']:.2f}")
            manifest.append(entry)
        browser.close()

    man_path = OUT / "assignments.json"
    # merge if partial
    if man_path.exists() and only_ranks:
        old = json.loads(man_path.read_text(encoding="utf-8"))
        by_rank = {e["rank"]: e for e in old}
        for e in manifest:
            by_rank[e["rank"]] = e
        manifest = [by_rank[r] for r in sorted(by_rank)]
    man_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Done → {OUT} ({len(ranks) * 2} images this run)")
    return manifest


if __name__ == "__main__":
    ranks = [int(x) for x in sys.argv[1:]] or None
    render_all(only_ranks=ranks)
