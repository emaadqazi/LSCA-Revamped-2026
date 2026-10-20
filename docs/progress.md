# Progress log

Update this at the end of every session: what changed, what's blocked, what's next.

---

## Session 1: 2026-10-19

### Done
- **Analysed the old site.** It's a Vite + React SPA on GitHub Pages with hard-coded data. The 2025–26 roster (25 execs, 8 portfolios), the 3 past events and all headshots and speaker photos were pulled from its bundle into the new project.
- **Built Option A, "Manifest"** (`designs/manifest`), an Astro 7 + Tailwind 4 site with:
  - `/`: hero with the animated interlocking chain-link logo, "Coming up" events, articles, industry news, and a team teaser with headshots
  - `/about`: mission, what each portfolio does, faculty advisor
  - `/team`: roster grouped by portfolio. Supports `status: "hiring"` placeholder cards. Older years are archived at `/team/<term>`.
  - `/events`: upcoming events as a list grouped by month or as a month grid (tablet and up), type filters, a collapsible past-events section, a "Subscribe to calendar" feed (`/events.ics`), and per-event Google Calendar / `.ics` buttons
  - `/events/<slug>`: details, speakers, register button, JSON-LD
  - `/articles` and `/articles/<slug>`: Markdown articles with reading time and an RSS feed (`/articles/rss.xml`)
  - `/news`: curated external links with "Why it matters" lines and topic filters
  - A branded 404 page, sitemap, Open Graph image, favicon and robots.txt
- **Built Option B, "Network"** (`designs/network`): a copy of Manifest plus
  - a **logo intro loader**, inspired by thisisgazzar.com. The two links draw in as the page loads, interlock, show the club name, then the screen wipes away while the logo flies into the header. It plays once per visit (sessionStorage), `?intro` forces it, a click or keypress skips it, it's skipped for reduced motion, and a 7s safety timeout uncovers the page if the script fails.
  - a **3D globe hero** (three.js) with real continents as dots (computed at build time from Natural Earth data), 19 shipping routes between 16 trade hubs, moving packages, a pulsing "Waterloo, ON" pin, drag to spin, pausing when off-screen, and a static frame for reduced motion.
- **Multi-design setup:** npm workspaces, `npm run dev` runs everything, plus a showcase page.
- **Deploy prep:** a GitHub Pages workflow that rebuilds daily so events move to "Past" automatically. It currently points at `designs/manifest`.
- **Checked:** production builds pass for both designs. Pages were checked in Chrome at 390px, 768px and 1440px with no horizontal overflow, and the `.ics` feed is valid RFC 5545.

### Placeholders still in the site (agreed to leave for now)
Draft files show only in `npm run dev` and never in production builds:
- `src/content/events/draft-example-*.md`: 4 example events
- `src/content/articles/how-to-write-an-lsca-article.md`: a template article
- `src/content/news/links.json`: 3 example links (`"draft": true`)

Production currently shows "nothing scheduled / first articles on the way" empty states.

### Waiting on others
- [ ] **2026–27 exec roster** and which director roles are open. `members.md` so far has only "Ben Maycock – Co President". The site still shows 2025–26.
- [ ] **Media-day headshots** (October), to go in `src/assets/team/2026-27/`
- [ ] **Fall 2026 / Winter 2027 events**: title, date/time, room, registration link
- [ ] **First articles** and starter **news links**
- [ ] **Presidents' choice** between Option A and Option B

### Next steps
1. Push the repo to GitHub and create Vercel projects with Root Directory set to `designs/manifest`, `designs/network`, and optionally `showcase`. Put the URLs into `showcase/designs.json` and send the showcase link to the presidents.
2. Possibly add the logo intro to Option A as well (it's a self-contained `IntroLoader.astro` plus a head script in `index.astro`), giving a third combination to compare.
3. When the roster arrives, create `team/2026-27.json` **in the chosen design**, or in both while still comparing.
4. Once a design is chosen:
   - delete the other folder(s)
   - set `path:` in `.github/workflows/deploy.yml`
   - remove the draft example files
   - switch GitHub Pages to "GitHub Actions" in the repo settings
5. Before launch: test on a real iPhone and Android phone in Safari and Chrome, run Lighthouse, and import `/events.ics` into Google and Apple Calendar to confirm it works.

### Known caveats
- Content is **duplicated** in each design folder. Any content added before the decision must be added to both, or only to the likely winner.
- The 3D globe is about 130 KB gzipped (three.js) and loads after first paint.
- The Instagram, LinkedIn and Slack URLs and `info@lsca.ca` / phone number were copied from the old site. Confirm they're still correct.
