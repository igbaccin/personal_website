"""Put the newest Substack post into the built home page's anti-plug.

Runs in GitHub Actions after `quarto render`. If the feed cannot be read,
the page keeps the title it was built with, so the build never fails here.
"""
import html
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET

FEED = "https://ibmartins.substack.com/feed"
PAGE = sys.argv[1] if len(sys.argv) > 1 else "_site/index.html"

try:
    request = urllib.request.Request(FEED, headers={"User-Agent": "ibmartins.com site build"})
    item = ET.fromstring(urllib.request.urlopen(request, timeout=30).read()).find("channel/item")
    title, link = item.findtext("title").strip(), item.findtext("link").strip()
except Exception as error:
    print(f"Latest post not updated: {error}")
    sys.exit(0)

with open(PAGE, encoding="utf-8") as f:
    page = f.read()
def replace(match):
    attributes = re.sub(r'\bhref="[^"]*"', f'href="{html.escape(link, quote=True)}"', match.group(1))
    return f"<a{attributes}>{html.escape(title)}</a>"


page, count = re.subn(r"<a([^>]*\bdata-latest-post\b[^>]*)>[^<]*</a>", replace, page)
with open(PAGE, "w", encoding="utf-8") as f:
    f.write(page)
print(f"Latest post: {title} <{link}> ({count} link updated)")
