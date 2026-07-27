#!/usr/bin/env python3
"""10 artistic literary quote-card templates for ACE.await.
Same sample quote on each — Instagram 1080×1350 for fair comparison."""
import html as html_mod
from pathlib import Path

HERE = Path(__file__).resolve().parent
RENDER = HERE / ".render" / "templates"
FONT_DIR = (HERE / ".." / ".." / "assets" / "fonts").resolve()
SITE = "https://AceConscious.Studio"
W, H = 1080, 1350

SAMPLE = {
    "fa": "من به پروانه‌ها بیشتر از الگوریتم‌ها اعتماد دارم.",
    "en": "I trust butterflies more than I trust algorithms.",
    "ch_fa": "فصل ۵ · اعتماد به پروانه‌ها",
    "ch_en": "Ch. 5 · Trusting the Butterflies",
}

TEMPLATES = [
    {"id": "01-inkwash", "name": "Ink Wash", "blurb": "آبرنگ مرکب ژاپنی؛ لکه‌های زنده؛ حس خوشنویسی معاصر"},
    {"id": "02-letterpress", "name": "Letterpress", "blurb": "چاپ سربی روی کاغذ بافت‌دار؛ حاشیهٔ قدیمی؛ جوهر فشرده"},
    {"id": "03-midnight-verse", "name": "Midnight Verse", "blurb": "شب شاعرانه؛ ماه محو؛ جوهر طلایی روی نیلی"},
    {"id": "04-butterflight", "name": "Butterflight", "blurb": "پروانهٔ جوهرپاش؛ پس‌زمینهٔ زنده؛ امضای رمان"},
    {"id": "05-torn-page", "name": "Torn Page", "blurb": "صفحهٔ پاره از دفتر؛ لایه‌های کاغذ؛ حس دست‌نویس"},
    {"id": "06-studio-light", "name": "Studio Light", "blurb": "نور گرم استودیوی نویسنده؛ سایه و عمق؛ فضای صمیمی"},
    {"id": "07-copperplate", "name": "Copperplate", "blurb": "لوح مسی؛ قاب زینتی نرم؛ حس کلاسیک ادبی"},
    {"id": "08-river-ink", "name": "River Ink", "blurb": "جریان مرکب افقی؛ حرکت و نفس؛ مدرن شاعرانه"},
    {"id": "09-archive", "name": "Archive Seal", "blurb": "مهر آرشیو؛ کاغذ کهنه؛ حس سند ادبی"},
    {"id": "10-constellation", "name": "Constellation", "blurb": "صورت فلکی ظریف؛ شب عمیق؛ نقل‌قول مثل ستاره"},
]


def fonts_css():
    return f"""
@font-face {{ font-family:"Vazirmatn"; src:url("file://{FONT_DIR}/Vazirmatn-Regular.woff2") format("woff2"); font-weight:400; }}
@font-face {{ font-family:"Vazirmatn"; src:url("file://{FONT_DIR}/Vazirmatn-Medium.woff2") format("woff2"); font-weight:500; }}
@font-face {{ font-family:"Vazirmatn"; src:url("file://{FONT_DIR}/Vazirmatn-SemiBold.woff2") format("woff2"); font-weight:600; }}
"""


def grain(opacity=0.35, dark=False):
    blend = "screen" if dark else "multiply"
    return f'''<div style="position:absolute;inset:0;z-index:3;pointer-events:none;mix-blend-mode:{blend};opacity:{opacity};background-image:url(&quot;data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/></svg>&quot;);"></div>'''


def card_shell(tid, inner, lang="fa"):
    return f'''<!doctype html>
<html lang="{lang}" dir="{"rtl" if lang == "fa" else "ltr"}">
<head>
<meta charset="utf-8">
<title>Template {tid}</title>
<link href="https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,500;0,7..72,600;0,7..72,700;1,7..72,400;1,7..72,500&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
{fonts_css()}
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ background:#111; }}
.card {{ position:relative; width:{W}px; height:{H}px; overflow:hidden; }}
</style>
</head>
<body>{inner}</body>
</html>'''


