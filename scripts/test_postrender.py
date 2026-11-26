"""Small offline regression checks for the post-render parsers."""
from contextlib import contextmanager, redirect_stderr, redirect_stdout
from io import StringIO
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
from uuid import uuid4
from urllib.parse import urlsplit
import unittest
from unittest.mock import patch

from lxml import html

from language_pages import SWITCH_HANDLER, check_keys, dictionaries, local_css, local_srcset, local_url, translated_html
from publication_records import publication_graph
from asset_guards import CUSTOM_START, auxiliary_reasons, reviewed_runtime, vendor_fingerprint
from optimize import JS_TYPES, choose_sheet, compact_script, minify_js, trimmed_css, trim_rules

ROOT = Path(__file__).resolve().parents[1]
SITE = None
if "--site" in sys.argv:
    i = sys.argv.index("--site")
    SITE = Path(sys.argv[i + 1]).resolve()
    del sys.argv[i:i + 2]


class LanguagePagesTest(unittest.TestCase):
    def test_missing_values_report_all_languages_and_pages(self):
        keys = dictionaries()
        del keys["sv"]["teach.title"]
        keys["pt"]["res.label"] = ""
        pages = {"teaching": html.fromstring('<p data-i18n="teach.title"></p>'),
                 "research": html.fromstring('<p data-i18n-html="res.label"></p>')}
        with self.assertRaises(ValueError) as raised:
            check_keys(pages, keys)
        self.assertIn("sv: teach.title (teaching.html)", str(raised.exception))
        self.assertIn("pt: res.label (research.html)", str(raised.exception))

    def test_html_placeholders_can_reorder_and_keep_original_link_text(self):
        node = html.fromstring('<p><a href="/a" rel="author"><em>First</em></a> and <a href="/b">Second</a></p>')
        translated_html(node, '<strong>Links:</strong> {a2}B & C{/a2}, {a1}{/a1}.')
        self.assertEqual(node.text_content(), "Links: B & C, First.")
        self.assertEqual(node.xpath("./a/@href"), ["/b", "/a"])
        self.assertTrue(node.xpath('./a[@rel="author"]/em[text()="First"]'))
        with self.assertRaisesRegex(ValueError, "no such link"):
            translated_html(node, "{a3}Missing{/a3}")

    def test_internal_paths(self):
        pairs = {"#publications": "#publications",
                 "https://example.org/research.html": "https://example.org/research.html",
                 "./index.html#contact": "/sv/#contact", "./research": "/sv/research.html",
                 "https://ibmartins.com/projects.html?q=1#earlier": "/sv/projects.html?q=1#earlier",
                 "./files/cv.pdf": "/files/cv.pdf", "research.llms.md": "/research.llms.md"}
        for original, expected in pairs.items():
            self.assertEqual(local_url(original, "teaching", "sv", page_link=True), expected)
        self.assertEqual(local_srcset("images/a.webp 600w, images/b.webp 960w", "teaching", "pt"),
                         "/images/a.webp 600w, /images/b.webp 960w")
        self.assertEqual(local_css('url(images/a.webp), url("fonts/b.woff2"), url(#mask)', "index", "sv"),
                         'url(/images/a.webp), url("/fonts/b.woff2"), url(#mask)')


def entry(number, venue, authors="A. Example and I. Martins"):
    return (f'<article><div class="publication-year">2022</div><div>'
            f'<h3><a href="https://doi.org/10.1234/{number}">Work {number}</a></h3>'
            f'<p>{authors}</p><p class="journal">{venue}</p></div></article>')


