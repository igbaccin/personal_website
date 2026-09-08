# Igor B. Martins

A minimal academic website built with Quarto and hosted on GitHub Pages.

**Live site:** https://igbaccin.github.io/personal_website/

Software and hosting use free services. Domain registration for `ibmartins.com` remains separate. No paid theme, font subscription, analytics service, database, or application server is required.

## Updating the site

Edit the relevant `.qmd` file in GitHub and commit the change to `main`. The **Build and publish website** workflow renders the site and updates the `gh-pages` branch. GitHub Pages then publishes it. Progress appears in the repository's Actions tab.

| File | What to edit |
| --- | --- |
| `index.qmd` | Landing-page introduction, research and CV buttons, social profiles, and email |
| `research.qmd` | Publications, manuscripts, work in progress, essays, and media |
| `teaching.qmd` | Courses, teaching periods, supervision, and award |
| `about.qmd` | Biography, professional links, and contact details |
| `_quarto.yml` | Navigation, footer, CV link, and website address |
| `styles.scss` | Typography, layout, spacing, and dark monochrome palette |
| `site.css` | Background imagery and its dark overlays |

The page content uses ordinary HTML inside Quarto documents. Text between tags can be edited directly. To add a publication, copy an existing `<article class="publication">…</article>` block in `research.qmd`, then update its title, year, authors, journal, and link. Update the count in the relevant section's summary if adding a manuscript, project, or essay. Use `&amp;` for an ampersand inside HTML text.

The homepage is a concise landing page. The complete publication list lives on the separate Research page, and Substack is linked directly from the landing page.

The CV links to the existing public Google Drive document. Replace that URL in `index.qmd`, `about.qmd`, and `_quarto.yml` if the document address changes.

## Local preview

Install [Quarto](https://quarto.org/docs/get-started/) and open a terminal in this folder:

```sh
quarto preview
```

To generate the complete static site:

```sh
quarto render
```

The generated files are written to `_site/`, which is excluded from the source repository. The publishing workflow uses Quarto 1.10.18 for reproducible builds. No R, Python, Node.js, or package installation is needed for this site's content.

## Free hosting configuration

The repository is public. In **Settings → Pages**, the source is **Deploy from a branch**, using the `gh-pages` branch and its root folder. The existing workflow publishes to that branch. Standard hosted Actions runners are free for public repositories; this workflow uses `ubuntu-latest`.

## Connecting ibmartins.com when ready

The current Google Site and domain records are unchanged by this repository. The new site can be reviewed at its GitHub Pages address first.

When ready to move the domain:

1. Verify `ibmartins.com` in the GitHub account's Pages settings using GitHub's DNS TXT challenge.
2. Add `www.ibmartins.com` as this repository's custom domain under **Settings → Pages**.
3. Add `cname: www.ibmartins.com` under the deployment action's `with:` settings in `.github/workflows/render.yml` so future publications preserve the domain.
4. Change `site-url` in `_quarto.yml` to `https://www.ibmartins.com/`.
5. At the domain registrar, point the `www` CNAME record to `igbaccin.github.io`. Configure the apex domain according to GitHub's current documentation, preserving any email records.
6. Enable **Enforce HTTPS** once the certificate is available.

[GitHub's custom-domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)

The site includes a `/home.html` redirect to preserve the former Google Sites homepage path. GitHub Pages also serves the `.html` pages at their extensionless paths, covering `/research`, `/teaching`, and `/about`.

## Design and content

The palette is charcoal, white, and cool grey, with a dark background throughout. Photographs form the backgrounds of the landing page and page headers. Architecture, archival photography, and the hourglass mark were supplied in the Desktop Website folder. The portrait was retained from this repository and is displayed in its original colour.

Headings use Georgia at restrained sizes; body text uses system fonts. Photography is served locally and configured in `site.css`. No external font service is used. The teaching award is ordinary text within the page header, so it stays in the reading flow at every screen size.

The empty title placeholder in `includes/title-placeholder.html` keeps Quarto from moving the custom page headings outside their designed layouts.

Content was migrated from https://www.ibmartins.com/ on 8 September 2026. Publication years and manuscript statuses follow that source. The obsolete placeholder PDF and background file have been removed; the real CV is linked from Google Drive.

Desktop design is agreed with the site owner before a separate phone-layout pass. Course images link to the original Lund syllabus URLs; the course grid can be followed by a compact teaching history once the full record is supplied.
