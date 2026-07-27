#!/usr/bin/env python3
"""Series V2 — 10 more artistic literary templates WITH book logo.
Does NOT overwrite v1 templates. Outputs to .render/templates-v2/."""
import html as html_mod
from pathlib import Path

HERE = Path(__file__).resolve().parent
RENDER = HERE / ".render" / "templates-v2"
FONT_DIR = (HERE / ".." / ".." / "assets" / "fonts").resolve()
LOGO = (HERE / ".." / ".." / "assets" / "logo-icon.png").resolve()
SITE = "https://AceConscious.Studio"
W, H = 1080, 1350

SAMPLE = {
    "fa": "من به پروانه‌ها بیشتر از الگوریتم‌ها اعتماد دارم.",
    "en": "I trust butterflies more than I trust algorithms.",
}


def resolve_quote(lang, quote=None):
    fa = lang == "fa"
    q = SAMPLE[lang] if quote is None else quote
    return q, fa


def quote_font_size(text, lang, base_fa, base_en):
    """Scale down only for long quotes — keeps short lines large."""
    n = len(text)
    lines = text.count("\n") + 1
    base = base_fa if lang == "fa" else base_en
    if lines > 18 or n > 700:
        return max(28, int(round(base * 0.40)))
    if lines > 12 or n > 450:
        return max(32, int(round(base * 0.52)))
    if lines > 6 or n > 280:
        return max(38, int(round(base * 0.66)))
    if n > 160:
        return max(46, int(round(base * 0.80)))
    if n > 90:
        return max(54, int(round(base * 0.90)))
    return base


def quote_html(text, lang, base_fa, base_en):
    fs = quote_font_size(text, lang, base_fa, base_en)
    body = "<br>".join(html_mod.escape(l) for l in text.split("\n"))
    return fs, body


TEMPLATES = [
    {"id": "v2-01-silhouette-aura", "name": "Silhouette Aura", "blurb": "لوگوی بزرگ محو در مرکز نور؛ هالهٔ نقاشانه"},
    {"id": "v2-02-ink-portrait", "name": "Ink Portrait", "blurb": "لوگو کنار متن؛ پاشش جوهر؛ ترکیب نامتقارن"},
    {"id": "v2-03-velvet-stage", "name": "Velvet Stage", "blurb": "صحنهٔ مخملی تیره؛ لوگو مثل نشان تئاتر ادبی"},
    {"id": "v2-04-parchment-crest", "name": "Parchment Crest", "blurb": "لوگو به‌عنوان نشان بالای صفحهٔ پوستی"},
    {"id": "v2-05-split-mind", "name": "Split Mind", "blurb": "نیم‌صفحه لوگو / نیم‌صفحه نقل‌قول؛ دوگانگی رمان"},
    {"id": "v2-06-gold-leaf", "name": "Gold Leaf", "blurb": "برگ طلا روی زمینهٔ عمیق؛ لوگو طلاکوب"},
    {"id": "v2-07-brush-storm", "name": "Brush Storm", "blurb": "ضربه‌قلم‌های زنده اطراف لوگو و متن"},
    {"id": "v2-08-moonlit-seal", "name": "Moonlit Seal", "blurb": "مهر لوگوی ماه‌تاب؛ شب شاعرانه"},
    {"id": "v2-09-atelier", "name": "Atelier Wall", "blurb": "دیوار کارگاه نویسنده؛ لوگو مثل تابلوی آویخته"},
    {"id": "v2-10-echo", "name": "Echo Layers", "blurb": "چند لایه لوگوی محو؛ پژواک هویت کتاب"},
]


def fonts_css():
    return f"""
@font-face {{ font-family:"Vazirmatn"; src:url("file://{FONT_DIR}/Vazirmatn-Regular.woff2") format("woff2"); font-weight:400; }}
@font-face {{ font-family:"Vazirmatn"; src:url("file://{FONT_DIR}/Vazirmatn-Medium.woff2") format("woff2"); font-weight:500; }}
@font-face {{ font-family:"Vazirmatn"; src:url("file://{FONT_DIR}/Vazirmatn-SemiBold.woff2") format("woff2"); font-weight:600; }}
"""


