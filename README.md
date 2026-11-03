# lauriersupplychain.ca

The website for the Laurier Supply Chain Association. Built with [Astro](https://astro.build) and Tailwind CSS, deployed to GitHub Pages.

```sh
npm install
npm run dev      # http://localhost:4321, shows drafts
npm run build    # production build in dist/, drafts removed
```

Pushing to `main` deploys automatically. The site also rebuilds every morning so finished events move to "Past events" without anyone touching it.

All content lives in `src/content/`. You never need to edit a page to add content.

## Add an event

Create `src/content/events/YYYY-MM-short-name.md`. The filename becomes the URL (`/events/2026-11-networking-night`).

```md
---
title: Industry Networking Night
start: 2026-11-12T18:30:00-05:00   # always include the Toronto offset
end: 2026-11-12T21:00:00-05:00
location: Lazaridis Hall, Atrium
type: Networking                   # Speaker panel | Social | Competition | Workshop | Networking | Info session
summary: One sentence shown in the event list.
audience: Open to all students.    # optional
registerUrl: https://...           # optional, shows a Register button
speakers:                          # optional
  - name: Jane Doe
    title: Supply Chain Analyst at Example Co.
    photo: Jane-Doe.jpeg           # file in src/assets/speakers/
    linkedin: https://www.linkedin.com/in/...
draft: true                        # optional: preview locally without publishing
---

Full description in Markdown.
```

**Time zone offset:** use `-04:00` between mid-March and early November (EDT) and `-05:00` otherwise (EST). For an event with no set time, add `allDay: true`.

The event appears on the home page, the events list, the month calendar and the subscribable calendar feed (`/events.ics`).

## Publish an article

Copy `src/content/articles/how-to-write-an-lsca-article.md`, which shows every formatting option. Fill in `title`, `author`, `authorRole`, `date`, `excerpt` and `tags`, write in Markdown, and remove `draft: true` when it's ready.

## Weekly industry news (automatic)

Every Monday at 6–7am Waterloo time, the **Weekly industry news** workflow (`.github/workflows/news.yml`) runs `scripts/fetch-news.mjs`. The script reads seven trade-press feeds (Supply Chain Dive, FreightWaves, The Loadstar, SupplyChainBrain, gCaptain, Inside Logistics, Supply Professional), keeps the past week's stories, and asks Claude to pick the five most worth a student's time and write a two-sentence summary, a "why it matters" line and a topic tag for each. The picks are committed to `src/content/news/weekly.json` and the site redeploys. They appear at the top of `/news` under "This week in supply chain" (with a "Last updated" tag at the bottom) and in the home page's Industry news panel. Earlier weeks stay on `/news` grouped by month for six months.

**One-time setup:** in the GitHub repo go to Settings → Secrets and variables → Actions and add a secret named `ANTHROPIC_API_KEY`. A week costs a few cents.

- **Refresh this week's picks now:** Actions tab → Weekly industry news → Run workflow. Re-running in the same week replaces that week's five; it never adds a sixth.
- **Preview locally:** `npm run news -- --dry-run` (needs `ANTHROPIC_API_KEY` in your shell) or `npm run news -- --dry-run --no-ai` for a no-key version that uses the publishers' own blurbs. Drop `--dry-run` to write the file; if `npm run dev` is running, restart it afterwards so it re-reads the collection.
- **Fix or remove a pick:** edit `src/content/news/weekly.json` by hand. Entries for past weeks are never touched by the script.
- **Change the model, sources or prompt:** `NEWS_MODEL` env (default `claude-sonnet-5`), the `FEEDS` list and `SYSTEM` prompt at the top of `scripts/fetch-news.mjs`.
- If the API call fails the workflow fails (GitHub emails the repo owner) and last week's picks stay up.

## Add an industry news link

Hand-picked links show on `/news` under "Picked by the team". Add an entry to the top of `src/content/news/links.json`:

```json
{
  "id": "2026-10-port-of-vancouver",
  "title": "Headline exactly as published",
  "url": "https://...",
  "source": "The Globe and Mail",
  "date": "2026-10-18",
  "tag": "Logistics",
  "takeaway": "One sentence on why it matters to students."
}
```

`id` must be unique. `tag` is one of: Logistics, Procurement, Trade & policy, Technology, Careers, Sustainability.

## Update the team

Each school year has its own file in `src/content/team/` (e.g. `2025-26.json`). The newest file is shown at `/team`, and older years stay available at `/team/2025-26`.

To start a new year, copy last year's file to `2026-27.json`, change `term` and `label`, and edit the members. Headshots go in `src/assets/team/2026-27/`; set `photo` to `"2026-27/FirstLast.jpg"`. If a member has no photo yet, leave `photo` out and the card shows their initials. Any size works because images are cropped to 4:5 and compressed at build time, but consistent media-day headshots look best.

For a director role that isn't filled yet, add a placeholder:

```json
{ "name": "Open position", "role": "Director of Events", "status": "hiring", "applyUrl": "https://forms.gle/..." }
```

## Design notes

- Colours come from the logo: `mist #E3EBF1`, `harbour #0B4558`, `signal #0A9CC0`, `deep #062A36` (see `src/styles/global.css`). Use `signal-ink #07738E` for small light-blue text on light backgrounds; plain `signal` doesn't meet contrast requirements there.
- One typeface, Archivo, used at three widths: wide (`.display`) for page titles, normal for body text, condensed (`.data`) for dates and times.
- The chain-link mark is `src/components/LinkMark.astro`. It's drawn in SVG, so it stays sharp at any size.
- Motion is opt-in per element: add `data-reveal` (wipe) or `data-reveal="rise"` to anything that should animate in, and `style="--i: n"` to stagger siblings. Numbers marked `data-count` count up. See `docs/design-notes.md` for the tracking motif and `src/scripts/motion.ts` for the mechanics.