class PublicationsTest(unittest.TestCase):
    def test_scope_warnings_and_complete_records(self):
        venue = "<em>Journal</em> · 12(2), 20–31"
        source = ('<div><section id="publications">' + entry(1, venue) + entry(2, venue, "") +
                  '</section><section id="under-review">' + entry(3, venue) + '</section></div>')
        errors = StringIO()
        with redirect_stderr(errors):
            records = publication_graph(html.fromstring(source))["@graph"]
        self.assertEqual(len(records), 1)
        self.assertIn("10.1234/2", errors.getvalue())
        self.assertEqual(records[0]["author"], [{"@type": "Person", "name": "A. Example"},
                                                {"@id": "https://ibmartins.com/#person"}])
        self.assertEqual(records[0]["isPartOf"]["issueNumber"], "2")
        self.assertEqual(records[0]["isPartOf"]["isPartOf"]["volumeNumber"], "12")
        self.assertEqual(records[0]["pagination"], "20–31")

    def test_explicit_publication_types(self):
        venues = ['<em>University</em> · <span data-i18n="st.phd">PhD thesis</span>',
                  '<em>Institute</em> · <span data-i18n="st.report">Report</span>',
                  '<em>Book</em> · <span data-i18n="st.editedby">Edited by</span> E. Example, 11–21']
        doc = html.fromstring('<section id="publications">' +
                              "".join(entry(i, v) for i, v in enumerate(venues)) + '</section>')
        records = publication_graph(doc)["@graph"]
        self.assertEqual([r["@type"] for r in records], ["Thesis", "Report", "Chapter"])
        self.assertEqual(records[2]["isPartOf"], {"@type": "Book", "name": "Book"})


