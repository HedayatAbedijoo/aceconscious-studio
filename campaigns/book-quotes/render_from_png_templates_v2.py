#!/usr/bin/env python3
"""Compose quotes onto PNG templates with safe zones + language alignment.
FA: right-aligned text, block centered in safe box.
EN: left-aligned text, block centered in safe box.
Output → out/quotes-from-templates-v2/
"""
from __future__ import annotations

import json
import random
import sys
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
TEMPLATES_DIR = HERE / "templates"
OUT = HERE / "out" / "quotes-from-templates-v2"
RENDER = HERE / ".render" / "quotes-from-templates-v2"
FONT_DIR = (HERE / ".." / ".." / "assets" / "fonts").resolve()
SEED = 20260726
W, H = 1122, 1402

# Safe quote boxes avoid ink/smoke/circles/logos.
# box = (left, top, width, height)
CONFIG = {
    # parchment + faint silhouette — keep quote ABOVE the faint body outline
    1: dict(ink="#2A211A", box=(160, 300, 800, 520), box_dense=(140, 280, 840, 860), dark=False),
    # dark + smoke on RIGHT — keep text on LEFT half
    2: dict(ink="#F4F0EA", box=(70, 300, 500, 820), box_dense=(70, 280, 520, 900), dark=True),
    # slate border — inner clear panel
    3: dict(ink="#33404C", box=(180, 340, 760, 760), box_dense=(170, 320, 780, 860), dark=False),
    # ink splash + horizontal rule ~y356 — start BELOW rule, stay upper-right
    4: dict(ink="#1A1410", box=(520, 390, 500, 280), box_dense=(520, 390, 500, 280), dark=False),
    # black + gold frame + corner quotes — keep clear of quote marks
    5: dict(ink="#E8C76A", box=(250, 450, 620, 500), box_dense=(230, 420, 660, 700), dark=True),
    # light + circle RIGHT — keep text LEFT, clear of enso
    6: dict(ink="#2C3540", box=(90, 300, 520, 700), box_dense=(80, 280, 560, 820), dark=False),
    # figure on RIGHT — keep text LEFT
    7: dict(ink="#1C1713", box=(70, 300, 500, 780), box_dense=(70, 280, 520, 880), dark=False),
    # enso BOTTOM-RIGHT — keep text UPPER-LEFT, short height clears circle
    8: dict(ink="#33281F", box=(100, 270, 620, 500), box_dense=(100, 270, 620, 560), dark=False),
    # dark + circle CENTER — stay inside circle with padding
    9: dict(ink="#F0EBE3", box=(250, 420, 620, 540), box_dense=(230, 380, 660, 680), dark=True),
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
    rng = random.Random(seed)
    # Prefer templates without heavy ink collisions for dense text
    # Prefer roomy clear templates; graphic-heavy ones only as last-resort fallbacks
    roomy = [1, 3, 5, 6]
    dense_pref = [3, 1, 5]
    deck = []
    while len(deck) < len(quotes) + 40:
        batch = roomy[:]
        rng.shuffle(batch)
        deck.extend(batch)
    out = {}
    for rank, q in enumerate(quotes, 1):
        text = q["fa"] if q["fa"].count("\n") >= q["en"].count("\n") else q["en"]
        if is_dense(text):
            out[rank] = dense_pref[(rank - 1) % len(dense_pref)]
        else:
            out[rank] = deck[rank - 1]
    return out


def is_dense(text: str) -> bool:
    lines = text.count("\n") + 1
    return lines >= 12 or len(text) > 380


def font_size(text: str, lang: str) -> int:
    n = len(text)
    lines = text.count("\n") + 1
    if lang == "fa":
        if lines > 20 or n > 650: return 24
        if lines > 14 or n > 400: return 30
        if lines > 10 or n > 280: return 36
        if lines > 7 or n > 240: return 42
        if n > 140: return 50
        if n > 80: return 58
        if n > 45: return 66
        return 74
    else:
        if lines > 20 or n > 750: return 22
        if lines > 14 or n > 450: return 28
        if lines > 10 or n > 320: return 34
        if lines > 7 or n > 280: return 40
        if n > 160: return 48
        if n > 90: return 56
        if n > 50: return 64
        return 72


def line_height(text: str, lang: str) -> float:
    lines = text.count("\n") + 1
    if lines > 18:
        return 1.28 if lang == "fa" else 1.20
    if lines > 14:
        return 1.38 if lang == "fa" else 1.28
    if lines > 8:
        return 1.58 if lang == "fa" else 1.42
    if lines > 3:
        return 1.72 if lang == "fa" else 1.55
    return 1.85 if lang == "fa" else 1.65


def quote_box(cfg: dict, quote: str) -> tuple[int, int, int, int]:
    if is_dense(quote) and "box_dense" in cfg:
        return cfg["box_dense"]
    return cfg["box"]


def build_html(template_id: int, lang: str, quote: str, scale: float = 1.0) -> str:
    import html as html_mod

    cfg = CONFIG[template_id]
    tpl = (TEMPLATES_DIR / f"{template_id}.png").resolve()
    left, top, bw, bh = quote_box(cfg, quote)
    fa = lang == "fa"
    fs = max(18, int(round(font_size(quote, lang) * scale)))
    lh = line_height(quote, lang)
    body = "<br>".join(html_mod.escape(l) for l in quote.split("\n"))
    # Block centered in safe box; lines hug language start edge (never center/justify)
    text_align = "right" if fa else "left"
    font = "Vazirmatn" if fa else "Literata"
    weight = 600 if fa else 500
    shadow = (
        "0 1px 12px rgba(0,0,0,0.55)"
        if cfg["dark"]
        else "none"
    )

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
  background:#000 url("file://{tpl}") center / {W}px {H}px no-repeat;
}}
.quote {{
  position:absolute; left:{left}px; top:{top}px; width:{bw}px; height:{bh}px;
  display:flex; align-items:center; justify-content:center;
  z-index:2; overflow:hidden; padding:12px 8px;
}}
.quote p {{
  font-family:"{font}", Georgia, serif;
  font-size:{fs}px; font-weight:{weight}; line-height:{lh};
  color:{cfg["ink"]}; text-align:{text_align};
  /* shrink-wrap so the BLOCK can be centered; lines hug language edge */
  width:fit-content; max-width:100%;
  margin:0; white-space:pre-wrap;
  text-shadow:{shadow};
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


def text_rect(page):
    return page.evaluate("""() => {
      const p = document.getElementById('qtext');
      const r = p.getBoundingClientRect();
      return {x:r.x, y:r.y, w:r.width, h:r.height};
    }""")


def glyph_collision(
    template_id: int, rendered: Path, dark_text: bool, rect: dict | None = None
) -> bool:
    """True if rendered text glyphs sit on dark/busy template art."""
    if not rendered.exists():
        return True
    tpl = Image.open(TEMPLATES_DIR / f"{template_id}.png").convert("RGB")
    out = Image.open(rendered).convert("RGB")
    if rect:
        x0 = max(0, int(rect["x"]) - 8)
        y0 = max(0, int(rect["y"]) - 8)
        x1 = min(W, int(rect["x"] + rect["w"]) + 8)
        y1 = min(H, int(rect["y"] + rect["h"]) + 8)
    else:
        x0, y0, x1, y1 = 40, 200, W - 40, H - 80
    bad = 0
    total = 0
    for y in range(y0, y1, 2):
        for x in range(x0, x1, 2):
            rt, gt, bt = tpl.getpixel((x, y))
            ro, go, bo = out.getpixel((x, y))
            lt = 0.2126 * rt + 0.7152 * gt + 0.0722 * bt
            lo = 0.2126 * ro + 0.7152 * go + 0.0722 * bo
            if dark_text:
                # text darkens parchment; flag if underlay is ink/enso/smoke
                if lt - lo > 20 and lo < 95:
                    total += 1
                    if lt < 185:
                        bad += 1
            else:
                # light text on dark card; flag if underlay is too light/ghostly
                if lo - lt > 20 and lo > 150:
                    total += 1
                    if lt > 70:
                        bad += 1
    if total < 30:
        return False
    return (bad / total) > 0.04


def contrast_conflict(template_id: int, rect: dict, dark_text: bool) -> bool:
    """True if text sits on incompatible or busy template pixels."""
    im = Image.open(TEMPLATES_DIR / f"{template_id}.png").convert("RGB")
    x0 = max(0, int(rect["x"]))
    y0 = max(0, int(rect["y"]))
    x1 = min(W, int(rect["x"] + rect["w"]))
    y1 = min(H, int(rect["y"] + rect["h"]))
    if x1 <= x0 or y1 <= y0:
        return True
    crop = im.crop((x0, y0, x1, y1))
    step = max(3, min(crop.size) // 50)
    dark = 0
    light = 0
    busy = 0
    lums = []
    total = 0
    px = crop.load()
    for y in range(0, crop.size[1], step):
        for x in range(0, crop.size[0], step):
            r, g, b = px[x, y]
            lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
            lums.append(lum)
            total += 1
            if lum < 75:
                dark += 1
            if lum > 210:
                light += 1
    if total == 0:
        return True
    lums.sort()
    median = lums[len(lums) // 2]
    for lum in lums:
        # mid-tone graphics (enso, faint ink) on parchment
        if dark_text and lum < median - 28:
            busy += 1
        if (not dark_text) and lum > median + 35:
            busy += 1
    dark_ratio = dark / total
    light_ratio = light / total
    busy_ratio = busy / total
    if dark_text and (dark_ratio > 0.05 or busy_ratio > 0.14):
        return True
    if (not dark_text) and (light_ratio > 0.14 or busy_ratio > 0.16):
        return True
    return False


SAFE_FALLBACKS = [1, 3, 5, 6]


def render_one(page, template_id: int, lang: str, quote: str, out_path: Path) -> dict:
    dark_text = not CONFIG[template_id]["dark"]
    scale = 1.0
    last_meta = {}
    for attempt in range(1, 10):
        html = build_html(template_id, lang, quote, scale=scale)
        html_path = RENDER / f"_tmp-{out_path.stem}.html"
        html_path.write_text(html, encoding="utf-8")
        page.set_viewport_size({"width": W, "height": H})
        page.goto(html_path.resolve().as_uri(), wait_until="networkidle")
        page.wait_for_timeout(280)
        overflow = measure_overflow(page)
        rect = text_rect(page)
        conflict = contrast_conflict(template_id, rect, dark_text=dark_text)
        last_meta = {
            "attempts": attempt,
            "scale": scale,
            "overflow": overflow,
            "conflict": conflict,
            "rect": rect,
            "template": template_id,
            "path": out_path.name,
        }
        if not overflow:
            page.locator(".card").screenshot(path=str(out_path), type="png")
            collide = glyph_collision(template_id, out_path, dark_text, rect)
            last_meta["collision"] = collide
            # Prefer glyph check; rect contrast is a soft signal
            last_meta["ok"] = not collide and not overflow
            if conflict and not collide:
                last_meta["ok"] = True
            return last_meta
        scale *= 0.88
    page.locator(".card").screenshot(path=str(out_path), type="png")
    last_meta["ok"] = False
    last_meta["collision"] = glyph_collision(
        template_id, out_path, dark_text, last_meta.get("rect")
    )
    return last_meta


def render_rank(page, quotes, assignments, rank: int) -> dict:
    q = quotes[rank - 1]
    preferred = assignments[rank]
    candidates = [preferred] + [t for t in SAFE_FALLBACKS if t != preferred]
    entry = {"rank": rank, "id": q["id"], "preferred": preferred, "files": {}, "qa": {}}
    for tid in candidates:
        for old in OUT.glob(f"q{rank:02d}-*.png"):
            old.unlink()
        entry["template"] = tid
        entry["files"] = {}
        entry["qa"] = {}
        ok_both = True
        for lang in ("fa", "en"):
            name = f"q{rank:02d}-{lang}-t{tid}.png"
            path = OUT / name
            meta = render_one(page, tid, lang, q[lang], path)
            entry["files"][lang] = meta.get("path", name)
            entry["qa"][lang] = meta
            collide = meta.get("collision", False)
            print(
                f"q{rank:02d}-{lang} t{tid} ok={meta['ok']} "
                f"overflow={meta['overflow']} conflict={meta['conflict']} "
                f"collide={collide} scale={meta['scale']:.2f}"
            )
            if not meta["ok"]:
                ok_both = False
        if ok_both:
            return entry
    return entry


def main(start: int = 1, end: int = 50):
    from playwright.sync_api import sync_playwright

    quotes = load_quotes()
    assignments = assign_templates(quotes, seed=SEED)
    OUT.mkdir(parents=True, exist_ok=True)
    RENDER.mkdir(parents=True, exist_ok=True)
    manifest_path = OUT / "assignments.json"
    manifest = []
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    by_rank = {e["rank"]: e for e in manifest}

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": W, "height": H})
        for rank in range(start, end + 1):
            entry = render_rank(page, quotes, assignments, rank)
            by_rank[rank] = entry
            manifest_path.write_text(
                json.dumps([by_rank[r] for r in sorted(by_rank)], ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
        browser.close()
    print(f"Rendered ranks {start}-{end} → {OUT}")


if __name__ == "__main__":
    a = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    b = int(sys.argv[2]) if len(sys.argv) > 2 else a
    main(a, b)