def t01_inkwash(lang="fa"):
    q, fa = SAMPLE[lang], lang == "fa"
    ch = SAMPLE["ch_fa"] if fa else SAMPLE["ch_en"]
    label = "نقل‌قولی از رمانِ ACE.await" if fa else "A quote from the novel ACE.await"
    return f'''
<section class="card" style="background:#f4efe6;color:#1c1814;">
  <div style="position:absolute;inset:0;background:
    radial-gradient(ellipse 70% 50% at 15% 20%, rgba(40,55,70,0.18), transparent 60%),
    radial-gradient(ellipse 55% 45% at 88% 78%, rgba(120,70,50,0.14), transparent 55%),
    radial-gradient(ellipse 40% 35% at 70% 18%, rgba(60,80,90,0.10), transparent 50%),
    linear-gradient(165deg,#f7f2ea 0%,#ebe3d4 45%,#e7ddd0 100%);"></div>
  <svg viewBox="0 0 1080 1350" style="position:absolute;inset:0;width:100%;height:100%;opacity:0.28;z-index:1;" fill="none">
    <path d="M-40 180 C120 80 280 220 200 380 C140 520 40 560 -20 480" fill="rgba(35,50,65,0.35)"/>
    <path d="M980 1100 C860 980 720 1120 820 1240 C900 1330 1040 1300 1120 1200" fill="rgba(110,65,45,0.28)"/>
    <path d="M700 160 C780 220 860 180 900 260" stroke="rgba(35,50,65,0.45)" stroke-width="14" stroke-linecap="round"/>
    <path d="M740 210 C800 250 840 230 870 290" stroke="rgba(35,50,65,0.25)" stroke-width="7" stroke-linecap="round"/>
  </svg>
  {grain(0.28)}
  <div style="position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;padding:88px 80px 68px;">
    <p style="font-family:Cormorant Garamond,Literata,serif;font-size:22px;letter-spacing:0.28em;text-transform:uppercase;color:#6a5c4c;text-align:center;">ACE.await</p>
    <p style="font-family:{'Vazirmatn' if fa else 'Literata'},sans-serif;font-size:22px;color:#6a5c4c;text-align:center;margin-top:10px;">{label}</p>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;text-align:center;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},serif;font-size:{86 if fa else 72}px;font-weight:{600 if fa else 500};line-height:{1.72 if fa else 1.4};max-width:860px;">{html_mod.escape(q)}</p>
    </div>
    <div style="text-align:center;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},sans-serif;font-size:22px;color:#6a5c4c;margin-bottom:14px;">{html_mod.escape(ch)}</p>
      <p style="font-family:'JetBrains Mono',monospace;font-size:18px;color:#7a6a58;">{SITE}</p>
    </div>
  </div>
</section>'''


