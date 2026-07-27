#!/usr/bin/env python3
"""Generate temporary HTML quote cards for Instagram (1080x1350) and LinkedIn (1080x1080).
Verbatim text only — this script never edits quote text.
Outputs to .render/ for Playwright PNG export."""
import json, os, re, html

HERE = os.path.dirname(os.path.abspath(__file__))
RENDER = os.path.join(HERE, ".render")
EN_CH = "/home/hedayat/ace-novel-projects/ace-await-ebooks-format/english-format/chapters/chapter-{:02d}.md"
FA_CH = "/home/hedayat/ace-novel-projects/ace-await-ebooks-format/farsi-format/chapters/chapter-{:02d}.md"

FA_DIG = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")
SITE = "https://AceConscious.Studio"

SIZES = {
    "ig": (1080, 1350),  # Instagram feed 4:5
    "li": (1080, 1080),  # LinkedIn square
}

# ---------------------------------------------------------------- palettes
# muted, paper-like; text stays dominant. bg / ink (text) / muted / accent / wash
PALETTES = {
    "parchment": dict(bg="#e8dcc8", ink="#26211b", muted="#5c5348", accent="#8a6d3b", wash="rgba(138,109,59,0.16)", dark=False),
    "sage":      dict(bg="#dde3d1", ink="#20281d", muted="#4f5c48", accent="#5a7350", wash="rgba(90,115,80,0.16)",  dark=False),
    "mist":      dict(bg="#d8e1e8", ink="#1e2730", muted="#48586a", accent="#4a6b82", wash="rgba(74,107,130,0.16)", dark=False),
    "rose":      dict(bg="#e9dbdc", ink="#2e2124", muted="#6b4f55", accent="#96606a", wash="rgba(150,96,106,0.15)", dark=False),
    "lavender":  dict(bg="#e0dde9", ink="#252333", muted="#565073", accent="#6b628f", wash="rgba(107,98,143,0.15)", dark=False),
    "terracotta":dict(bg="#ecdccd", ink="#2f231b", muted="#6e5442", accent="#a5643c", wash="rgba(165,100,60,0.14)", dark=False),
    "teal":      dict(bg="#d4e3e0", ink="#1d2b28", muted="#436058", accent="#3f7268", wash="rgba(63,114,104,0.16)", dark=False),
    "golden":    dict(bg="#ece2c6", ink="#2b2414", muted="#6a5c33", accent="#a0812a", wash="rgba(160,129,42,0.16)", dark=False),
    "midnight":  dict(bg="#171d27", ink="#dde5ee", muted="#8fa0b4", accent="#7eb8da", wash="rgba(126,184,218,0.10)", dark=True),
    "charcoal":  dict(bg="#1b1713", ink="#e8dcc8", muted="#a89a80", accent="#d4a842", wash="rgba(212,168,66,0.10)", dark=True),
}

# ------------------------------------------------------------------ motifs
def _svg(inner, w=900, h=900):
    return (f'<svg viewBox="0 0 {w} {h}" width="{w}" height="{h}" fill="none" '
            f'xmlns="http://www.w3.org/2000/svg">{inner}</svg>')

