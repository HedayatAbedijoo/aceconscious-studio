#!/usr/bin/env python3
"""Check public locale pages, translated markup, routing and local assets."""
import json
from urllib.parse import urlsplit, unquote

from build_locales import ROOT, SITE, LANGUAGES, PAGES, route, parse, template_for
from book import SECTIONS, BOOKMARKS, BACK_COVER_LINKS, APPENDIX_ITEMS


# Anchors that other pages, search results and shared links point at.
BOOK_ANCHORS = ("headline", "reviews", "synopsis", "buy", "author", "contact", "sample",
                "contents", "community", "privacy", "impressum", "rights",
                "screen", "ace")


def check_book(soup, path, code):
    """Each locale is one book: ordered pages instead of a scrolling page."""
    pages = soup.select("#book-source [data-page]")
    assert pages, f"No book pages: {path}"
    assert pages[0]["data-section"] == "cover" and pages[0]["id"] == "cover", path
    assert pages[-1]["id"] == "back-cover", path
    order = list(dict.fromkeys(page["data-section"] for page in pages))
    assert order == ["cover", *SECTIONS], f"Section order drift: {path}: {order}"
    assert all(page.get("data-title") for page in pages if page["data-section"] != "cover"), path
    for anchor in BOOK_ANCHORS:
        assert soup.find(id=anchor), f"Missing book anchor #{anchor}: {path}"
    assert not soup.select("#book-source iframe, #book-source script"), path
    assert not soup.select(".site-nav, .site-footer, #lang-menu"), f"Book has no site chrome: {path}"
    chooser = soup.select_one("#cover-entry #book-language")
    assert chooser and not soup.select("#book-source [data-set-lang]"), path
    links = chooser.select("[data-set-lang]")
    assert [a["data-set-lang"] for a in links] == [l["code"] for l in LANGUAGES], path
    assert len(chooser.select('[aria-current="page"]')) == 1, path
    for a in links:
        target = a["data-set-lang"]
        assert a["href"] == route("home", target) + ("" if target in ("en", "fa") else "#headline"), path
    assert soup.select_one('[data-page="cover"]')["data-image"] == ("/assets/cover-fa.jpg" if code == "fa" else "/assets/cover.jpg"), path
    strings = json.loads(soup.select_one("#book-strings").string)
    assert list(strings["sections"]) == list(BOOKMARKS), path
    appendix = soup.select_one('[data-page="appendix"]')
    assert appendix and appendix.has_attr("data-fixed"), path
    assert [a["data-jump"] for a in appendix.select(".section-index a")] == list(APPENDIX_ITEMS), path
    assert [p["id"] for p in pages if p["data-section"] == "appendix"] == ["appendix", *APPENDIX_ITEMS], path
    assert pages[pages.index(appendix) - 1]["data-section"] == "sample", path
    assert not soup.select('.bookmark[data-section="appendix"]'), path
    assert all(a["data-jump"] == "appendix" for a in soup.select(".back-to-index [data-jump]")), path
    assert [a["data-jump"] for a in soup.select(".back-cover__links a")] == list(BACK_COVER_LINKS), path
    # Every bookmark needs pages, and the forms stay real forms.
    assert soup.select_one("#contact-form") and soup.select_one("#community-form"), path
    assert soup.select_one('[data-page="contact"] #contact-form'), path
    assert soup.select_one('[data-page="community"] #community-form'), path
    assert soup.select_one("#amazon-marketplace option[selected]"), path
    # Conversion must retain the legal introductions.
    for name in ("privacy", "impressum"):
        original = parse((ROOT / (route(name, code).lstrip("/") + "index.html")).read_text())
        intro = original.select_one(".legal-page__updated").get_text(" ", strip=True)
        assert intro in soup.select_one("#" + name).get_text(" ", strip=True), path
    intro = soup.select('#book-source [data-section="ace"]')
    assert [p["id"] for p in intro] == ["ace", "ace-pdaf", "ace-phases", "ace-play"], path
    assert all(p.has_attr("data-fixed") for p in intro), path
    assert soup.select_one("#ace-play .ace-intro-play")["href"] == "#community", path
    assert soup.select_one("#ace-play .ace-intro-contact")["href"] == "#contact", path
    assert not soup.select(".ace-intro-kicker"), path
    assert not soup.select('.ace-intro [data-i18n="back"], .ace-intro-back'), path
    intro_copy = json.loads((ROOT / f"content/book/ace-intro.{code}.json").read_text())
    for el in soup.select('.ace-intro [data-i18n]'):
        assert el.get_text() == intro_copy[el["data-i18n"]], f"Intro translation mismatch: {path}: {el}"
    assert order.index("story") + 1 == order.index("ace"), path
    assert order.index("ace") + 1 == order.index("buy"), path
    assert order.index("buy") + 1 == order.index("community"), path
    assert order.index("community") + 1 == order.index("author"), path
    assert order.index("author") + 1 == order.index("contact"), path



def check():
    count = 0
    cache = {}
    for name in PAGES:
        reference = None
        for lang in LANGUAGES:
            code = lang["code"]
            path = route(name, code)
            html = (ROOT / (path.lstrip("/") + "index.html")).read_text()
            soup = parse(html)
            cache[path] = soup
            book = template_for(name, code) == "book"
            assert soup.html["lang"] == lang["htmlLang"], path
            assert soup.html["dir"] == lang["dir"], path
            assert soup.select_one('link[rel="canonical"]')["href"] == SITE + path, path
            alternates = soup.select('link[rel="alternate"][hreflang]')
            assert len(alternates) == len(LANGUAGES) + 1, path
            ids = [el["id"] for el in soup.select("[id]")]
            assert len(ids) == len(set(ids)), f"Duplicate ID: {path}"
            for script in soup.select('script[type="application/ld+json"], script#locale-data'):
                json.loads(script.string)
            assert not soup.select("base"), f"Base URL breaks local anchors: {path}"
            count += 1
            if book:
                check_book(soup, path, code)
                continue
            assert soup.select_one("#lang-menu summary").get_text() == "language", path
            items = soup.select("#lang-menu [data-set-lang]")
            assert [a["data-set-lang"] for a in items] == [l["code"] for l in LANGUAGES], path
            assert [a["href"] for a in items] == [route(name, l["code"]) for l in LANGUAGES], path
            assert len(soup.select('#lang-menu [aria-current="page"]')) == 1, path
            sections = [(el.name, el.get("id")) for el in soup.select("main section, main article")]
            if reference is None:
                reference = sections
            assert sections == reference, f"Section drift: {path}"
    errors = []
    for page_path, soup in cache.items():
        for el in soup.select("a[href], script[src], img[src], link[rel='stylesheet']"):
            attr = "src" if el.name in ("script", "img") else "href"
            value = el[attr]
            url = urlsplit(value)
            if url.netloc and url.netloc != "aceconscious.studio":
                continue
            if url.scheme and url.scheme not in ("http", "https"):
                continue
            target = url.path or page_path
            if target.endswith("/"):
                filename = target.lstrip("/") + "index.html"
            else:
                filename = target.lstrip("/")
            if not (ROOT / filename).is_file():
                errors.append(f"{page_path}: missing {value}")
            if url.fragment and target in cache and not cache[target].find(id=unquote(url.fragment)):
                errors.append(f"{page_path}: missing anchor {value}")
    assert not errors, "\n".join(errors)
    print(f"Passed locale, menu, section, metadata, anchor and asset checks for {count} pages.")


if __name__ == "__main__":
    check()
