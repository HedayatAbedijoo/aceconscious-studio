#!/usr/bin/env python3
"""Place the shared Reviews section before Voices on the static homepages.

Edit content/reviews.html and its js/i18n.js translations, then run:
  python3 scripts/sync_reviews.py
No runtime fetch or server is needed by the website.
"""
import argparse
from hashlib import sha256
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
PAGES = ("index.html", "de/index.html", "fa/index.html", "404.html")
START = "<!-- Reviews:start -->"
END = "<!-- Reviews:end -->"


def asset_url(path):
    version = sha256((ROOT / path).read_bytes()).hexdigest()[:10]
    return f"/{path}?v={version}"


def set_review_count(section):
    identifiers = re.findall(r'<article\b[^>]*\bdata-review-id="([^"]+)"', section)
    if not identifiers or len(identifiers) != len(set(identifiers)):
        raise ValueError("Reviews need at least one article and unique data-review-id values.")
    total = len(identifiers)
    section = re.sub(r'(<span class="reviews__counter"[^>]*>).*?(</span>)', lambda m: f"{m[1]}1 of {total}{m[2]}", section)
    return re.sub(r'(<p class="reviews__sr-only reviews__status"[^>]*>).*?(</p>)', lambda m: f"{m[1]}Review 1 of {total}{m[2]}", section)


def load_section():
    return set_review_count((ROOT / "content/reviews.html").read_text().strip())


def replace_section(page, section):
    block = f"    {START}\n{section}\n    {END}\n\n"
    if START in page:
        if END not in page:
            raise ValueError("The existing Reviews section is missing its end marker.")
        page = re.sub(r'^[ \t]*' + re.escape(START) + r'.*?' + re.escape(END) + r'\n{0,2}', '', page, count=1, flags=re.S | re.M)
    voices = re.search(r'^[ \t]*(?:<!-- Characters -->\n[ \t]*)?<section\b[^>]*\bid="voices"[^>]*>', page, re.M)
    if not voices:
        raise ValueError("Cannot find the Voices section.")
    return page[:voices.start()] + block + page[voices.start():]


def update_page(page, section):
    page = replace_section(page, section)
    review_link = re.search(r'<li><a href="#reviews"[^>]*>.*?</a></li>', page)
    review_link = review_link.group() if review_link else '<li><a href="#reviews" data-i18n="nav.reviews">Reviews</a></li>'
    page = re.sub(r'^[ \t]*<li><a href="#reviews"[^>]*>.*?</a></li>\n?', '', page, count=1, flags=re.M)
    page = re.sub(r'<li><a href="#voices"[^>]*>.*?</a></li>', lambda m: review_link + '\n        ' + m.group(), page, count=1)
    stylesheet = f'<link rel="stylesheet" href="{asset_url("css/reviews.css")}">'
    if re.search(r'<link\b[^>]*href="/css/reviews\.css(?:\?[^"]*)?"[^>]*>', page):
        page = re.sub(r'<link\b[^>]*href="/css/reviews\.css(?:\?[^"]*)?"[^>]*>', stylesheet, page)
    else:
        page = page.replace('</head>', '  ' + stylesheet + '\n</head>', 1)
    script = f'<script src="{asset_url("js/reviews.js")}" defer></script>'
    if re.search(r'<script src="/js/reviews\.js(?:\?[^"]*)?"[^>]*></script>', page):
        page = re.sub(r'<script src="/js/reviews\.js(?:\?[^"]*)?"[^>]*></script>', script, page)
    else:
        page = re.sub(r'(<script src="/js/main\.js[^\"]*"[^>]*></script>)', lambda m: m[1] + '\n  ' + script, page, count=1)
    return re.sub(r'(?<=src=")/js/i18n\.js(?:\?[^"]*)?', asset_url("js/i18n.js"), page)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Check that the homepages match the shared section without writing")
    args = parser.parse_args()
    section = load_section()
    stale = []
    for name in PAGES:
        path = ROOT / name
        before = path.read_text()
        after = update_page(before, section)
        if before != after:
            stale.append(name)
            if not args.check:
                path.write_text(after)
    if args.check and stale:
        raise SystemExit("Run python3 scripts/sync_reviews.py to update: " + ", ".join(stale))
    print("Review pages are up to date." if args.check else f"Updated {len(stale)} review pages.")
