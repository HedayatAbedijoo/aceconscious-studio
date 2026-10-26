#!/usr/bin/env python3
"""Compose the localized book edition of each home page.

The book is a presentation of content the site already has: it reads the
rendered locale pages (home, ace, rights, screen, privacy, impressum), the
printed sample chapters and the edition data, then lays them out as the ordered
pages of one book. Nothing here invents text, quotations, scores or store links.

Every page is written into the document as ordinary HTML inside #book-source,
so the content is complete without JavaScript and for crawlers; js/book.js
reflows that markup onto paper sheets. Every locale uses the same layout and its own translated source pages.
"""
import json
from html import escape
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
STRINGS = {}
LANGUAGE = "en"
EDITIONS = json.loads((ROOT / "content/book/editions.json").read_text())
SAMPLE = json.loads((ROOT / "content/book/sample-en.json").read_text())

# Page-group order after the front cover. Reference pages have no bookmark;
# their links live on the appendix opener and back cover.
SECTIONS = ("headline", "reviews", "story", "ace", "buy", "community",
            "author", "contact", "sample", "appendix", "back-cover")
BOOKMARKS = tuple(section for section in SECTIONS if section != "appendix")
APPENDIX_ITEMS = ("contents", "screen", "rights", "privacy", "impressum")
BACK_COVER_LINKS = APPENDIX_ITEMS

# Links that lead to a page of this book turn pages instead of loading a page.
JUMP_TARGETS = {
    "/": "headline", "/#top": "headline", "/#reviews": "reviews", "/#synopsis": "synopsis",
    "/#buy": "buy", "/#author": "author", "/#contact": "contact", "/#sample": "sample",
    "/#contents": "contents", "/ace/": "ace", "/privacy/": "privacy",
    "/impressum/": "impressum", "/rights/": "rights", "/screen/": "screen",
    "#contact": "contact", "#synopsis": "synopsis", "#author": "author", "#sample": "sample",
}

BLOCK_TAGS = {"p", "h2", "h3", "h4", "ul", "ol", "blockquote", "figure", "table", "dl", "img"}
CONTAINERS = {"div", "section", "article", "aside", "details", "header", "footer", "li", "figcaption"}
KEEP_ATTRS = {"href", "src", "alt", "width", "height", "dir", "lang", "cite", "datetime",
              "class", "target", "rel", "loading", "data-jump", "colspan", "aria-hidden"}
KEEP_CLASSES = {"lede", "aside", "quiet", "dropcap", "chapter-kicker",
                "legal-page__updated",
                "pullquote", "review-brand", "review-link", "ornament", "poem", "author-image",
                "author-signature", "small-rule", "text-link", "ink-button", "score-row",
                "rating", "quote-mark", "contents-row", "section-index", "ace-letters",
                "contact-email", "review-excerpt", "back-to-index", "store-grid", "store-card",
                "link-list", "headline-eyebrow", "headline-title", "headline-tagline",
                "headline-logline", "marketplace", "paper-form", "dot"}

SKIP_SELECTORS = (
    "nav", "script", "style", "noscript", "form", "button",
    ".ind-actions", ".ind-toc-wrap", ".ind-tocbar", ".ace-toc", ".ace-tocbar",
    ".ace-hero__actions", ".ace-hero__map", ".ace-toc__backdrop", ".legal-page__back",
    ".site-nav", ".site-footer", ".skip-link", ".reviews__controls", ".reviews__status",
    ".hero__actions", ".ind-hero__eyebrow", ".ind-cover", ".ind-avail",
)


def text(node, default=""):
    return node.get_text(" ", strip=True) if node else default


def inner(node):
    """Inline HTML of a node, cleaned of build-time attributes."""
    if node is None:
        return ""
    copy = clone(node)
    return "".join(str(child) for child in copy.contents).strip()


def clone(node):
    from build_locales import parse
    copy = parse(str(node))
    element = copy.find(True)
    sanitize(element)
    return element


def sanitize(element):
    """Strip page chrome and point internal links at the matching book page."""
    for unwanted in element.select("svg,script,style,button,.reviews__sr-only,.ind-sr-only"):
        unwanted.decompose()
    for node in [element, *element.find_all(True)]:
        if node.name == "a":
            href = node.get("href", "")
            from build_locales import ROUTES
            url = urlsplit(href)
            canonical = ROUTES.get(url.path)
            local = not url.netloc or url.netloc == "aceconscious.studio"
            normalized = (("/" if canonical == "home" else f"/{canonical}/")
                          + ("#" + url.fragment if url.fragment else "")) if canonical and local else href
            target = JUMP_TARGETS.get(normalized)
            if target:
                node["data-jump"] = target
            elif href.startswith("#"):
                # In-page anchors of the original pages do not exist inside the book.
                node.name = "span"
                del node["href"]
            elif href.startswith("http") and "aceconscious.studio" not in href:
                node["target"] = "_blank"
                node["rel"] = "noopener noreferrer"
        if node is not element and node.name in ("bdi", "span") and not node.attrs:
            node.unwrap()
            continue
        classes = [name for name in node.get("class", []) if name in KEEP_CLASSES]
        for attribute in list(node.attrs):
            if attribute not in KEEP_ATTRS:
                del node[attribute]
        if classes:
            node["class"] = classes
        elif node.has_attr("class"):
            del node["class"]
    return element


