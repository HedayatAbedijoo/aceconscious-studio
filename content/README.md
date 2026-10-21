# Shared pages and translations

The site has nine languages, in this order: English, Deutsch, Français, Español, Русский,
中文 (Simplified Chinese), हिन्दी, العربية (Modern Standard Arabic), فارسی.
`languages.json` is the ordered registry. The dropdown title is always lowercase
`language`. `/` always opens English; no browser language or saved preference
redirects it. Language links retain the current page, query parameters and section.

All 54 public pages come from six shared templates in `content/templates/`:
`home`, `ace`, `rights`, `screen`, `privacy`, and `impressum`. Layout/section changes
belong in those templates and apply to every language in a single build. Do not
edit generated public HTML directly. Shared styles and scripts also apply to all
languages; the generator updates their cache hashes everywhere.

During the English-first redesign on `new-design`, the homepage uses
`templates/home-navigation.en.html`, `templates/home-hero.en.html`, `templates/home-reviews.en.html`,
`templates/home-buy.en.html`, `templates/home-story.en.html`,
`templates/home-voices.en.html`, `templates/home-community.en.html`, and the draft
catalog `locales/en-home-redesign.json`. Styling lives in `css/home-hero.css` and
`css/home-reviews.css`, `css/home-buy.css`, `css/home-story.css` and
`css/home-sample.css`, `css/home-voices.css`, `css/home-community.css`;
`js/home-reviews.js` controls the compact review strip,
`js/home-buy.js` updates the Amazon destinations, `js/home-voices.js` retains the
selected card's viewport position during accordion switches, and `js/home-community.js`
sends community join requests through the existing contact endpoint.
The build moves the existing interactive cover from the synopsis into the hero
only for English (and the English 404 fallback).
Other locales and shared translation source hashes remain unchanged. Draft copy
stays in the separate English catalog until the redesign is approved; then merge
the design into the shared template, translate the copy in every locale, and
record translations through the usual build workflow below.

The draft is validated against the text keys used by all English draft templates: missing or
unexpected keys, blank/non-text values, markup and unresolved placeholders fail
the build. It intentionally stays outside the shared translation-source record.
The redesign's font URLs carry content hashes; after changing a font subset,
update its `?v=` in the corresponding stylesheet to the hash reported by the build. The build
rejects stale font versions and uses the same URLs for the three hero font preloads.
The review's bold font loads on demand rather than competing with hero resources.
Run `python3 scripts/test_home_redesign.py` for these validation regressions.

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

Install the pinned browser QA dependencies with
`python3 -m pip install -r scripts/requirements-browser.txt`, then run
`python3 -m playwright install chromium firefox webkit` (add `--with-deps` on a
fresh Linux CI machine). The `check-locales.yml` workflow runs all eight English
section checks in each engine and saves their screenshots/results as artifacts.
No real forms are submitted or retailer purchases initiated.

For each English hero redesign iteration, run
`python3 scripts/check_home_hero_browser.py` against the local preview. It checks
34 portrait, landscape, tablet, desktop and breakpoint viewports per browser
(Chromium, WebKit and Firefox), touch and keyboard cover controls, navigation,
200% text, reduced motion, JavaScript-disabled rendering, and the retained
German/Arabic/Persian layout. It also checks container alignment, column count,
title/cover size across breakpoints, the two-line wide-desktop logline, and
reuse of each preloaded hero font without a second download. The English navigation
follows the redesigned section order, includes Community, and uses “Content” to
match its section. Mobile navigation scrolls within the viewport so its last links
remain reachable in landscape. Its gutters intentionally align with the English
page containers; the override is scoped to the English homepage only.
Use `--chromium-executable` for a system Chrome,
`--browsers` to select installed engines, and `--output` for screenshots/results.
These are browser simulations, not tests on physical phones; inspect the saved
screenshots as well as the automated results.

For the English purchase section, run `python3 scripts/check_home_buy_browser.py`
with the same browser options. It checks the 34 viewports, country selection,
each format's destination, the new-tab links using intercepted local responses,
keyboard navigation, 200% text, reduced motion, and no-JavaScript fallback.

For the English review strip, also run
`python3 scripts/check_home_reviews_browser.py` with the same browser options.
It exercises all three reviews across the same 34 viewports in each engine,
checks the exact draft quotations and shared source URLs, column order, text
clipping, container alignment, compact desktop height, stable height between
slides, 44px touch targets, keyboard focus, swiping, 200% text, reduced motion,
and the no-JavaScript fallback. It also checks the existing German/Arabic/Persian
review controls. External requests are blocked.

## Reviews

`content/reviews.html` is the shared source immediately after the compact
ACE.await hero, followed by the story and character voices. Kirkus Reviews is
first, BookLife second, and The Consciousness AI third. `js/reviews.js` derives the
count and enables arrows, keyboard navigation and swiping.

