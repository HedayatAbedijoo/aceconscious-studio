# Website content and translations

- Public HTML pages are generated. Edit `content/templates/*.html` for shared
  structure and `content/locales/*.json` for text, then run
  `python3 scripts/build_locales.py`.
- Keep every page and section consistent across all registered languages. The ordered
  language registry is `content/languages.json`; the menu title is always the
  literal lowercase `language`. The root URL defaults to English.
- A text change requires corresponding translations in every locale. Do not ship
  English fallbacks or silently remove an untranslated section. Keep proper
  names, review attribution, actual edition availability and external URLs accurate.
  After updating all translations for changed English text, use
  `python3 scripts/build_locales.py --record-translations`. The source hashes
  prevent accidental publication with translations of an older English source.
- Reviews share `content/reviews.html`. `scripts/sync_reviews.py` rebuilds all
  locales, including their translated reviews.
- English `/` is the book edition: `content/templates/book.html` plus
  `scripts/book.py`, which lays out the content of the shared English pages as
  book pages. Its own wording lives in `content/book/`. Keep the other languages
  on `home.html`; do not add a language picker inside the book. Store links come
  from `content/book/editions.json` — never invent a URL, ASIN or format.
  The sample chapters come from `assets/sample-en.pdf` through
  `scripts/extract_sample_pdf.py`; keep them as real text in the printed layout.
- Before completing changes, run `python3 scripts/build_locales.py --check` and
  `python3 scripts/check_locales.py`. For navigation/layout changes, also check
  keyboard, mobile and RTL behavior in a browser.
- Do not send email through the user's mailbox. Only create drafts for review.
