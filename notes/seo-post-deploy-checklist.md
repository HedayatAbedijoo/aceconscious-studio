# SEO / AIO post-deploy checklist — aceconscious.studio

Companion to the technical SEO + AI-discoverability pass of 12 September 2026 (see `notes/seo-aio-implementation-report.md`).
Everything below must be done by the site owner after the changes are deployed; none of it can be done from the repository.

## 0. GitHub Pages settings (do first)

- **Enforce HTTPS.** `http://aceconscious.studio/` currently answers `200` over plain HTTP instead of redirecting.
  GitHub → repository → Settings → Pages → tick **Enforce HTTPS**. Re-check with `curl -I http://aceconscious.studio/ace/` (expect `301` to `https://…`).

## 1. Google Search Console

1. Add a **Domain** property for `aceconscious.studio` (DNS TXT record), or a URL-prefix property for `https://aceconscious.studio/`.
   For the URL-prefix method, either paste the `google-site-verification` meta tag into the marked comment in `index.html` (`<head>`), or upload the `google….html` file to the repository root. Do not commit a token you have not received from Google.
2. Sitemaps → submit `https://aceconscious.studio/sitemap.xml`.
3. URL Inspection → inspect and **Request indexing** for, in this order:
   `https://aceconscious.studio/ace/`, `https://aceconscious.studio/`, `https://aceconscious.studio/ace-de/`, `https://aceconscious.studio/ace-fa/`, `https://aceconscious.studio/de/`, `https://aceconscious.studio/fa/`.
4. For each inspected URL confirm: "URL is on Google" (after a few days), *User-declared canonical* = *Google-selected canonical*, no "Page with redirect" or "Alternate page with proper canonical tag" warnings.
5. Indexing → Pages: watch for "Excluded by noindex" (only `/privacy/`, `/impressum/`, `/de/datenschutz/`, `/de/impressum/` and `404.html` may appear there).
6. Experience → Core Web Vitals and Enhancements → check that no structured-data errors are reported.

## 2. Bing Webmaster Tools

1. Add the site (import from Search Console is the quickest route) or verify with the `msvalidate.01` meta tag in the marked comment in `index.html`, or the `BingSiteAuth.xml` file at the root.
2. Sitemaps → submit `https://aceconscious.studio/sitemap.xml`.
3. URL Inspection → inspect the six canonical URLs above.
4. IndexNow → generate a key (Bing Webmaster Tools offers one), then follow the setup notes in `scripts/indexnow-submit.sh`
   (save the key as `/<key>.txt` in the repository root, deploy, run `INDEXNOW_KEY=<key> ./scripts/indexnow-submit.sh`).

## 3. Rich-result / structured-data validation

- https://validator.schema.org/ → paste `https://aceconscious.studio/ace/` (and the German and Persian URLs).
- https://search.google.com/test/rich-results → `https://aceconscious.studio/` (Book) and `/ace/`.
- Facebook Sharing Debugger and X Card Validator → `https://aceconscious.studio/ace/` to refresh the Open Graph cache.

## 4. Verification commands

```bash
# status codes and redirects (expect 200 for canonicals, one-hop 301 for no-slash variants)
for u in / /ace/ /ace-de/ /ace-fa/ /de/ /fa/ /ace /ace-de /ace-fa /de /fa; do
  printf '%-10s ' "$u"; curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' "https://aceconscious.studio$u"; done

curl -I https://aceconscious.studio/            # no X-Robots-Tag
curl -I https://aceconscious.studio/ace/
curl -I https://aceconscious.studio/ace-de/
curl -I https://aceconscious.studio/ace-fa/
curl -I http://aceconscious.studio/ace/         # expect 301 to https once "Enforce HTTPS" is on
curl https://aceconscious.studio/robots.txt
curl https://aceconscious.studio/sitemap.xml
curl https://aceconscious.studio/llms.txt

# canonical, robots meta, hreflang, title
curl -s https://aceconscious.studio/ace/ | grep -o -E '<link[^>]*(canonical|hreflang)[^>]*>|<meta[^>]*robots[^>]*>|<title>[^<]*</title>'

# JSON-LD graph (types and ids)
curl -s https://aceconscious.studio/ace/ | python3 -c '
import sys,re,json; d=json.loads(re.search(r"<script type=\"application/ld\+json\">(.*?)</script>", sys.stdin.read(), re.S).group(1))
[print(n["@type"], n["@id"]) for n in d["@graph"]]'

# crawler access (expect 200 for every user-agent)
for ua in "GPTBot/1.2" "OAI-SearchBot/1.0" "ClaudeBot/1.0" "Claude-SearchBot/1.0" "PerplexityBot/1.0" "Googlebot/2.1" "bingbot/2.0"; do
  printf '%-20s ' "$ua"; curl -s -o /dev/null -w '%{http_code}\n' -A "Mozilla/5.0 (compatible; $ua)" https://aceconscious.studio/ace/; done
```