def blocks(node, skip=()):
    """Flatten a section of a page into the book's block elements, in order."""
    result = []
    if node is None:
        return result
    for child in node.children:
        if getattr(child, "name", None) is None:
            continue
        selectors = SKIP_SELECTORS + tuple(skip)
        if any(child_matches(child, selector) for selector in selectors):
            continue
        if child.name == "details":
            summary = child.find("summary")
            if summary:
                result.append(f"<h3>{escape(text(summary))}</h3>")
            result += blocks(child, skip)
            continue
        if child.name == "table":
            result += table_rows(child)
            continue
        if child.name == "dl":
            result += definition_rows(child)
            continue
        if child.name in BLOCK_TAGS:
            html = str(clone(child))
            if text(child) or child.find("img"):
                result.append(html)
            continue
        if child.name in CONTAINERS:
            result += blocks(child, skip)
    return result


def child_matches(node, selector):
    if selector.startswith("."):
        return selector[1:] in node.get("class", [])
    return node.name == selector


def table_rows(table):
    """Tables read as labelled rows on a book page."""
    rows = []
    headings = table.select("thead tr:first-child th")
    for row in table.select("tr"):
        cells = row.select("th,td")
        if not cells or row.find_parent("thead"):
            continue
        if len(cells) == 2:
            rows.append(f'<p class="score-row"><span>{inner(cells[0])}</span>'
                        f'<span>{inner(cells[1])}</span></p>')
        else:
            # Wide comparison tables become one labelled group per dimension.
            # Keep each value paired with its column heading on narrow sheets.
            values = []
            for index, cell in enumerate(cells[1:], start=1):
                label = inner(headings[index]) if index < len(headings) else ""
                values.append(f'<p class="score-row"><span>{label}</span>'
                              f'<span>{inner(cell)}</span></p>')
            rows.append('<div class="comparison-row" data-keep-together>'
                        f'<h4>{inner(cells[0])}</h4>' + "".join(values) + '</div>')
    return rows


def definition_rows(list_node):
    rows = []
    for group in list_node.select("div") or [list_node]:
        for term, value in zip(group.select("dt"), group.select("dd")):
            rows.append(f'<p class="score-row"><span>{inner(term)}</span>'
                        f'<span>{inner(value)}</span></p>')
    return rows


def opener(heading, kicker=""):
    parts = []
    if kicker:
        parts.append(f'<p class="chapter-kicker">{escape(kicker)}</p>')
    parts.append(f"<h2>{escape(heading)}</h2>")
    return parts


def page(id, section, title, body, classes="", **extra):
    return {"id": id, "section": section, "title": title, "blocks": body,
            "classes": classes, **extra}


# ----------------------------------------------------------------- sections

def cover_pages(home, strings):
    front = page("cover", "cover", "ACE.await", [], "cover",
                 image=EDITIONS["covers"].get(LANGUAGE, EDITIONS["covers"]["en"])["front"], alt=STRINGS["ui"]["coverAlt"])
    footer = home.select_one(".site-footer")
    links = [f'<li><a href="#{identifier}" data-jump="{identifier}">'
             f'{escape(STRINGS["appendix"]["items"][identifier])}</a></li>'
             for identifier in BACK_COVER_LINKS]
    back = page("back-cover", "back-cover", STRINGS["sections"]["back-cover"], [
        '<footer class="back-cover__imprint">'
        '<p class="back-cover__studio"><a href="https://aceconscious.studio/" '
        'target="_blank" rel="noopener noreferrer">'
        f'{inner(footer.select_one(".site-footer__brand"))}</a></p>'
        f'<p class="back-cover__legal">{inner(footer.select_one(".site-footer__legal"))}</p>'
        '<ul class="back-cover__links">' + "".join(links) + '</ul></footer>',
    ], "cover back-cover", image=EDITIONS["covers"].get(LANGUAGE, EDITIONS["covers"]["en"])["back"], alt=STRINGS["ui"]["backCoverAlt"])
    return front, back