def t02_letterpress(lang="fa"):
    q, fa = SAMPLE[lang], lang == "fa"
    ch = SAMPLE["ch_fa"] if fa else SAMPLE["ch_en"]
    label = "نقل‌قولی از رمانِ" if fa else "A quote from the novel"
    return f'''
<section class="card" style="background:#e8dcc6;color:#221c16;">
  <div style="position:absolute;inset:0;background:
    linear-gradient(180deg,rgba(80,50,30,0.06),transparent 30%),
    repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(80,55,30,0.03) 3px,rgba(80,55,30,0.03) 4px);"></div>
  {grain(0.42)}
  <div style="position:absolute;inset:36px;border:3px double rgba(50,35,20,0.45);z-index:2;"></div>
  <div style="position:absolute;inset:52px;border:1px solid rgba(50,35,20,0.18);z-index:2;"></div>
  <div style="position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;padding:96px 92px 72px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:20px;padding-bottom:22px;border-bottom:2px solid rgba(50,35,20,0.25);">
      <div>
        <p style="font-family:{'Vazirmatn' if fa else 'Literata'},sans-serif;font-size:22px;color:#6b5640;">{label}</p>
        <p style="font-family:Cormorant Garamond,Literata,serif;font-size:42px;font-weight:600;letter-spacing:0.02em;margin-top:2px;">ACE.await</p>
      </div>
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},sans-serif;font-size:20px;color:#6b5640;text-align:{'left' if fa else 'right'};max-width:40%;">{html_mod.escape(ch)}</p>
    </div>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;text-align:center;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},serif;font-size:{82 if fa else 68}px;font-weight:{600 if fa else 600};line-height:{1.7 if fa else 1.38};max-width:860px;text-shadow:0 1px 0 rgba(255,255,255,0.25);">{html_mod.escape(q)}</p>
    </div>
    <p style="font-family:'JetBrains Mono',monospace;font-size:18px;color:#6b5640;text-align:center;letter-spacing:0.02em;">{SITE}</p>
  </div>
</section>'''


def t03_midnight_verse(lang="fa"):
    q, fa = SAMPLE[lang], lang == "fa"
    ch = SAMPLE["ch_fa"] if fa else SAMPLE["ch_en"]
    label = "نقل‌قولی از رمانِ ACE.await" if fa else "A quote from ACE.await"
    return f'''
<section class="card" style="background:#0e1528;color:#f0e6d2;">
  <div style="position:absolute;inset:0;background:
    radial-gradient(ellipse 55% 40% at 70% 18%, rgba(230,210,160,0.16), transparent 55%),
    radial-gradient(ellipse 80% 60% at 30% 80%, rgba(60,80,140,0.22), transparent 60%),
    linear-gradient(180deg,#152040 0%,#0e1528 45%,#0a101c 100%);"></div>
  <svg viewBox="0 0 1080 1350" style="position:absolute;inset:0;width:100%;height:100%;z-index:1;opacity:0.9;" fill="none">
    <circle cx="760" cy="220" r="70" fill="rgba(240,220,170,0.12)"/>
    <circle cx="760" cy="220" r="38" fill="rgba(240,220,170,0.22)"/>
    <circle cx="180" cy="980" r="2.5" fill="#e8d9b0"/><circle cx="260" cy="860" r="1.8" fill="#e8d9b0"/>
    <circle cx="900" cy="700" r="2" fill="#e8d9b0"/><circle cx="820" cy="1100" r="1.5" fill="#e8d9b0"/>
    <circle cx="140" cy="320" r="1.6" fill="#e8d9b0"/><circle cx="420" cy="180" r="1.4" fill="#e8d9b0"/>
    <path d="M120 1180 C300 1080 500 1220 700 1120 C860 1040 980 1140 1080 1080" stroke="rgba(200,180,120,0.18)" stroke-width="1.5"/>
  </svg>
  {grain(0.22, dark=True)}
  <div style="position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;padding:80px 76px 64px;">
    <p style="font-family:Cormorant Garamond,serif;font-style:italic;font-size:28px;color:#d4b86a;text-align:center;">ACE.await</p>
    <p style="font-family:{'Vazirmatn' if fa else 'Literata'},sans-serif;font-size:21px;color:#a8b0c4;text-align:center;margin-top:8px;">{label}</p>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;text-align:center;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},serif;font-size:{84 if fa else 70}px;font-weight:{600 if fa else 500};line-height:{1.7 if fa else 1.4};max-width:860px;color:#f4ead8;">{html_mod.escape(q)}</p>
    </div>
    <div style="text-align:center;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},sans-serif;font-size:20px;color:#a8b0c4;margin-bottom:12px;">{html_mod.escape(ch)}</p>
      <p style="font-family:'JetBrains Mono',monospace;font-size:17px;color:#8a9270;">{SITE}</p>
    </div>
  </div>
</section>'''


