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

### LinkedIn links (2026-10-21, on `main`)
- Found 2026–27 LinkedIn URLs by searching LinkedIn in the user's own logged-in Chrome (Claude in Chrome). The user approved the less certain matches (Bryan Wu, Quinn James, Abby Soh, Findlay Stone, Katie Lee).
- Wei Shao goes by "Wayne Shao" on LinkedIn. Evangline Yamine's profile spells her name "Evangeline" (the site still uses the list's spelling; awaiting the user's call).
- **Still no LinkedIn:** Matthew Nagy, Devon Sharma, Estelle Sing Fat.
- Removed every "Join our Slack" link (header, mobile menu, hero, footer) and the Slack URL from `site.ts`.

---

## Session 3: 2026-10-27 (branch `feature/wow-redesign`)

Brief: find the gaps, then revise the whole site so it has a "wow" factor with supply-chain-themed motion while staying professional.

### Gaps found
- After the globe, the home page was three flat lists. No story of what a student gets, no proof points, nothing moved.
- No way in: no page or button for students who want to join or companies who want to speak/sponsor. Only a footer email.
- Past speakers (EY, Honeywell, LCBO, faculty) were buried in one past-event page.
- Event pages had an empty right column; About was text-only; the faculty advisor photo existed but wasn't used.
- No motion outside the hero and no page-to-page transition.
- Bug: the globe canvas rendered at device-pixel size on 2x/3x screens (`renderer.setSize(w, h, false)`), so on phones and Retina Macs it was 2–3× too big and spilled over the headline.

### Done
- **Concept: shipment tracking.** Logistics vernacular runs through the site: waybill leaders, barcodes, a tracking card, route lines with a travelling package.
- **Home:** word-by-word headline rise; a **live arrivals log** under the hero copy, fed by the globe (`lsca:arrival` events fire when a package reaches a port, shown at most every 2.6 s); a **waybill strip** of facts with count-ups; the **tracking journey** (`TrackingJourney.astro`): a sticky shipping-label card and a vertical route where a parcel travels as you scroll, stops light up and the status changes from "Order received" to "Delivered"; a **speaker conveyor belt** (`SpeakerBelt.astro`) built from every past event's speakers, with rollers turning underneath, paused on hover; staggered reveals on the rest.
- **New page `/get-involved`** for students (attend, apply, write) and companies/alumni (speak, sponsor), with the header's "Get involved" button, the footer and the hero pointing at it. Open `hiring` roles from the roster are listed automatically.
- **`NextUp.astro`**: pre-footer band on inner pages with the next event on the calendar (or Instagram when there is none).
- **About:** the five stages (Plan, Source, Make, Move, Deliver) as stops on one dashed route; faculty advisor photo.
- **Event pages:** sticky "logistics" label (date, time, where, status, calendar buttons, map link); speakers under the description; "Also coming up" below.
- **Site-wide motion system** (`src/scripts/motion.ts`, loaded by `Base.astro`): `data-reveal` wipes/rises, `data-count` count-ups, `data-track` scroll-driven timelines. Cross-document view transitions (`@view-transition`), header held still. Everything shows its end state under `prefers-reduced-motion` and without JS.
- Fixed the globe sizing bug above.

### Checked
- Production build passes (12 pages). Screenshots at 1440px and iPhone 13 for every page: no horizontal overflow, no console errors, reduced-motion state verified, intro loader still hands off to the hero.

### Next steps
- Review on a real phone; decide whether the belt speed (60 s per loop) and the journey's per-stop height (34vh on desktop) feel right.
- `npm run check` needs `@astrojs/check` and `typescript` as devDependencies; they were not added this session.
- Replace the draft example content before launch (unchanged from Session 2).
