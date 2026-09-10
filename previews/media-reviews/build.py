#!/usr/bin/env python3
"""Build three local-only media review designs in the existing homepages."""
from pathlib import Path
import re
import sys

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
from sync_reviews import load_section, replace_section, set_review_count

for language in ('en', 'de', 'fa'):
    source = ROOT / ('index.html' if language == 'en' else f'{language}/index.html')
    for design in ('a', 'b', 'c'):
        section = load_section()
        section = section.replace('media-review--a', f'media-review--{design}', 1)
        section = set_review_count(section)
        page = replace_section(source.read_text(), section)
        page = page.replace('content="index, follow, max-image-preview:large"', 'content="noindex, nofollow"')
        page = re.sub(r'<title>.*?</title>', f'<title>Media review {design.upper()} · ACE.await</title>', page, count=1)
        # Previews should not report visits to the production analytics endpoint.
        page = re.sub(r'\s*<script src="/js/analytics(?:-config)?\.js[^\"]*"[^>]*></script>', '', page)
        page = page.replace('</head>', '<link rel="stylesheet" href="/previews/media-reviews/designs.css">\n<script src="/previews/media-reviews/frame.js" defer></script>\n</head>')
        out = HERE / 'view' / language
        out.mkdir(parents=True, exist_ok=True)
        (out / f'{design}.html').write_text(page)
print('Built 9 previews. Open /previews/media-reviews/index.html with Live Server.')
