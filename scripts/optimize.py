"""Optimize only reviewed assets, after all language pages have been generated."""
from hashlib import sha256
import json
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit

from lxml import html
from rjsmin import jsmin
import tinycss2

from asset_guards import CUSTOM_START, VENDOR_CSS, local_asset, reviewed_runtime, reviewed_vendor, warn
from language_pages import LANGUAGES, PAGES, serialize_document


SCRIPTS = ("i18n.js", "hourglass.js", "hourglass-nav.js", "site_libs/quarto-nav/quarto-nav.js",
           "site_libs/quarto-html/quarto.js", "site_libs/quarto-html/tabsets/tabsets.js")
JS_TYPES = {"", "module", "application/javascript", "text/javascript"}
UTILITY = re.compile(r"(?:m[trbsexy]?|p[trbsexy]?|g[xy]?|gap|row-gap|column-gap|d|align-items|align-self|"
                     r"align-content|justify-content|flex|order|offset|col|float|overflow|opacity|position|"
                     r"text|bg|border|rounded|shadow|w|h|mw|mh|fw|fs|lh|z|object-fit|translate-middle)-[\w-]+")


def write_changed(path, data):
    if not path.exists() or path.read_bytes() != data:
        path.write_bytes(data)


def unused_utilities(rule, used):
    # Only positive class chains and simple combinators. A class inside :not(),
    # :is(), an attribute value or any other unsupported construct cannot qualify.
    if any("--" in t.value for t in rule.content if t.type == "ident"):
        return False
    for selector in tinycss2.serialize(rule.prelude).split(","):
        if not re.fullmatch(r"[\s.*\w>+~-]+", selector):
            return False
        names = re.findall(r"\.([-\w]+)", selector)
        if not any(UTILITY.fullmatch(name) and name not in used for name in names):
            return False
    return True


def trim_rules(source, used):
    # Work with source slices to keep escapes, whitespace and generated values
    # byte-for-byte in every retained rule.
    lines = [0] + [m.end() for m in re.finditer("\n", source)]
    drops = []

    def walk(rules, end):
        for rule in reversed(rules):
            start = lines[rule.source_line - 1] + rule.source_column - 1
            if rule.type == "qualified-rule":
                if unused_utilities(rule, used):
                    drops.append((start, end))
            elif rule.type == "at-rule":
                if rule.lower_at_keyword == "media":
                    query = tinycss2.serialize(rule.prelude).lower()
                    if "print" not in query and "prefers-reduced-motion" not in query:
                        walk(tinycss2.parse_rule_list(rule.content), end - 1)
                elif rule.lower_at_keyword not in ("container", "keyframes", "charset"):
                    raise ValueError("unrecognized CSS at-rule")
            elif rule.type not in ("comment", "whitespace"):
                raise ValueError("unrecognized CSS syntax")
            end = start

    walk(tinycss2.parse_stylesheet(source), len(source))
    pieces, offset = [], 0
    for start, end in sorted(drops):
        pieces.append(source[offset:start])
        offset = end
    return "".join(pieces) + source[offset:]


def trimmed_css(source, used):
    vendor, boundary, custom = source.partition(CUSTOM_START)
    if not boundary or CUSTOM_START in custom:
        raise ValueError("missing or ambiguous custom CSS boundary")
    if sha256(vendor.encode()).hexdigest() != VENDOR_CSS:
        raise ValueError("Bootstrap vendor CSS differs from the reviewed Quarto build")
    return trim_rules(vendor, used) + boundary + custom