def headline_page(strings):
    headline = STRINGS["headline"]
    return page("headline", "headline", "ACE.await", [
        '<div class="headline-frontmatter">'
        f'<p class="headline-imprint">{escape(headline["studio"])}<br>'
        f'{escape(headline["placeAndYear"])}</p>'
        '<p class="headline-title" dir="ltr" translate="no">'
        'ACE<span class="dot">.</span>await</p>'
        f'<p class="headline-byline">{escape(strings["hero.author"])}</p>'
        '<span class="ornament" aria-hidden="true">❧</span></div>',
        '<div class="headline-summary">'
        f'<p class="headline-tagline">{escape(headline["tagline"])}</p>'
        f'<p class="headline-logline">{escape(headline["logline"])}</p></div>',
        f'<p class="headline-eyebrow">{escape(headline["eyebrow"])}</p>',
    ], "headline-page", fixed=True)


def review_pages(home, strings):
    """Keep Kirkus in full; the other two book reviews use their short quotes."""
    pages = []
    for position, article in enumerate(home.select("[data-review-id]"), start=1):
        identifier = article["data-review-id"]
        compact = identifier in {"booklife-2026", "consciousness-2026"}
        quote = article.select_one(f'#{article["aria-labelledby"]}')
        brand = text(article.select_one(".media-review__name, .review__score-source"))
        kind = text(article.select_one(".media-review__publication p, .media-review__eyebrow"))
        published = text(article.select_one(".media-review__publication time"))
        body = [f'<p class="chapter-kicker">'
                f'{escape(STRINGS["sections"]["reviews"])} · {position:02d}</p>']
        small = " · ".join(part for part in (kind, published) if part)
        body.append(f'<p class="review-brand">{escape(brand)}'
                    + (f"<small>{escape(small)}</small>" if small else "") + "</p>")
        body.append('<span class="quote-mark" aria-hidden="true">“</span>')
        body.append(f'<p class="pullquote">{inner(quote.select_one("p") or quote)}</p>')
        for secondary in article.select(".media-review__secondary-quote p, .review__tagline p"):
            body.append(f'<p class="lede">{inner(secondary)}</p>')
        closing_start = len(body)
        if not compact:
            for excerpt in article.select(".media-review__excerpt p, .review__excerpt p"):
                body.append(f'<p class="review-excerpt">{inner(excerpt)}</p>')
        rating = article.select_one(".review__rating")
        if rating and not compact:
            body.append(f'<p class="rating" dir="ltr">{inner(rating)}</p>')
            scale = article.select_one(".review__scale")
            if scale:
                body.append(f'<p class="chapter-kicker">{escape(text(scale))}</p>')
            body += definition_rows(article.select_one(".review__scores"))
        note = text(article.select_one(".media-review__note, .review__translation"))
        if note:
            body.append(f'<p class="quiet">{escape(note)}</p>')
        link = article.select_one("a.review__link")
        if link:
            label = text(link.select_one("span"))
            body.append(f'<a class="review-link" href="{escape(link["href"])}" target="_blank" '
                        f'rel="noopener noreferrer">{escape(label)} '
                        f'<span aria-hidden="true">↗</span></a>')
        if identifier == "kirkus-2026":
            # The source link belongs with the final quote, never on its own sheet.
            body[closing_start:] = [
                '<div class="review-closing" data-keep-together>'
                + "".join(body[closing_start:]) + "</div>"
            ]
        pages.append(page("reviews" if position == 1 else identifier, "reviews",
                          brand or strings["reviews.heading"], body,
                          "review-page short-review-page" if compact else "review-page",
                          fixed=compact))
    return pages


def store_card(store, fmt, href, mark, edition=""):
    attributes = f' data-edition="{edition}"' if edition else ""
    if href:
        return (f'<a class="store-card" href="{escape(href)}" target="_blank" '
                f'rel="noopener noreferrer"{attributes}>'
                f'<span class="store-card__mark" aria-hidden="true">{mark}</span>'
                f'<span class="store-card__store">{escape(store)}</span>'
                f'<span class="store-card__format">{escape(fmt)}</span></a>')
    return (f'<span class="store-card" aria-disabled="true"{attributes}>'
            f'<span class="store-card__mark" aria-hidden="true">{mark}</span>'
            f'<span class="store-card__store">{escape(store)}</span>'
            f'<span class="store-card__format">{escape(fmt)}</span></span>')


