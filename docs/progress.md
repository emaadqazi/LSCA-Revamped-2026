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

---

## Session 2: 2026-10-21

### Done
- **Network (Option B) chosen.** It was moved from `designs/network` to the repo root, so it's now a single plain Astro project (`npm install && npm run dev`, port 4321).
- Removed `designs/manifest`, `showcase/`, `scripts/dev-all.mjs` and the npm-workspace root `package.json`. All are still in git history at `43c7802`.
- `.github/workflows/deploy.yml` now builds `path: .`. The design's README is now the root `README.md`. `docs/README.md` and `design-notes.md` were updated to match.
- A production build from the root passes (10 pages).

### Next steps
- Polish pass on the non-hero parts of the site (the user said "we need to polish up some of the other stuff"; specifics TBD).
- The Vercel/showcase step in Session 1's next steps no longer applies. Deploy is just GitHub Pages from the root. Remove the draft example files before launch.
- **2026–27 roster added** (`src/content/team/2026-27.json`, 24 people in 8 portfolios) from `members/list.md`, with headshots copied into `src/assets/team/2026-27/`. `/team` now shows 2026–27, and 2025–26 is archived at `/team/2025-26`.
  - **No photo (initials placeholder):** Findlay Stone, Estelle Sing Fat, and Devon Sharma (the supplied file was LinkedIn's default #OpenToWork avatar).
  - Returning members kept their LinkedIn links and their program year was bumped by one (e.g. 3rd → 4th). New members have no program or LinkedIn yet.
  - Confirmed: "Quinn Woodlock" is correct (the photo file was misnamed `Quinn-Lockwood.jpg`). Katie Lee is a **different person** from 2025–26's Kaitlyn Lee, so she has no carried-over LinkedIn or program.
  - Katie's photo came as a circle on white. It was cropped to the largest 4:5 box inside the circle, so it's small (244×306) and a full-size original would be sharper.
- **Member emails are shown on cards** (optional `email` field in the team schema, rendered as a `mailto:` link under each person) so visitors can reach the exec for inquiries. Emails come from `members/list.md`.
- `members/` (the raw list and photos) is intentionally left **untracked**.

### Team page carousel (branch `feature/meet-the-team`)
- `/team` now has a **Carousel / List** toggle. Carousel is the default, and the choice is remembered in localStorage and applied before first paint by an inline script, so there's no flash.
- **Carousel:** one portfolio per slide, using native scroll-snap so phones swipe. Prev/next arrows, portfolio chips that act as tabs (with the active chip highlighted), ←/→ keys, and `/team#events` opens on that slide. The track's height follows the visible slide.
  - Below 768px each member becomes a compact row (thumbnail + text) listed vertically, and the next slide peeks in from the edge.
  - From 768px up, slides show the usual card grid.
- **List:** the original stacked layout, unchanged.
- One set of markup serves both views. CSS in `Roster.astro` switches on `.team[data-view]`, and `MemberCard.astro` has `m-*` hook classes for the compact layout.
- Checked in Playwright on iPhone SE, iPhone 13, iPad Mini and 1440px desktop: swipe, arrows, tabs, hash, persistence, no horizontal overflow, no console errors.
