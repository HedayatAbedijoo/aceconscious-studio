#!/usr/bin/env python3
"""Build static review previews, optionally serving them locally.

Usage: python3 scripts/preview-reviews.py [--build-only] [--port 8765]
Generated pages also work with VS Code Live Server or any static HTTP server.
"""
import argparse
from functools import partial
from html import escape
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
from sync_reviews import load_section, replace_section, set_review_count

ROOT = Path(__file__).resolve().parent.parent


def render_fixtures(language):
    data = json.loads((ROOT / "previews/reviews/fixtures.json").read_text())[language]
    articles = []
    for name in ("short", "long"):
        tagline = f'<blockquote class="review__tagline"><p>{escape(data["tagline"])}</p></blockquote>' if name == "long" else ""
        articles.append(f'''<article class="review" data-review-id="preview-{name}" aria-labelledby="preview-{name}-quote">
          <div class="review__quotes"><blockquote class="review__headline" id="preview-{name}-quote"><p>{escape(data[name])}</p></blockquote>{tagline}</div>
          <blockquote class="review__excerpt"><p>{escape(data[name + 'Text'])}</p></blockquote>
          <footer class="review__footer"><p class="review__source">{escape(data['source'])}</p></footer>
        </article>''')
    return '\n'.join(articles)


def render_preview(language, layout, examples=False):
    source = ROOT / ("index.html" if language == "en" else f"{language}/index.html")
    page = source.read_text()
    section = load_section()
    section = section.replace("reviews--split", f"reviews--{layout}")
    # Keep the unselected B reference while the shared fragment follows selected A.
    if layout == "masthead":
        source_credit = '<cite class="review__source review__score-source"><bdi lang="en" dir="ltr">The BookLife Prize</bdi></cite>'
        section = section.replace(source_credit, '<span class="review__score-label" data-i18n="reviews.overall">Overall score</span>', 1)
        section = section.replace('          <span class="reviews__sr-only" data-i18n="reviews.overall">Overall score</span>\n', '', 1)
        footer_credit = source_credit.replace(' review__score-source', '')
        report = '<p class="review__report"><span data-i18n="reviews.report">Critic’s Report</span><span aria-hidden="true"> · </span><bdi dir="ltr">2026</bdi></p>'
        section = section.replace('<div class="review__credit">', '<div class="review__credit">\n            ' + footer_credit + '\n            ' + report, 1)
    if examples:
        section = section.replace('      </article>\n    </div>', '      </article>\n' + render_fixtures(language) + '\n    </div>')
    section = set_review_count(section)
    page = page.replace('content="index, follow, max-image-preview:large"', 'content="noindex, nofollow"')
    page = replace_section(page, section)
    # All presentation changes are preview-only. Existing locale scripts stay intact.
    page = page.replace('</body>', '<script src="/previews/reviews/frame.js" defer></script>\n</body>', 1)
    return page.encode()


def build_previews():
    count = 0
    for language in ("en", "de", "fa"):
        directory = ROOT / "previews/reviews/view" / language
        directory.mkdir(parents=True, exist_ok=True)
        for layout in ("split", "masthead"):
            for examples in (False, True):
                name = "index" if layout == "split" else "masthead"
                if examples:
                    name += "-examples"
                (directory / f"{name}.html").write_bytes(render_preview(language, layout, examples))
                count += 1
    print(f"Built {count} static review previews. Open previews/reviews/index.html with Live Server.", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--build-only", action="store_true", help="Generate pages for an existing static server without starting another server")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    build_previews()
    if args.build_only:
        raise SystemExit(0)
    server = ThreadingHTTPServer(("127.0.0.1", args.port), partial(SimpleHTTPRequestHandler, directory=str(ROOT)))
    print(f"Review comparison: http://127.0.0.1:{args.port}/previews/reviews/", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