def choose_sheet(site, documents):
    directory = site / "site_libs/bootstrap"
    pages = {path: doc.xpath('//link[@id="quarto-bootstrap"]') for path, doc in documents.items()}
    pages = {path: links for path, links in pages.items() if links}
    originals = [p for p in directory.glob("bootstrap-*.min.css")
                 if re.fullmatch(r"bootstrap-[0-9a-f]{32}\.min\.css", p.name)]
    if len(originals) != 1:
        for path in pages:
            warn(path.relative_to(site).as_posix(), "keeping rendered Bootstrap link: unrecognized theme layout")
        return
    original = originals[0]
    used = set("collapse collapsing collapsed show active headroom--pinned headroom--unpinned "
               "i18n-pending latest-carousel is-current is-leaving has-research-nav hg-live".split())
    for script in site.rglob("*.js"):
        used.update(re.findall(r"[-\w]+", jsmin(script.read_text(encoding="utf-8"))))
    problems = {}
    for path, doc in documents.items():
        runtime = reviewed_runtime(doc, site, path)
        if runtime.problem:
            problems[path] = runtime.problem
        # Include data attributes (e.g. a Bootstrap custom class), templates
        # and ordinary class attributes before considering a utility absent.
        for value in doc.xpath("//@*"):
            used.update(re.findall(r"[-\w]+", value))
        for _, code in runtime.scripts:
            used.update(re.findall(r"[-\w]+", jsmin(code)))

    source = original.read_text(encoding="utf-8")
    css_problem = ""
    try:
        trimmed = trimmed_css(source, used)
    except ValueError as error:
        css_problem = str(error)
        trimmed = source
    selected = original
    if trimmed != source and any(path not in problems for path in pages):
        data = trimmed.encode()
        selected = directory / f"bootstrap-utilities-{sha256(data).hexdigest()[:32]}.min.css"
        write_changed(selected, data)
    for path, links in pages.items():
        reason = css_problem or problems.get(path)
        target = original if reason else selected
        if reason:
            warn(path.relative_to(site).as_posix(), f"keeping full Bootstrap stylesheet because {reason}")
        for link in links:
            href = link.get("href")
            name = urlsplit(href).path.rsplit("/", 1)[-1]
            if name == original.name or re.fullmatch(r"bootstrap-utilities-[0-9a-f]{32}\.min\.css", name):
                asset = local_asset(site, path, href)
                if asset is not None and asset.parent == directory.resolve():
                    link.set("href", href.replace(name, target.name))
                    continue
            warn(path.relative_to(site).as_posix(), f"keeping unrecognized Bootstrap link {href}")
    print(f"Bootstrap: {selected.name} ({selected.stat().st_size} bytes).")


def compact_script(script, page="inline script"):
    kind = script.get("type", "").strip().lower()
    source = script.text
    if not source or script.get("src"):
        return
    if kind in ("application/ld+json", "application/json"):
        script.text = json.dumps(json.loads(source), ensure_ascii=False, separators=(",", ":")).replace("<", r"\u003c")
    elif kind in JS_TYPES:
        small = minify_js(source, page)
        # Never introduce a raw HTML end tag by removing whitespace in JS.
        if not re.search(r"</script\b|<!--", small, re.I):
            script.text = small
        elif small != source:
            warn(page, "keeping inline JavaScript unchanged to preserve HTML parsing")


def minify_js(source, page=None):
    # rjsmin preserves /*! notices. Retain the original when other notice
    # forms are present, rather than stripping or rewriting a licence.
    if re.search(r"/\*(?!\!)(?:(?!\*/).)*(?:licen[cs]e|@preserve|copyright|SPDX-)|//[^\n]*(?:licen[cs]e|@preserve|copyright|SPDX-)",
                 source, re.I | re.S):
        if page is not None:
            warn(page, "keeping JavaScript unchanged to preserve a licence notice")
        return source
    return jsmin(source, keep_bang_comments=True)


def optimize(site):
    documents = {p: html.document_fromstring(p.read_bytes(), parser=html.HTMLParser(encoding="utf-8"))
                 for p in sorted(site.rglob("*.html"))}
    required = {site / ("" if lang == "en" else lang) / f"{page}.html" for page in PAGES for lang in LANGUAGES}
    if not (required | {site / "404.html"}).issubset(documents):
        raise ValueError("Missing final pages. Run language_pages.py before optimize.py.")
    before = {path: serialize_document(doc) for path, doc in documents.items()}
    choose_sheet(site, documents)
    referencing_pages = {}
    for path, doc in documents.items():
        has_glass = bool(doc.xpath("//*[@data-hg-hero or @data-hg-404]"))
        for script in doc.xpath("//script"):
            if (not has_glass and script.get("src") and
                    local_asset(site, path, script.get("src")) == (site / "hourglass.js").resolve()):
                script.drop_tree()
            else:
                page = path.relative_to(site).as_posix()
                if script.get("src"):
                    asset = local_asset(site, path, script.get("src"))
                    referencing_pages.setdefault(asset, []).append(page)
                compact_script(script, page)
        data = serialize_document(doc)
        if data != before[path]:
            write_changed(path, data)
    for name in SCRIPTS:
        path = site / name
        if path.is_file():
            pages = ", ".join(referencing_pages.get(path.resolve(), []))
            source = path.read_text(encoding="utf-8")
            if name.startswith("site_libs/") and not reviewed_vendor(name, source):
                warn(pages or name, f"keeping unreviewed vendor script {name} unchanged")
                continue
            write_changed(path, minify_js(source, f"{pages} ({name})").encode())


if __name__ == "__main__":
    optimize(Path(sys.argv[1] if len(sys.argv) > 1 else "_site"))
