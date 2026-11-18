"""Read the English publication entries. The linked paper, not its data, owns the DOI."""
import re
import sys
from urllib.parse import unquote, urlsplit


def text(node):
    return " ".join(node.text_content().split())


def one(nodes, label):
    if len(nodes) != 1:
        raise ValueError(f"expected one {label}, found {len(nodes)}")
    return nodes[0]


def doi_links(node):
    return [a for a in node.xpath(".//a[@href]")
            if urlsplit(a.get("href")).hostname in {"doi.org", "dx.doi.org"}]


def parse_authors(byline):
    names = re.split(r",\s*(?:and\s+)?|\s+and\s+", byline)
    authors = []
    for name in names:
        if not re.fullmatch(r"[^\W\d_][\w .’'\-]*", name) or name.lower() == "et al.":
            raise ValueError(f"unrecognized byline {byline!r}")
        if name in {"I. Martins", "Igor B. Martins"}:
            authors.append({"@id": "https://ibmartins.com/#person"})
        else:
            authors.append({"@type": "Person", "name": name})
    return authors


def parse_entry(entry, links):
    heading = one(entry.xpath(".//h3"), "title")
    title = text(heading)
    # Prefer the title link when a work also links to a replication package.
    work_links = [a for a in links if not a.xpath('descendant-or-self::*[@data-i18n="st.replication" or @data-i18n="st.preprint"]')]
    doi_link = one(doi_links(heading) or work_links, "work DOI link")
    address = urlsplit(doi_link.get("href"))
    doi = unquote(address.path.lstrip("/"))
    if not re.fullmatch(r"10\.\d{4,9}/\S+", doi, re.I):
        raise ValueError(f"invalid DOI {doi!r}")
    year = text(one(entry.xpath('.//*[@class="publication-year"]'), "year"))
    byline = one(heading.xpath("following-sibling::*[1][self::p and not(@class)]"), "author line")
    journal = one(byline.xpath('following-sibling::*[1][self::p and @class="journal"]'), "venue line")
    venue = text(one(journal.xpath("./em"), "venue name"))
    if not title or not venue:
        raise ValueError("empty title or venue")
    if not re.fullmatch(r"\d{4}", year):
        raise ValueError(f"expected a four-digit publication year, found {year!r}")

    url = "https://doi.org/" + address.path.lstrip("/")
    line = text(journal)
    if not line.startswith(venue):
        raise ValueError(f"unrecognized venue line {line!r}")
    details = line[len(venue):].strip().removeprefix("·").strip()
    record = {
        "@type": "ScholarlyArticle", "@id": url, "identifier": doi, "url": url,
        "name": title, "headline": title, "author": parse_authors(text(byline)), "datePublished": year,
        "http://purl.org/dc/terms/bibliographicCitation": line,
    }
    markers = journal.xpath(".//@data-i18n")
    if "st.phd" in markers or "st.report" in markers:
        record["@type"] = "Thesis" if "st.phd" in markers else "Report"
        record["publisher"] = {"@type": "Organization", "name": venue}
        return record
    pages = r"(\d+\s*[-–]\s*\d+)"
    if "st.editedby" in markers:
        record["@type"] = "Chapter"
        record["isPartOf"] = {"@type": "Book", "name": venue}
        span = re.search(pages + r"$", details)
        if span:
            record["pagination"] = span[1]
        return record

    parent = {"@type": "Periodical", "name": venue}
    volume_issue = re.fullmatch(r"(\d+)\(([^()]+)\)(?:,\s*" + pages + r")?", details)
    numbered = re.fullmatch(r"(\d+),\s*" + pages, details)
    if volume_issue:
        volume = {"@type": "PublicationVolume", "volumeNumber": volume_issue[1], "isPartOf": parent}
        parent = {"@type": "PublicationIssue", "issueNumber": volume_issue[2], "isPartOf": volume}
        if volume_issue[3]:
            record["pagination"] = volume_issue[3]
    elif numbered:
        # The unlabelled number could be an issue or a volume. Preserve it verbatim above.
        record["pagination"] = numbered[2]
    elif re.fullmatch(pages, details):
        record["pagination"] = details
    elif details and not details.isdecimal():
        raise ValueError(f"unrecognized publication details {details!r}")
    record["isPartOf"] = parent
    return record


def publication_graph(document):
    sections = document.xpath('//*[@id="publications"]')
    if len(sections) != 1:
        print("Warning: expected one Publications section; skipping publication records", file=sys.stderr)
        return {"@context": "https://schema.org", "@graph": []}
    section = sections[0]
    records = []
    claimed = set()
    for entry in section.xpath(".//article"):
        links = doi_links(entry)
        if not links:
            continue
        try:
            record = parse_entry(entry, links)
            if record["@id"].lower() in claimed:
                raise ValueError("duplicate work DOI")
        except ValueError as error:
            print(f"Warning: skipping publication ({links[0].get('href')}): {error}", file=sys.stderr)
            continue
        records.append(record)
        claimed.add(record["@id"].lower())
    for link in doi_links(section):
        if not link.xpath("ancestor::article"):
            print(f"Warning: skipping DOI outside a publication entry: {link.get('href')}", file=sys.stderr)
    return {"@context": "https://schema.org", "@graph": records}