def motif_svg(kind, c):
    s = f'stroke="{c}"'
    if kind == "butterfly":
        return _svg(f'''<g {s} stroke-width="3">
          <path d="M450 430 C330 260 150 220 130 340 C112 448 300 520 442 470"/>
          <path d="M450 430 C570 260 750 220 770 340 C788 448 600 520 458 470"/>
          <path d="M446 468 C350 560 260 640 292 700 C322 756 420 640 448 540"/>
          <path d="M454 468 C550 560 640 640 608 700 C578 756 480 640 452 540"/>
          <path d="M450 420 C444 500 444 560 450 620"/>
          <path d="M446 416 C420 380 400 350 392 320 M454 416 C480 380 500 350 508 320"/>
        </g>''')
    if kind == "path":
        return _svg(f'''<g {s} stroke-width="3" stroke-dasharray="2 26" stroke-linecap="round">
          <path d="M120 810 C300 700 240 560 400 500 C580 434 520 300 700 240 C760 220 800 190 820 150"/>
          <path d="M400 500 C470 560 560 620 720 640"/>
        </g>
        <circle cx="120" cy="810" r="7" fill="{c}"/>
        <circle cx="820" cy="150" r="7" fill="{c}"/>
        <circle cx="720" cy="640" r="7" fill="{c}"/>''')
    if kind == "network":
        pts = [(190,230),(420,150),(700,210),(830,420),(690,690),(420,780),(180,640),(320,430),(560,420),(760,560)]
        dots = "".join(f'<circle cx="{x}" cy="{y}" r="8" fill="{c}"/>' for x, y in pts)
        edges = [(0,1),(1,2),(2,3),(3,9),(9,4),(4,5),(5,6),(6,7),(7,0),(7,8),(8,1),(8,3),(8,5),(9,8),(6,8)]
        lines = "".join(f'<line x1="{pts[a][0]}" y1="{pts[a][1]}" x2="{pts[b][0]}" y2="{pts[b][1]}" {s} stroke-width="2.5"/>' for a, b in edges)
        return _svg(lines + dots)
    if kind == "console":
        return _svg(f'''<g {s} stroke-width="3">
          <rect x="140" y="240" width="620" height="420" rx="18"/>
          <line x1="140" y1="316" x2="760" y2="316"/>
          <circle cx="186" cy="278" r="9"/><circle cx="228" cy="278" r="9"/><circle cx="270" cy="278" r="9"/>
          <path d="M200 400 L260 450 L200 500" stroke-width="4"/>
          <line x1="300" y1="500" x2="430" y2="500" stroke-width="4"/>
        </g>''')
    if kind == "spiral":
        return _svg(f'''<g {s} stroke-width="3">
          <path d="M450 450 C450 400 520 400 520 450 C520 520 420 520 420 440 C420 340 560 340 560 460 C560 600 380 600 380 430 C380 250 620 250 620 470 C620 700 340 700 340 420 C340 190 680 190 680 480"/>
          <line x1="450" y1="450" x2="450" y2="330" stroke-width="4"/>
          <line x1="450" y1="450" x2="540" y2="500" stroke-width="4"/>
        </g>''')
    if kind == "mirror":
        return _svg(f'''<g {s} stroke-width="3">
          <path d="M300 220 C180 340 180 560 300 680"/>
          <path d="M600 220 C720 340 720 560 600 680"/>
          <line x1="450" y1="180" x2="450" y2="720" stroke-dasharray="3 22" stroke-linecap="round"/>
          <circle cx="360" cy="450" r="10" fill="{c}"/><circle cx="540" cy="450" r="10"/>
        </g>''')
    if kind == "pendulum":
        return _svg(f'''<g {s} stroke-width="3">
          <line x1="450" y1="160" x2="450" y2="170"/>
          <path d="M450 165 L260 620" stroke-dasharray="3 20" stroke-linecap="round"/>
          <path d="M450 165 L640 620"/>
          <circle cx="640" cy="650" r="34"/>
          <circle cx="260" cy="650" r="34" stroke-dasharray="3 14"/>
          <path d="M300 740 C400 790 500 790 600 740" stroke-dasharray="2 18" stroke-linecap="round"/>
        </g>''')
    if kind == "horizon":
        return _svg(f'''<g {s} stroke-width="3">
          <line x1="120" y1="600" x2="780" y2="600"/>
          <circle cx="450" cy="600" r="150" stroke-dasharray="0"/>
          <path d="M450 380 A220 220 0 0 1 670 600" stroke-dasharray="3 20" stroke-linecap="round"/>
          <path d="M230 600 A220 220 0 0 1 450 380" stroke-dasharray="3 20" stroke-linecap="round"/>
          <line x1="200" y1="680" x2="700" y2="680" stroke-dasharray="2 24" stroke-linecap="round"/>
          <line x1="260" y1="740" x2="640" y2="740" stroke-dasharray="2 30" stroke-linecap="round"/>
        </g>''')
    if kind == "heart":
        return _svg(f'''<g {s} stroke-width="3">
          <path d="M450 660 C260 520 220 380 300 300 C360 240 440 260 450 330 C460 260 540 240 600 300 C680 380 640 520 450 660"/>
          <path d="M140 480 L300 480 L340 420 L390 540 L430 480 L470 480" stroke-width="2.5"/>
          <path d="M450 660 C450 700 450 740 450 780" stroke-dasharray="2 20" stroke-linecap="round"/>
        </g>''')
    if kind == "branches":
        return _svg(f'''<g {s} stroke-width="3">
          <path d="M450 780 C450 640 450 560 450 470 C450 350 380 300 300 260 M450 470 C450 380 540 330 620 290 M450 600 C400 560 340 540 280 540 M450 560 C510 520 580 500 650 500"/>
          <circle cx="300" cy="250" r="12"/><circle cx="628" cy="282" r="12"/>
          <circle cx="272" cy="540" r="9"/><circle cx="658" cy="498" r="9"/>
          <path d="M330 800 C410 770 490 770 570 800" stroke-dasharray="2 16" stroke-linecap="round"/>
        </g>''')
    if kind == "scales":
        return _svg(f'''<g {s} stroke-width="3">
          <line x1="450" y1="200" x2="450" y2="640"/>
          <line x1="240" y1="280" x2="660" y2="280"/>
          <path d="M240 280 L190 440 M240 280 L290 440 M190 440 A50 34 0 0 0 290 440"/>
          <path d="M660 280 L610 470 M660 280 L710 470 M610 470 A50 34 0 0 0 710 470"/>
          <path d="M360 700 L540 700 M330 640 L570 640" />
          <circle cx="450" cy="200" r="12"/>
        </g>''')
    if kind == "waves":
        return _svg(f'''<g {s} stroke-width="3" stroke-linecap="round">
          <path d="M140 360 C240 300 340 300 450 360 C560 420 660 420 760 360"/>
          <path d="M140 470 C240 410 340 410 450 470 C560 530 660 530 760 470" stroke-dasharray="3 18"/>
          <path d="M140 580 C240 520 340 520 450 580 C560 640 660 640 760 580" stroke-dasharray="2 26"/>
          <circle cx="450" cy="252" r="9" fill="{c}"/>
        </g>''')
    if kind == "compass":
        return _svg(f'''<g {s} stroke-width="3">
          <circle cx="450" cy="450" r="270"/>
          <circle cx="450" cy="450" r="238" stroke-dasharray="3 20" stroke-linecap="round"/>
          <path d="M450 260 L500 500 L450 640 L400 500 Z"/>
          <circle cx="450" cy="450" r="14" fill="{c}"/>
          <line x1="450" y1="150" x2="450" y2="190"/><line x1="450" y1="710" x2="450" y2="750"/>
          <line x1="150" y1="450" x2="190" y2="450"/><line x1="710" y1="450" x2="750" y2="450"/>
        </g>''')
    if kind == "ledger":
        rows = "".join(f'<line x1="180" y1="{y}" x2="720" y2="{y}" {s} stroke-width="2.5" stroke-dasharray="{"0" if i%3 else "3 14"}"/>' for i, y in enumerate(range(260, 700, 62)))
        return _svg(f'''<g {s} stroke-width="3">
          <rect x="150" y="190" width="600" height="560" rx="10"/>
          <line x1="560" y1="190" x2="560" y2="750"/>
        </g>{rows}''')
    raise KeyError(kind)

