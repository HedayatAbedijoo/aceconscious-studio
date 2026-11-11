#!/usr/bin/env python3
"""Turn the printed sample chapters into the book's sample pages.

The published PDF (`assets/sample-en.pdf`, Literata and JetBrains Mono, 396 x 612 pt)
is the typographic source. This reads Poppler's text layer with positions and fonts
and records every printed page as structured data: running head, chapter openers,
paragraph indents, dialogue levels, verse, the console window, italics and
footnotes. The reader renders that data as real, selectable text, so the sample
keeps the printed page breaks instead of becoming images or an external viewer.

    python3 scripts/extract_sample_pdf.py            # rewrite content/book/sample-en.json
    python3 scripts/extract_sample_pdf.py --check    # verify the checked-in file
"""
import argparse
import json
import re
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "assets/sample-en.pdf"
OUTPUT = ROOT / "content/book/sample-en.json"

# Poppler's XML reports the page in its own units; the sheet keeps that geometry.
SHEET = {"width": 594, "height": 918}
BODY_SIZES = {13}
VERSE_SIZE = 14
FOOTNOTE_SIZES = {11}
HEAD_SIZE = 15
KICKER_SIZE = 16
TITLE_SIZE = 22
REFERENCE_SIZE = 9
MARKER_SIZE = 8
INDENT = 5          # a first line sits about seven units right of the text block
DIALOGUE_GAP = 18   # dialogue sits far enough right to never look like an indent


def text_of(node):
    """Flatten one <text> run, keeping italics and dropping link artifacts."""
    parts = []

    def walk(el, italic):
        if el.text:
            parts.append((el.text, italic))
        for child in el:
            walk(child, italic or child.tag == "i")
            if child.tail:
                parts.append((child.tail, italic))

    walk(node, node.tag == "i")
    return parts


def escape(value):
    return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def runs_to_html(runs):
    """Join runs on one line, adding a space only where the PDF left a gap."""
    html, previous_end = "", None
    for run in runs:
        if previous_end is not None and run["left"] - previous_end >= 2:
            html += " "
        previous_end = run["left"] + run["width"]
        for text, italic in run["parts"]:
            if not text:
                continue
            piece = escape(text)
            if run["kind"] == "reference":
                piece = f'<sup class="sample-ref">{piece}</sup>'
            elif italic:
                piece = f"<em>{piece}</em>"
            html += piece
    return re.sub(r"\s+", " ", html).strip()


def classify(size, family):
    if "JetBrainsMono" in family:
        return "console"
    if "CMSY" in family:
        return "bullet"
    if size == HEAD_SIZE:
        return "head"
    if size == KICKER_SIZE:
        return "kicker"
    if size == TITLE_SIZE:
        return "title"
    if size == REFERENCE_SIZE:
        return "reference"
    if size == MARKER_SIZE:
        return "marker"
    if size == VERSE_SIZE:
        return "verse"
    if size in FOOTNOTE_SIZES:
        return "note"
    if size in BODY_SIZES:
        return "body"
    raise ValueError(f"Unexpected type size {size} in {family}")


def read_pages():
    xml = subprocess.run(
        ["pdftohtml", "-xml", "-i", "-nodrm", "-stdout", str(PDF)],
        check=True, capture_output=True, text=True).stdout
    document = ET.fromstring(xml)
    pages, fonts = [], {}
    for page in document.findall("page"):
        # Poppler declares each font once, on the first page that uses it.
        fonts.update({f.get("id"): (round(float(f.get("size"))), f.get("family"), f.get("color"))
                      for f in page.findall("fontspec")})
        runs = []
        for node in page.findall("text"):
            size, family, color = fonts[node.get("font")]
            runs.append({
                "top": int(node.get("top")), "left": int(node.get("left")),
                "width": int(node.get("width")), "size": size, "color": color,
                "kind": classify(size, family), "parts": text_of(node),
            })
        pages.append({"number": int(page.get("number")),
                      "runs": sorted(runs, key=lambda r: (r["top"], r["left"]))})
    return pages


def group_lines(runs):
    """Runs printed on the same baseline, allowing for raised superscripts."""
    lines = []
    for run in sorted(runs, key=lambda r: (r["top"], r["left"])):
        line = next((item for item in lines if abs(item["top"] - run["top"]) <= 4), None)
        if line:
            line["runs"].append(run)
        else:
            lines.append({"top": run["top"], "runs": [run]})
    for line in lines:
        line["runs"].sort(key=lambda r: r["left"])
        # Body runs set the line's position; a superscript never starts a line.
        body = [r for r in line["runs"] if r["kind"] != "reference"] or line["runs"]
        line["left"] = body[0]["left"]
        line["top"] = max(r["top"] for r in line["runs"])
        line["kinds"] = {r["kind"] for r in line["runs"]}
    return sorted(lines, key=lambda line: line["top"])


