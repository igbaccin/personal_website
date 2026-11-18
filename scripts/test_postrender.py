"""Small offline regression checks for the post-render parsers."""
from contextlib import redirect_stderr
from io import StringIO
import unittest

from lxml import html

from language_pages import check_keys, dictionaries, local_css, local_srcset, local_url, translated_html
from publication_records import publication_graph


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


if __name__ == "__main__":
    unittest.main()