def t04_butterflight(lang="fa"):
    q, fa = SAMPLE[lang], lang == "fa"
    ch = SAMPLE["ch_fa"] if fa else SAMPLE["ch_en"]
    label = "نقل‌قولی از رمانِ" if fa else "A quote from the novel"
    return f'''
<section class="card" style="background:#e7efdf;color:#1a2618;">
  <div style="position:absolute;inset:0;background:
    radial-gradient(ellipse 60% 45% at 85% 15%, rgba(180,140,60,0.16), transparent 55%),
    radial-gradient(ellipse 50% 40% at 10% 85%, rgba(70,110,70,0.14), transparent 50%),
    linear-gradient(160deg,#eef4e6,#e2ead8 50%,#d8e4d0);"></div>
  <svg viewBox="0 0 1080 1350" style="position:absolute;inset:0;width:100%;height:100%;z-index:1;opacity:0.55;" fill="none">
    <g stroke="#3d5c38" stroke-width="2.2" opacity="0.55">
      <path d="M780 240 C700 160 620 180 640 260 C655 310 720 300 760 270"/>
      <path d="M780 240 C860 160 940 180 920 260 C905 310 840 300 800 270"/>
      <path d="M780 255 C770 310 770 360 780 400"/>
      <path d="M760 250 C740 220 730 200 720 180 M800 250 C820 220 830 200 840 180"/>
    </g>
    <g stroke="#3d5c38" stroke-width="1.6" opacity="0.28">
      <path d="M220 1080 C160 1000 100 1020 120 1090 C135 1135 180 1125 210 1100"/>
      <path d="M220 1080 C280 1000 340 1020 320 1090 C305 1135 260 1125 230 1100"/>
      <path d="M220 1090 C215 1130 215 1160 220 1190"/>
    </g>
    <circle cx="520" cy="700" r="180" stroke="#3d5c38" stroke-width="1" stroke-dasharray="2 14" opacity="0.2"/>
  </svg>
  {grain(0.25)}
  <div style="position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;padding:72px 72px 60px;">
    <div style="display:flex;justify-content:space-between;align-items:baseline;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},sans-serif;font-size:22px;color:#4f6548;">{label} <b style="font-family:Literata,serif;font-weight:600;color:#1a2618;">ACE.await</b></p>
      <p style="font-family:Cormorant Garamond,serif;font-size:24px;font-style:italic;color:#6a7a50;">butterfly / الگوریتم</p>
    </div>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;text-align:center;padding:0 10px;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},serif;font-size:{84 if fa else 70}px;font-weight:{600 if fa else 500};line-height:{1.7 if fa else 1.4};max-width:860px;">{html_mod.escape(q)}</p>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid rgba(61,92,56,0.25);padding-top:18px;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},sans-serif;font-size:20px;color:#4f6548;">{html_mod.escape(ch)}</p>
      <p style="font-family:'JetBrains Mono',monospace;font-size:17px;color:#4f6548;">{SITE}</p>
    </div>
  </div>
</section>'''


