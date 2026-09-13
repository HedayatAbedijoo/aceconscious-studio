# Final SEO source verification — ACE Conscious Studio

Captured at **2026-09-12T22:59:56.073443+00:00** using direct HTTPS `curl` requests; inspected the raw responses rather than a rendered-text crawler.

## Scope and result

All three discovery files return HTTP 200 with the expected content types and exactly match the repository. All six indexable pages return HTTP 200 and contain parseable JSON-LD with consistent entity and translation references. Their raw HTML matches commit `b874069`.

The shortened homepage titles and synchronized legal navigation in this round are local changes. The live source results below describe the already deployed version; they do not claim these new edits are deployed.

## Local changes

| Language | Homepage title | Characters |
|---|---|---:|
| EN | ACE.await \| AI, Consciousness & the ACE Decision Model | 54 |
| DE | ACE.await \| KI, Bewusstsein & das ACE-Entscheidungsmodell | 57 |
| FA | ACE.await \| هوش مصنوعی، آگاهی و مدل تصمیم‌گیری ACE | 50 |

- Updated `<title>`, Open Graph title, Twitter title, WebPage name, and their runtime i18n values. Updated the fallback page and the i18n asset version.
- Privacy and Impressum in English and German now use the same eight-link navigation structure and labels as the localized homepage, including ACE. Links target the corresponding homepage section or localized ACE page.
- Legal language menus offer EN and DE, both pointing to the corresponding legal document. Removed FA because there is no Persian legal translation.
- Legal document text and `noindex` directives are unchanged. All three standalone ACE pages are byte-for-byte unchanged.

Local verification passed: `node --check js/i18n.js`, `git diff --check`, HTML/link checks, and execution of the i18n code for EN/DE/FA with matching document, Open Graph, Twitter and JSON-LD titles. Headless Chrome checks covered all four legal pages at 390, 1024 and 1440 pixels: eight navigation links, correct EN/DE language choices, no clipped or overlapping links, and working mobile menu open/close controls. External requests were blocked during these local browser checks.

## HTTP responses

