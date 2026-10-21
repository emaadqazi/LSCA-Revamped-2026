# LSCA Website 2026: project docs

Start here at the beginning of each working session.

| Doc | What's in it |
| --- | --- |
| [progress.md](progress.md) | What's done, what's waiting on other people, and suggested next steps. **Update this at the end of every session.** |
| [design-notes.md](design-notes.md) | Why things look and work the way they do, plus problems already solved so they aren't solved twice. |
| [../README.md](../README.md) | Running the site, and how to add events, articles, news links and team members. |

## The project in one paragraph

A rebuild of [lauriersupplychain.ca](https://www.lauriersupplychain.ca) (the old site was a single-page Vite + React app on GitHub Pages under `emaadqazi.github.io`). The president asked for an updated exec team (directors added once hired, consistent headshots after the October media day), a **Published Articles** tab, a place for **industry news/links**, and a **calendar of future events**. The new site is Astro 7 + Tailwind 4, with content stored as Markdown/JSON files edited through Git. The site uses the **Network** design (logo intro loader + 3D globe hero), chosen on 2026-10-21 over the simpler Manifest option, which was removed (it's still in git history at commit `43c7802`).

## Quick start

```sh
npm install          # once, from the repo root
npm run dev          # http://localhost:4321 (drafts shown); /?intro replays the logo intro
npm run build        # production build in dist/
```

If a port is stuck from an old server: `pkill -f astro.mjs`. Astro 7's dev server runs as its own process, so stopping the parent script doesn't always stop it.

## Repo layout

```
LSCA_Website_2026/
  src/content/           ← all editable content
    events/*.md           one file per event
    articles/*.md         one file per article
    news/links.json       industry news links
    team/<term>.json      one roster per school year (newest is shown at /team)
  src/assets/team/<term>/ headshots (optimized at build time)
  src/assets/speakers/    speaker photos
  src/components/         UI pieces (IntroLoader, NetworkHero, EventRow, MemberCard, MonthGrid, LinkMark, …)
  src/lib/                site config, date/time-zone helpers, .ics generator, content queries, globe land dots
  src/pages/              routes
  src/styles/global.css   colour/type tokens
  public/                 favicon, OG image, CNAME, robots.txt
  docs/                   these notes
  members.md              the user's draft 2026–27 roster (incomplete)
  .github/workflows/      GitHub Pages deploy (builds the repo root)
```
