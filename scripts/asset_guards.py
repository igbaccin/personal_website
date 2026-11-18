"""Decide which optional assets a rendered page can omit."""
from dataclasses import dataclass
from hashlib import sha256
import re
from urllib.parse import unquote, urlsplit

import tinycss2

# The original and production-minified copies of the reviewed Quarto 1.10.18 scripts.
VENDOR_SCRIPTS = {
    "site_libs/bootstrap/bootstrap.min.js": {
        "d2ea6c1e0cabca20d18e924b25a1cd0187c38ba7c33f60ab06e1b0402b9bcdb5"},
    "site_libs/quarto-nav/quarto-nav.js": {
        "a209dafb198d7c8e77cb398912b7225806e7b998211afa1fb269a4ef54ff56f6",
        "a947950cdddd5829474995179c22e2ead90679183cedb9fbbdb1b7d9090a9544"},
    "site_libs/quarto-html/quarto.js": {
        "4ecb60f215d96b2af0fe9d985c71e32863b1c993a64725a416ac18b5991c59c6",
        "a3ddd64df3a5922039c3d60fde98b1d2b33fa5d7e4e71b2284e11f0470deaeae"},
    "site_libs/quarto-html/tabsets/tabsets.js": {
        "a9c226bf70e82eaf5476f619cecfb70b4446b87ce4d1634d6404b0b2ba006d15",
        "88558602d6bc1066def016e996dc6deda351a9cf388a19484bd6eddb0329b539"},
}
CUSTOM_START = "/*! ibmartins custom rules */"
VENDOR_CSS = "ab5d56a94c7c244d89af83cd7c8a7f34ccd802e8d9df9e7f95061aec0faa68b8"
GUARDED_APPLY = re.compile(r"\bif\s*\(\s*window\.SiteI18n\s*\)\s*window\.SiteI18n\.apply\(\);")
ICON = re.compile(r"""(?<![\w-])(?:bi-[\w-]+|bootstrap-icons)(?![\w-])|(?<=\.)bi(?![\w-])|(?<=["'`\s=])bi(?=["'`\s>])""")
HIGHLIGHT = re.compile(r"(?<![\w-])(?:sourceCode|numberSource|sourceLine|code-with-filename|highlight|language-[\w-]+)(?![\w-])|--quarto-hl-")
STATIC_IMPORT = re.compile(r"""(?:\bfrom\s*|\bimport\s*)["']([^"']+)["']""")
DYNAMIC_IMPORT = re.compile(r"""\bimport\s*\(\s*(?:["']([^"']+)["']\s*(?=[,)])|)""")
AUXILIARY = ("icons", "highlighting")


def local_asset(site, page, url):
    parts = urlsplit(url)
    if parts.netloc or parts.scheme or not parts.path:
        return None
    path = unquote(parts.path)
    target = ((site if path.startswith("/") else page.parent) / path.lstrip("/")).resolve()
    return target if target.is_relative_to(site.resolve()) and target.is_file() else None


def warn(page, reason):
    message = f"{page}: {reason}".replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
    print(f"::warning title=Speed fallback::{message}")


def vendor_fingerprint(css):
    """Hash the set of top-level rules. Quarto 1.10.18 sometimes writes the same
    bslib blocks in a different order from one build to the next."""
    rules = sorted(tinycss2.serialize([rule]) for rule in tinycss2.parse_stylesheet(css)
                   if rule.type not in ("whitespace", "comment"))
    return sha256("\n".join(rules).encode()).hexdigest()


def reviewed_vendor(name, source):
    return sha256(source.encode()).hexdigest() in VENDOR_SCRIPTS.get(name, ())


@dataclass
class Runtime:
    scripts: list[tuple[str, str]]
    problem: str = ""

    def language_reason(self):
        if self.problem:
            return self.problem
        for origin, code in self.scripts:
            if origin != "i18n.js" and re.search(r"\bSiteI18n\b", GUARDED_APPLY.sub("", code)):
                return f"{origin} uses SiteI18n outside the guarded apply call"
        return ""


