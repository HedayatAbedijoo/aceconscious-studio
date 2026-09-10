# Adding a book review

The website uses the final Design A immediately before **Voices of the Characters**. `reviews.html` is the shared source for all homepages; `js/reviews.js` counts the articles and enables navigation automatically. BookLife is first and The Consciousness AI is second. The carousel starts at **1 of 2**, with arrows, keyboard navigation and swiping enabled.

1. Copy an `<article class="review">…</article>` block inside `reviews.html` and place it in the desired review order.
2. Give the article a unique `data-review-id`, heading `id`, and matching `aria-labelledby`. Replace its quotes, short excerpt, source name, full-review URL, and scores. Keep the quotes, excerpt, and footer inside `review__copy` and the rating inside `review__score-panel`; these let the desktop text flow without gaps caused by the score card. Keep the source beside the rating. For an unscored media review, use the `media-review media-review--a` article: its publisher card holds the source logo, name, publication date and source link, with no score panel. The second tagline is optional.
3. Give the new text unique `data-i18n` keys, such as `reviews.next.headline`, `reviews.next.tagline`, and `reviews.next.excerpt`. Add those keys to the English, German, and Persian dictionaries in `js/i18n.js`. Leave the source's proper name unchanged. Use the translation note for excerpts translated from English.
   The Consciousness AI excerpt uses `data-i18n-html` to preserve the user-supplied `<strong>` emphasis. Keep all three quotes translated in German/Persian and retain the translated-quotation note.
4. Run `python3 scripts/sync_reviews.py`. This updates the English, German, Persian, and fallback homepages, including the initial count and asset cache versions. It does not publish the website.
5. Check the website through Live Server. To refresh the comparison fixtures as well, run `python3 scripts/preview-reviews.py --build-only`.

`python3 scripts/sync_reviews.py --check` verifies that the homepages match the shared source. Keep layout-test fixtures confined to the preview directory; they are never added to the shared content file.
