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

## Languages

The site is written in English. Swedish and Portuguese are applied in the browser by `i18n.js`, which also adds the EN · SV · PT switcher to the navigation.

- Mark new translatable text with `data-i18n="key"` (plain text) or `data-i18n-html="key"` (text containing links: in the dictionary, `{a1}…{/a1}` stands for the element's first link, `{a2}…{/a2}` for the second; an empty `{a1}{/a1}` keeps the link's own text). Add every new key to both the `sv` and `pt` dictionaries in `i18n.js`.
- Never translate titles of publications, projects, courses, journals, or other proper names.
- Recurring words already have keys: `st.forthcoming`, `st.submitted`, `st.rr`, `st.preprint`, `st.report`, `st.phd`, `w.and`, `w.oxand`, `n.works`, `n.manuscripts`, `n.contributions`, `role.researcher`, `fund.award`, `proj.website`. A new publication or project normally needs no new keys.
- Check changes with `?lang=sv` and `?lang=pt` added to a page address.
- The home-page greeting lines are in `GREET` in `i18n.js`. Keep the persona of an always-working, tired academic, and refer to Sweden rather than a city.
## Build step after rendering

After `quarto render`, GitHub Actions runs `scripts/og-url.py`, which adds an `og:url` tag matching each page's canonical address. Local builds skip it.

## Completion evidence

Report the files changed, the commit identifier, the GitHub Actions result, and the live URL checked. If publication is blocked, leave the repository in a recoverable state and state the exact remaining step.