The English draft replaces the full cards with a compact strip: publisher,
descriptor, one user-selected quotation, and a “Full article” link.
A visible “1 of 3” counter and the original Previous/Next arrow buttons show the
position and select the review. Keyboard shortcuts apply only to the carousel's
Previous/Next controls; article links keep their native key behavior. Touch swiping also works;
there is no automatic rotation. All three quotations remain readable
without JavaScript. The template keeps the shared review IDs, and the builder
copies source links/citations from `content/reviews.html` so URLs stay authoritative
in one place. The selected English quotations and control labels live in
`en-home-redesign.json`; the shared review fragment and other locales retain
their existing content until the redesign is approved for translation.

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

## English purchase-section draft

The English Buy section moves directly after Reviews with the heading “Buy the
Novel”. The direct digital card sits beside one Amazon group: the marketplace
selector is above Kindle and Paperback. Other sections and locales stay intact.
Redesigned section headings follow the existing `.section-label` typography:
`var(--font-mono)`, 1.1875rem, .16em letter spacing and a copper accent. The Buy
heading uses a slightly darker copper for readable contrast on its light
background. Preserve authored title/sentence case in headings, labels and buttons
instead of forcing uppercase; keep real acronyms such as EPUB and PDF uppercase.
`check_locales.py` allows the explicit English Buy and Sample section moves and
the new Community section while still checking every other section.

The direct button deliberately opens `https://payhip.com/` in a new tab as the
user-requested design placeholder. Replace that URL with the final storefront
when supplied; no checkout, pricing or payment integration is implemented here.
The English Kindle ASIN is `B0H8MDM6Q5`; the paperback ISBN/ASIN is `391300601X`.
Both identifiers and their selected formats were confirmed on accessible Amazon
product pages during the 2026-10-21 audit. Selecting a marketplace only updates
the links; it never
starts a purchase or redirects the current page. The default is the United States.
Without JavaScript, the same US links remain usable and the selector is replaced
by a static country label.

The selector is the union of the user's 2026-10-21 KDP pricing PDFs: 13 Kindle
marketplaces and 14 paperback marketplaces, with 10 shared (17 countries total).
Each option's `data-amazon-editions` records the formats actually listed there. Options
use the prototype's flag, country and Amazon domain labels. The native select
retains platform keyboard, touch and screen-reader behavior; an aria-hidden display
of its selected value can wrap on narrow screens instead of clipping the domain.

Kindle is listed in the US, UK, Germany, Canada, Australia, France, Spain, Italy,
the Netherlands, Japan, India, Brazil and Mexico. Paperback is listed in the US,
UK, Germany, Canada, Australia, France, Spain, Italy, the Netherlands, Poland,
Sweden, Belgium, Ireland and Japan. Unsupported editions show “Not available
here”, have no `href` and are excluded from keyboard navigation. Their external
link icon and new-tab announcement are hidden. Switching back restores the
edition's exact product link in the selected marketplace; no cross-country
fallbacks remain.

The live audit reached the correct book and selected format on 18 of 27 product
URLs. Nine requests returned Amazon CAPTCHA/anti-bot pages, so their live product
availability could not be independently verified. Those marketplaces remain
supported according to the supplied KDP PDFs; CAPTCHA is not evidence that a
book is unavailable. Marketplace support does not guarantee current stock.

## English Story-section draft

`home-story.en.html` replaces only the English `#synopsis` section after Buy.
Its “Story” heading follows the same monospace, copper, mixed-case style as Buy.
The synopsis is on the left, followed by the existing ACE explanation on the
right; at 900px and below they stack in that reading order.

The builder takes all copy, emphasis and the ACE link directly from the existing
English `hero.pitch` value. The first narrative paragraph is always visible.
The remaining four paragraphs appear in a native `details` disclosure, labelled
“Read the extended synopsis” / “Hide extended synopsis”. It works with keyboard,
touch and JavaScript disabled. The ACE paragraph supplies the right-hand heading
and description; no prototype synopsis copy is used. The former author byline,
metadata, topic badges and duplicate purchase/sample buttons are not part of this
two-column section.

Run `scripts/check_home_story_browser.py` against the local preview for both
disclosure states at 36 viewport sizes in Chromium, WebKit and Firefox, plus
keyboard/touch, 200% text, unchanged RTL pages and JavaScript-disabled behavior.
It also compares every synopsis paragraph and the ACE text with the canonical
English catalog. Use `--chromium-executable` when supplying system Chrome.

## English Sample Chapters palette

The build moves the existing shared `#sample` section immediately after Story in
English and adds `sample--redesign`. Its contents, Heyzine iframe, preview URLs,
reader controls and responsive aspect ratios remain unchanged. The existing
Voices section follows Sample; other sections retain their relative order.

