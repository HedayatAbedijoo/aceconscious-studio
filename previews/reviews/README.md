# Review design comparison

Final Design A is integrated into the website. Its score card credits **The BookLife Prize** beside the rating, and its footer keeps the full-review link and translated-excerpt note. The carousel shows **1 of 1** with disabled arrows until another review is added. Design B remains available for reference. The canonical content is now `content/reviews.html`; see `content/README.md` for adding a review.

For VS Code Live Server (including port 5501), generate the static pages once from the repository root:

```sh
python3 scripts/preview-reviews.py --build-only
```

Then open `previews/reviews/index.html` with Live Server. No custom backend routes or separate server are required. Regenerate after changing the homepage, review fragment, or fixtures. The generated `view/` directory is local build output and is excluded from Git.

Alternatively, build the pages and start a local static server in one command:

```sh
python3 scripts/preview-reviews.py
```

Open **http://127.0.0.1:8765/previews/reviews/**. Select A or B, English/German/Persian, and a viewport width. “Open full page” opens the selected design in the original homepage context; Reviews appears immediately before Voices of the Characters, followed by Sample and Contents.

The preview generator replaces the Reviews section in copies of the existing locale homepages. Each language has static pages for A, B, and their carousel examples. Running this preview generator does not change or publish production homepages. `css/reviews.css` and `js/reviews.js` are shared by both designs, and translations use the existing `js/i18n.js` dictionary. The comparison and generated pages are marked `noindex`.

“Carousel test examples” adds two clearly labeled, unpublished layout fixtures: one tagline without scores, and a longer review. These fixtures live in `fixtures.json` and are only included in the generated example pages. With JavaScript disabled, articles remain stacked and readable.

## Browser verification

With the preview server running and Playwright available in the Python environment:

```sh
python3 scripts/check-review-previews.py
```

In this workspace the existing environment can be used:

```sh
campaigns/book-quotes/.venv/bin/python3 scripts/check-review-previews.py
```

Screenshots for both layouts in all three languages, plus a QA report, go to `/tmp/ace-review-previews`. Checks cover five viewport widths, numeric scores, attribution, localized order and controls, real touch swipes, keyboard wrapping, focus, reduced motion, text enlargement, and the no-JavaScript fallback.

## Review source and later integration

The public URL is https://booklife.com/project/ace-await-110051. It returned HTTP 200 and contains the supplied full assessment and scores. The originally supplied `/my/project/` URL returned HTTP 401 without authentication. Quotes are credited to **The BookLife Prize**, and translated excerpts are labeled.

Design A uses `reviews--split` on the production homepages. Run `python3 scripts/sync_reviews.py` after editing `content/reviews.html` or its translations, then rebuild these previews if needed. Add `--website` to the browser-check command to verify the actual homepages, their navigation, and language switching. Keep comparison controls and fixtures confined to previews. The carousel discovers articles and derives its count automatically.
