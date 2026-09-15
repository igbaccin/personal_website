# Igor B. Martins website

This repository contains the source for [ibmartins.com](https://ibmartins.com/), an academic website built with Quarto and published through GitHub Pages.

## Project locations

- Local project folder: this repository's checked-out directory
- GitHub repository: <https://github.com/igbaccin/personal_website>
- Live website: <https://ibmartins.com/>
- Hosting: GitHub Pages
- Domain and DNS: Porkbun

The local folder and the GitHub repository contain the website inputs. GitHub Actions renders those inputs and publishes the generated site. Porkbun directs the domain to GitHub Pages.

## Content map

| File or folder | What it controls |
| --- | --- |
| `index.qmd` | Landing-page introduction, main links, academic profiles, and email |
| `research.qmd` | Publications, manuscripts, work in progress, essays, and media |
| `projects.qmd` | Research projects and funding |
| `teaching.qmd` | Courses, teaching history, supervision, and award |
| `about.qmd` | Biography, affiliations, professional links, and contact details |
| `_quarto.yml` | Navigation, footer, site address, CV link, and Quarto settings |
| `styles.scss` and `site-v2.css` | Typography, layout, spacing, colours, and responsive design |
| `images/` | Portraits, page photographs, and icons |
| `files/` | Downloadable files, including the CV |
| `.github/workflows/render.yml` | Automated build and publication workflow |
| `CNAME` | Permanent custom-domain setting for GitHub Pages |

Generated folders such as `_site/`, `.quarto/`, and `index_files/` are outputs. Edit the source files listed above.

## Updating the website with Codex

Open a task attached to this Website project and describe the desired result. Codex can locate the relevant source file, make the change, validate the site, commit it, push it to GitHub, and verify the live deployment.

Useful prompts include:

- `Add this publication to Research and publish the update: [citation and link].`
- `Replace my website CV with the attached PDF and verify every CV link.`
- `Update my biography to say [new text], then publish it.`
- `Change the homepage portrait to the attached image and check desktop and phone layouts.`
- `Preview this change locally and do not publish it yet: [requested change].`
- `Check whether the website, custom domain, and latest GitHub deployment are healthy.`

Attachments supplied in a task should be copied into `images/` or `files/` when they belong on the website. The repository then becomes their durable source.

## Publication workflow

Changes pushed to `main` start the **Build and publish website** GitHub Actions workflow. It renders the Quarto source and updates the `gh-pages` branch. GitHub Pages publishes that branch at `ibmartins.com`.

For a local preview, install [Quarto](https://quarto.org/docs/get-started/) and run:

```sh
quarto preview
```

To render the complete site locally:

```sh
quarto render
```

No application server, database, paid theme, external font service, or analytics service is required.

## Domain configuration

The apex domain points to GitHub Pages, and `www.ibmartins.com` points to `igbaccin.github.io`. The repository's `CNAME` file preserves `ibmartins.com` during publication. DNS changes belong in Porkbun and should only be needed when the hosting arrangement changes.

The `/home.html` redirect preserves the former Google Sites homepage path. GitHub Pages also serves the main pages at their `.html` URLs and extensionless paths.

## Content conventions

Publication entries use ordinary HTML inside the Quarto documents. To add an item, copy the nearest existing entry of the same type and update its title, year, authors, venue, status, and link. Keep section counts synchronized with their entries. Use `&amp;` for ampersands inside HTML text.

The complete publication list belongs on the Research page. The homepage remains concise. Current teaching and earlier teaching remain separate, and course links should point to the relevant Lund syllabus pages when available.