class SpeedTest(unittest.TestCase):
    @contextmanager
    def fixture(self):
        # Create beside the build so the test inherits the checkout's permissions.
        parent = SITE.parent if SITE else ROOT
        path = parent / (".guard-" + uuid4().hex[:12])
        path.mkdir()
        try:
            yield path
        finally:
            shutil.rmtree(path)

    def test_auxiliary_style_guards(self):
        both = {"icons", "highlighting"}
        cases = [('<i class="bi bi-share"></i>', {"icons"}), ('<pre class="sourceCode">x</pre>', {"highlighting"}),
                 ('<aside id="quarto-margin-sidebar"></aside>', both),
                 ('<style>i{font-family:bootstrap-icons}</style>', {"icons"}),
                 ('<script>makeIcon()</script>', set()), ('<script src="//example.org/app.js"></script>', both),
                 ('<button onclick="makeHighlight()">x</button>', set()),
                 ("""<button onclick="this.classList.add('bi')">x</button>""", {"icons"}),
                 ('<script>node.className = "sourceCode";</script>', {"highlighting"})]
        for markup, expected in cases:
            with self.subTest(markup=markup):
                doc = html.document_fromstring(markup)
                path = ROOT / "index.html"
                runtime = reviewed_runtime(doc, ROOT, path)
                self.assertEqual(set(auxiliary_reasons(doc, ROOT, path, runtime)), expected)

    def test_site_scripts_and_language_api(self):
        with self.fixture() as root:
            (root / "i18n.js").write_text("window.SiteI18n = {}; /* revised translation */")
            path = root / "index.html"
            markup = ('<script src="i18n.js"></script><script src="widget.js"></script>'
                      '<script>updateLatest(); if (window.SiteI18n) window.SiteI18n.apply();</script>')
            doc = html.document_fromstring(markup)
            for code, depends, icons in [('runChangedWidget();', False, False),
                                         ('el.className = "bi bi-share";', False, True),
                                         ('window.SiteI18n.t("home.latest");', True, False),
                                         ('window.SiteI18n.apply();', True, False)]:
                (root / "widget.js").write_text(code)
                runtime = reviewed_runtime(doc, root, path)
                self.assertFalse(runtime.problem)
                self.assertEqual(bool(runtime.language_reason()), depends)
                reasons = auxiliary_reasons(doc, root, path, runtime)
                self.assertEqual(set(reasons), {"icons"} if icons else set())

    def test_vendor_css_fingerprint_ignores_rule_order(self):
        # Quarto can write the same bslib blocks in another order between builds.
        same = vendor_fingerprint(".a{x:1}/*! note */.b{y:2}@media print{.c{z:3}}")
        self.assertEqual(same, vendor_fingerprint("@media print{.c{z:3}}.b{y:2}.a{x:1}"))
        self.assertNotEqual(same, vendor_fingerprint(".a{x:1}.b{y:3}@media print{.c{z:3}}"))

    def test_theme_and_vendor_fallbacks(self):
        # A real upgrade must still be publishable with the full assets.
        # Use a fixed reviewed fixture independently of the site's current vendor.
        vendor = ".p-2{padding:2px}.m-5{margin:5px}"
        script = b"var vendorVersion = 1;"
        name = "bootstrap-" + "a" * 32 + ".min.css"
        with self.fixture() as root:
            dest = root / "site_libs/bootstrap"
            dest.mkdir(parents=True)
            path = root / "index.html"
            theme = dest / name
            bootstrap = dest / "bootstrap.min.js"
            markup = (f'<link id="quarto-bootstrap" rel="stylesheet" href="site_libs/bootstrap/{name}">'
                      '<script src="site_libs/bootstrap/bootstrap.min.js"></script><script src="i18n.js"></script>'
                      '<script>updateLatest("p-2");</script>')
            (root / "i18n.js").write_text('var words = {title: "Revised"};')
            tail = ".reviewed-site-rule{color:green}"
            for prefix, js, expected in [(vendor, script, ""), (vendor+"a{color:blue}", script, "vendor CSS"),
                                          (vendor, script+b"/*changed*/", "vendor script"),
                                          (vendor, None, "cannot resolve script")]:
                theme.write_bytes((prefix + CUSTOM_START + tail).encode())
                if js is None:
                    bootstrap.unlink()
                else:
                    bootstrap.write_bytes(js)
                doc = html.document_fromstring(markup)
                reviewed = {"site_libs/bootstrap/bootstrap.min.js": {hashlib.sha256(script).hexdigest()}}
                with (redirect_stdout(StringIO()) as log,
                      patch("asset_guards.VENDOR_SCRIPTS", reviewed),
                      patch("optimize.VENDOR_CSS", vendor_fingerprint(vendor))):
                    choose_sheet(root, {path: doc})
                selected = root / doc.xpath('//link[@id="quarto-bootstrap"]/@href')[0]
                if expected:
                    self.assertRegex(log.getvalue(), "::warning title=Speed fallback::index.html: .*" + expected)
                    self.assertEqual(selected, theme)
                else:
                    self.assertNotIn("::warning", log.getvalue())
                    self.assertNotEqual(selected, theme)
                    result = selected.read_text(encoding="utf-8")
                    self.assertTrue(result.endswith(CUSTOM_START + tail))
                    self.assertIn(".p-2{padding:", result)
                    self.assertLess(len(result), len(prefix + CUSTOM_START + tail))

    def test_only_unneeded_utilities_are_trimmed(self):
        keep = ('.d-block,.p-2{a:b}.p-2:focus{a:b}:not(.p-2){a:b}.p-2{--x:2}'
                '@media print{.p-2{a:b}}@media(prefers-reduced-motion:reduce){.p-2{a:b}}'
                '@keyframes k{to{opacity:1}}.hg-live{a:b}')
        self.assertEqual(trim_rules('.row .p-2,.m-2{a:b}'+keep, {"d-block"}), keep)
        with self.assertRaisesRegex(ValueError, "boundary"):
            trimmed_css('@future x{.p-2{a:b}}', set())

    def test_minification_keeps_licenses_and_json_values(self):
        for notice in ("/*! Preserve me */", "/* Copyright 2025 */", "// SPDX-License-Identifier: MIT"):
            self.assertIn(notice, minify_js(notice+"\nvar x = 1;"))
        node = html.fragment_fromstring('<div><script type="application/ld+json">{"title":"\\u003c/script>"}</script></div>')[0]
        compact_script(node)
        self.assertEqual(json.loads(node.text), {"title":"</script>"})
        self.assertNotIn("</script>", node.text)

    def test_interactions_with_a_simulated_clock(self):
        subprocess.run(["node", str(ROOT/"scripts/test_interactions.cjs")], check=True,
                       env={**os.environ, "STATIC_SWITCH_JS": SWITCH_HANDLER})

    @unittest.skipUnless(SITE, "pass --site to test built output")
    def test_production_scripts_and_routes(self):
        checked = set()
        pages = sorted(SITE.rglob("*.html"))
        for path in pages:
            doc = html.document_fromstring(path.read_bytes(), parser=html.HTMLParser(encoding="utf-8"))
            scripts = doc.xpath("//script")
            if doc.xpath('//link[@id="quarto-bootstrap"]'):
                sources = [urlsplit(s.get("src", "")).path.rsplit("/",1)[-1] for s in scripts]
                self.assertEqual(sources.count("hourglass-nav.js"), 1, path)
                self.assertEqual("hourglass.js" in sources, bool(doc.xpath("//*[@data-hg-hero or @data-hg-404]")), path)
                # Future unreviewed runtimes may retain the complete language API.
                if doc.get("lang") == "en":
                    self.assertIn("i18n.js", sources)
                if path.name == "index.html":
                    self.assertEqual([e.tag for e in doc.xpath("//picture/*")], ["source", "img"])
            for el in scripts:
                kind = el.get("type", "")
                if kind not in JS_TYPES:
                    if kind in ("application/json","application/ld+json"):
                        json.loads(el.text)
                    continue
                code = el.text or ""
                if el.get("src"):
                    target = urlsplit(el.get("src"))
                    if target.netloc or target.scheme:
                        continue
                    p = (SITE if target.path.startswith("/") else path.parent) / target.path.lstrip("/")
                    code = p.read_text(encoding="utf-8")
                    if p.name in ("hourglass-nav.js","hourglass.js","i18n.js"):
                        self.assertEqual(target.query, "v="+hashlib.sha1((ROOT/p.name).read_bytes()).hexdigest()[:12])
                key = (kind, code)
                if key not in checked:
                    checked.add(key)
                    subprocess.run(["node", "--check", "--input-type="+("module" if kind=="module" else "commonjs")],
                                   input=code.encode(), check=True)
        print(f"Syntax checked {len(checked)} distinct executable scripts across {len(pages)} HTML files.")

    @unittest.skipUnless(SITE, "pass --site to test built output")
    def test_page_index_matches_the_lists(self):
        # Each index link leads to a section, and a count beside it is the number of entries there.
        def has(name):
            return f'contains(concat(" ", @class, " "), " {name} ")'
        sections = {"research": 4, "projects": 3, "teaching": 3}
        for page, expected in sections.items():
            for prefix in ("", "sv/", "pt/"):
                name = f"{prefix}{page}.html"
                doc = html.document_fromstring((SITE / name).read_bytes(), parser=html.HTMLParser(encoding="utf-8"))
                links = doc.xpath(f'//nav[{has("section-nav")}]/a')
                self.assertEqual(len(links), expected, name)
                for link in links:
                    target = doc.get_element_by_id(link.get("href").removeprefix("#"))
                    entries = len(target.xpath(".//article"))
                    for count in link.xpath(f'./span[{has("nav-count")}]'):
                        self.assertEqual(int(count.text), entries, f"{name} {link.get('href')}")
                    for stated in target.xpath(f'.//*[{has("group-meta")}]'):
                        self.assertEqual(int(stated.text_content().split()[0]), entries, f"{name} {link.get('href')}")
                switches = doc.xpath(f'//button[{has("summary-switch")}]')
                self.assertEqual(len(switches), 2 if page == "research" else 0, name)


if __name__ == "__main__":
    unittest.main()
