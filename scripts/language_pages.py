"""Publish static language counterparts and research records after og-url.py."""
from copy import deepcopy
import json
from pathlib import Path
import re
import sys
from urllib.parse import urljoin, urlsplit, urlunsplit
from xml.etree import ElementTree as ET

from lxml import etree, html

from publication_records import one, publication_graph
from asset_guards import reviewed_runtime, warn


ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://ibmartins.com"
PAGES = ("index", "research", "projects", "teaching")
LANGUAGES = ("en", "sv", "pt")
NS = "http://www.sitemaps.org/schemas/sitemap/0.9"
SWITCH_HANDLER = """document.addEventListener("DOMContentLoaded", function () {
  var group = document.querySelector(".hs-lang-group");
  if (group) group.addEventListener("click", function (event) {
    var link = event.target.closest("a[hreflang]");
    if (link) {
      try { localStorage.setItem("site-lang", link.hreflang); } catch (_) {}
    }
  });
});"""


def page_path(page, lang):
    prefix = "/" if lang == "en" else f"/{lang}/"
    return prefix if page == "index" else f"{prefix}{page}.html"


def page_name(path):
    if path in ("/", "/index", "/index.html"):
        return "index"
    name = path.removeprefix("/").removesuffix(".html")
    return name if name in PAGES else None


def dictionaries():
    script = (ROOT / "i18n.js").read_text(encoding="utf-8")
    marker = re.search(r"^\s*var\s+D\s*=\s*", script, re.M)
    if not marker:
        raise ValueError("Cannot find the translation dictionary (var D) in i18n.js")
    data, _ = json.JSONDecoder().raw_decode(script[marker.end():])
    return data


def navigation(document):
    lists = document.xpath('//*[@id="quarto-header"]//ul[contains(concat(" ", @class, " "), " navbar-nav ")]')
    if not lists:
        raise ValueError("Missing Quarto navigation")
    return lists[-1]


def annotate_nav(document):
    for label in navigation(document).xpath('.//a[@href]/span[@class="menu-text"]'):
        target = urlsplit(urljoin(ORIGIN + "/", label.getparent().get("href")))
        page = page_name(target.path) if target.netloc == urlsplit(ORIGIN).netloc else None
        if page:
            label.set("data-i18n", "nav." + ("home" if page == "index" else page))


def check_keys(pages, translations):
    missing = []
    for page, document in pages.items():
        keys = set(document.xpath("//@data-i18n | //@data-i18n-html"))
        keys.update(("lang.label", f"meta.{page}.title", f"meta.{page}.description"))
        for lang in LANGUAGES[1:]:
            for key in sorted(keys):
                value = translations.get(lang, {}).get(key)
                if not isinstance(value, str) or not value.strip():
                    missing.append(f"  {lang}: {key} ({page}.html)")
    if missing:
        raise ValueError("Missing translations in i18n.js:\n" + "\n".join(missing))


def set_text(node, value):
    for child in list(node):
        node.remove(child)
    node.text = value


def translated_html(node, value):
    anchors = node.xpath(".//a")

    def link(match):
        n = int(match[1])
        if not 1 <= n <= len(anchors):
            raise ValueError(f"{node.get('data-i18n-html')}: no such link {{a{n}}}")
        anchor = deepcopy(anchors[n - 1])
        if match[2]:
            set_text(anchor, match[2])
        return html.tostring(anchor, encoding="unicode", with_tail=False)

    markup = re.sub(r"\{a(\d+)\}(.*?)\{/a\1\}", link, value, flags=re.S)
    if re.search(r"\{/?a\d+\}", markup):
        raise ValueError(f"Unpaired link placeholder in {node.get('data-i18n-html')}")
    fragment = html.fragment_fromstring(markup, create_parent="div")
    set_text(node, fragment.text)
    node.extend(fragment)


def local_url(value, page, lang, page_link=False):
    if not value or value.startswith("#"):
        return value
    url = urlsplit(urljoin(ORIGIN + page_path(page, "en"), value))
    if url.scheme not in ("http", "https") or url.netloc != urlsplit(ORIGIN).netloc:
        return value
    target = page_name(url.path) if page_link else None
    path = page_path(target, lang) if target else url.path
    return urlunsplit(("", "", path, url.query, url.fragment))


def local_srcset(value, page, lang):
    # A URL token may contain commas (e.g. a data URL). Only a trailing comma
    # or the comma following width/density descriptors separates candidates.
    candidates = []
    rest = value.strip()
    while rest:
        match = re.match(r"(\S+)(.*)", rest, re.S)
        token, rest = match.groups()
        descriptor = ""
        if token.endswith(","):
            token = token.rstrip(",")
        else:
            descriptor, _, rest = rest.partition(",")
        candidates.append((local_url(token, page, lang) + " " + descriptor.strip()).rstrip())
        rest = rest.lstrip(" ,\t\n\r")
    return ", ".join(candidates)


def local_css(value, page, lang):
    def rewrite(match):
        url = match["quoted"] if match["quote"] else match["plain"]
        rooted = local_url(url, page, lang)
        if url == rooted:
            return match[0]
        quote = match["quote"] or ""
        return f"url({quote}{rooted}{quote})"

    return re.sub(r"""\burl\(\s*(?:(?P<quote>["'])(?P<quoted>.*?)(?P=quote)|(?P<plain>[^()"'\s]+))\s*\)""",
                  rewrite, value, flags=re.I | re.S)


