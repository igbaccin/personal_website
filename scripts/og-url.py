"""Finalize home links, the skip link, sharing metadata and the sitemap after Quarto renders."""
from pathlib import Path
import re
import sys
from xml.etree import ElementTree as ET

site = Path(sys.argv[1] if len(sys.argv) > 1 else "_site")
home = "https://ibmartins.com/"
content_pages = {"index.html", "research.html", "projects.html", "teaching.html"}
SKIP = re.compile(r'\s*<a class="skip-link"[^>]*>.*?</a>', re.S)
SKIP_LINK = '<a class="skip-link" href="#quarto-document-content" data-i18n="skip">Skip to main content</a>'


def skip_link_first(page):
    """Quarto places the skip link inside the page body; move it to the first place a keyboard reaches."""
    if not SKIP.search(page):
        return page
    page = SKIP.sub("", page)
    return re.sub(r"(<body\b[^>]*>)", lambda m: m.group(1) + "\n" + SKIP_LINK, page, count=1)


TOOLTIP_FILES = re.compile(r'\s*<(?:script src|link href)="[^"]*site_libs/quarto-html/(?:popper\.min\.js|tippy\.umd\.min\.js|tippy\.css)"[^>]*>(?:</script>)?')


def drop_unused_tooltips(page):
    """Quarto always ships its tooltip library; with every hover feature off, nothing on the page calls it."""
    if page.count("tippyHover(") > 1:
        return page
    return TOOLTIP_FILES.sub("", page)


for path in sorted(site.glob("*.html")):
    original = path.read_text(encoding="utf-8")
    page = re.sub(r'(<a\b[^>]*?\shref=")(?:\./|/)?index\.html"', r'\g<1>/"', original)
    page = skip_link_first(page)
    page = drop_unused_tooltips(page)
    tags = []
    if path.name in content_pages and 'property="og:type"' not in page:
        tags.append('<meta property="og:type" content="website">')
    if path.name != "404.html" and 'property="og:url"' not in page:
        for tag in re.findall(r"<link\b[^>]*>", page):
            if 'rel="canonical"' in tag:
                href = re.search(r'\shref="([^"]+)"', tag)
                if href:
                    tags.append(f'<meta property="og:url" content="{href[1]}">')
                break
    if tags:
        page = page.replace("</head>", "\n".join(tags) + "\n</head>", 1)
    if page != original:
        path.write_text(page, encoding="utf-8")

path = site / "sitemap.xml"
ns = "http://www.sitemaps.org/schemas/sitemap/0.9"
ET.register_namespace("", ns)
tree = ET.parse(path)
changed = False
for entry in tree.findall(f"{{{ns}}}url"):
    loc = entry.find(f"{{{ns}}}loc")
    if loc is not None and loc.text == home + "index.html":
        loc.text = home
        changed = True
    for stamp in entry.findall(f"{{{ns}}}lastmod"):
        entry.remove(stamp)
        changed = True
if changed:
    tree.write(path, encoding="utf-8", xml_declaration=True)