def t05_torn_page(lang="fa"):
    q, fa = SAMPLE[lang], lang == "fa"
    ch = SAMPLE["ch_fa"] if fa else SAMPLE["ch_en"]
    label = "نقل‌قولی از رمانِ ACE.await" if fa else "A quote from the novel ACE.await"
    return f'''
<section class="card" style="background:#2c241c;color:#1f1812;">
  <div style="position:absolute;inset:0;background:
    radial-gradient(ellipse at 30% 20%,#3a3026,#2c241c 55%,#211a14);"></div>
  <!-- back sheet -->
  <div style="position:absolute;left:70px;right:50px;top:90px;bottom:70px;background:#d9cbb4;transform:rotate(-1.6deg);box-shadow:0 18px 50px rgba(0,0,0,0.35);z-index:1;"></div>
  <!-- front sheet -->
  <div style="position:absolute;left:56px;right:64px;top:78px;bottom:82px;background:#efe4d2;transform:rotate(0.8deg);box-shadow:0 10px 30px rgba(0,0,0,0.22);z-index:2;
    clip-path:polygon(0% 0%,100% 0%,100% 92%,97% 94%,100% 96%,98% 98%,100% 100%,0% 100%,2% 97%,0% 94%,3% 91%,0% 88%,0% 0%);"></div>
  {grain(0.2)}
  <div style="position:absolute;left:96px;right:104px;top:130px;bottom:140px;z-index:4;display:flex;flex-direction:column;transform:rotate(0.8deg);">
    <p style="font-family:Cormorant Garamond,serif;font-size:20px;letter-spacing:0.2em;text-transform:uppercase;color:#7a6550;">ACE.await · excerpt</p>
    <p style="font-family:{'Vazirmatn' if fa else 'Literata'},sans-serif;font-size:20px;color:#7a6550;margin-top:8px;">{label}</p>
    <div style="flex:1;display:flex;align-items:center;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},serif;font-size:{74 if fa else 62}px;font-weight:{600 if fa else 500};line-height:{1.68 if fa else 1.38};max-width:820px;">{html_mod.escape(q)}</p>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},sans-serif;font-size:18px;color:#7a6550;">{html_mod.escape(ch)}</p>
      <p style="font-family:'JetBrains Mono',monospace;font-size:15px;color:#7a6550;">{SITE}</p>
    </div>
  </div>
</section>'''


def t06_studio_light(lang="fa"):
    q, fa = SAMPLE[lang], lang == "fa"
    ch = SAMPLE["ch_fa"] if fa else SAMPLE["ch_en"]
    label = "نقل‌قولی از رمانِ" if fa else "A quote from"
    return f'''
<section class="card" style="background:#1a1410;color:#f2e6d0;">
  <div style="position:absolute;inset:0;background:
    radial-gradient(ellipse 90% 70% at 50% -5%, rgba(255,200,120,0.22), transparent 50%),
    radial-gradient(ellipse 60% 45% at 50% 40%, rgba(220,160,80,0.12), transparent 55%),
    linear-gradient(180deg,#2a2018 0%,#1a1410 50%,#120e0b 100%);"></div>
  <div style="position:absolute;top:0;left:10%;right:10%;height:3px;background:linear-gradient(90deg,transparent,#d4a842,transparent);opacity:0.55;z-index:2;"></div>
  {grain(0.18, dark=True)}
  <div style="position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;padding:100px 84px 72px;">
    <div style="text-align:center;">
      <p style="font-family:Cormorant Garamond,serif;font-size:34px;font-weight:600;color:#e8c878;letter-spacing:0.08em;">ACE.await</p>
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},sans-serif;font-size:22px;color:#c4b090;margin-top:12px;">{label}</p>
    </div>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;text-align:center;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},serif;font-size:{84 if fa else 70}px;font-weight:{600 if fa else 500};line-height:{1.7 if fa else 1.4};max-width:860px;text-shadow:0 0 40px rgba(212,168,66,0.18);">{html_mod.escape(q)}</p>
    </div>
    <div style="text-align:center;border-top:1px solid rgba(232,200,120,0.2);padding-top:20px;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},sans-serif;font-size:20px;color:#c4b090;margin-bottom:10px;">{html_mod.escape(ch)}</p>
      <p style="font-family:'JetBrains Mono',monospace;font-size:17px;color:#a89468;">{SITE}</p>
    </div>
  </div>
</section>'''