def grain(opacity=0.4, dark=False):
    blend = "screen" if dark else "multiply"
    return f'''<div style="position:absolute;inset:0;z-index:5;pointer-events:none;mix-blend-mode:{blend};opacity:{opacity};background-image:url(&quot;data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/></svg>&quot;);"></div>'''


def logo_img(variant="dark", size=220, extra=""):
    """variant: dark (for light bg) | light (for dark bg via CSS invert)."""
    filt = "filter:brightness(0) invert(1);" if variant == "light" else ""
    return f'<img src="file://{LOGO}" alt="ACE.await" style="width:{size}px;height:{size}px;object-fit:contain;{filt}{extra}"/>'


def shell(tid, inner, lang="fa"):
    return f'''<!doctype html>
<html lang="{lang}" dir="{"rtl" if lang == "fa" else "ltr"}">
<head>
<meta charset="utf-8">
<title>{tid}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,500;0,7..72,600;0,7..72,700;1,7..72,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
{fonts_css()}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{background:#111}}
.card{{position:relative;width:{W}px;height:{H}px;overflow:hidden}}
</style>
</head>
<body>{inner}</body>
</html>'''


def t01(lang="fa", quote=None):
    q, fa = resolve_quote(lang, quote)
    fs, body = quote_html(q, lang, 82, 68)
    return f'''
<section class="card" style="background:#1a1210;color:#f3e8d4;">
  <div style="position:absolute;inset:0;background:
    radial-gradient(ellipse 70% 55% at 50% 42%, rgba(200,140,70,0.22), transparent 58%),
    radial-gradient(ellipse 90% 70% at 50% 100%, rgba(0,0,0,0.5), transparent 50%),
    linear-gradient(180deg,#2a1c14,#120e0c);"></div>
  <div style="position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);opacity:0.22;z-index:1;">
    {logo_img("light", 720, "mix-blend-mode:screen;")}
  </div>
  {grain(0.25, True)}
  <div style="position:absolute;inset:0;z-index:6;display:flex;flex-direction:column;padding:64px 72px 56px;">
    <div style="display:flex;justify-content:center;">{logo_img("light", 96, "opacity:0.92;")}</div>
    <p style="font-family:Cormorant Garamond,serif;font-size:42px;letter-spacing:0.04em;text-align:center;color:#e0c080;margin-top:10px;">ACE.<span style="font-weight:400;text-transform:none;font-variant:normal;">await</span></p>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;text-align:center;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},serif;font-size:{fs}px;font-weight:{600 if fa else 500};line-height:{1.68 if fa else 1.38};max-width:860px;text-shadow:0 4px 40px rgba(0,0,0,0.45);">{body}</p>
    </div>
    <div style="text-align:center;">
      <p style="font-family:'JetBrains Mono',monospace;font-size:23px;color:#a89468;">{SITE}</p>
    </div>
  </div>
</section>'''


