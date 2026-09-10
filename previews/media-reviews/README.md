# Integrated media review: Design A

Design A is integrated into the main homepages. BookLife remains first; The Consciousness AI is second, without ratings. Its publisher card includes the official logo, source link and date. Two short quotations are followed by the user-supplied opening paragraph, preserving the bold emphasis on the central ethical question.

All three passages are in English on the English site and translated on the German and Persian sites. Translation notes are explicit. Quotes use semantic blockquotes and cite the direct essay URL.

Canonical content: `content/reviews.html`; translations: `js/i18n.js`; styles: `css/reviews.css`; logo: `assets/reviews/the-consciousness-ai.png`. Edit those files, then run:

```sh
python3 scripts/sync_reviews.py
python3 previews/media-reviews/build.py
```

Open `previews/media-reviews/index.html` with Live Server serving the repository root. The preview reads the canonical content and defaults to the second review, while production starts with BookLife. EN/DE/FA and mobile/tablet width controls remain available. B and C are retained only as direct-page layout references. Generated `view/` files are ignored by Git.

Production uses no preview scripts, styles or assets. The local integration does not publish the site.

Source: [Original essay](https://theconsciousness.ai/posts/hedayat-abedijoo-ace-await-ai-consciousness-novel-2026/), The Consciousness AI, September 9, 2026. Logo: [official black site logo](https://theconsciousness.ai/public/images/site-logo-black.png), unmodified. No individual byline was inferred.