def t07_copperplate(lang="fa"):
    q, fa = SAMPLE[lang], lang == "fa"
    ch = SAMPLE["ch_fa"] if fa else SAMPLE["ch_en"]
    label = "نقل‌قولی از رمانِ ACE.await" if fa else "A quote from the novel ACE.await"
    return f'''
<section class="card" style="background:#1f1814;color:#f0e2c8;">
  <div style="position:absolute;inset:0;background:
    radial-gradient(ellipse at center, #3a2a20 0%, #1f1814 70%);"></div>
  <svg viewBox="0 0 1080 1350" style="position:absolute;inset:0;width:100%;height:100%;z-index:1;opacity:0.55;" fill="none">
    <rect x="48" y="48" width="984" height="1254" stroke="#c4a06a" stroke-width="1.5"/>
    <rect x="62" y="62" width="956" height="1226" stroke="#c4a06a" stroke-width="0.8" opacity="0.5"/>
    <!-- corner ornaments -->
    <path d="M90 90 H170 M90 90 V170" stroke="#c4a06a" stroke-width="2"/>
    <path d="M990 90 H910 M990 90 V170" stroke="#c4a06a" stroke-width="2"/>
    <path d="M90 1260 H170 M90 1260 V1180" stroke="#c4a06a" stroke-width="2"/>
    <path d="M990 1260 H910 M990 1260 V1180" stroke="#c4a06a" stroke-width="2"/>
    <path d="M480 110 C500 130 520 130 540 110 C560 130 580 130 600 110" stroke="#c4a06a" stroke-width="1.5"/>
    <path d="M480 1240 C500 1220 520 1220 540 1240 C560 1220 580 1220 600 1240" stroke="#c4a06a" stroke-width="1.5"/>
  </svg>
  {grain(0.2, dark=True)}
  <div style="position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;padding:110px 100px 90px;">
    <p style="font-family:Cormorant Garamond,serif;font-size:26px;letter-spacing:0.35em;text-transform:uppercase;color:#c4a06a;text-align:center;">ACE.await</p>
    <p style="font-family:{'Vazirmatn' if fa else 'Literata'},sans-serif;font-size:21px;color:#b8a080;text-align:center;margin-top:12px;">{label}</p>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;text-align:center;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},serif;font-size:{80 if fa else 66}px;font-weight:{600 if fa else 500};line-height:{1.7 if fa else 1.4};max-width:820px;">{html_mod.escape(q)}</p>
    </div>
    <div style="text-align:center;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},sans-serif;font-size:20px;color:#b8a080;margin-bottom:12px;">{html_mod.escape(ch)}</p>
      <p style="font-family:'JetBrains Mono',monospace;font-size:17px;color:#a08060;">{SITE}</p>
    </div>
  </div>
</section>'''


def t08_river_ink(lang="fa"):
    q, fa = SAMPLE[lang], lang == "fa"
    ch = SAMPLE["ch_fa"] if fa else SAMPLE["ch_en"]
    label = "نقل‌قولی از رمانِ ACE.await" if fa else "A quote from ACE.await"
    return f'''
<section class="card" style="background:#eef2f4;color:#152028;">
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,#dfe8ee 0%,#eef2f4 40%,#e8e6df 100%);"></div>
  <svg viewBox="0 0 1080 1350" style="position:absolute;inset:0;width:100%;height:100%;z-index:1;" fill="none">
    <path d="M-20 420 C180 360 300 520 480 460 C660 400 780 560 980 480 C1040 455 1100 470 1120 450" stroke="#2a4a5c" stroke-width="48" opacity="0.08" stroke-linecap="round"/>
    <path d="M-20 460 C200 400 320 560 500 500 C680 440 800 600 1000 520" stroke="#2a4a5c" stroke-width="22" opacity="0.12" stroke-linecap="round"/>
    <path d="M-20 500 C220 440 340 600 520 540 C700 480 820 640 1020 560" stroke="#2a4a5c" stroke-width="8" opacity="0.18" stroke-linecap="round"/>
    <path d="M-20 980 C200 920 340 1080 540 1000 C740 920 880 1100 1120 1020" stroke="#6a4a3a" stroke-width="30" opacity="0.07" stroke-linecap="round"/>
    <path d="M-20 1010 C220 950 360 1110 560 1030 C760 950 900 1130 1120 1050" stroke="#6a4a3a" stroke-width="10" opacity="0.12" stroke-linecap="round"/>
  </svg>
  {grain(0.22)}
  <div style="position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;padding:84px 76px 64px;">
    <div style="display:flex;justify-content:space-between;align-items:baseline;">
      <p style="font-family:Cormorant Garamond,serif;font-size:30px;font-weight:600;color:#2a4a5c;">ACE.await</p>
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},sans-serif;font-size:20px;color:#5a7080;">{html_mod.escape(ch)}</p>
    </div>
    <p style="font-family:{'Vazirmatn' if fa else 'Literata'},sans-serif;font-size:21px;color:#5a7080;margin-top:10px;">{label}</p>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;text-align:center;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},serif;font-size:{84 if fa else 70}px;font-weight:{600 if fa else 500};line-height:{1.7 if fa else 1.4};max-width:860px;">{html_mod.escape(q)}</p>
    </div>
    <p style="font-family:'JetBrains Mono',monospace;font-size:18px;color:#5a7080;text-align:center;">{SITE}</p>
  </div>
</section>'''


