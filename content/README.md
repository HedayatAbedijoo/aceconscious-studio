# Shared pages and translations

The site has nine languages, in this order: English, Deutsch, Français, Español, Русский,
中文 (Simplified Chinese), हिन्दी, العربية (Modern Standard Arabic), فارسی.
`languages.json` is the ordered registry. The dropdown title is always lowercase
`language`. `/` always opens English; no browser language or saved preference
redirects it. Language links retain the current page, query parameters and section.

All 54 public pages come from shared templates in `content/templates/`:
`home`, `ace`, `rights`, `screen`, `privacy`, and `impressum`. Layout/section changes
belong in those templates and apply to every language in a single build. Do not
edit generated public HTML directly. Shared styles and scripts also apply to all
languages; the generator updates their cache hashes everywhere.

## The English book edition

English `/` is a different presentation of the same content: one book that opens
at the cover and is read by turning pages. It is built from `content/templates/book.html`
by `scripts/book.py`, which reads the rendered English `home`, `ace`, `rights`,
`screen`, `privacy` and `impressum` pages and lays their content out as ordered
book pages. Nothing is retyped there, so editing a shared template or `en.json`
still updates the book. `build_locales.template_for()` is the only switch: every
other language keeps `home.html` and its existing design, routes and text.

Page order after the cover: Headline, Reviews (Kirkus first), Story, Author, Buy,
Contact, Community, Sample, Appendix, ACE, then the back cover. The eleven bookmarks match
that order. The back cover reuses the shared home-page footer and places the binding
on the right, with the page edges on the left. The English edition has no Voices section, so English pages link to
`/#voices` no longer; the other languages keep theirs. There is no language picker
inside the book; `hreflang` and the other languages' own URLs are unchanged.

`content/book/` holds what exists only in the book:

- `strings.en.json` — bookmark names, page furniture, the headline, store and
  reader-circle wording. English only on purpose: adding a key here does not force
  a translation into the other eight catalogs. A future edition adds `strings.<code>.json`.
- `editions.json` — where the novel can actually be bought. The build links an
  entry only if it has a URL (or an Amazon identifier) and prints "Awaiting content"
  for the rest, so a storefront that is not published yet never appears as a live link.
- `sample-en.json` — the printed sample chapters, extracted from `assets/sample-en.pdf`
  by `scripts/extract_sample_pdf.py`. Each printed page becomes one book page with
  its own running head, folio, indents, dialogue, verse, italics and footnotes, as
  real selectable text. Re-run that script (or `--check`) if the PDF changes.

`js/book.js` reflows the static markup in `#book-source` onto paper sheets and
hands them to StPageFlip (`js/vendor/page-flip.js`, MIT). Without JavaScript the
same markup reads as an ordinary page, which is also what crawlers see. The contact
form and the reader circle are the project's real forms, moved onto their pages so
`js/contact.js` and `js/community.js` keep working; no demo form, no mailto stand-in.

The bundled page-turn library has local lifecycle fixes documented in
`js/vendor/README.md`. Browser regressions run with
`node scripts/check_book_browser.cjs` (Playwright must be available to Node;
`CHROME_BIN` optionally selects Chrome). The suite serves local files through
interception and mocks all form requests. `--fonts` permits Google Fonts reads.
The shared Python browser suite also supports `--local-files` to run without a
preview server. Static checks verify that legal introductions and ACE comparison
values survive conversion into book pages.

Text belongs in `content/locales/<code>.json`. `en.json` is the English source.
The text inside a template's `data-i18n` / `data-i18n-html` elements is illustrative;
the catalog is authoritative. Use a descriptive key for new content and add its
translation to every catalog. `data-i18n-attr="alt:key;aria-label:other.key"` also
supports translated accessibility labels, metadata and placeholders. Keep HTML
emphasis, links and interpolation placeholders such as `{current}` intact.

The initial additions used machine-assisted translation, with manual revision of
navigation, story introductions, names and core model terminology. Existing
German/Persian translations were retained wherever they matched the shared
content. Review quotations are identified as translations. Proper names, brand
names, URLs, legal references, scores, and actual book edition availability remain
accurate. The book itself, cover artwork and the third-party flipbook are separate
assets: published previews remain English/Persian, with a localized notice. The
new website languages do not imply new published editions of the book.

## Build and check

Install the small build dependency once:

```sh
python3 -m pip install -r scripts/requirements.txt
```

After a layout, CSS, JS, or translated wording change:

```sh
python3 scripts/build_locales.py
python3 scripts/build_locales.py --check
python3 scripts/check_locales.py
```

When English source text changes, first update **all translations**, then
record that work and rebuild:

```sh
python3 scripts/build_locales.py --record-translations
python3 scripts/check_locales.py
```

The source-hash record rejects unacknowledged English changes; missing/empty
translations, damaged interpolation placeholders and unsafe HTML fail the build.
The checker verifies all 54 page routes, language ordering, section consistency,
metadata, local links, anchors and assets. CI and the deployment script run the
checks. Builds are deterministic and use no translation service or network.

Serve the repository with any static web server for browser QA. Check mobile and
desktop, Arabic/Persian RTL, Cyrillic/Hindi/Chinese text, keyboard navigation, contact
validation, and review controls. Do not submit real contact messages during tests.
`scripts/check_locales_browser.py` automates these checks at desktop/mobile sizes,
including switching without JavaScript. It requires Playwright and a running
local server; use `--base`, `--executable` and `--output` as needed. The test blocks
external requests and never submits a contact message.

## Reviews

`content/reviews.html` is the shared source immediately after the compact
ACE.await hero, followed by the story and character voices. Kirkus Reviews is
first, BookLife second, and The Consciousness AI third. `js/reviews.js` derives the
count and enables arrows, keyboard navigation and swiping.

To add a review, copy an article in the shared fragment, give it a unique
`data-review-id`, heading ID and matching `aria-labelledby`, and add its text keys
to **all** locale catalogs. Preserve source attribution, quotations, scores,
links and the translated-quotation note. The Kirkus card has no inferred numerical
score or review date. Its Persian publisher spelling is **کِرکِس ریویوز**. Preserve
`<strong>` emphasis in HTML translations.

Run `python3 scripts/sync_reviews.py` to rebuild every locale, or add `--check` to
verify the generated files. This does not publish. Existing comparison fixtures
can be regenerated with `python3 scripts/preview-reviews.py --build-only`; fixtures
stay in `previews/` and never enter the shared content file.