| URL | HTTP | Content type | Bytes | Redirects |
|---|---:|---|---:|---:|
| [/robots.txt](https://aceconscious.studio/robots.txt) | 200 | `text/plain; charset=utf-8` | 1426 | 0 |
| [/sitemap.xml](https://aceconscious.studio/sitemap.xml) | 200 | `application/xml` | 3293 | 0 |
| [/llms.txt](https://aceconscious.studio/llms.txt) | 200 | `text/plain; charset=utf-8` | 2356 | 0 |
| [/](https://aceconscious.studio/) | 200 | `text/html; charset=utf-8` | 53055 | 0 |
| [/de/](https://aceconscious.studio/de/) | 200 | `text/html; charset=utf-8` | 54935 | 0 |
| [/fa/](https://aceconscious.studio/fa/) | 200 | `text/html; charset=utf-8` | 58282 | 0 |
| [/ace/](https://aceconscious.studio/ace/) | 200 | `text/html; charset=utf-8` | 81080 | 0 |
| [/ace-de/](https://aceconscious.studio/ace-de/) | 200 | `text/html; charset=utf-8` | 88539 | 0 |
| [/ace-fa/](https://aceconscious.studio/ace-fa/) | 200 | `text/html; charset=utf-8` | 112365 | 0 |

All six HTML responses lack an `X-Robots-Tag` header and their robots meta permits indexing.

## Crawler access

The downloaded robots rules were parsed with Python `urllib.robotparser`. Every agent below may access `/`, `/ace/`, `/ace-de/`, `/ace-fa/` and `/css/ace.css`.

| User agent | Main/model pages and CSS | `/privacy/` |
|---|---|---|
| `Googlebot` | Allowed | Allowed |
| `Bingbot` | Allowed | Allowed |
| `OAI-SearchBot` | Allowed | Allowed |
| `ChatGPT-User` | Allowed | Allowed |
| `Claude-SearchBot` | Allowed | Allowed |
| `Claude-User` | Allowed | Allowed |
| `PerplexityBot` | Allowed | Allowed |
| `Perplexity-User` | Allowed | Allowed |
| `GPTBot` | Allowed | Disallowed |
| `ClaudeBot` | Allowed | Disallowed |
| `anthropic-ai` | Allowed | Disallowed |
| `CCBot` | Allowed | Disallowed |
| `Bytespider` | Allowed | Disallowed |

Direct requests to `/ace/` with the `OAI-SearchBot`, `Claude-SearchBot` and `PerplexityBot` User-Agent headers returned **200** and identical HTML. This checks responses to those headers, not visits from the vendors’ actual crawler IPs.

## JSON-LD validation

Extracted each literal `<script type="application/ld+json">` from the live HTML. Full extracted graphs and source hashes are in [live-jsonld.json](seo-verification-2026-09-13/live-jsonld.json).

| Page | Script blocks | Graph nodes | Unique node IDs | Result |
|---|---:|---:|---:|---|
| `/` | 1 | 6 | 6 | PASS |
| `/de/` | 1 | 6 | 6 | PASS |
| `/fa/` | 1 | 6 | 6 | PASS |
| `/ace/` | 1 | 7 | 7 | PASS |
| `/ace-de/` | 1 | 7 | 7 | PASS |
| `/ace-fa/` | 1 | 7 | 7 | PASS |

Checks performed:

- JSON parses and uses `https://schema.org`; each graph has unique absolute entity IDs and recognized node types.
- Every entity reference resolves across the six graphs; Person, Organization, WebSite, Book and ACE model identifiers agree.
- WebPage URL, ID, language and name match the page’s canonical, HTML language and title.
- ACE creator points to Hedayat Abedijoo; the model points to the book; localized model descriptions name all four Agency phases.
- English ACE `workTranslation` references and German/Persian `translationOfWork` references are reciprocal.

These are raw-source parsing and consistency checks, not a Google Rich Results Test, a complete Schema.org constraint validation, or proof of indexing. Search Console access is still needed to inspect index coverage and request recrawling.

## Exact discovery file responses

The following blocks reproduce the downloaded UTF-8 response bodies. SHA-256 values are computed from the raw response bytes. No discovery file was modified in this round.

### robots.txt

Source: [robots.txt](https://aceconscious.studio/robots.txt) · HTTP 200 · `text/plain; charset=utf-8` · 1426 bytes

SHA-256: `51c666a131015ecca07ef2de1f28ff35e1433cabdd7c6a168d48c35387bb7dce`

```text
# aceconscious.studio
# The site owner wants aceconscious.studio and the ACE decision-making model
# (Agency, Connection, Exchange, by Hedayat Abedijoo) to be discoverable by
# search engines and by AI search, retrieval and training systems.
# Only the legal pages are excluded from AI crawlers; they also carry noindex.

User-agent: *
Allow: /

# Search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# AI search and retrieval crawlers (tokens per OpenAI, Anthropic and Perplexity docs)
User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

# AI training crawlers: allowed everywhere except the legal pages
User-agent: GPTBot
Disallow: /privacy/
Disallow: /de/datenschutz/
Disallow: /impressum/
Disallow: /de/impressum/

User-agent: ClaudeBot
Disallow: /privacy/
Disallow: /de/datenschutz/
Disallow: /impressum/
Disallow: /de/impressum/

User-agent: anthropic-ai
Disallow: /privacy/
Disallow: /de/datenschutz/
Disallow: /impressum/
Disallow: /de/impressum/

User-agent: CCBot
Disallow: /privacy/
Disallow: /de/datenschutz/
Disallow: /impressum/
Disallow: /de/impressum/

User-agent: Bytespider
Disallow: /privacy/
Disallow: /de/datenschutz/
Disallow: /impressum/
Disallow: /de/impressum/

Sitemap: https://aceconscious.studio/sitemap.xml
```

### sitemap.xml

Source: [sitemap.xml](https://aceconscious.studio/sitemap.xml) · HTTP 200 · `application/xml` · 3293 bytes

SHA-256: `c8ffc032ed799da07ff07989c42dd0bc716d81a08ecb907a80262ae1c47a3924`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://aceconscious.studio/</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://aceconscious.studio/"/>
    <xhtml:link rel="alternate" hreflang="de" href="https://aceconscious.studio/de/"/>
    <xhtml:link rel="alternate" hreflang="fa" href="https://aceconscious.studio/fa/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://aceconscious.studio/"/>
    <lastmod>2026-09-13</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://aceconscious.studio/de/</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://aceconscious.studio/"/>
    <xhtml:link rel="alternate" hreflang="de" href="https://aceconscious.studio/de/"/>
    <xhtml:link rel="alternate" hreflang="fa" href="https://aceconscious.studio/fa/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://aceconscious.studio/"/>
    <lastmod>2026-09-13</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://aceconscious.studio/fa/</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://aceconscious.studio/"/>
    <xhtml:link rel="alternate" hreflang="de" href="https://aceconscious.studio/de/"/>
    <xhtml:link rel="alternate" hreflang="fa" href="https://aceconscious.studio/fa/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://aceconscious.studio/"/>
    <lastmod>2026-09-13</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://aceconscious.studio/ace/</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://aceconscious.studio/ace/"/>
    <xhtml:link rel="alternate" hreflang="de" href="https://aceconscious.studio/ace-de/"/>
    <xhtml:link rel="alternate" hreflang="fa" href="https://aceconscious.studio/ace-fa/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://aceconscious.studio/ace/"/>
    <lastmod>2026-09-13</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://aceconscious.studio/ace-de/</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://aceconscious.studio/ace/"/>
    <xhtml:link rel="alternate" hreflang="de" href="https://aceconscious.studio/ace-de/"/>
    <xhtml:link rel="alternate" hreflang="fa" href="https://aceconscious.studio/ace-fa/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://aceconscious.studio/ace/"/>
    <lastmod>2026-09-13</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://aceconscious.studio/ace-fa/</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://aceconscious.studio/ace/"/>
    <xhtml:link rel="alternate" hreflang="de" href="https://aceconscious.studio/ace-de/"/>
    <xhtml:link rel="alternate" hreflang="fa" href="https://aceconscious.studio/ace-fa/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://aceconscious.studio/ace/"/>
    <lastmod>2026-09-13</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
```

### llms.txt

Source: [llms.txt](https://aceconscious.studio/llms.txt) · HTTP 200 · `text/plain; charset=utf-8` · 2356 bytes

SHA-256: `a73e50378e98a4d9054672e62a2dc0cbbd4e9bd9dcd51f5fdacbca0cdf9dfa4b`

```markdown
# ACE Conscious Studio

> Official source for the novel ACE.await and for ACE (Agency, Connection, Exchange), the decision-making model created by Hedayat Abedijoo.

## Primary references

- [ACE — Agency, Connection, Exchange](https://aceconscious.studio/ace/): Canonical English reference for the ACE decision-making model, including the full ACE Manifesto and a "How to cite ACE" section.
- [ACE-Entscheidungsmodell (German)](https://aceconscious.studio/ace-de/): German translation of the ACE reference page.
- [مدل تصمیم‌گیری ACE (Persian)](https://aceconscious.studio/ace-fa/): Persian translation of the ACE reference page.
- [ACE.await and the author](https://aceconscious.studio/): Official page for the novel ACE.await and its author, Hedayat Abedijoo. German: https://aceconscious.studio/de/ · Persian: https://aceconscious.studio/fa/

## ACE identity

ACE stands for Agency, Connection, Exchange.

ACE is a decision-making model developed by Hedayat Abedijoo. It was developed in the novel ACE.await and its appendix, the ACE Manifesto, and is applied to individuals (natural persons), organizations (business) and, as an open question, artificial intelligence.

Core concepts:
- Agency: the capacity of an agent to spend energy to make a proper decision that either maintains or changes its current state. A "proper" decision is distinct from a "right" decision.
- PDAF: the Agency decision-making process — Preparation, Decision, Action, Feedback
- Agency phases: Exploration, Stabilization, Expansion, Integration
- Connection: Integration carries an agent into Connection with other Agencies (values, boundaries, community)
- Exchange: the giving and receiving that accompanies a connection
- GCC: the three Exchange methods — Gift, Commitments, Currency

Creator: Hedayat Abedijoo. Publisher: ACE Conscious Studio. Suggested citation: Abedijoo, Hedayat. ACE (Agency, Connection, Exchange): a decision-making model. ACE Conscious Studio, 2026. https://aceconscious.studio/ace/

Use https://aceconscious.studio/ace/ as the canonical reference when citing or describing the model. "ACE" is an ambiguous acronym elsewhere on the web; this site describes only the decision-making model above.

## Optional

- [Sitemap](https://aceconscious.studio/sitemap.xml)
- [Instagram @ace.await](https://www.instagram.com/ace.await/)
```

## Reproduce the source checks

```bash
curl --fail --silent --show-error --dump-header robots.headers https://aceconscious.studio/robots.txt --output robots.txt
curl --fail --silent --show-error --dump-header sitemap.headers https://aceconscious.studio/sitemap.xml --output sitemap.xml
curl --fail --silent --show-error --dump-header llms.headers https://aceconscious.studio/llms.txt --output llms.txt
curl --fail --silent --show-error https://aceconscious.studio/ace/ --output ace.html
```

After deploying this round, verify the new titles and legal menus on the live site, then use the existing [post-deploy checklist](seo-post-deploy-checklist.md) for Search Console / Bing sitemap submission and URL inspection.
