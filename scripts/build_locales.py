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
HERO_FONTS = ("PlayfairDisplay-Regular-latin.woff2", "DMSans-Regular-latin.woff2",
              "DMMono-Regular-latin.woff2")
HOME_FONT_STYLESHEETS = {
    "css/home-hero.css": HERO_FONTS,
    "css/home-reviews.css": ("PlayfairDisplay-Bold-latin.woff2",),
}


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


def template_string_keys(fragment):
    keys = {el.get("data-i18n") or el["data-i18n-html"]
            for el in fragment.select("[data-i18n], [data-i18n-html]")}
    for el in fragment.select("[data-i18n-attr]"):
        keys.update(pair.strip().split(":", 1)[1] for pair in el["data-i18n-attr"].split(";"))
    return keys


def validate_home_draft(draft, required_keys):
    """The English-only homepage draft is plain copy, not a translated catalog."""
    if not isinstance(draft, dict):
        raise ValueError("English homepage draft must be a JSON object")
    missing = required_keys - set(draft)
    unknown = set(draft) - required_keys
    if missing or unknown:
        raise ValueError(f"English homepage draft keys: missing {sorted(missing)}, unexpected {sorted(unknown)}")
    for key, value in draft.items():
        if not isinstance(value, str) or not value.strip():
            raise ValueError(f"English homepage draft {key}: expected nonempty text")
        if re.search(r"<[^>]*>|\{\w+\}|ZXQ\d|\[X\d", value):
            raise ValueError(f"English homepage draft {key}: markup, placeholders and unfinished markers are not supported")


def populate_home_story(story, pitch_html):
    """Arrange the canonical synopsis without duplicating or rewriting its copy."""
    pitch = parse(pitch_html)
    paragraphs = pitch.find_all("p", recursive=False)
    ace = pitch.select_one("p.hero__pitch-ace")
    narrative = [paragraph for paragraph in paragraphs if paragraph is not ace]
    if len(narrative) < 2 or ace is None:
        raise ValueError("English Story needs an introduction, extended synopsis and ACE paragraph")
    ace_link = ace.find("a", recursive=False)
    line_break = ace.find("br", recursive=False)
    if ace_link is None or line_break is None:
        raise ValueError("English Story needs the existing ACE link and description")

    story.select_one("[data-story-intro]").append(narrative[0].extract())
    for paragraph in narrative[1:]:
        story.select_one("[data-story-extended]").append(paragraph.extract())
    story.select_one("[data-story-ace-title]").append(ace_link.extract())
    line_break.extract()
    ace["class"] = ["story-ace__text"]
    story.select_one("[data-story-ace-copy]").replace_with(ace)


def populate_home_voices(voices, original):
    """Move every complete monologue into its matching English disclosure."""
    originals = {
        card.select_one(".character-card__name")["data-i18n"]: card
        for card in original.select(".character-card")
    }
    cards = voices.select(".voice-card")
    keys = [card.select_one(".voice-name")["data-i18n"] for card in cards]
    if len(keys) != 8 or len(set(keys)) != 8 or set(keys) != set(originals):
        raise ValueError("English Voices must retain all eight original characters")
    for key, card in zip(keys, cards):
        body = originals[key].select_one(".character-card__body").extract()
        body["class"] = ["voice-content"]
        card.select_one("[data-voice-copy]").replace_with(body)


def populate_home_author(author, original):
    """Keep the complete shared biography, poem, portrait and social links."""
    bio = original.select_one(".author__bio")
    paragraphs = bio.select(":scope > p[data-i18n-html]")
    if [p["data-i18n-html"] for p in paragraphs] != [f"author.p{i}" for i in range(1, 8)]:
        raise ValueError("English Author must retain all seven original biography paragraphs")
    author.select_one("[data-author-photo]").replace_with(original.select_one(".author__photo").extract())
    author.select_one("[data-author-verse]").replace_with(bio.select_one(".author__verse").extract())
    author.select_one("[data-author-intro]").append(paragraphs[0].extract())
    for paragraph in paragraphs[1:]:
        author.select_one("[data-author-extended]").append(paragraph.extract())
    for node in list(bio.contents):
        author.select_one("[data-author-links]").append(node.extract())


def home_font_urls():
    """Require CSS font versions to match their bytes, including the preload."""
    urls = {}
    for stylesheet, names in HOME_FONT_STYLESHEETS.items():
        css = (ROOT / stylesheet).read_text()
        css_urls = set(re.findall(r"""url\(["']?([^)"']+)""", css))
        for name in names:
            path = f"/assets/fonts/{name}"
            version = sha256((ROOT / path.lstrip("/")).read_bytes()).hexdigest()[:10]
            urls[name] = f"{path}?v={version}"
            if ".." + urls[name] not in css_urls:
                raise ValueError(f"Update {stylesheet} font URL to ../assets/fonts/{name}?v={version}")
    return urls


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


