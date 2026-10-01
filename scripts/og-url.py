"""Give every built page an og:url tag that matches its canonical address.

Runs in GitHub Actions after `quarto render`, because Quarto writes canonical
links but no og:url. Sharing platforms (LinkedIn, Facebook, Slack) use og:url
to treat every variant of a page's address as one page.
"""
import glob
import os
import re
import sys

SITE = sys.argv[1] if len(sys.argv) > 1 else "_site"
updated = 0
for path in sorted(glob.glob(os.path.join(SITE, "*.html"))):
    with open(path, encoding="utf-8") as f:
        page = f.read()
    if 'property="og:url"' in page or os.path.basename(path) == "404.html":
        continue
    canonical = None
    for tag in re.findall(r"<link\b[^>]*>", page):
        if re.search(r'\brel="canonical"', tag):
            match = re.search(r'\bhref="([^"]+)"', tag)
            canonical = match and match.group(1)
            break
    if not canonical:
        continue
    page = page.replace("</head>", f'<meta property="og:url" content="{canonical}">\n</head>', 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(page)
    updated += 1
print(f"og:url added to {updated} pages")
