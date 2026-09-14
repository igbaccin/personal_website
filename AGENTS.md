# Website project instructions

## Scope and source of truth

This repository is the canonical source for `https://ibmartins.com/`. GitHub repository `igbaccin/personal_website` is the remote source, and GitHub Pages is the publisher.

Edit Quarto source files, configuration, styles, images, and downloadable files. Do not hand-edit generated output in `_site/`, `.quarto/`, or `index_files/`.

## Default update workflow

When the user asks to update the website, inspect the existing pattern and make the smallest coherent source change. Preserve unrelated work. Validate links and content, render locally when Quarto is available, and run `git diff --check`.

Unless the user requests a draft or local preview, a website update includes committing the change, pushing `main`, waiting for the GitHub Actions build and Pages deployment, and verifying the live result at `https://ibmartins.com/`.

Do not alter Porkbun DNS, GitHub Pages settings, or the custom domain unless the user explicitly asks for a hosting or domain change.

## File routing

- Homepage content: `index.qmd`
- Publications and research output: `research.qmd`
- Funded and active projects: `projects.qmd`
- Teaching: `teaching.qmd`
- Biography and contact details: `about.qmd`
- Navigation, footer, site URL, and shared resources: `_quarto.yml`
- Visual design: `styles.scss` and `site-v2.css`
- Images: `images/`
- CV and other downloads: `files/`
- Deployment: `.github/workflows/render.yml`

Copy durable user-provided website assets into `images/` or `files/`, use descriptive lowercase filenames, and update every relevant link. Check desktop and narrow-screen layout when a visual change may affect responsiveness.

## Completion evidence

Report the files changed, the commit identifier, the GitHub Actions result, and the live URL checked. If publication is blocked, leave the repository in a recoverable state and state the exact remaining step.
