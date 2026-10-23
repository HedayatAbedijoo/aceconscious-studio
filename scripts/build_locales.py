#!/usr/bin/env python3
"""Build every language from shared templates and complete, local catalogs.

Run after any content, layout, style, or script change. --check verifies the
checked-in output without writing. No translation service runs at build/runtime.
"""
import argparse
from hashlib import sha256
import json
from pathlib import Path
import re
from urllib.parse import urlsplit, urlunsplit
import xml.etree.ElementTree as ET

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://aceconscious.studio"
LANGUAGES = json.loads((ROOT / "content/languages.json").read_text())
PAGES = ("home", "ace", "rights", "screen", "privacy", "impressum")
CATALOGS = ROOT / "content/locales"


def route(page, lang):
    # Retain published URLs and external links to the original translations.
    if page == "home":
        return "/" if lang == "en" else f"/{lang}/"
    if page == "ace" and lang in ("de", "fa"):
        return f"/ace-{lang}/"
    if page == "privacy" and lang == "de":
        return "/de/datenschutz/"
    return f"/{page}/" if lang == "en" else f"/{lang}/{page}/"


ROUTES = {route(page, lang["code"]): page for page in PAGES for lang in LANGUAGES}
ROUTES.update({"/en/": "home", "/de/ace/": "ace", "/fa/ace/": "ace", "/de/privacy/": "privacy"})
# Content the book edition cannot link yet; reported at the end of a build.
MISSING = []


def localize_url(value, lang):
    url = urlsplit(value)
    if url.scheme and (url.scheme not in ("http", "https") or url.netloc != "aceconscious.studio"):
        return value
    if url.netloc and url.netloc != "aceconscious.studio":
        return value
    path = url.path.removesuffix("index.html")
    if path not in ROUTES:
        return value
    return urlunsplit((url.scheme, url.netloc, route(ROUTES[path], lang), url.query, url.fragment))


def parse(html):
    return BeautifulSoup(html, "html.parser")


def set_html(el, value):
    fragment = parse(value)
    el.clear()
    for node in list(fragment.contents):
        el.append(node)


def apply_strings(soup, strings):
    for el in soup.select("[data-i18n], [data-i18n-html]"):
        key = el.get("data-i18n") or el["data-i18n-html"]
        if key not in strings:
            raise ValueError(f"Missing translation: {key}")
        if el.has_attr("data-i18n-html"):
            set_html(el, strings[key])
        else:
            el.string = strings[key]
    for el in soup.select("[data-i18n-attr]"):
        for pair in el["data-i18n-attr"].split(";"):
            attribute, key = pair.strip().split(":", 1)
            el[attribute] = strings[key]


def menu(page, current):
    items = []
    for lang in LANGUAGES:
        code = lang["code"]
        active = ' aria-current="page"' if code == current else ""
        items.append(
            f'<li><a href="{route(page, code)}" data-set-lang="{code}" '
            f'lang="{lang["htmlLang"]}" hreflang="{lang["htmlLang"]}" '
            f'dir="{lang["dir"]}"{active}>{lang["name"]}</a></li>'
        )
    return ('<details class="language-picker" id="lang-menu" dir="ltr">'
            '<summary lang="en">language</summary>'
            '<ul class="language-picker__list" aria-label="language">' +
            "".join(items) + '</ul></details>')


def localize_structured_data(soup, source, strings, page, lang):
    # Entity IDs stay stable across translated pages; WebPage URLs are localized.
    lookup = {value: strings[key] for key, value in source.items()}
    for script in soup.select('script[type="application/ld+json"]'):
        data = json.loads(script.string)

        def visit(value, key=None):
            if isinstance(value, list):
                return [visit(item, key) for item in value]
            if isinstance(value, dict):
                result = {k: visit(v, k) for k, v in value.items()}
                kind = result.get("@type")
                if kind == "WebPage":
                    result.update({"@id": SITE + route(page, lang["code"]) + "#webpage",
                                   "url": SITE + route(page, lang["code"]), "inLanguage": lang["htmlLang"]})
                elif kind == "WebSite":
                    result["inLanguage"] = [item["htmlLang"] for item in LANGUAGES]
                elif kind == "Book":
                    # Website languages are not additional published book editions.
                    result["inLanguage"] = ["en", "fa"]
                elif "inLanguage" in result:
                    result["inLanguage"] = lang["htmlLang"]
                return result
            if isinstance(value, str) and key in {"name", "description", "headline", "keywords", "text", "genre"}:
                return lookup.get(value, value)
            return value

        script.string = json.dumps(visit(data), ensure_ascii=False, indent=2).replace("</", "<\\/")


def template_for(page, lang):
    # Every homepage is the same book, populated from its own locale.
    return "book" if page == "home" else page