def reviewed_runtime(document, site, page):
    runtime = Runtime([])
    seen = set()

    def inspect(code, origin, owner, module):
        runtime.scripts.append((origin, code))
        imports = STATIC_IMPORT.findall(code) if module else []
        imports.extend(DYNAMIC_IMPORT.findall(code))
        for url in imports:
            if url.startswith((".", "/")):
                load(owner, url, True)
            else:
                # A variable path or a bare specifier needs browser state.
                runtime.problem = f"cannot resolve module {url or '(dynamic path)'} locally (imported by {origin})"

    def load(owner, url, module):
        asset = local_asset(site, owner, url)
        if asset is None:
            runtime.problem = f"cannot resolve script {url} locally"
            return
        if (asset, module) in seen:
            return
        seen.add((asset, module))
        name = asset.relative_to(site.resolve()).as_posix()
        code = asset.read_text(encoding="utf-8")
        if name.startswith("site_libs/") and not reviewed_vendor(name, code):
            runtime.problem = f"unreviewed vendor script {name}"
        inspect(code, name, asset, module)

    for el in document.iter("*"):
        for key, value in el.attrib.items():
            if key.lower().startswith("on"):
                inspect(value, f"inline {key}", page, False)
        if el.tag != "script" or el.get("type", "").lower() in ("application/json", "application/ld+json"):
            continue
        module = el.get("type", "").lower() == "module"
        if "src" in el.attrib:
            load(page, el.get("src"), module)
        else:
            inspect(el.text or "", "inline script", page, module)
    return runtime


def auxiliary_reasons(document, site, page, runtime):
    if runtime.problem:
        return dict.fromkeys(AUXILIARY, runtime.problem)
    reasons = {}
    for el in document.iter("*"):
        tokens = el.get("class", "").split()
        if (el.get("id") in ("TOC", "quarto-sidebar", "quarto-margin-sidebar", "quarto-sidebar-toc-left")
                or el.get("data-bs-toggle") not in (None, "collapse")
                or any(c in ("sidebar", "quarto-sidebar") or c.startswith("sidebar-") for c in tokens)):
            return dict.fromkeys(AUXILIARY, "sidebar, table of contents or Bootstrap widget in markup")
        if any(c == "bi" or c.startswith("bi-") for c in tokens):
            reasons["icons"] = "icon class in markup"
        if el.tag in ("code", "pre") or any(HIGHLIGHT.fullmatch(c) for c in tokens):
            reasons["highlighting"] = "code or highlighting class in markup"
        style = (el.text or "") if el.tag == "style" else el.get("style", "")
        if "bootstrap-icons" in style:
            reasons["icons"] = "icon font in inline CSS"
        if "--quarto-hl-" in style:
            reasons["highlighting"] = "syntax color in inline CSS"

    for origin, code in runtime.scripts:
        # Reviewed vendor code adds icons or highlighting only for the sidebars,
        # widgets and code blocks the markup checks above already catch.
        if origin.startswith("site_libs/"):
            continue
        for kind, pattern in (("icons", ICON), ("highlighting", HIGHLIGHT)):
            match = pattern.search(code)
            if match:
                reasons.setdefault(kind, f"{origin} mentions {match.group()}")

    for href in document.xpath('//link[@rel="stylesheet"]/@href'):
        asset = local_asset(site, page, href)
        if asset is None:
            return dict.fromkeys(AUXILIARY, f"cannot resolve stylesheet {href} locally")
        if asset.name == "bootstrap-icons.css" or asset.name.startswith("quarto-syntax-highlighting"):
            continue
        css = asset.read_text(encoding="utf-8")
        if asset.parent == (site / "site_libs/bootstrap").resolve():
            vendor, boundary, custom = css.partition(CUSTOM_START)
            # Our hashed derivative has the same vetted selectors, minus unused utilities.
            derivative = f"bootstrap-utilities-{sha256(css.encode()).hexdigest()[:32]}.min.css"
            if boundary and (asset.name == derivative or vendor_fingerprint(vendor) == VENDOR_CSS):
                css = custom
        if "@import" in css:
            return dict.fromkeys(AUXILIARY, f"CSS import in {href}")
        if "bootstrap-icons" in css:
            reasons["icons"] = f"icon font in {href}"
        if "--quarto-hl-" in css:
            reasons["highlighting"] = f"syntax color in {href}"
    return reasons
