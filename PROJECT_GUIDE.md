# Website project guide

Use this folder as the permanent home of the website project:

The repository's checked-out directory

The website's text, photographs, CV, design, and publishing instructions all live here. Git records every approved change and synchronizes the project with <https://github.com/igbaccin/personal_website>. GitHub Pages builds and serves the public site at <https://ibmartins.com/>.

## What to provide in an update request

A short instruction is enough when the requested change is clear. Include new wording, citations, URLs, PDFs, or images when they are the new source material. Say `preview only` when you want to review a change before publication.

Examples:

- `Add my new article to Publications. Here is the citation and DOI: ...`
- `Move this manuscript to Published and update the year and journal: ...`
- `Replace the CV with the attached PDF.`
- `Update my Lund affiliation everywhere it appears.`
- `Use the attached photograph on the About page. Preview only.`
- `Check the live site for broken links and fix any website-owned links.`

## How an update reaches the public site

1. Codex edits the appropriate source file in this project.
2. The change is checked and committed to Git.
3. The commit is pushed to the GitHub repository.
4. GitHub Actions builds the Quarto site.
5. GitHub Pages publishes it at `ibmartins.com`.

Porkbun controls the domain records. It does not store the website content. The old Google Site is no longer the source for updates.

## Quick source map

- Words and links live in the `.qmd` files.
- Photographs and icons live in `images/`.
- The downloadable CV lives in `files/`.
- Site-wide settings live in `_quarto.yml`.
- Styling lives in `styles.scss` and `site-v2.css`.
- Publication automation lives in `.github/workflows/render.yml`.

Future Codex tasks opened on this folder automatically receive the maintenance instructions in `AGENTS.md`.