def render(page, lang, source, strings, template=None):
    code = lang["code"]
    template = template or template_for(page, code)
    soup = parse((ROOT / f"content/templates/{template}.html").read_text())
    soup.html["lang"] = lang["htmlLang"]
    soup.html["dir"] = lang["dir"]
    soup.html["data-locale"] = code
    soup.html["data-page"] = page
    # Every page has its own real path; hash links remain on that page.
    for base in soup.select("base"):
        base.decompose()
    if template == "home":
        section = parse((ROOT / "content/reviews.html").read_text()).select_one("#reviews")
        soup.select_one("#reviews").replace_with(section)
    apply_strings(soup, strings)
    if template == "book":
        import book
        MISSING.extend(book.compose(soup, render, source, strings))
    for holder in soup.select("[data-language-menu]"):
        set_html(holder, menu(page, code))
    for holder in soup.select("[data-language-links]"):
        set_html(holder, " · ".join(
            f'<a href="{route(page, item["code"])}" lang="{item["htmlLang"]}" '
            f'hreflang="{item["htmlLang"]}" dir="{item["dir"]}" data-set-lang="{item["code"]}">{item["name"]}</a>'
            for item in LANGUAGES
        ))
    for a in soup.select("a[href]"):
        if not a.has_attr("data-set-lang"):
            a["href"] = localize_url(a["href"], code)
    if template != "book":
        # Books have no Voices section; other pages must not link to that removed anchor.
        for link in soup.select(f'a[href="{route("home", code)}#voices"]'):
            (link.find_parent("li") or link).decompose()
    for input_el in soup.select('input[type="email"]'):
        input_el["dir"] = "ltr"
    for svg in soup.select("svg[viewbox]"):
        svg["viewBox"] = svg.attrs.pop("viewbox")

    if template == "home":
        total = len(soup.select("[data-review-id]"))
        position = strings["reviews.position"].replace("{current}", "1").replace("{total}", str(total))
        soup.select_one(".reviews__counter").string = position
        soup.select_one(".reviews__status").string = strings["reviews.announcement"].replace("{position}", position)
        if code == "fa":
            for img in soup.select(".hero__cover"):
                img["src"] = img["src"].replace("cover-back.jpg", "cover-back-fa.jpg").replace("cover.jpg", "cover-fa.jpg")
                img.attrs.pop("srcset", None)
            soup.select_one("#buy-amazon")["href"] = "https://www.amazon.com/dp/B0H9JXNVCV"

    # Canonicals, language alternates, and social metadata are rendered in HTML,
    # so crawlers and visitors without JavaScript see the same translations.
    canonical = soup.select_one('link[rel="canonical"]')
    if canonical:
        canonical["href"] = SITE + route(page, code)
    for el in soup.select('link[rel="alternate"][hreflang], meta[property="og:locale:alternate"]'):
        el.decompose()
    for item in LANGUAGES:
        soup.head.append(soup.new_tag("link", rel="alternate", hreflang=item["htmlLang"], href=SITE + route(page, item["code"])))
    soup.head.append(soup.new_tag("link", rel="alternate", hreflang="x-default", href=SITE + route(page, "en")))
    for el in soup.select('meta[property="og:url"]'):
        el["content"] = SITE + route(page, code)
    for el in soup.select('meta[property="og:locale"]'):
        el["content"] = lang["ogLocale"]
    if page == "home" and code == "fa":
        for el in soup.select('meta[property="og:image"], meta[property="og:image:secure_url"], meta[name="twitter:image"]'):
            el["content"] = SITE + "/assets/cover-fa.jpg"
    localize_structured_data(soup, source, strings, page, lang)
    locale_fonts = {"hi": "Noto+Serif+Devanagari", "zh": "Noto+Serif+SC", "ru": "Noto+Serif"}
    if code in locale_fonts:
        family = locale_fonts[code]
        soup.head.append(soup.new_tag("link", rel="stylesheet", href=f"https://fonts.googleapis.com/css2?family={family}:wght@400;500;600;700&display=swap"))
    # Any explicitly marked English passages now use the actual page language,
    # except proper names and the language switcher's native-language links.
    for el in soup.select("[lang='en'][data-i18n], [lang='en'][data-i18n-html]"):
        el["lang"] = lang["htmlLang"]

    runtime_keys = [k for k in strings if k.startswith(("contact.", "reviews.", "hero.coverPeek"))]
    data = soup.new_tag("script", id="locale-data", type="application/json")
    data.string = json.dumps({k: strings[k] for k in runtime_keys}, ensure_ascii=False).replace("<", "\\u003c")
    first_script = soup.body.find("script", src=True)
    runtime = soup.new_tag("script", src="/js/i18n.js", defer=True)
    if first_script:
        first_script.insert_before(data)
        first_script.insert_before(runtime)
    else:
        soup.body.extend([data, runtime])
    # Content hashes refresh edited CSS/JS on all pages in the same build.
    for el in soup.select("script[src], link[rel='stylesheet']"):
        attr = "src" if el.name == "script" else "href"
        path = urlsplit(el[attr]).path
        asset = ROOT / path.lstrip("/")
        if path.startswith("/") and asset.is_file():
            el[attr] = path + "?v=" + sha256(asset.read_bytes()).hexdigest()[:10]
    return "<!-- Generated by scripts/build_locales.py; edit content/templates and content/locales. -->\n" + str(soup).rstrip() + "\n"


