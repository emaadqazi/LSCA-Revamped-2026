---
# EXAMPLE ONLY. `draft: true` keeps it off the live site. Use it as a template for real articles.
title: How to publish an article on the LSCA site
author: Emaad Qazi
authorRole: VP of Software
date: 2026-10-19
excerpt: A template article that shows every formatting option. Copy this file, change the front matter, and write.
tags: [Guide]
draft: true
---

Every article is a Markdown file in `src/content/articles/`. The filename becomes the URL, so `ai-in-procurement.md` is published at `/articles/ai-in-procurement`.

## Headings break up longer pieces

Use `##` for sections and `###` for sub-sections. Keep paragraphs short; most people read on their phone.

> Pull quotes work well for a line you want readers to remember.

### Lists, links and tables

- Link to sources, e.g. [Statistics Canada](https://www.statcan.gc.ca/)
- **Bold** for emphasis, sparingly
- Numbers and data are welcome

| Mode  | Share of Canadian freight (example) |
| ----- | ----------------------------------- |
| Truck | 60%                                 |
| Rail  | 30%                                 |
| Other | 10%                                 |

When it's ready, set `draft: false` (or delete the line), commit, and push.