# --------------------------------------------------- per-quote art direction
ART = {
    12:("sage","butterfly"), 13:("terracotta","path"), 14:("midnight","network"),
    45:("rose","mirror"), 66:("teal","waves"), 69:("mist","horizon"),
    80:("charcoal","spiral"), 96:("golden","compass"),
    1:("parchment","console"), 8:("lavender","mirror"), 35:("sage","branches"),
    37:("mist","mirror"), 38:("midnight","network"), 42:("rose","heart"),
    51:("lavender","waves"), 54:("terracotta","scales"), 58:("terracotta","spiral"),
    61:("golden","waves"), 62:("sage","path"), 64:("terracotta","horizon"),
    73:("lavender","heart"), 85:("golden","branches"), 89:("parchment","mirror"),
    90:("sage","spiral"), 93:("mist","console"), 94:("midnight","network"),
    4:("mist","scales"), 7:("rose","waves"), 16:("mist","waves"),
    18:("golden","path"), 19:("parchment","compass"), 23:("teal","scales"),
    27:("lavender","pendulum"), 33:("terracotta","branches"), 44:("golden","heart"),
    47:("parchment","branches"), 48:("parchment","branches"), 50:("teal","waves"),
    57:("golden","path"), 60:("rose","heart"), 70:("lavender","waves"),
    74:("mist","spiral"), 77:("charcoal","scales"), 81:("sage","horizon"),
    86:("midnight","ledger"), 40:("teal","path"), 71:("golden","horizon"),
    75:("lavender","horizon"), 79:("mist","path"), 84:("teal","console"),
}