AMAZON_MARK = ('<svg viewBox="0 0 24 24" role="img"><path d="M.045 18.02c.072-.116.187-.124.348-.022'
               ' 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.6.41-1.006.654-1.244.743-2.64'
               ' 1.316-4.185 1.726a17.617 17.617 0 01-10.951-.577 17.88 17.88 0 01-5.43-3.35c-.1-.074-.151-.15-.151-.22'
               ' 0-.047.021-.09.051-.13z"/><path d="M13.4 7.2c-1.3.1-2.8.2-3.9.7-1.3.6-2.3 1.7-2.3 3.4 0 2.1 1.3 3.2 3 3.2'
               ' 1.4 0 2.2-.3 3.3-1.4.4.5.5.8 1.2 1.3.1.1.3.1.5 0 .4-.3 1-.9 1.4-1.2.2-.1.1-.4 0-.5-.4-.5-.8-1-.8-2V7.4c0-1.4.1-2.7-.9-3.7-.8-.8-2.1-1.1-3.2-1.1-2.1'
               ' 0-4.4.8-4.9 3.4 0 .3.2.4.3.5l2.1.2c.2 0 .3-.2.4-.4.2-.9.9-1.3 1.7-1.3.4 0 .9.2 1.2.6.3.5.2 1.1.2 1.6zm-.4 4.3c-.3.6-.8.9-1.4.9-.8'
               ' 0-1.2-.6-1.2-1.4 0-1.7 1.5-2 2.9-2v.4c0 .8 0 1.4-.3 2.1z"/></svg>')
STORE_MARK = ('<svg viewBox="0 0 24 24" role="img"><path d="M4 3h13a3 3 0 0 1 3 3v15l-4.5-2.6L11 21l-4.5-2.6L4 21z'
              'm2 2v12.5l2.5-1.4L13 18.7l4.5-2.6L18 16.4V6a1 1 0 0 0-1-1z"/></svg>')


def buy_pages(strings):
    """Link verified editions; future stores remain inactive placeholders."""
    amazon = EDITIONS["amazon"]
    markets = amazon["markets"]
    default = markets[0]
    cards, missing = [], []
    editions = amazon.get("localizedEditions", {}).get(LANGUAGE, amazon["editions"])
    for edition in editions:
        href = f'https://{default["host"]}/dp/{edition["identifier"]}'
        cards.append(store_card(edition["store"], STRINGS["buy"]["formats"][edition["id"]].split(" · ")[-1], href,
                                AMAZON_MARK, edition["id"]))
    for store in EDITIONS["stores"]:
        if store.get("url"):
            cards.append(store_card(store["store"], store.get("format") or "", store["url"],
                                    STORE_MARK))
        else:
            missing.append(f'{store["store"]}: {store["missing"]}')
            cards.append(store_card(store["store"], STRINGS["buy"]["comingSoon"], "", STORE_MARK))
    options = "".join(
        f'<option value="{market["code"]}" data-host="{market["host"]}" '
        f'data-editions="{" ".join(market["editions"])}"'
        f'{" selected" if market is default else ""}>'
        f'{market["flag"]} {escape(STRINGS["buy"]["markets"][market["code"]])} · {escape(market["host"].removeprefix("www."))}'
        "</option>" for market in markets)
    body = [
        f'<h2>{escape(strings["buy.label"])}</h2>',
        '<div class="marketplace" data-live>'
        f'<label for="amazon-marketplace">{escape(STRINGS["buy"]["marketplaceLabel"])}</label>'
        f'<select id="amazon-marketplace" data-unavailable="{escape(STRINGS["buy"]["unavailable"])}">'
        f"{options}</select></div>",
        f'<div class="store-grid">{"".join(cards)}</div>',
        *([] if LANGUAGE == "en" else [f'<p class="quiet">{escape(STRINGS["buy"]["editionNote"])}</p>']),
    ]
    return [page("buy", "buy", strings["buy.label"], body, "buy-page", fixed=True)], missing


def story_pages(home, strings):
    section = home.select_one("#synopsis .synopsis__text")
    body = [
        '<div class="story-heading" data-keep-together>'
        '<span class="story-year" aria-hidden="true">2313</span>'
        f'<h2>{escape(strings["synopsis.heading"])}</h2></div>'
    ]
    body += blocks(section.select_one(".hero__pitch"))
    return [page("synopsis", "story", strings["synopsis.heading"], body, "story-page")]


def author_pages(home, strings):
    section = home.select_one("#author")
    bio = section.select_one(".author__bio")
    verse = bio.select_one(".author__verse")
    body = [
        '<div class="author-opening" data-keep-together>'
        f'<h2>{escape(strings["name.author"])}</h2>'
        '<div class="author-intro">'
        f'<div class="poem">{inner(verse)}</div>'
        '<div class="author-portrait"><img src="/assets/author-book.png" '
        f'alt="{escape(strings["name.author"])}" width="940" height="1672"></div>'
        '</div><div class="ornament" aria-hidden="true">❧</div></div>'
    ]
    for element in bio.children:
        if getattr(element, "name", None) != "p" or not element.get("data-i18n-html", "").startswith("author."):
            continue
        body.append(str(clone(element)))
    social = '<div class="author-social">'
    instagram = bio.select_one('a.ig-link')
    for href, label, mark in [
        (instagram["href"], text(instagram), INSTAGRAM_MARK),
        ("https://www.linkedin.com/in/abedijoo/", "LinkedIn", LINKEDIN_MARK),
        ("https://x.com/ACEawait", "@ACEawait", X_MARK),
    ]:
        social += (f'<a href="{escape(href)}" target="_blank" rel="noopener noreferrer">'
                   f'<span class="author-social__icon" aria-hidden="true">{mark}</span>'
                   f'{escape(label)}</a>')
    social += '</div>'
    # Keep the invitation to get in touch with the author's social links.
    body[-1] = '<div class="author-closing" data-keep-together>' + body[-1] + social + '</div>'
    return [page("author", "author", strings["name.author"], body, "author-page")]


