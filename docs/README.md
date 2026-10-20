# LSCA Website 2026: project docs

Start here at the beginning of each working session.

| Doc | What's in it |
| --- | --- |
| [progress.md](progress.md) | What's done, what's waiting on other people, and suggested next steps. **Update this at the end of every session.** |
| [design-notes.md](design-notes.md) | Why things look and work the way they do, plus problems already solved so they aren't solved twice. |
| [../README.md](../README.md) | How the multi-design setup works: running locally, adding a design, deploying to Vercel. |
| `designs/<name>/README.md` | How to add events, articles, news links and team members to a design. |

## The project in one paragraph

A rebuild of [lauriersupplychain.ca](https://www.lauriersupplychain.ca) (the old site was a single-page Vite + React app on GitHub Pages under `emaadqazi.github.io`). The president asked for an updated exec team (directors added once hired, consistent headshots after the October media day), a **Published Articles** tab, a place for **industry news/links**, and a **calendar of future events**. The new site is Astro 7 + Tailwind 4, with content stored as Markdown/JSON files edited through Git. There are currently **two design options** in `designs/` for the presidents to choose between.

## Quick start

```sh
npm install                 # once, from the repo root (npm workspaces)
npm run dev                 # all designs + showcase
npm run dev:network         # just one design
npm run build               # production build of every design
```

| URL | What |
| --- | --- |
| http://localhost:4320 | Showcase page linking to each design |
| http://localhost:4321 | Option A: Manifest |
| http://localhost:4322 | Option B: Network (`/?intro` replays the logo intro) |

If a port is stuck from an old server: `pkill -f astro.mjs`. Astro 7's dev server runs as its own process, so stopping the parent script doesn't always stop it.

## Repo layout

```
LSCA_Website_2026/
  designs/
    manifest/            Option A, a complete Astro site
    network/             Option B, the same site plus logo intro and 3D globe hero
  showcase/              index.html + designs.json (names, ports, Vercel URLs)
  scripts/dev-all.mjs    starts every design and the showcase
  docs/                  these notes
  members.md             the user's draft 2026–27 roster (incomplete)
  .github/workflows/     GitHub Pages deploy (points at designs/manifest)
```

Inside each design:

```
src/content/           ← all editable content
  events/*.md           one file per event
  articles/*.md         one file per article
  news/links.json       industry news links
  team/<term>.json      one roster per school year (newest is shown at /team)
src/assets/team/<term>/ headshots (optimized at build time)
src/assets/speakers/    speaker photos
src/components/         UI pieces (EventRow, MemberCard, MonthGrid, LinkMark, …)
src/lib/                site config, date/time-zone helpers, .ics generator, content queries
src/pages/              routes
src/styles/global.css   colour/type tokens
```