def chapter_title(path_tpl, ch):
    with open(path_tpl.format(ch), encoding="utf-8") as f:
        first = f.readline()
    t = re.sub(r"^#\s*", "", first)
    return re.sub(r"\s*\{[^}]*\}\s*$", "", t.strip()).strip()

def font_size(text, lang, is_verse, platform):
    """Larger readable sizes; quote text is the dominant element.
    LinkedIn square gets a modest scale-down for vertical space.
    Long verse is capped so it never overflows the card."""
    n = len(text)
    if is_verse:
        lines = text.count("\n") + 1
        # Count blank lines lightly — visual density is driven by non-empty rows
        nonempty = sum(1 for l in text.split("\n") if l.strip())
        density = max(lines, nonempty + nonempty // 3)
        if density > 22:
            fs = 28 if lang == "fa" else 26
        elif density > 18:
            fs = 32 if lang == "fa" else 28
        elif density > 14:
            fs = 38 if lang == "fa" else 34
        elif density > 8:
            fs = 46 if lang == "fa" else 40
        else:
            fs = 56 if lang == "fa" else 48
    elif lang == "fa":
        if n < 60:   fs = 86
        elif n < 120: fs = 72
        elif n < 210: fs = 58
        elif n < 330: fs = 50
        elif n < 520: fs = 42
        else:         fs = 36
    else:
        if n < 70:   fs = 76
        elif n < 150: fs = 64
        elif n < 260: fs = 52
        elif n < 420: fs = 44
        elif n < 640: fs = 38
        else:         fs = 34

    if platform == "li":
        # Allow slightly smaller floor for dense verse on square canvas
        floor = 24 if is_verse and text.count("\n") >= 18 else 30
        fs = max(floor, int(round(fs * 0.88)))

    # Final height clamp: keep quote inside mid area
    # Available mid height ≈ 1098 (ig) / 856 (li); leave cushion for qmark
    avail = 980 if platform == "ig" else 740
    lines = text.count("\n") + 1 if is_verse else 0
    if is_verse and lines >= 18:
        lh = 1.55 if lang == "fa" else 1.38
    else:
        lh = 1.78 if lang == "fa" else 1.52
    if is_verse:
        while fs > 18 and fs * lh * lines > avail:
            fs -= 1
    else:
        # rough wrap estimate at ~28 chars/line fa, ~42 en for ~900px width
        cpl = 28 if lang == "fa" else 42
        est_lines = max(1, -(-n // cpl))  # ceil
        while fs > 26 and fs * lh * est_lines > avail:
            fs -= 1
    return fs

def css_for(platform):
    w, h = SIZES[platform]
    # Absolute font paths so file:// screenshots resolve fonts
    font_dir = os.path.join(HERE, "..", "..", "assets", "fonts")
    font_dir = os.path.abspath(font_dir)
    pad_y = 36 if platform == "li" else 42
    pad_x = 52 if platform == "li" else 66
    head_fs = 22 if platform == "li" else 25
    ch_fs = 20 if platform == "li" else 23
    qmark_fs = 96 if platform == "li" else 120
    brand_fs = 26 if platform == "li" else 29
    site_fs = 19 if platform == "li" else 21
    frame_inset = 28 if platform == "li" else 32
    return f"""
  @font-face {{ font-family:"Vazirmatn"; src:url("file://{font_dir}/Vazirmatn-Regular.woff2") format("woff2"); font-weight:400; }}
  @font-face {{ font-family:"Vazirmatn"; src:url("file://{font_dir}/Vazirmatn-Medium.woff2") format("woff2"); font-weight:500; }}
  @font-face {{ font-family:"Vazirmatn"; src:url("file://{font_dir}/Vazirmatn-SemiBold.woff2") format("woff2"); font-weight:600; }}
  :root {{ --serif:"Literata", Georgia, "Times New Roman", serif; --fa:"Vazirmatn", Tahoma, sans-serif; --mono:"JetBrains Mono", "Courier New", monospace; }}
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  body {{ background:#111; margin:0; }}
  .slide {{ position:relative; width:{w}px; height:{h}px; overflow:hidden; display:none;
           background:var(--bg); color:var(--ink); }}
  .slide.active {{ display:block; }}
  .slide::before {{ content:""; position:absolute; inset:0; z-index:1;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/></svg>");
    mix-blend-mode:multiply; opacity:0.42; pointer-events:none; }}
  .slide.dark::before {{ mix-blend-mode:screen; opacity:0.28; }}
  .slide::after {{ content:""; position:absolute; inset:0; z-index:1; pointer-events:none;
    background:
      radial-gradient(120% 60% at 50% -10%, var(--wash) 0%, transparent 60%),
      radial-gradient(150% 130% at 50% 60%, transparent 55%, rgba(0,0,0,0.10) 100%); }}
  .frame {{ position:absolute; inset:{frame_inset}px; z-index:2; border:1.5px solid var(--ink); opacity:0.85; pointer-events:none; }}
  .frame::after {{ content:""; position:absolute; inset:7px; border:1px solid var(--ink); opacity:0.30; }}
  .motif {{ position:absolute; z-index:2; left:50%; top:52%; transform:translate(-50%,-50%);
           opacity:var(--motif-op,0.11); pointer-events:none; }}
  .motif svg {{ width:780px; height:780px; max-width:88%; }}
  .content {{ position:absolute; inset:{frame_inset}px; z-index:3; display:flex; flex-direction:column; padding:{pad_y}px {pad_x}px {pad_y - 6}px; }}
  .head {{ display:flex; align-items:baseline; justify-content:space-between; gap:20px;
          padding-bottom:14px; border-bottom:1px solid color-mix(in srgb, var(--ink) 40%, transparent); }}
  .head__label {{ font-size:{head_fs}px; font-weight:500; color:var(--muted); letter-spacing:0.02em; white-space:nowrap; }}
  .head__label b {{ font-family:var(--serif); font-weight:600; color:var(--ink); letter-spacing:0.01em; direction:ltr; unicode-bidi:embed; }}
  .head__ch {{ font-size:{ch_fs}px; font-weight:400; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:44%; }}
  .mid {{ flex:1; min-height:0; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:8px; }}
  .qmark {{ font-family:var(--fa); font-size:{qmark_fs}px; line-height:0.55; color:var(--accent); opacity:0.38; }}
  html[dir="ltr"] .qmark {{ font-family:var(--serif); }}
  .quote {{ max-width:940px; font-weight:600; color:var(--ink); }}
  .quote.center {{ text-align:center; }}
  .quote.justify {{ text-align:justify; }}
  html[dir="rtl"] .quote {{ font-family:var(--fa); line-height:1.78; font-weight:600; }}
  html[dir="ltr"] .quote {{ font-family:var(--serif); line-height:1.52; font-weight:500; }}
  .foot {{ margin-top:auto; display:flex; align-items:baseline; justify-content:space-between; gap:16px;
          padding-top:14px; border-top:1px solid color-mix(in srgb, var(--ink) 40%, transparent); }}
  .foot__brand {{ font-family:var(--serif); font-size:{brand_fs}px; font-weight:600; color:var(--ink); direction:ltr; }}
  .foot__brand span {{ opacity:0.55; font-weight:400; }}
  .foot__site {{ font-family:var(--mono); font-size:{site_fs}px; color:var(--muted); direction:ltr; letter-spacing:0.01em; white-space:nowrap; }}
"""

SCRIPT = """
  function show() {
    var n = (location.hash || "#1").replace("#", "");
    document.querySelectorAll(".slide").forEach(function (s) { s.classList.remove("active"); });
    var el = document.getElementById("s" + n);
    if (el) el.classList.add("active");
  }
  window.addEventListener("hashchange", show);
  show();
"""

def load_selected():
    with open(os.path.join(HERE, "quotes-50.json"), encoding="utf-8") as f:
        sel = json.load(f)["selected"]
    return sorted(sel, key=lambda x: (-x["score"], x["chapter"]))

def build(lang, platform):
    sel = load_selected()
    w, h = SIZES[platform]
    rtl = lang == "fa"
    slides = []
    for rank, it in enumerate(sel, 1):
        pal_name, motif = ART[it["id"]]
        p = PALETTES[pal_name]
        text = it["fa"] if rtl else it["en"]
        is_verse = "\n" in text
        fs = font_size(text, lang, is_verse, platform)
        body = "<br>".join(html.escape(l) for l in text.split("\n"))
        align = "center" if (is_verse or len(text) < 220) else "justify"
        ch = it["chapter"]
        if rtl:
            label = 'نقل‌قولی از رمانِ <b>ACE.await</b>'
            ch_label = f'فصل {str(ch).translate(FA_DIG)} · {html.escape(chapter_title(FA_CH, ch))}'
            qmark = "«"
        else:
            label = 'A quote from the novel <b>ACE.await</b>'
            ch_label = f'Ch. {ch} · {html.escape(chapter_title(EN_CH, ch))}'
            qmark = "“"
        motif_html = motif_svg(motif, p["accent"])
        dark_cls = " dark" if p["dark"] else ""
        motif_op = "0.14" if p["dark"] else "0.10"
        maxw = "960px" if fs <= 40 else "920px"
        lines_n = text.count("\n") + 1
        # Dense verse: smaller decorative quote + tighter leading
        if is_verse and lines_n >= 18:
            qmark_style = ' style="font-size:48px; opacity:0.28; line-height:0.4;"'
            lh = 1.55 if rtl else 1.38
            quote_extra = f" line-height:{lh};"
        elif is_verse and lines_n >= 12:
            qmark_style = ' style="font-size:72px; opacity:0.32;"'
            quote_extra = ""
        else:
            qmark_style = ""
            quote_extra = ""
        slides.append(f'''
<section class="slide{dark_cls}" id="s{rank}" style="--bg:{p['bg']}; --ink:{p['ink']}; --muted:{p['muted']}; --accent:{p['accent']}; --wash:{p['wash']}; --motif-op:{motif_op};">
  <div class="frame"></div>
  <div class="motif">{motif_html}</div>
  <div class="content">
    <div class="head">
      <p class="head__label">{label}</p>
      <p class="head__ch">{ch_label}</p>
    </div>
    <div class="mid">
      <div class="qmark"{qmark_style}>{qmark}</div>
      <p class="quote {align}" style="font-size:{fs}px; max-width:{maxw};{quote_extra}">{body}</p>
    </div>
    <div class="foot">
      <p class="foot__brand">ACE.<span>await</span></p>
      <p class="foot__site">{SITE}</p>
    </div>
  </div>
</section>''')

    doc = f'''<!doctype html>
<html lang="{lang}" dir="{"rtl" if rtl else "ltr"}">
<head>
<meta charset="utf-8">
<title>ACE.await — quote cards ({lang.upper()} / {platform})</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,400;7..72,500;7..72,600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>{css_for(platform)}</style>
</head>
<body>
{"".join(slides)}
<script>{SCRIPT}</script>
</body>
</html>'''
    os.makedirs(RENDER, exist_ok=True)
    out = os.path.join(RENDER, f"slides-{lang}-{platform}.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(doc)
    print(f"{out}: {len(sel)} slides ({w}x{h})")
    return out

def build_all():
    paths = []
    for lang in ("fa", "en"):
        for platform in ("ig", "li"):
            paths.append(build(lang, platform))
    return paths

if __name__ == "__main__":
    build_all()