def render(page, lang, source, strings):
    code = lang["code"]
    soup = parse((ROOT / f"content/templates/{page}.html").read_text())
    soup.html["lang"] = lang["htmlLang"]
    soup.html["dir"] = lang["dir"]
    soup.html["data-locale"] = code
    soup.html["data-page"] = page
    # Every page has its own real path; hash links remain on that page.
    for base in soup.select("base"):
        base.decompose()
    if page == "home":
        section = parse((ROOT / "content/reviews.html").read_text()).select_one("#reviews")
        soup.select_one("#reviews").replace_with(section)
        # English-first redesign, explicitly kept out of the translated source
        # until review is complete. Other locales retain the shared homepage.
        if code == "en":
            navigation = parse((ROOT / "content/templates/home-navigation.en.html").read_text()).select_one("#nav-menu")
            hero = parse((ROOT / "content/templates/home-hero.en.html").read_text()).select_one("#top")
            reviews = parse((ROOT / "content/templates/home-reviews.en.html").read_text()).select_one("#reviews")
            buy = parse((ROOT / "content/templates/home-buy.en.html").read_text()).select_one("#buy")
            story = parse((ROOT / "content/templates/home-story.en.html").read_text()).select_one("#synopsis")
            voices = parse((ROOT / "content/templates/home-voices.en.html").read_text()).select_one("#voices")
            community = parse((ROOT / "content/templates/home-community.en.html").read_text()).select_one("#community")
            author = parse((ROOT / "content/templates/home-author.en.html").read_text()).select_one("#author")
            contents = parse((ROOT / "content/templates/home-contents.en.html").read_text()).select_one("#contents")
            draft = json.loads((CATALOGS / "en-home-redesign.json").read_text())
            required = set().union(*(template_string_keys(fragment) for fragment in (navigation, hero, reviews, buy, story, voices, community, author, contents))) - set(source)
            validate_home_draft(draft, required)
            strings = {**strings, **draft}
            soup.select_one("#nav-menu").replace_with(navigation)
            populate_home_story(story, strings["hero.pitch"])
            populate_home_voices(voices, soup.select_one("#voices"))
            soup.select_one("#voices").replace_with(voices)
            voices.insert_after(community)
            populate_home_author(author, soup.select_one("#author"))
            soup.select_one("#author").decompose()
            community.insert_after(author)
            chapters = soup.select_one("#contents .toc-grid").extract()
            chapters["class"] = ["contents-list"]
            chapters["role"] = "list"
            contents.select_one("[data-contents-list]").replace_with(chapters)
            soup.select_one("#contents").replace_with(contents)
            for review in reviews.select("[data-review-id]"):
                original = section.select_one(f'[data-review-id="{review["data-review-id"]}"]')
                url = original.select_one(".review__link")["href"]
                review.select_one("[data-review-source]")["href"] = url
                review.select_one("[data-review-citation]")["cite"] = url
            soup.select_one("#reviews").replace_with(reviews)
            soup.select_one("#buy").decompose()
            reviews.insert_after(buy)
            cover = soup.select_one("#book-cover").parent.extract()
            cover["class"] = [name for name in cover["class"] if name != "reveal"]
            hero.select_one("[data-hero-cover]").replace_with(cover)
            soup.select_one("#top").replace_with(hero)
            soup.select_one("#synopsis").replace_with(story)
            sample = soup.select_one("#sample").extract()
            sample["class"].append("sample--redesign")
            story.insert_after(sample)
            fonts = home_font_urls()
            # Preload only fonts used in the hero. The review's bold face loads
            # normally without competing with these initial-viewport resources.
            for name in HERO_FONTS:
                preload = soup.new_tag("link", rel="preload", href=fonts[name],
                                       attrs={"as": "font", "type": "font/woff2", "crossorigin": ""})
                soup.head.select_one('link[rel="stylesheet"]').insert_before(preload)
            soup.head.append(soup.new_tag("link", rel="stylesheet", href="/css/home-hero.css"))
            soup.head.append(soup.new_tag("link", rel="stylesheet", href="/css/home-reviews.css"))
            soup.head.append(soup.new_tag("link", rel="stylesheet", href="/css/home-buy.css"))
            soup.head.append(soup.new_tag("link", rel="stylesheet", href="/css/home-story.css"))
            soup.head.append(soup.new_tag("link", rel="stylesheet", href="/css/home-sample.css"))
            soup.head.append(soup.new_tag("link", rel="stylesheet", href="/css/home-voices.css"))
            soup.head.append(soup.new_tag("link", rel="stylesheet", href="/css/home-community.css"))
            soup.head.append(soup.new_tag("link", rel="stylesheet", href="/css/home-author.css"))
            soup.head.append(soup.new_tag("link", rel="stylesheet", href="/css/home-contents.css"))
            soup.head.append(soup.new_tag("link", rel="stylesheet", href="/css/home-headings.css"))
            soup.select_one('script[src^="/js/reviews.js"]')["src"] = "/js/home-reviews.js"
            soup.body.append(soup.new_tag("script", src="/js/home-buy.js", defer=""))
            soup.body.append(soup.new_tag("script", src="/js/home-community.js", defer=""))
            soup.body.append(soup.new_tag("script", src="/js/home-voices.js", defer=""))
    apply_strings(soup, strings)
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
    for input_el in soup.select('input[type="email"]'):
        input_el["dir"] = "ltr"
    for svg in soup.select("svg[viewbox]"):
        svg["viewBox"] = svg.attrs.pop("viewbox")

    if page == "home":
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
    locale_fonts = {"hi": "Noto+Sans+Devanagari", "zh": "Noto+Sans+SC", "ru": "Oswald"}
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


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--record-translations", action="store_true",
                        help="Record the source ONLY after updating every locale for the current English text")
    args = parser.parse_args()
    build(args.check, args.record_translations)