def contact_pages(strings):
    circle = STRINGS["contact"]
    join = (
        '<form class="paper-form" id="community-form" method="post" novalidate '
        f'aria-label="{escape(circle["circleHeading"])}" data-live '
        f'data-sending="{escape(circle["circleSending"])}" '
        f'data-success="{escape(circle["circleSuccess"])}" '
        f'data-error="{escape(circle["circleError"])}" '
        f'data-unavailable="{escape(circle["circleUnavailable"])}" '
        f'data-invalid-email="{escape(strings["contact.invalidEmail"])}" '
        f'data-request-message="{escape(circle["circleRequestMessage"])}">'
        '<input class="community-honeypot" type="text" name="website" autocomplete="off" '
        'tabindex="-1" aria-hidden="true">'
        '<fieldset class="community-fields" disabled>'
        '<input id="community-email" name="email" type="email" autocomplete="email" '
        'inputmode="email" autocapitalize="none" spellcheck="false" maxlength="254" required '
        f'aria-label="{escape(circle["circleEmailLabel"])}" '
        f'placeholder="{escape(circle["circleEmailPlaceholder"])}" dir="ltr">'
        f'<button class="ink-button" type="submit">{escape(circle["circleSubmit"])} ↗</button>'
        '</fieldset>'
        '<p class="form-status" id="community-status" role="status" aria-live="polite" '
        'aria-atomic="true" hidden></p></form>')
    write = (
        '<form class="paper-form" id="contact-form" novalidate data-live>'
        '<input aria-hidden="true" autocomplete="off" class="contact-form__honeypot" '
        'name="website" tabindex="-1" type="text">'
        f'<label for="contact-email">{escape(strings["contact.emailLabel"])}</label>'
        '<input autocomplete="email" id="contact-email" name="email" type="email" required dir="ltr">'
        f'<label for="contact-message">{escape(strings["contact.messageLabel"])}</label>'
        '<textarea id="contact-message" name="message" required rows="5"></textarea>'
        f'<button class="ink-button" type="submit">{escape(strings["contact.submit"])}</button>'
        '<p class="form-status" id="contact-status" role="status" aria-live="polite" hidden></p>'
        '</form>')
    first = opener(STRINGS["sections"]["community"]) + [
        f'<p class="gift-description">{escape(circle["giftDescription"])}</p>',
        '<p class="gift-contact"><a class="text-link" href="#contact" data-jump="contact">'
        f'{escape(circle["giftContact"])}</a></p>',
        f'<h2 class="gift-community-heading">{escape(circle["circleHeading"])}</h2>',
        f'<p class="gift-community-description">{escape(circle["circleDescription"])}</p>',
        join,
    ]
    second = [
        f'<p class="chapter-kicker">{escape(strings["contact.label"])}</p>',
        f'<h2>{escape(circle["writeHeading"])}</h2>',
        write,
        f'<p class="quiet">{escape(circle["emailDirect"])}</p>',
        '<a class="contact-email" href="mailto:ace.conscious.studio@gmail.com">'
        'ace.conscious.studio@gmail.com</a>',
    ]
    return [page("community", "community", STRINGS["sections"]["community"], first, "gift-page", fixed=True),
            page("contact", "contact", circle["writeHeading"], second)]