def t02(lang="fa", quote=None):
    q, fa = resolve_quote(lang, quote)
    fs, body = quote_html(q, lang, 78, 64)
    return f'''
<section class="card" style="background:#f2ebe0;color:#1a1612;">
  <div style="position:absolute;inset:0;background:
    radial-gradient(ellipse 50% 40% at 0% 0%, rgba(40,50,60,0.16), transparent 55%),
    radial-gradient(ellipse 45% 35% at 100% 100%, rgba(140,70,40,0.14), transparent 50%),
    linear-gradient(145deg,#f6f0e6,#ebe2d4);"></div>
  <svg viewBox="0 0 1080 1350" style="position:absolute;inset:0;width:100%;height:100%;z-index:1;opacity:0.55;" fill="none">
    <path d="M-30 260 C80 120 220 300 140 420 C80 520 -10 540 -40 460" fill="rgba(30,40,50,0.35)"/>
    <path d="M900 200 C980 140 1080 220 1040 320 C1010 390 940 370 900 300" fill="rgba(30,40,50,0.22)"/>
    <path d="M980 1180 C860 1060 740 1200 820 1300 C880 1360 1020 1340 1100 1240" fill="rgba(120,60,40,0.28)"/>
    <path d="M60 900 C40 980 80 1060 40 1140" stroke="rgba(30,40,50,0.35)" stroke-width="16" stroke-linecap="round"/>
    <path d="M120 860 C90 960 140 1040 100 1160" stroke="rgba(30,40,50,0.18)" stroke-width="8" stroke-linecap="round"/>
    <circle cx="200" cy="700" r="18" fill="rgba(30,40,50,0.2)"/>
    <circle cx="860" cy="980" r="12" fill="rgba(120,60,40,0.25)"/>
  </svg>
  <div style="position:absolute;{'left' if not fa else 'right'}:48px;bottom:180px;z-index:3;opacity:0.88;transform:rotate({'-6' if fa else '6'}deg);">
    {logo_img("dark", 280)}
  </div>
  {grain(0.32)}
  <div style="position:absolute;inset:0;z-index:6;display:flex;flex-direction:column;padding:72px 68px 56px;">
    <p style="font-family:Cormorant Garamond,serif;font-size:36px;letter-spacing:0.04em;color:#6a5a48;">ACE.<span style="font-weight:400;text-transform:none;font-variant:normal;">await</span></p>
    <div style="flex:1;display:flex;align-items:center;{'justify-content:flex-start;padding-left:20px;padding-right:300px' if not fa else 'justify-content:flex-start;padding-right:20px;padding-left:300px'};">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},serif;font-size:{fs}px;font-weight:{600 if fa else 500};line-height:{1.65 if fa else 1.35};max-width:720px;">{body}</p>
    </div>
    <div style="text-align:center;">
      <p style="font-family:'JetBrains Mono',monospace;font-size:23px;color:#6a5a48;">{SITE}</p>
    </div>
  </div>
</section>'''


def t03(lang="fa", quote=None):
    q, fa = resolve_quote(lang, quote)
    fs, body = quote_html(q, lang, 82, 68)
    return f'''
<section class="card" style="background:#140c14;color:#f2e6dc;">
  <div style="position:absolute;inset:0;background:
    radial-gradient(ellipse 80% 50% at 50% 0%, rgba(160,60,80,0.28), transparent 55%),
    radial-gradient(ellipse 70% 55% at 50% 70%, rgba(80,40,90,0.2), transparent 60%),
    linear-gradient(180deg,#241018,#140c14 50%,#0c080c);"></div>
  <div style="position:absolute;top:0;left:0;right:0;height:56px;background:#0a060a;z-index:2;"></div>
  <div style="position:absolute;bottom:0;left:0;right:0;height:56px;background:#0a060a;z-index:2;"></div>
  <div style="position:absolute;top:72px;left:50%;transform:translateX(-50%);z-index:3;">
    {logo_img("light", 130, "opacity:0.9;")}
  </div>
  {grain(0.22, True)}
  <div style="position:absolute;inset:56px 0;z-index:6;display:flex;flex-direction:column;padding:150px 76px 40px;">
    <p style="font-family:Cormorant Garamond,serif;font-size:42px;font-weight:600;letter-spacing:0.04em;color:#f2e6dc;text-align:center;">ACE.<span style="font-weight:400;text-transform:none;font-variant:normal;">await</span></p>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;text-align:center;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},serif;font-size:{fs}px;font-weight:{600 if fa else 500};line-height:{1.68 if fa else 1.38};max-width:860px;">{body}</p>
    </div>
    <div style="text-align:center;border-top:1px solid rgba(224,160,176,0.25);padding-top:18px;">
      <p style="font-family:'JetBrains Mono',monospace;font-size:23px;color:#a08088;">{SITE}</p>
    </div>
  </div>
</section>'''


