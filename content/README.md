# Shared pages and translations

The site has nine languages, in this order: English, Deutsch, Français, Español, Русский,
中文 (Simplified Chinese), हिन्दी, العربية (Modern Standard Arabic), فارسی.
`languages.json` is the ordered registry. The dropdown title is always lowercase
`language`. `/` always opens English; no browser language or saved preference
redirects it. Language links retain the current page, query parameters and section.

All 54 public pages come from six shared templates in `content/templates/`:
`home`, `ace`, `rights`, `screen`, `privacy`, and `impressum`. The homepage also
includes shared `buy`, `ace-intro`, and `gift-community` fragments. Layout/section changes
belong in those templates and apply to every language in a single build. Do not
edit generated public HTML directly. Shared styles and scripts also apply to all
languages; the generator updates their cache hashes everywhere.

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

`scripts/check_home_extensions.py` checks the ACE/Gift additions in all nine
languages at desktop and narrow mobile widths. It covers all steps and tabs,
keyboard/RTL navigation, form focus, exact catalog copy, section order, no-script
fallback, and mocked community validation, success, errors, duplicate requests,
honeypot, unavailable configuration and the 20-second timeout. All external
requests are blocked; no signup or contact messages reach the real endpoint.

The ACE introduction uses the `aceIntro.*` catalog keys; Gift and Community use
`giftCommunity.*`. Their approved copy and intentional newlines are preserved.
The homepage order is hero, Reviews, Story, ACE introduction, Buy, Gift (including
Community), Author, Contact, Voices, Sample, Contents, and the existing footer.
The standalone ACE article retains its existing route. Community requests use
`js/contact-config.js` and the contact backend; they do not confirm a subscription.

The first three ACE steps use a compact vertical selector on the physical left
and a shared reading panel, including in RTL layouts. Up/Down and Home/End select
cards. Selecting a card types its copy, following the character reader's behavior;
the complete accessible text remains available, and reduced motion shows it
immediately. `scripts/check_ace_reader.py` checks all eleven cards, exact copy,
responsive/RTL layout, keyboard selection, typing cancellation and no-script fallback.

The homepage header keeps Reviews, Story, ACE, Buy, Gift and Contact inline while
they fit; Author, Characters, Sample and Contents use the hamburger disclosure. At mobile
widths all ten links move into it, and intermediate widths move trailing priority
links as needed. `js/home-nav.js` measures real link widths (including translated
labels and loaded fonts), so the header never wraps. ACE links to the introduction;
the full model article remains linked in the footer. The new sections use the
existing `.container`, section labels, Reviews controls, buttons and Contact form
styles. The browser checker also verifies alignment and navigation across 12
additional viewport sizes per language, including landscape and live resizing.

## Reviews

`content/reviews.html` is the shared source immediately after the compact
ACE.await hero, followed by the story. Character voices appear after Contact. Kirkus Reviews is
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
