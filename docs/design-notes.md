# Design notes and decisions

## Brief
"Similar to our logo's shades of blue, works on every device, attractive and doesn't look AI-generated. Simple, clean, polished, screaming supply chain."

## Visual system (shared by every design)

**Colours**, taken from the logo and defined in `src/styles/global.css`:

| Token | Hex | Use |
| --- | --- | --- |
| `mist` | `#E3EBF1` | Logo background; page-header and section fills, intro loader background |
| `mist-deep` | `#CFDCE6` | Rules, borders, quiet fills |
| `harbour` | `#0B4558` | The logo's dark link; primary text and buttons |
| `signal` | `#0A9CC0` | The logo's light link; accents on dark backgrounds, large display only |
| `signal-ink` | `#07738E` | Darkened `signal` for small text on light backgrounds (AA contrast) |
| `deep` | `#062A36` | Footer, dark sections, Network hero |
| `paper` | `#F8FBFD` | Page background |

**Type:** a single typeface, Archivo (variable, with a width axis), self-hosted with `@fontsource-variable/archivo`.
- `.display`: 125% width, 800 weight, for page titles (reads like freight lettering)
- `.heading`: 112% width, 700 weight
- `.data`: 75% width, tabular figures, for dates, times and rooms

**The logo mark** (`src/components/LinkMark.astro`) is redrawn as SVG: two 104×224 rounded rectangles at 45°. A clipped copy of the light link is drawn over the dark one at the right-hand crossing so they read as interlocked. `public/favicon.svg` uses the same geometry.

## Choices made on purpose
- **Avoided common signs of an AI-generated page** (per the frontend-design skill): no all-caps eyebrow labels, no monospace data labels, no grids of identical cards with soft shadows, no gradient blobs or glassmorphism, no "→" appended to links, sentence-case copy.
- **One bold moment per design:** the interlocking logo in Manifest; the loader and globe in Network. Everything else stays quiet.
- **Event cards look like shipping labels**: a tear-off date stub with a dashed perforation and punched holes. The "This week" chip appears automatically.
- **Headshots:** shared 4:5 crop, slightly desaturated until hover so mismatched photos sit together. A member without a photo gets an initials monogram, so the grid stays consistent before and after media day.
- **Drafts** (`draft: true`) render only in dev, so the team can preview content safely.

## Problems already solved (don't repeat these)
- **Don't name a colour token `current`.** Tailwind's `bg-current` / `text-current` mean `currentColor`. That's why the light-blue token is called `signal`.
- **Date-only values** (`date: 2026-10-19`) parse as UTC midnight, which displays as the previous day in Toronto. `calendarDate` in `content.config.ts` shifts them to noon UTC. Event times must include the offset (`-04:00` for EDT, `-05:00` for EST).
- **All date formatting goes through `src/lib/dates.ts`** with `timeZone: 'America/Toronto'`, so the build server's time zone never matters.
- **zsh treats `[slug]` in a path as a glob pattern.** Quote such paths in shell commands or create those files with an editor.
- **No HTML comments inside JSX expressions** in `.astro` files. Use `{/* … */}` outside the expression.
- **Headless Chrome screenshots** below about 500px wide are clipped by its minimum window size. Use Playwright with `devices['iPhone 13']` for real mobile checks (the script used last session was in the session scratchpad, not the repo).
- **Images live in `src/assets`, not `public`**, so Astro compresses them (old headshots went from up to 800 KB to 3–57 KB).
- **The globe's land dots** are computed at build time in `designs/network/src/lib/landDots.ts` (world-atlas 110m + d3-geo) and embedded as JSON. The browser never downloads map data.
- **The intro loader and hero stay in sync:** the hero's `.reveal` animations are paused while `html.intro` is set, and the globe mounts on the `lsca:intro-done` event.

## Ideas not yet tried
- The logo intro on Option A.
- A third design direction (for example a lighter, editorial take, or one built around a "route map" timeline of events).
- Connecting-dots motifs elsewhere in the Network design (section dividers, the events timeline).