def sample_pages(sample=SAMPLE):
    """The printed chapters, one book page per printed page."""
    pages = []
    for sheet in sample["pages"]:
        parts = []
        notes = ""
        for block in sheet["blocks"]:
            kind = block["type"]
            if kind == "chapter":
                parts.append('<div class="sample-chapter">'
                             f'<p class="sample-chapter__kicker">{escape(block["kicker"])}</p>'
                             f'<p class="sample-chapter__title">{escape(block["title"])}</p></div>')
            elif kind == "paragraph":
                parts.append(f'<p class="{"opens" if block["opens"] else ""}">{block["html"]}</p>')
            elif kind == "verse":
                parts.append('<div class="sample-verse">'
                             + "<br>".join(block["lines"]) + "</div>")
            elif kind == "dialogue":
                items = "".join(
                    f'<li class="level-{item["level"]}">'
                    f'<span class="sample-dialogue__mark" aria-hidden="true">{escape(item["mark"])}</span>'
                    f'{item["html"]}</li>' for item in block["items"])
                parts.append(f'<ul class="sample-dialogue">{items}</ul>')
            elif kind == "console":
                lines = "".join(
                    f'<li class="{"reply" if line["prompt"] != "~" else "prompt"}">'
                    f'<span class="sample-console__prompt" aria-hidden="true">{escape(line["prompt"])}</span>'
                    f'<span>{escape(line["text"])}</span></li>' for line in block["lines"])
                parts.append('<div class="sample-console">'
                             '<div class="sample-console__bar">'
                             f'<span>{escape(block["title"])}</span>'
                             '<span class="sample-console__dots" aria-hidden="true">'
                             "<span></span><span></span><span></span></span></div>"
                             f'<ul class="sample-console__lines">{lines}</ul></div>')
            elif kind == "notes":
                notes = '<div class="sample-notes">' + "".join(
                    f'<p><sup>{escape(item["marker"])}</sup>{item["html"]}</p>'
                    for item in block["items"]) + "</div>"
        folio = escape(sheet["folio"])
        divider = '<span class="sample-sheet__divider" aria-hidden="true">|</span>'
        reference = (f'{sheet["runningTitle"]} {divider} {folio}' if sheet["side"] == "recto"
                     else f'{folio} {divider} {sheet["runningTitle"]}')
        head = (f'<div class="sample-sheet__head sample-sheet__head--{sheet["side"]}">'
                f"<span>{reference}</span></div>")
        sheet_html = ('<div class="sample-sheet">'
                      '<div class="sample-sheet__canvas">'
                      '<div class="sample-sheet__inner">'
                      f'{head}<div class="sample-sheet__body">{"".join(parts)}{notes}</div>'
                      "</div></div></div>")
        pages.append(page(f"sample-{sheet['number']:02d}" if sheet["number"] > 1 else "sample",
                          "sample", f"ACE.await · {sheet['folio']}", [sheet_html],
                          "sample-page", fixed=True))
    return pages


def localized_sample_pages():
    """Published samples are original editions, never invented translations."""
    if LANGUAGE == "en":
        return sample_pages()
    if LANGUAGE == "fa":
        sample = json.loads((ROOT / "content/book/sample-fa.json").read_text())
        pages = sample_pages(sample)
        for item in pages:
            item["blocks"] = [block.replace('class="sample-sheet"', 'class="sample-sheet" lang="fa" dir="rtl"') for block in item["blocks"]]
        return pages
    pages = sample_pages()
    # Keep the original's language and direction within the localized book UI.
    for item in pages:
        item["blocks"] = [block.replace('class="sample-sheet"', 'class="sample-sheet" lang="en" dir="ltr"') for block in item["blocks"]]
    return pages


def link_row(href, name, handle, mark):
    return (f'<li><a href="{escape(href)}" target="_blank" rel="noopener noreferrer">'
            f'<span class="link-list__icon" aria-hidden="true">{mark}</span>'
            f'<span class="link-list__text"><span class="link-list__name">{escape(name)}</span>'
            f'<span class="link-list__handle">{escape(handle)}</span></span>'
            '<span class="link-list__go" aria-hidden="true">↗</span></a></li>')


INSTAGRAM_MARK = ('<svg viewBox="0 0 24 24" role="img"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75'
                  ' 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25'
                  ' 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25'
                  ' 4.25 0 0 0 16.25 3.5h-8.5zm8.75 2.25a1.125 1.125 0 1 1 0 2.25 1.125 1.125 0 0'
                  ' 1 0-2.25zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/></svg>')
LINKEDIN_MARK = ('<svg viewBox="0 0 24 24" role="img"><path d="M4 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4z'
                 'M2 9h4v13H2zM9 9h4v1.8c.8-1.3 2-2.1 3.8-2.1 3.7 0 5.2 2.3 5.2 6V22h-4v-6.7'
                 'c0-2-.6-3.1-2.1-3.1-1.8 0-2.9 1.2-2.9 3.4V22H9z"/></svg>')
X_MARK = ('<svg viewBox="0 0 24 24" role="img"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-5-7.5L5.3 22H2.1'
          'l8.3-9.5L.8 2h6.5l4.5 6.8L18.9 2zM17.9 20h1.7L6.2 4H4.4z"/></svg>')
GLOBE_MARK = ('<svg viewBox="0 0 24 24" role="img"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 9h-3a15.6'
              ' 15.6 0 0 0-1.3-5.6A8 8 0 0 1 18.9 11zM12 4.2c.8 1.1 1.5 3.3 1.7 6.8h-3.4c.2-3.5.9-5.7 1.7-6.8zM4.3'
              ' 13h3c.1 2.1.5 4 1.1 5.6A8 8 0 0 1 4.3 13zm3-2h-3a8 8 0 0 1 4.1-5.6A15.6 15.6 0 0 0 7.3 11zM12'
              ' 19.8c-.8-1.1-1.5-3.3-1.7-6.8h3.4c-.2 3.5-.9 5.7-1.7 6.8zm2.6-1.2c.6-1.6 1-3.5 1.1-5.6h3a8 8 0 0 1-4.1 5.6z"/></svg>')
