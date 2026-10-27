# Design notes and decisions

## Brief
"Similar to our logo's shades of blue, works on every device, attractive and doesn't look AI-generated. Simple, clean, polished, screaming supply chain."

## Visual system

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

## Motion and the tracking motif (Session 3)
The site borrows the vocabulary of shipment tracking, which is the one thing every visitor already knows about supply chain:
- **Waybill leaders** (`leader` utility): label, dotted line, value. Used for facts and event details.
- **Barcodes** (`.barcode`): decorative stripes on labels. Always `aria-hidden`.
- **Route lines** (`.route-line`): a dashed line with one package travelling along it. Section dividers on page headers, the Next-up band and the footer.
- **The tracking journey** on the home page is the set piece: scroll progress (`--p`, set by `motion.ts`) moves a parcel down a route, fills the rail, lights stops and updates the card's status. Stop thresholds are measured from the DOM, not hard-coded.
- **Reveals** (`data-reveal`) wipe in from the left, the direction goods travel, with `--i` stagger. `data-reveal="rise"` for photos and outlined blocks a wipe would clip. The script removes the attribute once landed so the element's own hover transitions apply.
- Reduced motion: every effect shows its end state; the belt becomes a static wrapped row; the arrivals log is hidden because the globe doesn't animate.
- Colours added: `night #041C24` (footer, bottom of the hero) and `signal-bright #3CC4E6` (glow on dark only).

## Choices made on purpose
- **Avoided common signs of an AI-generated page** (per the frontend-design skill): no all-caps eyebrow labels, no monospace data labels, no grids of identical cards with soft shadows, no gradient blobs or glassmorphism, no "→" appended to links, sentence-case copy.
- **Bold moments are the intro loader, the globe hero and the tracking journey.** Everything else stays quiet.
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
- **The globe's land dots** are computed at build time in `src/lib/landDots.ts` (world-atlas 110m + d3-geo) and embedded as JSON. The browser never downloads map data.
- **The intro loader and hero stay in sync:** the hero's `.reveal` animations are paused while `html.intro` is set, and the globe mounts on the `lsca:intro-done` event.
- **Always call `renderer.setSize(w, h)` without `false`** so three.js also sets the canvas's CSS size. With `false`, the canvas displays at device-pixel size and is 2–3× too big on Retina and phone screens.
- **IntersectionObserver measures the clipped box in Chrome.** An element hidden with `clip-path: inset(0 100% 0 0)` is a sliver wide, so an observer with `threshold: 0.05` never fires. Use `threshold: 0`.
- **Scoped `position: relative` beats Tailwind's `lg:sticky`.** Astro adds `[data-astro-cid]` to scoped selectors, raising their specificity above a utility class. Put the sticky rule in the scoped `<style>` inside a media query instead.
- **Spaces between inline-block words** must live outside the `overflow: hidden` wrapper, otherwise they collapse and the words run together.

## Ideas not yet tried
- A scroll-driven version of the globe (zooming to Waterloo as the page scrolls).
- Per-event "tracking numbers" on the shipping-label cards, generated from the slug.