def t04(lang="fa", quote=None):
    q, fa = resolve_quote(lang, quote)
    fs, body = quote_html(q, lang, 80, 66)
    return f'''
<section class="card" style="background:#e8d8b8;color:#241c14;">
  <div style="position:absolute;inset:0;background:
    radial-gradient(ellipse at 20% 10%, rgba(160,100,40,0.12), transparent 40%),
    radial-gradient(ellipse at 90% 80%, rgba(100,70,40,0.14), transparent 45%),
    linear-gradient(180deg,#f0e4c8,#e2d0a8 70%,#d8c498);"></div>
  {grain(0.5)}
  <div style="position:absolute;inset:44px;border:2px solid rgba(60,40,20,0.35);z-index:2;"></div>
  <div style="position:absolute;inset:56px;border:1px solid rgba(60,40,20,0.18);z-index:2;"></div>
  <div style="position:absolute;top:78px;left:50%;transform:translateX(-50%);z-index:4;text-align:center;">
    {logo_img("dark", 150)}
  </div>
  <div style="position:absolute;inset:0;z-index:6;display:flex;flex-direction:column;padding:250px 88px 80px;">
    <p style="font-family:Cormorant Garamond,serif;font-size:38px;letter-spacing:0.04em;color:#6a4e30;text-align:center;">ACE.<span style="font-weight:400;text-transform:none;font-variant:normal;">await</span></p>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;text-align:center;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},serif;font-size:{fs}px;font-weight:{600 if fa else 500};line-height:{1.68 if fa else 1.36};max-width:840px;">{body}</p>
    </div>
    <div style="text-align:center;">
      <p style="font-family:'JetBrains Mono',monospace;font-size:23px;color:#7a5e40;">{SITE}</p>
    </div>
  </div>
</section>'''


def t05(lang="fa", quote=None):
    q, fa = resolve_quote(lang, quote)
    fs, body = quote_html(q, lang, 68, 56)
    # logo panel on start side (right in RTL)
    return f'''
<section class="card" style="background:#0f1418;color:#e8e4dc;">
  <div style="position:absolute;top:0;bottom:0;{'right' if fa else 'left'}:0;width:38%;background:
    linear-gradient(180deg,#1c242c,#12181e);z-index:1;"></div>
  <div style="position:absolute;top:0;bottom:0;{'right' if fa else 'left'}:38%;width:2px;background:linear-gradient(180deg,transparent,#c4a06a,transparent);z-index:2;opacity:0.7;"></div>
  <div style="position:absolute;top:0;bottom:0;{'left' if fa else 'right'}:0;width:62%;background:
    radial-gradient(ellipse at 30% 40%, rgba(180,140,80,0.08), transparent 50%),
    linear-gradient(180deg,#161c22,#0f1418);z-index:1;"></div>
  <div style="position:absolute;top:0;bottom:0;{'right' if fa else 'left'}:0;width:38%;z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;">
    {logo_img("light", 260, "opacity:0.92;")}
    <p style="font-family:Cormorant Garamond,serif;font-size:44px;letter-spacing:0.04em;color:#d4b87a;">ACE.<span style="font-weight:400;text-transform:none;font-variant:normal;">await</span></p>
  </div>
  {grain(0.2, True)}
  <div style="position:absolute;top:0;bottom:0;{'left' if fa else 'right'}:0;width:62%;z-index:6;display:flex;flex-direction:column;padding:72px 56px 56px;">
    <div style="flex:1;display:flex;align-items:center;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},serif;font-size:{fs}px;font-weight:{600 if fa else 500};line-height:{1.65 if fa else 1.35};">{body}</p>
    </div>
    <div>
      <p style="font-family:'JetBrains Mono',monospace;font-size:23px;color:#7a8490;">{SITE}</p>
    </div>
  </div>
</section>'''