QUILL_MARK = ('<svg viewBox="0 0 24 24" role="img"><path d="M20 3c-6.6.4-11.2 2.7-13.6 6.9-1 1.8-1.4 3.8-1.3 5.8L3 18l1.5 1.3'
             ' 2-2.3c2 .2 4-.2 5.8-1.2C16.5 13.4 19 9 20 3zM8.9 14.7c-.6 0-1.1-.1-1.6-.2 1.9-3.5 5-6 9-7.4'
             '-2.1 3.9-4.6 6.3-7.4 7.6z"/></svg>')
MAIL_MARK = ('<svg viewBox="0 0 24 24" role="img"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0'
             ' 1-1-1V6a1 1 0 0 1 1-1zm1.6 2L12 12.3 19.4 7zM20 17V8.6l-7.4 5.3a1 1 0 0 1-1.2 0L4 8.6V17z"/></svg>')


def appendix_pages(pages_html, home, strings):
    """A single linked opener followed by references in reading order."""
    labels = STRINGS["appendix"]["items"]
    entries = []

    privacy = pages_html["privacy"].select_one(".legal-page__content")
    entries.append(("privacy", labels["privacy"], text(privacy.select_one("h1")),
                    blocks(privacy, skip=(".section-label",))))

    impressum = pages_html["impressum"].select_one(".legal-page__content")
    entries.append(("impressum", labels["impressum"], text(impressum.select_one("h1")),
                    blocks(impressum, skip=(".section-label",))))

    rights = pages_html["rights"].select_one("#rights-available")
    entries.append(("rights", labels["rights"], text(rights.select_one("h2")),
                    blocks(rights, skip=("h2",))))

    screen = pages_html["screen"].select_one("#why-screen")
    entries.append(("screen", labels["screen"], labels["screen"],
                    [f'<p class="lede">{escape(text(screen.select_one("h2")))}</p>',
                     *blocks(screen, skip=("h2",))]))

    contents = home.select_one("#contents .container")
    chapters = [f'<p class="contents-row"><span>{index:02d}</span><span>{escape(text(item))}</span></p>'
                for index, item in enumerate(contents.select(".toc-grid li"), start=1)]
    entries.append(("contents", labels["contents"], strings["toc.label"],
                    [f'<p class="lede">{escape(strings["toc.lead"])}</p>', *chapters]))

    links = [f'<li><a href="#{identifier}" data-jump="{identifier}">'
             f'{escape(labels[identifier])}</a></li>' for identifier in APPENDIX_ITEMS]
    result = [page("appendix", "appendix", STRINGS["appendix"]["heading"], [
        f'<h2 class="appendix-title">{escape(STRINGS["appendix"]["heading"])}</h2>',
        '<ol class="section-index">' + "".join(links) + '</ol>',
    ], classes="appendix-page appendix-index", fixed=True)]
    entries.sort(key=lambda entry: APPENDIX_ITEMS.index(entry[0]))
    for identifier, label, heading, body in entries:
        result.append(page(identifier, "appendix", label, [
            f'<p class="chapter-kicker">{escape(STRINGS["appendix"]["heading"])}</p>',
            f'<h2 class="appendix-title">{escape(heading)}</h2>', *body,
            f'<p class="back-to-index"><button type="button" data-jump="appendix">'
            f'{escape(STRINGS["appendix"]["back"])}</button></p>'],
            classes="appendix-page screen-page" if identifier == "screen" else "appendix-page"))
    return result


def ace_pages():
    """Four translated introduction sheets; the standalone article is separate."""
    from build_locales import parse, apply_strings
    intro = parse((ROOT / "content/templates/ace-intro.html").read_text())
    copy = json.loads((ROOT / f"content/book/ace-intro.{LANGUAGE}.json").read_text())
    apply_strings(intro, copy)
    return [page(section["id"], "ace", text(section.select_one("h2")),
                 [str(section.select_one(".ace-intro"))],
                 "ace-intro-page", fixed=True)
            for section in intro.select("section[data-intro-page]")]


# ------------------------------------------------------------------ assembly