def plain(runs):
    return re.sub(r"<[^>]+>", "", runs_to_html(runs))


def running_title(title):
    """The recto head prints the book title with the second word in small capitals."""
    if title.isupper() and "." in title:
        head, _, rest = title.partition(".")
        return f'{escape(head)}.<span class="sample-smallcaps">{escape(rest.lower())}</span>'
    return escape(title)


def page_blocks(lines, text_left, bullet_left):
    """Printed blocks in reading order; paragraphs keep their first-line indent."""
    blocks, notes = [], []
    in_notes = False
    for line in lines:
        kinds, left = line["kinds"], line["left"]
        if "head" in kinds:
            continue
        if "console" in kinds:
            runs = [r for r in line["runs"] if r["kind"] == "console"]
            if not blocks or blocks[-1]["type"] != "console":
                blocks.append({"type": "console", "title": "", "lines": []})
            console = blocks[-1]
            if runs[0]["color"] == "#666666":           # the window's title bar
                console["title"] = plain(runs)
            elif runs[0]["color"] == "#999999":         # a prompt opens an exchange
                console["lines"].append({"prompt": plain(runs[:1]), "text": plain(runs[1:])})
            elif console["lines"]:                      # a wrapped console line
                console["lines"][-1]["text"] += " " + plain(runs)
            continue
        if "kicker" in kinds:
            blocks.append({"type": "chapter", "kicker": plain(line["runs"]), "title": ""})
            continue
        if "title" in kinds:
            blocks[-1]["title"] = plain(line["runs"])
            continue
        if "verse" in kinds:
            if not blocks or blocks[-1]["type"] != "verse":
                blocks.append({"type": "verse", "lines": []})
            blocks[-1]["lines"].append(runs_to_html(line["runs"]))
            continue
        if "marker" in kinds:
            in_notes = True
            marker = next(r for r in line["runs"] if r["kind"] == "marker")
            rest = [r for r in line["runs"] if r is not marker]
            notes.append({"marker": plain([marker]), "html": runs_to_html(rest)})
            continue
        if in_notes and "note" in kinds:
            notes[-1]["html"] += " " + runs_to_html(line["runs"])
            continue
        if "bullet" in kinds:
            bullet = next(r for r in line["runs"] if r["kind"] == "bullet")
            rest = [r for r in line["runs"] if r is not bullet]
            if not blocks or blocks[-1]["type"] != "dialogue":
                blocks.append({"type": "dialogue", "items": []})
            blocks[-1]["items"].append({
                # The two speakers sit about seventeen units apart on the page.
                "level": 1 if bullet["left"] <= bullet_left + 8 else 2,
                "mark": plain([bullet]), "html": runs_to_html(rest),
            })
            continue
        if blocks and blocks[-1]["type"] == "dialogue" and left >= text_left + DIALOGUE_GAP:
            blocks[-1]["items"][-1]["html"] += " " + runs_to_html(line["runs"])
            continue
        # Body text: an indented line opens a paragraph, anything else continues one.
        html = runs_to_html(line["runs"])
        if left - text_left >= INDENT or not blocks or blocks[-1]["type"] != "paragraph":
            blocks.append({"type": "paragraph", "html": html,
                           "opens": left - text_left >= INDENT})
        else:
            blocks[-1]["html"] += " " + html
    if notes:
        blocks.append({"type": "notes", "items": notes})
    return blocks


def build():
    pages = []
    for page in read_pages():
        lines = group_lines(page["runs"])
        head = next(line for line in lines if "head" in line["kinds"])
        number = page["number"]
        prose = [line["left"] for line in lines
                 if line["kinds"] <= {"body", "reference"} and line["kinds"]]
        bullets = [run["left"] for line in lines for run in line["runs"] if run["kind"] == "bullet"]
        text_left = min(prose, default=0)
        blocks = page_blocks(lines, text_left, min(bullets, default=0))
        title, folio = (plain(head["runs"]).split(" | ") + [""])[:2]
        if not number % 2:
            folio, title = title, folio
        pages.append({"number": number, "side": "recto" if number % 2 else "verso",
                      "folio": folio, "runningTitle": running_title(title), "blocks": blocks})
    return {
        "source": "assets/sample-en.pdf",
        "note": "Generated by scripts/extract_sample_pdf.py from the printed sample chapters.",
        "sheet": SHEET,
        "pages": pages,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    data = json.dumps(build(), ensure_ascii=False, indent=2) + "\n"
    if args.check:
        if OUTPUT.read_text() != data:
            raise SystemExit("content/book/sample-en.json is stale; run scripts/extract_sample_pdf.py")
        print(f"Sample pages match {PDF.name}.")
    else:
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_text(data)
        print(f"Wrote {OUTPUT.relative_to(ROOT)} from {PDF.name}.")