def t06(lang="fa", quote=None):
    q, fa = resolve_quote(lang, quote)
    fs, body = quote_html(q, lang, 80, 66)
    return f'''
<section class="card" style="background:#0c1014;color:#f0e6d0;">
  <div style="position:absolute;inset:0;background:
    radial-gradient(ellipse 60% 40% at 50% 20%, rgba(212,168,66,0.18), transparent 55%),
    radial-gradient(ellipse 80% 60% at 50% 90%, rgba(40,50,70,0.4), transparent 50%),
    linear-gradient(180deg,#1a1810,#0c1014);"></div>
  <svg viewBox="0 0 1080 1350" style="position:absolute;inset:0;width:100%;height:100%;z-index:1;opacity:0.35;" fill="none">
    <path d="M80 200 Q200 120 300 220 T520 180 T740 240 T1000 160" stroke="#d4a842" stroke-width="1.2"/>
    <path d="M60 1150 Q220 1080 380 1180 T700 1120 T1020 1200" stroke="#d4a842" stroke-width="1"/>
    <circle cx="200" cy="180" r="3" fill="#d4a842"/><circle cx="880" cy="200" r="3" fill="#d4a842"/>
  </svg>
  <div style="position:absolute;inset:40px;border:1px solid rgba(212,168,66,0.35);z-index:2;"></div>
  <div style="position:absolute;top:64px;left:50%;transform:translateX(-50%);z-index:4;">
    <div style="padding:14px;border:1px solid rgba(212,168,66,0.45);border-radius:50%;">
      {logo_img("light", 120, "opacity:0.95;")}
    </div>
  </div>
  {grain(0.22, True)}
  <div style="position:absolute;inset:0;z-index:6;display:flex;flex-direction:column;padding:230px 80px 72px;">
    <p style="font-family:Cormorant Garamond,serif;font-size:40px;letter-spacing:0.04em;color:#d4a842;text-align:center;">ACE.<span style="font-weight:400;text-transform:none;font-variant:normal;">await</span></p>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;text-align:center;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},serif;font-size:{fs}px;font-weight:{600 if fa else 500};line-height:{1.68 if fa else 1.36};max-width:840px;">{body}</p>
    </div>
    <div style="text-align:center;">
      <p style="font-family:'JetBrains Mono',monospace;font-size:23px;color:#9a8a60;">{SITE}</p>
    </div>
  </div>
</section>'''


def t07(lang="fa", quote=None):
    q, fa = resolve_quote(lang, quote)
    fs, body = quote_html(q, lang, 82, 68)
    return f'''
<section class="card" style="background:#efe8dc;color:#1c1814;">
  <div style="position:absolute;inset:0;background:linear-gradient(160deg,#f4eee4,#e8dfd0 55%,#e2d6c4);"></div>
  <svg viewBox="0 0 1080 1350" style="position:absolute;inset:0;width:100%;height:100%;z-index:1;" fill="none">
    <path d="M-40 100 C100 -20 260 180 180 300 C120 400 20 420 -30 340" fill="rgba(25,35,45,0.42)"/>
    <path d="M200 40 C280 0 360 80 300 160" stroke="rgba(25,35,45,0.35)" stroke-width="22" stroke-linecap="round"/>
    <path d="M1100 400 C980 300 860 480 940 580 C1000 660 1100 640 1140 540" fill="rgba(130,55,40,0.32)"/>
    <path d="M-20 1100 C100 980 260 1180 180 1280 C120 1360 0 1340 -40 1240" fill="rgba(25,35,45,0.28)"/>
    <path d="M700 1200 C820 1120 960 1280 900 1360" stroke="rgba(130,55,40,0.3)" stroke-width="28" stroke-linecap="round"/>
    <path d="M420 80 C500 140 580 60 640 130" stroke="rgba(25,35,45,0.2)" stroke-width="10" stroke-linecap="round"/>
    <circle cx="520" cy="200" r="22" fill="rgba(25,35,45,0.15)"/>
    <circle cx="840" cy="900" r="40" fill="rgba(130,55,40,0.12)"/>
  </svg>
  <div style="position:absolute;top:56px;{'left' if not fa else 'right'}:56px;z-index:4;background:rgba(242,234,220,0.55);border-radius:50%;padding:10px;backdrop-filter:blur(2px);">
    {logo_img("dark", 160)}
  </div>
  {grain(0.35)}
  <div style="position:absolute;inset:0;z-index:6;display:flex;flex-direction:column;padding:80px 72px 60px;">
    <div style="{'margin-left:200px' if not fa else 'margin-right:200px'};">
      <p style="font-family:Cormorant Garamond,serif;font-size:48px;font-weight:600;color:#1c1814;">ACE.<span style="font-weight:400;text-transform:none;font-variant:normal;">await</span></p>
    </div>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;text-align:center;padding:0 20px;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},serif;font-size:{fs}px;font-weight:{600 if fa else 500};line-height:{1.68 if fa else 1.36};max-width:860px;">{body}</p>
    </div>
    <div style="text-align:center;">
      <p style="font-family:'JetBrains Mono',monospace;font-size:23px;color:#5a4e42;">{SITE}</p>
    </div>
  </div>
</section>'''


