#!/usr/bin/env python3
"""Regression checks for draft validation and font cache invalidation."""
from hashlib import sha256
from pathlib import Path
import json
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

import build_locales


class HomeDraftTests(unittest.TestCase):
    def setUp(self):
        keys = set()
        for name in ("home-navigation.en.html", "home-hero.en.html", "home-reviews.en.html", "home-buy.en.html",
                     "home-story.en.html", "home-voices.en.html", "home-community.en.html",
                     "home-author.en.html", "home-contents.en.html"):
            fragment = build_locales.parse(
                (build_locales.ROOT / "content/templates" / name).read_text())
            keys.update(build_locales.template_string_keys(fragment))
        source = json.loads((build_locales.CATALOGS / "en.json").read_text())
        self.required = keys - set(source)
        self.valid = {key: "A complete sentence." for key in self.required}

    def test_complete_copy(self):
        build_locales.validate_home_draft(self.valid, self.required)

    def test_missing_key(self):
        copy = self.valid.copy()
        copy.pop(next(iter(copy)))
        with self.assertRaisesRegex(ValueError, "missing"):
            build_locales.validate_home_draft(copy, self.required)

    def test_unknown_key_cannot_override_shared_source(self):
        with self.assertRaisesRegex(ValueError, "unexpected"):
            build_locales.validate_home_draft({**self.valid, "hero.genre": "Changed"}, self.required)

    def test_invalid_values(self):
        key = next(iter(self.valid))
        for value in ("", "   ", None, 42, "<script>alert(1)</script>",
                      "<em>Markup</em>", "Unfilled {name}", "ZXQ123", "[X12]"):
            with self.subTest(value=value), self.assertRaises(ValueError):
                build_locales.validate_home_draft({**self.valid, key: value}, self.required)

    def test_invalid_root(self):
        with self.assertRaises(ValueError):
            build_locales.validate_home_draft([], self.required)


class HomeFontTests(unittest.TestCase):
    def test_real_font_versions(self):
        self.assertEqual(len(build_locales.home_font_urls()), 4)

    def test_subset_change_requires_new_url(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "assets/fonts").mkdir(parents=True)
            (root / "css").mkdir()
            for stylesheet, names in build_locales.HOME_FONT_STYLESHEETS.items():
                rules = []
                for name in names:
                    data = name.encode()
                    (root / "assets/fonts" / name).write_bytes(data)
                    version = sha256(data).hexdigest()[:10]
                    rules.append(f'@font-face {{ src: url("../assets/fonts/{name}?v={version}"); }}')
                (root / stylesheet).write_text("\n".join(rules))
            with patch.object(build_locales, "ROOT", root):
                for path, names in build_locales.HOME_FONT_STYLESHEETS.items():
                    with self.subTest(stylesheet=path):
                        before = build_locales.home_font_urls()
                        name = names[0]
                        (root / "assets/fonts" / name).write_bytes(b"updated font subset")
                        with self.assertRaisesRegex(ValueError, f"Update {path} font URL"):
                            build_locales.home_font_urls()
                        version = sha256(b"updated font subset").hexdigest()[:10]
                        stylesheet = root / path
                        stylesheet.write_text(stylesheet.read_text().replace(
                            before[name], f"/assets/fonts/{name}?v={version}"))
                        after = build_locales.home_font_urls()
                        self.assertNotEqual(before[name], after[name])


class HomeStoryTests(unittest.TestCase):
    def setUp(self):
        self.story = build_locales.parse(
            (build_locales.ROOT / "content/templates/home-story.en.html").read_text())
        self.pitch = json.loads((build_locales.CATALOGS / "en.json").read_text())["hero.pitch"]

    def test_canonical_story_copy_and_emphasis_are_preserved(self):
        original = build_locales.parse(self.pitch)
        expected = [str(p) for p in original.select("p:not(.hero__pitch-ace)")]
        build_locales.populate_home_story(self.story, self.pitch)
        self.assertEqual([str(p) for p in self.story.select(".story-copy > p")], expected)
        self.assertEqual(len(self.story.select("[data-story-intro] > p")), 1)
        self.assertEqual(len(self.story.select("details [data-story-extended] > p")), len(expected) - 1)
        original_ace = original.select_one(".hero__pitch-ace")
        self.assertEqual(str(self.story.select_one("#story-ace-heading a")), str(original_ace.a))
        original_ace.a.extract()
        original_ace.br.extract()
        self.assertEqual(self.story.select_one(".story-ace__text").decode_contents(),
                         original_ace.decode_contents())
        self.assertFalse(self.story.details.has_attr("open"))

    def test_missing_ace_copy_is_not_silently_dropped(self):
        with self.assertRaisesRegex(ValueError, "ACE paragraph"):
            build_locales.populate_home_story(self.story, "<p>Introduction</p><p>Extended</p>")

    def test_missing_ace_link_is_not_replaced_by_prototype_copy(self):
        pitch = '<p>Introduction</p><p>Extended</p><p class="hero__pitch-ace">ACE description</p>'
        with self.assertRaisesRegex(ValueError, "existing ACE link"):
            build_locales.populate_home_story(self.story, pitch)


if __name__ == "__main__":
    unittest.main()