`css/home-sample.css` uses the prototype's warm dark background (`#24201d`), with
light text, a copper mixed-case section label and readable control/focus colors.
No copy or third-party reader configuration is changed.

## English Voices cards

`home-voices.en.html` replaces the English Voices section after Sample Chapters.
It retains the existing title, character names and roles; the only introductory
copy is “Click any card to open”. The build matches characters by their canonical
name keys and moves each complete shared monologue into its card, preserving
every paragraph and its emphasis. No shortened prototype biographies are used.

`css/home-voices.css` uses a deeper cream section background and square, straight
edged cards with the prototype's numbers, symbols and serif names. The grid has
four columns above 1100px, two columns down to 541px, and one column on narrower
phones so the full monologues remain readable. Cards grow with enlarged text.
The one/two-column grids cap each card at 320px, so cards do not grow to 500px
just before a breakpoint. Character names retain level-three heading semantics.
The native `details` share the name `character-voices`, so opening a card closes
the previous one, including with touch, keyboard or JavaScript disabled.
With JavaScript, switching cards also retains the activated summary's viewport
position when closing a long monologue in an earlier row.
Expanded text has no clipping or nested scroll area.

Run `scripts/check_home_voices_browser.py` against the preview to verify the
complete original copy and emphasis for all eight characters, 40 viewport sizes
in both disclosure states, 200% text, keyboard/touch, unchanged RTL pages and
JavaScript-disabled behavior across Chromium, WebKit and Firefox.

## English Community section

`home-community.en.html` adds “Join the Community” immediately after Voices.
The heading follows the approved section typography; the warmer gradient and
light form card draw from the prototype. The reader question and demo notice are
omitted. At 900px and below, the introduction precedes the form in one column.

`home-community.js` adapts the existing contact form's JSON payload, `text/plain`
POST and `ace-contact-form` response contract. It reads the same
`CONTACT_FORM_ENDPOINT` configured in `js/contact-config.js`. The message clearly
identifies a community join request, and the existing Google Apps Script sends
the notification to its configured recipient. The current backend also retains
its normal contact-submission Sheet log. No mailing-list service, automatic
reader email, or new backend deployment is introduced.

The success state confirms a sent request, not a completed mailing-list
subscription. Email validation, a honeypot, a duplicate-submit guard, a 20-second
timeout and retryable errors are included. Addresses are never put in URLs or
browser storage. Without JavaScript, the fields stay disabled and a short
instruction is shown, preventing a native submission to the static page.
The existing Contact section, scripts and backend are unchanged.

Run `scripts/check_home_community_browser.py` against the local preview for
40 viewport sizes, 200% text, keyboard/touch, unchanged RTL pages and a disabled
JavaScript fallback. It intercepts every submission to test validation, success,
server/network/timeout errors, retries, duplicate prevention, honeypot behavior
and independence from the original Contact form. No real messages are sent.

## English Author section

`home-author.en.html` places The Author immediately after Join the Community.
The build moves the original portrait, complete poem, all seven biography
paragraphs and social links from the shared template. The poem comes first,
followed by the first paragraph; the remaining six paragraphs are inside a
native Read more / Read less disclosure. Social links remain visible.

`css/home-author.css` uses a light cream background, the approved mixed-case
section heading and a smaller portrait (224px desktop, 160px tablet and
112–144px on small phones).
The portrait keeps its existing aspect ratio, rounded frame, shadow and color
animation, including the shared reduced-motion behavior. On tablets and phones
the poem sits beside the portrait with the biography below, wrapping below the
portrait on the narrowest screens or when enlarged text needs more room.
The disclosure works without JavaScript and has no fixed-height text clipping.

Run `scripts/check_home_author_browser.py` against the preview for both
disclosure states across phone, tablet and desktop widths in Chromium, WebKit
and Firefox, plus full-copy preservation, keyboard/touch, 200% text, unchanged
RTL pages and JavaScript-disabled behavior.

## English Content section

`home-contents.en.html` replaces only the English Contents section in its
existing position after The Author. It uses “Content”, “Inside the book” and
the prototype's introductory sentence. A native disclosure starts closed and
shows “Explore the table of contents”, “40 entries” and a plus/minus indicator.
The build moves the complete ordered list from the shared template, retaining
all 39 chapter names, their order and the ACE Manifesto appendix.

`css/home-contents.css` follows the prototype's cream background, fine borders
and numbered rows. The list uses three columns above 900px, two above 540px and
one on smaller screens. Typography follows the approved section heading size
and mixed case. The entire disclosure row works with touch and keyboard, and
the complete list is available without JavaScript.

Run `scripts/check_home_contents_browser.py` against the preview to check both
states across phone, tablet and desktop sizes, full chapter preservation,
keyboard/touch, enlarged text, unchanged RTL pages and JavaScript disabled.