def t08(lang="fa", quote=None):
    q, fa = resolve_quote(lang, quote)
    fs, body = quote_html(q, lang, 82, 68)
    return f'''
<section class="card" style="background:#0a1228;color:#eef0f6;">
  <div style="position:absolute;inset:0;background:
    radial-gradient(ellipse 45% 30% at 75% 12%, rgba(240,220,160,0.2), transparent 55%),
    radial-gradient(ellipse 70% 50% at 30% 80%, rgba(60,80,160,0.25), transparent 55%),
    linear-gradient(180deg,#152040,#0a1228);"></div>
  <div style="position:absolute;top:90px;{'left' if not fa else 'right'}:70px;width:200px;height:200px;border-radius:50%;background:rgba(240,220,160,0.08);box-shadow:0 0 80px rgba(240,220,160,0.12);z-index:1;"></div>
  <div style="position:absolute;top:120px;{'left' if not fa else 'right'}:100px;z-index:3;border:1px solid rgba(220,200,140,0.35);border-radius:50%;padding:16px;background:rgba(10,18,40,0.35);">
    {logo_img("light", 140)}
  </div>
  <svg viewBox="0 0 1080 1350" style="position:absolute;inset:0;width:100%;height:100%;z-index:1;">
    <circle cx="200" cy="500" r="1.8" fill="#e8dcc0" opacity="0.5"/>
    <circle cx="900" cy="600" r="2" fill="#e8dcc0" opacity="0.4"/>
    <circle cx="300" cy="1100" r="1.5" fill="#e8dcc0" opacity="0.45"/>
    <circle cx="780" cy="1000" r="1.7" fill="#e8dcc0" opacity="0.35"/>
  </svg>
  {grain(0.2, True)}
  <div style="position:absolute;inset:0;z-index:6;display:flex;flex-direction:column;padding:100px 76px 64px;">
    <p style="font-family:Cormorant Garamond,serif;font-style:italic;font-size:42px;font-weight:600;color:#d4b86a;{'margin-left:260px' if not fa else 'margin-right:260px'};">ACE.<span style="font-weight:400;text-transform:none;font-variant:normal;">await</span></p>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;text-align:center;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},serif;font-size:{fs}px;font-weight:{600 if fa else 500};line-height:{1.68 if fa else 1.36};max-width:860px;">{body}</p>
    </div>
    <div style="text-align:center;">
      <p style="font-family:'JetBrains Mono',monospace;font-size:23px;color:#8088a0;">{SITE}</p>
    </div>
  </div>
</section>'''


