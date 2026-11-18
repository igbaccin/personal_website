"""Finalize home links, sharing metadata and the sitemap after Quarto renders."""
from pathlib import Path
import re
import sys
from xml.etree import ElementTree as ET

site = Path(sys.argv[1] if len(sys.argv) > 1 else "_site")
home = "https://ibmartins.com/"
content_pages = {"index.html", "research.html", "projects.html", "teaching.html"}

for path in sorted(site.glob("*.html")):
    original = path.read_text(encoding="utf-8")
    page = re.sub(r'(<a\b[^>]*?\shref=")(?:\./|/)?index\.html"', r'\g<1>/"', original)
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