def translate(document, page, lang, words):
    document.set("lang", lang)
    document.set("xml:lang", lang)
    document.set("data-lang", lang)
    for node in document.xpath("//*[@data-i18n]"):
        set_text(node, words[node.get("data-i18n")])
    for node in document.xpath("//*[@data-i18n-html]"):
        translated_html(node, words[node.get("data-i18n-html")])
    for node in document.xpath("//*[@data-hs-greeting]"):
        node.set("hidden", "hidden")
    for node in document.xpath("//*[@href or @src or @srcset or @poster]"):
        for attr in ("href", "src", "poster"):
            if attr in node.attrib:
                if node.tag == "link" and (node.get("rel") == "canonical" or node.get("hreflang")):
                    continue
                node.set(attr, local_url(node.get(attr), page, lang, node.tag == "a" and attr == "href"))
        if "srcset" in node.attrib:
            node.set("srcset", local_srcset(node.get("srcset"), page, lang))
    for node in document.xpath("//*[@style]"):
        node.set("style", local_css(node.get("style"), page, lang))
    for node in document.xpath("//style"):
        node.text = local_css(node.text or "", page, lang)

    title = words[f"meta.{page}.title"]
    description = words[f"meta.{page}.description"]
    head = document.head
    site_name = one(head.xpath('meta[@property="og:site_name"]/@content'), "site name")
    head.find("title").text = title if page == "index" else f"{title} – {site_name}"
    canonical = ORIGIN + page_path(page, lang)
    one(head.xpath('link[@rel="canonical"]'), "canonical").set("href", canonical)
    for field, value in (("description", description), ("twitter:description", description),
                         ("og:description", description), ("twitter:title", title),
                         ("og:title", title), ("og:url", canonical)):
        tag = one(head.xpath("meta[@name=$key or @property=$key]", key=field), field)
        tag.set("content", value)


def language_links(document, page, lang, label):
    item = etree.SubElement(navigation(document), "li", {"id": "site-language-switcher", "class": "nav-item hs-lang"})
    group = etree.SubElement(item, "div", {"class": "hs-lang-group", "role": "group", "aria-label": label})
    for other in LANGUAGES:
        path = page_path(page, other)
        if other != "en":
            etree.SubElement(group, "span", {"aria-hidden": "true"}).text = "·"
        link = etree.SubElement(group, "a", lang=other, hreflang=other, href=path)
        link.text = other.upper()
        if other == lang:
            link.set("aria-current", "true")
        etree.SubElement(document.head, "link", rel="alternate", hreflang=other, href=ORIGIN + path)
    etree.SubElement(document.head, "link", rel="alternate", hreflang="x-default", href=ORIGIN + page_path(page, "en"))


def serialize_document(document):
    # libxml's HTML4 serializer writes an end tag for the HTML5 void source.
    # Self-closing syntax also keeps a second libxml parse from nesting the img.
    data = html.tostring(document, encoding="utf-8", doctype="<!DOCTYPE html>")
    return re.sub(rb"(<source\b[^<>]*?)></source>", rb"\1 />", data)


def sitemap(site):
    ET.register_namespace("", NS)
    tree = ET.parse(site / "sitemap.xml")
    urls = {el.text for el in tree.findall(f"{{{NS}}}url/{{{NS}}}loc")}
    for lang in LANGUAGES[1:]:
        for page in PAGES:
            url = ORIGIN + page_path(page, lang)
            if url not in urls:
                entry = ET.SubElement(tree.getroot(), f"{{{NS}}}url")
                ET.SubElement(entry, f"{{{NS}}}loc").text = url
    ET.indent(tree, space="  ")
    return ET.tostring(tree.getroot(), encoding="utf-8", xml_declaration=True)


def publish(site):
    translations = dictionaries()
    pages = {}
    for page in PAGES:
        document = html.document_fromstring((site / f"{page}.html").read_bytes(), parser=html.HTMLParser(encoding="utf-8"))
        for source in document.xpath("//picture/source[*]"):
            for child in reversed(list(source)):
                source.addnext(child)
        # Remove just the outputs owned by this step before building from English again.
        for old in document.xpath('//head/link[@rel="alternate"][@hreflang="en" or @hreflang="sv" or @hreflang="pt" or @hreflang="x-default"]'
                                  ' | //script[@id="publication-records"] | //*[@id="site-language-switcher"]'):
            old.getparent().remove(old)
        annotate_nav(document)
        pages[page] = document
    check_keys(pages, translations)
    graph = publication_graph(pages["research"])
    block = etree.SubElement(pages["research"].head, "script", type="application/ld+json", id="publication-records")
    block.text = json.dumps(graph, ensure_ascii=False, indent=2).replace("<", r"\u003c")
    outputs = {}
    for page, english in pages.items():
        for lang in LANGUAGES:
            document = deepcopy(english)
            output = site / ("" if lang == "en" else lang) / f"{page}.html"
            if lang != "en":
                translate(document, page, lang, translations[lang])
                reason = reviewed_runtime(document, site, output).language_reason()
                if reason:
                    warn(output.relative_to(site).as_posix(), f"keeping full i18n.js because {reason}")
                else:
                    for script in document.xpath("//script[@src]"):
                        if urlsplit(script.get("src")).path == "/i18n.js":
                            del script.attrib["src"]
                            script.text = SWITCH_HANDLER
            label = "Language" if lang == "en" else translations[lang]["lang.label"]
            language_links(document, page, lang, label)
            outputs[output] = serialize_document(document)
    outputs[site / "sitemap.xml"] = sitemap(site)
    for path, data in outputs.items():
        if not path.exists() or path.read_bytes() != data:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
    print(f"Published {len(graph['@graph'])} publication records on 3 research pages and 8 translated pages.")


if __name__ == "__main__":
    try:
        publish(Path(sys.argv[1] if len(sys.argv) > 1 else "_site"))
    except ValueError as error:
        sys.exit(str(error))
