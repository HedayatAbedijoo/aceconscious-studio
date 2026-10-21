#!/usr/bin/env python3
"""Check public locale pages, translated markup, routing and local assets."""
import json
from urllib.parse import urlsplit, unquote

from build_locales import ROOT, SITE, LANGUAGES, PAGES, route, parse


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
            assert soup.html["lang"] == lang["htmlLang"], path
            assert soup.html["dir"] == lang["dir"], path
            assert soup.select_one("#lang-menu summary").get_text() == "language", path
            items = soup.select("#lang-menu [data-set-lang]")
            assert [a["data-set-lang"] for a in items] == [l["code"] for l in LANGUAGES], path
            assert [a["href"] for a in items] == [route(name, l["code"]) for l in LANGUAGES], path
            assert len(soup.select('#lang-menu [aria-current="page"]')) == 1, path
            assert soup.select_one('link[rel="canonical"]')["href"] == SITE + path, path
            alternates = soup.select('link[rel="alternate"][hreflang]')
            assert len(alternates) == len(LANGUAGES) + 1, path
            ids = [el["id"] for el in soup.select("[id]")]
            assert len(ids) == len(set(ids)), f"Duplicate ID: {path}"
            sections = [(el.name, el.get("id")) for el in soup.select("main section, main article")]
            if name == "home" and code == "en":
                # Explicit English-first draft: three moved sections and the new
                # Community dialog. Normalize only these approved differences.
                assert soup.select_one("#reviews").find_next_sibling("section")["id"] == "buy", path
                assert soup.select_one("#synopsis").find_next_sibling("section")["id"] == "sample", path
                assert soup.select_one("#sample").find_next_sibling("section")["id"] == "voices", path
                assert soup.select_one("#voices").find_next_sibling("section")["id"] == "author", path
                assert soup.select_one("#author").find_next_sibling("section")["id"] == "contents", path
                assert soup.select_one("body > #community dialog#community-dialog"), path
                assert not soup.select("main #community, #nav-menu a[href='#community']"), path
                assert sections.count(("section", "author")) == 1, path
                sections.remove(("section", "author"))
                sections.insert(sections.index(("section", "contact")), ("section", "author"))
                assert sections.count(("section", "buy")) == 1, path
                sections.remove(("section", "buy"))
                sections.insert(sections.index(("section", "author")), ("section", "buy"))
                sample_block = [("section", "sample"), ("article", "sample-flipbook")]
                assert all(sections.count(item) == 1 for item in sample_block), path
                sample_start = sections.index(sample_block[0])
                assert sections[sample_start:sample_start + len(sample_block)] == sample_block, path
                del sections[sample_start:sample_start + len(sample_block)]
                contents_start = sections.index(("section", "contents"))
                sections[contents_start:contents_start] = sample_block
            if reference is None:
                reference = sections
            assert sections == reference, f"Section drift: {path}"
            for script in soup.select('script[type="application/ld+json"], script#locale-data'):
                json.loads(script.string)
            assert not soup.select("base"), f"Base URL breaks local anchors: {path}"
            count += 1
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