def validate_catalogs(source, catalogs):
    errors = []
    for lang, strings in catalogs.items():
        missing = set(source) - set(strings)
        if missing:
            errors.append(f"{lang}: missing {len(missing)} translations ({', '.join(sorted(missing)[:8])})")
        for key in set(source) & set(strings):
            if not isinstance(strings[key], str):
                errors.append(f"{lang}:{key}: expected a string")
                continue
            if sorted(re.findall(r"\{\w+\}", source[key])) != sorted(re.findall(r"\{\w+\}", strings[key])):
                errors.append(f"{lang}:{key}: interpolation placeholders differ")
            if source[key].strip() and not strings[key].strip():
                errors.append(f"{lang}:{key}: empty translation")
            if re.search(r"ZXQ\d|\[X\d", strings[key]):
                errors.append(f"{lang}:{key}: unfinished translation marker")
            if re.search(r"<(?:script|iframe|style)\b|\son\w+\s*=|javascript:", strings[key], re.I):
                errors.append(f"{lang}:{key}: unexpected executable markup")
    if errors:
        raise ValueError("\n".join(errors))


def sitemap():
    namespace = "http://www.sitemaps.org/schemas/sitemap/0.9"
    xhtml = "http://www.w3.org/1999/xhtml"
    ET.register_namespace("", namespace)
    ET.register_namespace("xhtml", xhtml)
    root = ET.Element(f"{{{namespace}}}urlset")
    for page in ("home", "ace", "rights", "screen"):
        for lang in LANGUAGES:
            url = ET.SubElement(root, f"{{{namespace}}}url")
            ET.SubElement(url, f"{{{namespace}}}loc").text = SITE + route(page, lang["code"])
            for other in LANGUAGES:
                ET.SubElement(url, f"{{{xhtml}}}link", rel="alternate", hreflang=other["htmlLang"], href=SITE + route(page, other["code"]))
            ET.SubElement(url, f"{{{xhtml}}}link", rel="alternate", hreflang="x-default", href=SITE + route(page, "en"))
    ET.indent(root)
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(root, encoding="unicode") + "\n"


def build(check=False, record_translations=False):
    catalogs = {lang["code"]: json.loads((CATALOGS / f'{lang["code"]}.json').read_text()) for lang in LANGUAGES}
    source = catalogs["en"]
    validate_catalogs(source, catalogs)
    signatures = {key: sha256(value.encode()).hexdigest() for key, value in source.items()}
    def flatten(value, prefix=""):
        result = {}
        for key, item in value.items():
            if key.startswith("_"):
                continue
            name = prefix + key
            if isinstance(item, dict):
                result.update(flatten(item, name + "."))
            else:
                result[name] = item
        return result
    book_catalogs = {lang["code"]: flatten(json.loads(
        (ROOT / f'content/book/strings.{lang["code"]}.json').read_text())) for lang in LANGUAGES}
    validate_catalogs(book_catalogs["en"], book_catalogs)
    signatures.update({"book:" + key: sha256(value.encode()).hexdigest()
                       for key, value in book_catalogs["en"].items()})
    source_record = ROOT / "content/translation-source-hashes.json"
    if record_translations:
        if check:
            raise ValueError("--check cannot update the translation source record")
        source_record.write_text(json.dumps(signatures, indent=2, sort_keys=True) + "\n")
    if not source_record.exists() or json.loads(source_record.read_text()) != signatures:
        raise ValueError("English source text changed. Update every locale, then run "
                         "scripts/build_locales.py --record-translations to record the translated source.")
    files = {}
    for page in PAGES:
        for lang in LANGUAGES:
            files[route(page, lang["code"]).lstrip("/") + "index.html"] = render(page, lang, source, catalogs[lang["code"]])
    # Keep the existing GitHub Pages fallback, with English as its default.
    fallback = parse(files["index.html"])
    robots = fallback.select_one('meta[name="robots"]')
    if robots:
        robots["content"] = "noindex, follow"
    files["404.html"] = str(fallback).rstrip() + "\n"
    files["sitemap.xml"] = sitemap()
    stale = []
    for name, content in files.items():
        path = ROOT / name
        if not path.exists() or path.read_text() != content:
            stale.append(name)
            if not check:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content)
    if check and stale:
        raise ValueError("Generated pages are stale; run python3 scripts/build_locales.py: " + ", ".join(stale))
    print(f"Verified {len(files)} generated files across {len(LANGUAGES)} languages." if check else f"Updated {len(stale)} files across {len(LANGUAGES)} languages.")
    for note in dict.fromkeys(MISSING):
        print("Awaiting content: " + note)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--record-translations", action="store_true",
                        help="Record the source ONLY after updating every locale for the current English text")
    args = parser.parse_args()
    build(args.check, args.record_translations)