def compose(soup, render, source, strings):
    """Fill #book-source with every page of this edition, in order."""
    from build_locales import LANGUAGES, parse, route as build_route
    global STRINGS, LANGUAGE
    LANGUAGE = soup.html["data-locale"]
    soup.head.append(soup.new_tag("link", rel="stylesheet", href="/css/ace-intro.css"))
    # Initialize the live cards before book.js moves the source off-DOM.
    soup.head.append(soup.new_tag("script", src="/js/ace-intro.js", defer=True))
    STRINGS = json.loads((ROOT / f"content/book/strings.{LANGUAGE}.json").read_text())
    language = next(item for item in LANGUAGES if item["code"] == LANGUAGE)
    # The book draws on the shared translated pages, including the scrolling
    # home template used as a content source.
    rendered = {name: parse(render(name, language, source, strings, template=name))
                for name in ("home", "rights", "screen", "privacy", "impressum")}
    home = rendered["home"]

    front, back = cover_pages(home, strings)
    buy, missing = buy_pages(strings)
    gift, contact = contact_pages(strings)
    ordered = [front, headline_page(strings), *review_pages(home, strings),
               *story_pages(home, strings), *ace_pages(), *buy, gift,
               *author_pages(home, strings), contact, *localized_sample_pages(),
               *appendix_pages(rendered, home, strings), back]

    html = []
    for item in ordered:
        attributes = [f'data-page="{item["id"]}"', f'id="{item["id"]}"',
                      f'data-section="{item["section"]}"',
                      f'data-title="{escape(item["title"], quote=True)}"']
        if item["classes"]:
            attributes.append(f'data-class="{item["classes"]}"')
        if item.get("fixed"):
            attributes.append("data-fixed")
        if item.get("image"):
            attributes.append(f'data-image="{item["image"]}" '
                              f'data-alt="{escape(item["alt"], quote=True)}"')
        body = "".join(item["blocks"])
        if item.get("image"):
            artwork = (f'<img class="cover-image" src="{item["image"]}" '
                       f'alt="{escape(item["alt"], quote=True)}" width="1600" height="2560">')
            if item["id"] == "back-cover":
                artwork = f'<div class="back-cover__artwork">{artwork}</div>'
            body = artwork + body
            if item["id"] == "back-cover":
                body = f'<div class="back-cover__layout">{body}</div>'
        html.append(f'<section {" ".join(attributes)}>{body}</section>')

    container = soup.select_one("#book-source")
    container.clear()
    book_markup = parse("".join(html))
    # Parse references independently of earlier embedded artwork. Otherwise
    # foreign-content parser state can nest <br> tags and emit extra </br>
    # breaks after addresses when the browser reads the generated document.
    for item, markup in zip(ordered, html):
        if item["section"] == "appendix":
            book_markup.find(id=item["id"]).replace_with(parse(markup).find(True))
    for node in list(book_markup.contents):
        container.append(node)

    # Cover controls are outside the paper and never enter the paginated content.
    for selector, key in [("#open", "openBook"), ("#open-label", "openBook"),
                          ("#close", "closeBook"), ("#previous", "previousPage"), ("#next", "nextPage"),
                          ("#book-menu-toggle", "bookSections")]:
        control = soup.select_one(selector)
        control["aria-label"] = STRINGS["ui"][key]
        if control.has_attr("title"):
            control["title"] = STRINGS["ui"][key]
    soup.select_one("#open-label span").string = STRINGS["ui"]["openBook"]
    soup.select_one("#bookmarks")["aria-label"] = STRINGS["ui"]["bookSections"]
    soup.select_one("#book-language-name").string = language["name"]
    soup.select_one('link[rel="preload"][as="image"]')["href"] = front["image"]
    menu = soup.select_one("#book-language-list")
    for item in LANGUAGES:
        own_cover = item["code"] in EDITIONS["covers"]
        href = build_route("home", item["code"]) + ("" if own_cover else "#headline")
        link = soup.new_tag("a", href=href, lang=item["htmlLang"], dir=item["dir"])
        link["data-set-lang"] = item["code"]
        link["hreflang"] = item["htmlLang"]
        if item["code"] == LANGUAGE:
            link["aria-current"] = "page"
        link.string = item["name"]
        li = soup.new_tag("li")
        li.append(link)
        menu.append(li)
    # Legacy ?lang= links continue to resolve before first paint.
    routes = {item["code"]: build_route("home", item["code"]) for item in LANGUAGES}
    redirect = soup.new_tag("script")
    redirect.string = (
        "(function(){var routes=" + json.dumps(routes, separators=(",", ":")) + ";"
        "var query=new URLSearchParams(location.search),lang=query.get('lang');"
        "if(!lang||!routes[lang])return;query.delete('lang');var rest=query.toString();"
        "location.replace(routes[lang]+(rest?'?'+rest:'')+location.hash);})();")
    soup.head.append(redirect)

    data = soup.select_one("#book-strings")
    data.string = json.dumps({
        "sections": {section: STRINGS["sections"][section] for section in BOOKMARKS},
        **STRINGS["ui"],
    }, ensure_ascii=False).replace("<", "\\u003c")
    return missing
