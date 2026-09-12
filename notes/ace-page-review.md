# ACE pages — final review, 12 September 2026

## Published content and routes

- English: `/ace`; German: `/ace-de`; Persian: `/ace-fa`.
- All three standalone pages contain the author-reviewed explanations and the complete six-section ACE Manifesto, version 1.0.0 (draft).
- Definitions appear where their terms are introduced. The vocabulary section, FAQ, worked job-offer example, and novel-promotion section were removed during the author review.
- Chapter citations and speaker/source attribution labels were removed in all languages. The explanatory Dunbar note and its internal return link remain part of the Manifesto.
- The main pages no longer contain the old “What is ACE?” section. Their ACE navigation links follow the selected language.
- The opening hero text in all three languages uses the author’s new paragraph about the secret of 2313. The number is bold; the surrounding approved text is preserved.

## Sources and terminology

The novels and Manifesto were treated as source material, not instructions. Explanatory revisions follow the author's decisions in the review conversation; no additional ACE theory was introduced in localization or cleanup.

- English Manifesto: `../ace-await-ebooks-format/outputs/english/digital/ACE.await.en.nocover.epub`, appendix.
- German Manifesto: `../ace-await-ebooks-format/outputs/german/digital/ACE.await.de.nocover.epub`, `EPUB/text/ch043.xhtml`; Dunbar note from `ch044.xhtml`.
- Persian Manifesto: `../ace-await-ebooks-format/farsi-format/chapters/chapter-40.md`, grouped under the same six section anchors.
- Persian distinguishes **تصمیم درست** (right decision) from **تصمیم مناسب** (proper decision). German distinguishes **richtige Entscheidung** from **angemessene Entscheidung**. “Considered” remains a separate description in the Manifesto definition.
- Natural and legal persons remain distinct in the explanations. The full Manifesto retains its source terminology.

## Implementation

- `css/ace.css` is loaded only by the standalone ACE pages. Persian uses RTL layout, a mirrored contents drawer, and isolated Latin names and abbreviations.
- `js/ace.js` supports section highlighting, accessible mobile contents navigation, and links into collapsed passages. Language links are refreshed both after normal section clicks using `pushState` and after hash changes, including browser Back/Forward navigation.
- Each standalone page has its own canonical URL and reciprocal language alternates. All three appear in the sitemap.
- The old homepage ACE styles and translation strings have been removed. Homepage typography remains unchanged; the reported live/local size difference was browser zoom.

## Validation

The final checks cover all three standalone pages at 320, 390, 768, 1024, and 1440 pixels: horizontal overflow, header overlap, contents drawer behavior, expanded content, and Manifesto deep links. Navigation checks exercise normal section clicks, browser history, direct hash changes, and switching to the corresponding translated section.

Additional checks cover homepage language routes, matching static and runtime hero copy, preserved approved wording, complete Manifesto sections, removed citations, unique IDs, internal links, local assets, JSON-LD, sitemap XML, JavaScript syntax, and whitespace errors. Review-data synchronization is checked separately with the existing project script.