def t09_archive(lang="fa"):
    q, fa = SAMPLE[lang], lang == "fa"
    ch = SAMPLE["ch_fa"] if fa else SAMPLE["ch_en"]
    label = "نقل‌قولی از رمانِ" if fa else "A quote from the novel"
    return f'''
<section class="card" style="background:#e4d5b8;color:#2a2018;">
  <div style="position:absolute;inset:0;background:
    radial-gradient(ellipse at 80% 10%, rgba(140,90,40,0.15), transparent 40%),
    radial-gradient(ellipse at 10% 90%, rgba(90,70,40,0.12), transparent 45%),
    linear-gradient(180deg,#eadcbd,#e0d0b0 60%,#d8c6a4);"></div>
  {grain(0.48)}
  <!-- archive seal -->
  <svg viewBox="0 0 200 200" style="position:absolute;top:70px;{'left' if fa else 'right'}:70px;width:150px;height:150px;z-index:2;opacity:0.42;" fill="none">
    <circle cx="100" cy="100" r="88" stroke="#8a4030" stroke-width="3"/>
    <circle cx="100" cy="100" r="74" stroke="#8a4030" stroke-width="1.5" stroke-dasharray="3 6"/>
    <text x="100" y="88" text-anchor="middle" fill="#8a4030" font-family="Literata,serif" font-size="18" font-weight="600">ACE</text>
    <text x="100" y="118" text-anchor="middle" fill="#8a4030" font-family="Literata,serif" font-size="16">await</text>
  </svg>
  <div style="position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;padding:92px 84px 68px;">
    <p style="font-family:{'Vazirmatn' if fa else 'Literata'},sans-serif;font-size:22px;color:#6a5040;{'margin-right:170px' if fa else 'margin-left:170px'};">{label} <b style="font-family:Literata,serif;">ACE.await</b></p>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;text-align:center;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},serif;font-size:{82 if fa else 68}px;font-weight:{600 if fa else 500};line-height:{1.7 if fa else 1.38};max-width:860px;">{html_mod.escape(q)}</p>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;border-top:1px dashed rgba(90,60,40,0.35);padding-top:18px;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},sans-serif;font-size:20px;color:#6a5040;">{html_mod.escape(ch)}</p>
      <p style="font-family:'JetBrains Mono',monospace;font-size:17px;color:#6a5040;">{SITE}</p>
    </div>
  </div>
</section>'''


