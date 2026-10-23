#!/usr/bin/env python3
"""Extract the published Persian sample as selectable text with printed page breaks.

The source is the existing Persian edition, not a translation of the English
sample. Poppler emits Persian presentation forms in visual order; reversing
those glyphs before Unicode normalization restores logical text. Numerals and
Latin runs retain their original order. PDF spacing is retained rather than
guessing missing zero-width non-joiners.

    python3 scripts/extract_sample_fa_pdf.py
    python3 scripts/extract_sample_fa_pdf.py --check
"""
import argparse
import hashlib
import html
import json
import re
import subprocess
import unicodedata
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "assets/sample-fa.pdf"
OUTPUT = ROOT / "content/book/sample-fa.json"
# Geometry-based verse/continuation recognition below belongs to this edition.
SOURCE_SHA256 = "a958c7114ce8ba834e04dec8b01d9545cb34517467c2b2a80be9f830e8814433"
LTR = re.compile(r"[A-Za-z0-9\u0660-\u0669\u06f0-\u06f9]+(?:[.:/_-][A-Za-z0-9\u0660-\u0669\u06f0-\u06f9]+)*")
MIRROR = str.maketrans("()[]{}«»", ")(][}{»«")


def logical_text(value):
    if not any(unicodedata.bidirectional(c) in {"R", "AL"} for c in value):
        return unicodedata.normalize("NFKC", value)
    # Reverse embedded LTR tokens first so that the whole-run reversal restores
    # their original order (notably the novel's ۳۱۳۲ on printed page eight).
    value = LTR.sub(lambda match: match.group()[::-1], value)
    return unicodedata.normalize("NFKC", value[::-1].translate(MIRROR))


def classify(size, family, color, number):
    if size == 15:
        return "head"
    if size == 18:
        return "kicker"
    if size == 31:
        return "title"
    if number == 1:
        return "console-title" if "JetBrainsMono" in family else (
            "prompt" if color == "#999999" else "console-text")
    if "CMSY" in family:
        return "bullet"
    return {13: "body", 11: "note", 9: "reference", 8: "marker"}[size]


def read_pages():
    if hashlib.sha256(PDF.read_bytes()).hexdigest() != SOURCE_SHA256:
        raise ValueError("Persian sample PDF changed; review extraction geometry first.")
    result = subprocess.run(["pdftohtml", "-xml", "-i", "-nodrm", "-stdout", str(PDF)],
                            capture_output=True, text=True, check=True)
    fonts, pages = {}, []
    for page in ET.fromstring(result.stdout).findall("page"):
        number = int(page.get("number"))
        fonts.update({node.get("id"): (round(float(node.get("size"))),
                      node.get("family"), node.get("color"))
                      for node in page.findall("fontspec")})
        runs = []
        for node in page.findall("text"):
            size, family, color = fonts[node.get("font")]
            runs.append({"top": int(node.get("top")), "left": int(node.get("left")),
                         "right": int(node.get("left")) + int(node.get("width")),
                         "kind": classify(size, family, color, number),
                         "text": logical_text("".join(node.itertext()))})
        lines = []
        for run in sorted(runs, key=lambda item: (item["top"], -item["right"])):
            line = next((line for line in lines if abs(line["top"] - run["top"]) <= 4), None)
            if line is None:
                line = {"top": run["top"], "runs": []}
                lines.append(line)
            line["runs"].append(run)
        for line in lines:
            line["runs"].sort(key=lambda item: -item["right"])
            line["kinds"] = {run["kind"] for run in line["runs"]}
            line["right"] = max(run["right"] for run in line["runs"] if run["kind"] != "reference")
        pages.append((number, lines))
    return pages


def line_html(runs):
    pieces = []
    for run in runs:
        text = html.escape(run["text"], quote=False)
        if run["kind"] == "reference":
            pieces.append(f'<sup class="sample-ref">{text}</sup>')
        else:
            if pieces:
                pieces.append(" ")
            pieces.append(text)
    return "".join(pieces)


def build():
    pages = []
    for number, lines in read_pages():
        blocks, notes = [], []
        head = next(line for line in lines if "head" in line["kinds"])
        title, folio = head["runs"][0]["text"].rsplit(" | ", 1)
        body_right = max((line["right"] for line in lines if "body" in line["kinds"]), default=0)
        for line in lines:
            kinds, runs = line["kinds"], line["runs"]
            if "head" in kinds:
                continue
            if "kicker" in kinds:
                blocks.append({"type": "chapter", "kicker": runs[0]["text"], "title": ""})
            elif "title" in kinds:
                blocks[-1]["title"] = runs[0]["text"]
            elif "console-title" in kinds:
                blocks.append({"type": "console", "title": runs[0]["text"], "lines": []})
            elif "prompt" in kinds:
                blocks[-1]["lines"].append({
                    "prompt": next(run["text"] for run in runs if run["kind"] == "prompt"),
                    "text": " ".join(run["text"] for run in runs if run["kind"] == "console-text")})
            elif "marker" in kinds:
                notes.append({"marker": next(run["text"] for run in runs if run["kind"] == "marker"),
                              "html": line_html([run for run in runs if run["kind"] == "note"])})
            elif "note" in kinds:
                notes[-1]["html"] += " " + line_html(runs)
            elif number == 2 and line["top"] >= 620:
                if not blocks or blocks[-1]["type"] != "verse":
                    blocks.append({"type": "verse", "lines": []})
                blocks[-1]["lines"].append(line_html(runs))
            elif "bullet" in kinds:
                mark = next(run["text"] for run in runs if run["kind"] == "bullet")
                if not blocks or blocks[-1]["type"] != "dialogue":
                    blocks.append({"type": "dialogue", "items": []})
                blocks[-1]["items"].append({"level": 1 if mark == "•" else 2, "mark": mark,
                    "html": line_html([run for run in runs if run["kind"] != "bullet"])})
            elif number == 4 and line["top"] < 150:
                # The prior page ends mid-sentence in Ava's second-level dialogue.
                blocks.append({"type": "dialogue", "items": [
                    {"level": 2, "mark": "", "html": line_html(runs)}]})
            elif blocks and blocks[-1]["type"] == "dialogue" and body_right - line["right"] >= 35:
                blocks[-1]["items"][-1]["html"] += " " + line_html(runs)
            else:
                opens = body_right - line["right"] >= 15
                if opens or not blocks or blocks[-1]["type"] != "paragraph":
                    blocks.append({"type": "paragraph", "html": line_html(runs), "opens": opens})
                else:
                    blocks[-1]["html"] += " " + line_html(runs)
        if notes:
            blocks.append({"type": "notes", "items": notes})
        pages.append({"number": number, "side": "recto" if number % 2 else "verso",
                      "folio": folio, "runningTitle": html.escape(title), "blocks": blocks})
    return {"source": "assets/sample-fa.pdf", "sourceSha256": SOURCE_SHA256,
            "note": "Generated by scripts/extract_sample_fa_pdf.py from the published Persian sample; PDF word spacing retained.",
            "language": "fa", "direction": "rtl", "sheet": {"width": 594, "height": 918}, "pages": pages}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    data = json.dumps(build(), ensure_ascii=False, indent=2) + "\n"
    if args.check:
        if OUTPUT.read_text() != data:
            raise SystemExit("content/book/sample-fa.json is stale; run scripts/extract_sample_fa_pdf.py")
        print("Persian sample pages match sample-fa.pdf.")
    else:
        OUTPUT.write_text(data)
        print("Wrote content/book/sample-fa.json from sample-fa.pdf.")