def t09(lang="fa", quote=None):
    q, fa = resolve_quote(lang, quote)
    fs, body = quote_html(q, lang, 76, 62)
    return f'''
<section class="card" style="background:#cfc4b0;color:#1e1812;">
  <div style="position:absolute;inset:0;background:
    linear-gradient(180deg,#d8ceba,#c8bca6 40%,#b8ac94);
    repeating-linear-gradient(90deg,transparent,transparent 80px,rgba(60,45,30,0.03) 80px,rgba(60,45,30,0.03) 81px);"></div>
  {grain(0.45)}
  <!-- hanging frame with logo -->
  <div style="position:absolute;top:70px;left:50%;transform:translateX(-50%);z-index:3;width:220px;height:260px;background:#ebe2d2;box-shadow:0 16px 40px rgba(0,0,0,0.22);border:10px solid #3a2e22;display:flex;align-items:center;justify-content:center;">
    <div style="position:absolute;top:-28px;left:50%;transform:translateX(-50%);width:2px;height:28px;background:#3a2e22;"></div>
    <div style="position:absolute;top:-36px;left:50%;transform:translateX(-50%);width:14px;height:14px;border-radius:50%;background:#3a2e22;"></div>
    {logo_img("dark", 170)}
  </div>
  <div style="position:absolute;inset:0;z-index:6;display:flex;flex-direction:column;padding:370px 76px 64px;">
    <p style="font-family:Cormorant Garamond,serif;font-size:40px;letter-spacing:0.04em;color:#4a3a28;text-align:center;">ACE.<span style="font-weight:400;text-transform:none;font-variant:normal;">await</span></p>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;text-align:center;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},serif;font-size:{fs}px;font-weight:{600 if fa else 500};line-height:{1.65 if fa else 1.35};max-width:860px;">{body}</p>
    </div>
    <div style="text-align:center;">
      <p style="font-family:'JetBrains Mono',monospace;font-size:23px;color:#6a5a48;">{SITE}</p>
    </div>
  </div>
</section>'''


def t10(lang="fa", quote=None):
    q, fa = resolve_quote(lang, quote)
    fs, body = quote_html(q, lang, 82, 68)
    return f'''
<section class="card" style="background:#12161c;color:#ece6da;">
  <div style="position:absolute;inset:0;background:
    radial-gradient(ellipse 60% 45% at 50% 50%, rgba(100,120,140,0.12), transparent 60%),
    linear-gradient(180deg,#1a2028,#12161c);"></div>
  <!-- echo logo layers -->
  <div style="position:absolute;left:50%;top:48%;transform:translate(-50%,-50%) scale(1.55);opacity:0.05;z-index:1;">{logo_img("light", 700)}</div>
  <div style="position:absolute;left:50%;top:48%;transform:translate(-50%,-50%) scale(1.15);opacity:0.08;z-index:1;">{logo_img("light", 700)}</div>
  <div style="position:absolute;left:50%;top:48%;transform:translate(-50%,-50%);opacity:0.14;z-index:1;">{logo_img("light", 700)}</div>
  <div style="position:absolute;top:56px;left:50%;transform:translateX(-50%);z-index:4;">
    {logo_img("light", 110, "opacity:0.95;")}
  </div>
  {grain(0.22, True)}
  <div style="position:absolute;inset:0;z-index:6;display:flex;flex-direction:column;padding:190px 76px 64px;">
    <p style="font-family:Cormorant Garamond,serif;font-size:44px;font-weight:600;letter-spacing:0.04em;text-align:center;color:#d0c8b0;">ACE.<span style="font-weight:400;text-transform:none;font-variant:normal;">await</span></p>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;text-align:center;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},serif;font-size:{fs}px;font-weight:{600 if fa else 500};line-height:{1.68 if fa else 1.36};max-width:860px;">{body}</p>
    </div>
    <div style="text-align:center;">
      <p style="font-family:'JetBrains Mono',monospace;font-size:23px;color:#7a8490;">{SITE}</p>
    </div>
  </div>
</section>'''


BUILDERS = {
    "v2-01-silhouette-aura": t01,
    "v2-02-ink-portrait": t02,
    "v2-03-velvet-stage": t03,
    "v2-04-parchment-crest": t04,
    "v2-05-split-mind": t05,
    "v2-06-gold-leaf": t06,
    "v2-07-brush-storm": t07,
    "v2-08-moonlit-seal": t08,
    "v2-09-atelier": t09,
    "v2-10-echo": t10,
}


def build_all(lang="fa"):
    RENDER.mkdir(parents=True, exist_ok=True)
    for t in TEMPLATES:
        out = RENDER / f"{t['id']}-{lang}.html"
        out.write_text(shell(t["id"], BUILDERS[t["id"]](lang), lang), encoding="utf-8")
        print(f"wrote {out.name}")
    return TEMPLATES


if __name__ == "__main__":
    build_all("fa")
