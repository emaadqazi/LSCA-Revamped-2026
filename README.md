# LSCA website: design options

Each folder in `designs/` is a complete, working copy of the site with the same content, so the presidents can compare real pages rather than mockups. When one is chosen, it becomes the live site and the others can be deleted.

| Folder | Option | What's different |
| --- | --- | --- |
| `designs/manifest` | A: Manifest | The clean, structured site. The chain-link logo interlocks in the hero. |
| `designs/network` | B: Network | Same site, plus a logo intro (the links draw in and interlock before the home page) and a 3D globe hero of shipping routes that lead back to Waterloo. |

## Run every design locally

```sh
npm install      # once, from this folder; installs every design
npm run dev      # starts all of them
```

- Showcase page: http://localhost:4320 (links to each option)
- Manifest: http://localhost:4321
- Network: http://localhost:4322

To run just one design: `npm run dev:manifest` or `npm run dev:network`.

The Network intro plays once per browser tab, so it doesn't repeat on every visit. To replay it while presenting, add `?intro` to the URL: http://localhost:4322/?intro

## Add another design

1. Copy a folder: `cp -R designs/manifest designs/my-idea` (skip `node_modules` and `dist` if present).
2. In `designs/my-idea/package.json`, change `"name"` to something unique, e.g. `lsca-design-my-idea`.
3. Add an entry to `showcase/designs.json` with a new `port` (4323, 4324, …).
4. Run `npm install` from this folder, then `npm run dev`.

## Share with the presidents on Vercel

Create one Vercel project per design, all from this same GitHub repo:

1. In Vercel, choose **Add New → Project**, import the repo, and set **Root Directory** to `designs/manifest`. Vercel detects Astro on its own. Deploy.
2. Repeat with Root Directory `designs/network`, and so on for each design.
3. Optional: one more project with Root Directory `showcase` and Framework Preset **Other**. This gives the presidents a single link that lists every option.
4. Paste each design's Vercel URL into the `url` fields in `showcase/designs.json` and push. The showcase uses these links when it isn't running on localhost.

Every push redeploys all the projects automatically, so the links always show the latest version.

## After a design is chosen

The GitHub Pages workflow (`.github/workflows/deploy.yml`) deploys the folder named in its `path:` setting to lauriersupplychain.ca. It currently points at `designs/manifest`; change it if another design wins. Each design's own `README.md` explains how to add events, articles, news links and team members.
