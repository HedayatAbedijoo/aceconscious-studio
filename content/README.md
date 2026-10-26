# Shared pages and translations

The site has nine languages, in this order: English, Deutsch, Français, Español, Русский,
中文 (Simplified Chinese), हिन्दी, العربية (Modern Standard Arabic), فارسی.
`languages.json` is the ordered registry. The dropdown title is always lowercase
`language`. `/` always opens English; no browser language or saved preference
redirects it. Language links on standalone pages retain page, query and section. On a book cover,
language links preserve the query but reset the reading position: English and
Persian stay on the cover; other selections open at the translated headline.

All 54 public pages come from shared templates in `content/templates/`:
`home`, `ace`, `rights`, `screen`, `privacy`, and `impressum`. Layout/section changes
belong in those templates and apply to every language in a single build. Do not
edit generated public HTML directly. Shared styles and scripts also apply to all
languages; the generator updates their cache hashes everywhere.

## The multilingual book edition

Every localized home URL is a book that opens at its cover and is read by turning
pages. `content/templates/book.html` and `scripts/book.py` use the matching
locale's shared home, ACE, rights, screen, privacy and imprint content. Shared
catalog corrections therefore update both the book and standalone pages.

Page order after the cover: Headline, Reviews (Kirkus first), Story, ACE, Buy, Gift,
Author, Contact, Sample, reference pages, then the back cover. Ten bookmarks
follow that order, with no Appendix bookmark or index page. The back-cover footer
links to Rights & Representation, Book to Screen, Privacy, Impressum and Contents
of the novel directly, without riffling; these pages return to the back cover.
Language selection exists only beside Open the book on the
front cover. Closing with the ribbon or Escape returns there. The root always
starts in English; browser language and saved preference do not redirect it.

`content/book/editions.json` maps available front/back covers. Persian uses its
own artwork; all other locales currently use the English art. Languages without
their own cover open at `#headline` when selected, making the translated content
visible immediately. All ordinary locale URLs still start at the cover.

Arabic and Persian use RTL typography, mirrored physical paper, tabs, controls,
keyboard arrows and touch coordinates. Artwork and text stay upright. Other
registered languages read LTR. Vazirmatn is bundled locally; Russian, Chinese
and Hindi request their appropriate Noto Serif families. English retains its
approved typography and paper effects.

Localized type scales in `css/book.css` account for each script's visual size.
Kirkus never shares a sheet with another review. The two short reviews use
`short-review-page` spacing and share a sheet when their complete translated
text fits; small screens retain readable type and can use separate sheets.
Translated story headings reserve a separate column for the decorative 2313.

Section bookmarks always remain one vertical stack of paper slips on the book
edge. Their heights, spacing and label sizes share the available space, including
short landscape displays; the paper folding and section riffle are preserved.
All ten sections stay visible together at the tested phone/tablet sizes. While a
live form field is focused, viewport resize must not rebuild/reparent the book:
that dismisses mobile keyboards. Reflow waits until editing finishes, and
unchanged layout dimensions do not trigger a rebuild.

`node scripts/check_book_mobile.cjs` checks nine locales at thirteen touch
viewport sizes, smaller desktop windows, every section's touch target, keyboard
navigation and both live forms through simulated keyboard resize and rotation.
It blocks external requests and never submits a form. Local screenshots and
JSON results go to the ignored `docs/mobile-qa/vertical/` folder. `--baseline`
records failures before a fix; `--interactions-only` runs the form/navigation
portion separately. These are Chromium emulations, not physical Android/iOS
keyboard tests. Provide Playwright on `NODE_PATH` and optionally `CHROME_BIN`.

`content/book/` holds what exists only in the book:

- `strings.<code>.json` — translated bookmarks, page furniture, headline, store
  and reader-circle wording in every locale. The builder checks key parity and
  source hashes just like the shared catalogs.
- `editions.json` — where the novel can actually be bought. The build links an
  entry only if it has a URL (or an Amazon identifier) and prints "Awaiting content"
  for the rest, so a storefront that is not published yet never appears as a live link.
- `sample-en.json` — the printed sample chapters, extracted from `assets/sample-en.pdf`
  by `scripts/extract_sample_pdf.py`. Each printed page becomes one book page with
  its own running head, folio, indents, dialogue, verse, italics and footnotes, as
  real selectable text. Re-run that script (or `--check`) if the PDF changes.
- `sample-fa.json` — nine published Persian sample pages, extracted by
  `scripts/extract_sample_fa_pdf.py`. Every sample section opens directly on the
  first printed page, without an introductory notice. Other locales use the
  original English excerpt; the website translation is not a new published novel
  edition. Persian store cards link to the Persian Kindle and paperback editions
  in `amazon.localizedEditions.fa`; other locales retain the English editions.

The ACE bookmark follows Story and precedes Author in every language. It uses
four sheets: ACE, PDAF, Agency phases, and the play invitation. The structure is
in `content/templates/ace-intro.html`, translated copy in
`content/book/ace-intro.<code>.json`, and scoped assets in `css/ace-intro.css` and
`js/ace-intro.js`. These catalogs participate in the normal key-parity and source
hash checks. All labels, definitions, navigation and accessibility text are translated;
the ACE/PDAF letter symbols and the novel’s name stay unchanged. Arabic and Persian
use RTL tab order, arrows and keyboard controls. The ordinary book pagination is
the only previous-page control; the final Revisit ACE link returns to the start.
Each sheet shows localized progress from 1 of 4 to 4 of 4. The headings are
What is ACE?, The Decision Loop, Four Phases of Agency, and Would you like to play ACE?.
The cards contain concise definitions; their earlier novel examples are no longer
displayed. `content/book/ace-intro.sources.json` retains the original scene references
for editorial history and is not rendered on the site.
The final sheet retains the decorative cards and explains that Hedayat is developing
a simple game. Its signup button opens the existing Community form at `#community`,
and its Contact link opens `#contact`; neither starts a game or submits a form.
The full standalone `/ace/`
article and its translations remain separate. Run `node scripts/check_ace_intro.cjs`
for all locales, card navigation, book order, keyboard, mobile/touch, resize, bounds
and the no-JavaScript fallback. Provide Playwright on `NODE_PATH` and optionally
`CHROME_BIN`; `--fonts` loads the actual site fonts for visual QA.

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
Multilingual behavior is checked with `node scripts/check_book_languages.cjs`: all
nine covers, language selection, auto-opening, keyboard direction, mobile layout
and content bounds. Screenshots are local under `/tmp/book-language-qa`.
`node scripts/check_book_typography.cjs` proofs every review sheet and the story
heading in all nine languages at seven viewport sizes, using actual web fonts.
It checks text preservation, Kirkus isolation, short-review packing, bounds and
title/2313 collisions. Screenshots and a comparison gallery stay local under
`/tmp/book-review-proof`; `--smoke` runs two representative viewport sizes.
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
assets: published previews remain English/Persian and open directly. The
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