def t10_constellation(lang="fa"):
    q, fa = SAMPLE[lang], lang == "fa"
    ch = SAMPLE["ch_fa"] if fa else SAMPLE["ch_en"]
    label = "نقل‌قولی از رمانِ ACE.await" if fa else "A quote from the novel ACE.await"
    stars = [(120,200),(200,280),(320,160),(480,240),(640,140),(820,220),(940,300),
             (160,500),(900,480),(100,780),(980,820),(220,1100),(780,1050),(500,1200),(860,1220)]
    star_svg = "".join(f'<circle cx="{x}" cy="{y}" r="{1.5 + (i%3)*0.7}" fill="#e8dcc0" opacity="{0.35 + (i%4)*0.12}"/>' for i,(x,y) in enumerate(stars))
    return f'''
<section class="card" style="background:#0b1020;color:#f2ead8;">
  <div style="position:absolute;inset:0;background:
    radial-gradient(ellipse 50% 35% at 50% 45%, rgba(100,120,180,0.14), transparent 60%),
    radial-gradient(ellipse 40% 30% at 80% 15%, rgba(180,140,220,0.10), transparent 50%),
    linear-gradient(180deg,#121830,#0b1020 50%,#080c18);"></div>
  <svg viewBox="0 0 1080 1350" style="position:absolute;inset:0;width:100%;height:100%;z-index:1;">
    {star_svg}
    <path d="M200 280 L320 160 L480 240 L640 140 L820 220" stroke="#e8dcc0" stroke-width="1" opacity="0.18" fill="none"/>
    <path d="M160 500 L320 160 M820 220 L900 480" stroke="#e8dcc0" stroke-width="0.8" opacity="0.12" fill="none"/>
  </svg>
  {grain(0.2, dark=True)}
  <div style="position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;padding:88px 80px 68px;">
    <p style="font-family:Cormorant Garamond,serif;font-style:italic;font-size:26px;color:#c8b890;text-align:center;">from the novel</p>
    <p style="font-family:Literata,serif;font-size:36px;font-weight:600;color:#f0e6d0;text-align:center;margin-top:4px;">ACE.await</p>
    <p style="font-family:{'Vazirmatn' if fa else 'Literata'},sans-serif;font-size:20px;color:#9aa3b8;text-align:center;margin-top:10px;">{label}</p>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;text-align:center;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},serif;font-size:{84 if fa else 70}px;font-weight:{600 if fa else 500};line-height:{1.7 if fa else 1.4};max-width:860px;">{html_mod.escape(q)}</p>
    </div>
    <div style="text-align:center;">
      <p style="font-family:{'Vazirmatn' if fa else 'Literata'},sans-serif;font-size:20px;color:#9aa3b8;margin-bottom:12px;">{html_mod.escape(ch)}</p>
      <p style="font-family:'JetBrains Mono',monospace;font-size:17px;color:#7a8498;">{SITE}</p>
    </div>
  </div>
</section>'''


BUILDERS = {
    "01-inkwash": t01_inkwash,
    "02-letterpress": t02_letterpress,
    "03-midnight-verse": t03_midnight_verse,
    "04-butterflight": t04_butterflight,
    "05-torn-page": t05_torn_page,
    "06-studio-light": t06_studio_light,
    "07-copperplate": t07_copperplate,
    "08-river-ink": t08_river_ink,
    "09-archive": t09_archive,
    "10-constellation": t10_constellation,
}


def build_all(lang="fa"):
    RENDER.mkdir(parents=True, exist_ok=True)
    paths = []
    for t in TEMPLATES:
        doc = card_shell(t["id"], BUILDERS[t["id"]](lang), lang)
        out = RENDER / f"{t['id']}-{lang}.html"
        out.write_text(doc, encoding="utf-8")
        paths.append(out)
        print(f"wrote {out.name}")
    items = "\n".join(
        f'<li><a href="{t["id"]}-{lang}.html"><b>{t["id"]}</b> — {t["name"]}</a>: {t["blurb"]}</li>'
        for t in TEMPLATES
    )
    (RENDER / f"index-{lang}.html").write_text(
        f"<!doctype html><meta charset=utf-8><title>Artistic Templates</title><ol style='font:18px/1.6 sans-serif;padding:32px'>{items}</ol>",
        encoding="utf-8",
    )
    return paths


if __name__ == "__main__":
    build_all("fa")
    build_all("en")
