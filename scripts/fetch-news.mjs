#!/usr/bin/env node
// Weekly industry news for /news and the home page.
//
// Reads the trade-press feeds below, keeps the past week's stories, and asks Claude to choose the
// five most worth a student's time and write a summary, a "why it matters" line and a topic tag
// for each. The picks are written to src/content/news/weekly.json, keyed by the Monday of the
// current week, so running it twice in one week replaces that week's picks instead of adding more.
//
//   node scripts/fetch-news.mjs             fetch, pick, write
//   node scripts/fetch-news.mjs --dry-run   print the picks, write nothing
//   node scripts/fetch-news.mjs --no-ai     skip Claude: heuristic picks with the publishers' own blurbs
//
// Env: ANTHROPIC_API_KEY (required unless --no-ai), NEWS_MODEL (default claude-sonnet-5).
// Run every Monday by .github/workflows/news.yml. Only Node built-ins are used.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../src/content/news/weekly.json', import.meta.url));

const FEEDS = [
  { source: 'Supply Chain Dive', url: 'https://www.supplychaindive.com/feeds/news/' },
  { source: 'FreightWaves', url: 'https://www.freightwaves.com/feed' },
  { source: 'The Loadstar', url: 'https://theloadstar.com/feed/' },
  { source: 'SupplyChainBrain', url: 'https://www.supplychainbrain.com/rss/articles' },
  { source: 'gCaptain', url: 'https://gcaptain.com/feed/' },
  { source: 'Inside Logistics', url: 'https://www.insidelogistics.ca/feed/' },
  { source: 'Supply Professional', url: 'https://www.supplypro.ca/feed/' },
];

// Must match the `tag` enum in src/content.config.ts.
const TAGS = ['Logistics', 'Procurement', 'Trade & policy', 'Technology', 'Careers', 'Sustainability'];
const PICKS = 5;
const WINDOW_DAYS = 8;
const MAX_CANDIDATES = 60;
const KEEP_MONTHS = 6;
const SKIP = /\b(sponsored|webinar|podcast|press release|white ?paper|infographic|advertorial)\b/i;

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const noAi = args.has('--no-ai');

// Feeds ----------------------------------------------------------------------------------------

async function fetchFeed({ source, url }) {
  const res = await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; LSCA news digest; +https://lauriersupplychain.ca)' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return parseFeed(await res.text(), source);
}

function parseFeed(xml, source) {
  const items = [];
  for (const item of xml.match(/<item\b[\s\S]*?<\/item>/g) ?? []) {
    const title = text(field(item, 'title'));
    const url = cleanUrl(text(field(item, 'link')));
    const date = new Date(text(field(item, 'pubDate') || field(item, 'dc:date')));
    const blurb = stripBoilerplate(text(field(item, 'description') || field(item, 'content:encoded'))).slice(0, 700);
    const categories = [...item.matchAll(/<category\b[^>]*>([\s\S]*?)<\/category>/g)].map((m) => text(m[1]));
    if (title && url && !Number.isNaN(date.valueOf())) items.push({ source, title, url, date, blurb, categories });
  }
  return items;
}

const field = (xml, tag) => xml.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1] ?? '';

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };
const decode = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] !== '#') return ENTITIES[e.toLowerCase()] ?? m;
    const hex = e[1] === 'x' || e[1] === 'X';
    const code = parseInt(e.slice(hex ? 2 : 1), hex ? 16 : 10);
    return Number.isFinite(code) ? String.fromCodePoint(code) : m;
  });

/** CDATA-unwrap, decode XML entities, strip HTML, decode HTML entities, tidy whitespace. */
function text(s) {
  s = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  s = decode(s);
  s = s.replace(/<br\s*\/?>|<\/p>|<\/li>/gi, ' ').replace(/<[^>]+>/g, '');
  s = decode(s);
  return s.replace(/\s+/g, ' ').trim();
}

/** WordPress feeds end excerpts with "[…] The post X appeared first on Y." */
const stripBoilerplate = (s) =>
  s.replace(/\s*\[(…|\.\.\.)\]/g, '…').replace(/\s*The post .+? appeared first on .+?\.?\s*$/i, '').replace(/\s*Continue reading.*$/i, '').trim();

function cleanUrl(u) {
  try {
    const url = new URL(u);
    for (const k of [...url.searchParams.keys()]) if (/^(utm_|mc_|fbclid|gclid)/i.test(k)) url.searchParams.delete(k);
    url.hash = '';
    return url.toString();
  } catch {
    return '';
  }
}

const normUrl = (u) => u.toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '');
const normTitle = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Selection ------------------------------------------------------------------------------------

const KEYWORDS = {
  'Trade & policy': /\b(tariff|trade|customs|cusma|usmca|sanction|polic(y|ies)|government|border|ottawa|washington|regulat|duty|duties|wto|export control)/i,
  Procurement: /\b(procure|supplier|sourcing|contract|purchas|buyer|negotiat|tender)/i,
  Technology: /\b(ai\b|artificial intelligence|automat|robot|software|digital|data|autonomous|platform|drone|technolog|algorithm)/i,
  Sustainability: /\b(emission|carbon|sustainab|climate|electric|green|net[- ]zero|environment|decarboni)/i,
  Careers: /\b(hiring|workforce|jobs?\b|labou?r|talent|career|union|strike|wage|layoff)/i,
};
const tagFor = (c) => {
  const hay = `${c.title} ${c.categories.join(' ')} ${c.blurb}`;
  return TAGS.find((t) => KEYWORDS[t]?.test(hay)) ?? 'Logistics';
};

/** No model: newest first, at most two per source, spread across tags, publisher blurb as the summary. */
function pickHeuristic(candidates) {
  const picks = [];
  const perSource = {};
  const tags = new Set();
  const tagged = candidates.map((c) => ({ ...c, tag: tagFor(c) }));
  for (const pass of [(c) => !tags.has(c.tag), () => true]) {
    for (const c of tagged) {
      if (picks.length >= PICKS || picks.includes(c) || (perSource[c.source] ?? 0) >= 2 || !pass(c)) continue;
      picks.push(c);
      perSource[c.source] = (perSource[c.source] ?? 0) + 1;
      tags.add(c.tag);
    }
  }
  return picks.map((c) => ({ ...c, summary: trimBlurb(c.blurb, 50), takeaway: undefined, method: 'heuristic' }));
}

/** Cut a blurb to about maxWords, ending at a sentence if one falls in the back half, else with an ellipsis. */
function trimBlurb(s, maxWords) {
  const words = s.split(' ');
  if (words.length <= maxWords) return s;
  const cut = words.slice(0, maxWords).join(' ');
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
  // A period after a lone capital (U.S., B.C.) or a common abbreviation is not a sentence end.
  if (end > cut.length / 2 && !/\b([A-Z]|Inc|Co|Ltd|Dr|Mr|Ms|St|No|vs)\.$/.test(cut.slice(0, end + 1))) return cut.slice(0, end + 1);
  return cut.replace(/[,;:]?$/, '') + '…';
}

const SYSTEM = `You curate a weekly industry news digest for the Laurier Supply Chain Association, a student club at Wilfrid Laurier University in Waterloo, Ontario. Readers are undergraduates heading into supply chain, logistics, procurement and operations careers, mostly in Canada.

From the candidate stories, choose the ${PICKS} most worth their time this week. Prefer stories with real consequences for how goods are planned, sourced, made or moved; Canadian relevance; and variety: no more than two picks from one source and at least three different tags across the five. Avoid sponsored content, product announcements, event promotion, stock-price pieces, and near-duplicates of the same event (keep the best one).

For each pick write:
- summary: two sentences, at most 50 words, plain and specific, using only facts present in the candidate text. Never invent numbers, names or quotes.
- takeaway: one sentence, at most 25 words, on why a student should care: what it signals about the industry, or a skill it rewards. Lead with the point.
- tag: exactly one of ${TAGS.join(', ')}.

Canadian English, sentence case, no exclamation marks, no marketing tone. Call the publish_picks tool once with the picks ordered most important first.`;

async function pickWithClaude(candidates) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set (use --no-ai to run without it)');
  const model = process.env.NEWS_MODEL || 'claude-sonnet-5';
  const list = candidates
    .map((c, i) => `#${i} | ${c.source} | ${c.date.toISOString().slice(0, 10)}\n${c.title}\n${c.blurb}`)
    .join('\n\n');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    signal: AbortSignal.timeout(120_000),
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      system: SYSTEM,
      messages: [{ role: 'user', content: `Candidate stories from the past week (${candidates.length}):\n\n${list}` }],
      tools: [
        {
          name: 'publish_picks',
          description: `Publish this week's ${PICKS} picks.`,
          input_schema: {
            type: 'object',
            properties: {
              picks: {
                type: 'array',
                minItems: 1,
                maxItems: PICKS,
                items: {
                  type: 'object',
                  properties: {
                    index: { type: 'integer', description: 'The candidate number after #' },
                    tag: { type: 'string', enum: TAGS },
                    summary: { type: 'string' },
                    takeaway: { type: 'string' },
                  },
                  required: ['index', 'tag', 'summary', 'takeaway'],
                },
              },
            },
            required: ['picks'],
          },
        },
      ],
      tool_choice: { type: 'auto' },
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const data = await res.json();
  let picks = data.content?.find((c) => c.type === 'tool_use')?.input?.picks;
  if (!picks) {
    // Fallback: the model answered in text. Find the JSON object in it.
    const txt = data.content?.filter((c) => c.type === 'text').map((c) => c.text).join('\n') ?? '';
    const json = txt.match(/\{[\s\S]*\}/)?.[0];
    picks = json ? JSON.parse(json).picks : undefined;
  }
  if (!Array.isArray(picks) || !picks.length) throw new Error('Claude returned no picks');

  const seen = new Set();
  return picks
    .filter((p) => Number.isInteger(p.index) && candidates[p.index] && !seen.has(p.index) && seen.add(p.index))
    .slice(0, PICKS)
    .map((p) => ({
      ...candidates[p.index],
      tag: TAGS.includes(p.tag) ? p.tag : tagFor(candidates[p.index]),
      summary: String(p.summary).trim(),
      takeaway: String(p.takeaway).trim() || undefined,
      method: 'ai',
    }));
}

// Output ---------------------------------------------------------------------------------------

/** Monday of the current week, as YYYY-MM-DD in Toronto time. */
function weekKey(now = new Date()) {
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

async function main() {
  const week = weekKey();
  let existing = [];
  try {
    existing = JSON.parse(await readFile(OUT, 'utf8'));
  } catch {}

  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const fetched = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      fetched.push(...r.value);
      console.log(`${FEEDS[i].source}: ${r.value.length} items`);
    } else console.warn(`${FEEDS[i].source}: failed (${r.reason?.message ?? r.reason})`);
  });
  if (!fetched.length) throw new Error('No feed could be read');

  const since = Date.now() - WINDOW_DAYS * 864e5;
  const used = new Set(existing.filter((e) => e.week !== week).map((e) => normUrl(e.url)));
  const seenUrl = new Set();
  const seenTitle = new Set();
  const candidates = fetched
    .filter((c) => c.date.valueOf() >= since && c.date.valueOf() <= Date.now() + 864e5)
    .filter((c) => !SKIP.test(`${c.title} ${c.categories.join(' ')}`))
    .filter((c) => !used.has(normUrl(c.url)))
    .sort((a, b) => b.date - a.date)
    .filter((c) => {
      const u = normUrl(c.url);
      const t = normTitle(c.title);
      if (seenUrl.has(u) || seenTitle.has(t)) return false;
      seenUrl.add(u);
      seenTitle.add(t);
      return true;
    })
    .slice(0, MAX_CANDIDATES);
  console.log(`${candidates.length} candidates from the past ${WINDOW_DAYS} days`);
  if (!candidates.length) {
    console.log('Nothing new this week; weekly.json left unchanged.');
    return;
  }

  const picks = noAi ? pickHeuristic(candidates) : await pickWithClaude(candidates);

  const published = new Date().toISOString();
  const entries = picks.map((p, i) => ({
    id: `${week}-${i + 1}-${slug(p.title)}`,
    week,
    published,
    rank: i + 1,
    title: p.title,
    url: p.url,
    source: p.source,
    date: p.date.toISOString(),
    tag: p.tag,
    summary: p.summary,
    ...(p.takeaway ? { takeaway: p.takeaway } : {}),
    method: p.method,
  }));

  const cutoff = new Date();
  cutoff.setUTCMonth(cutoff.getUTCMonth() - KEEP_MONTHS);
  const next = [...entries, ...existing.filter((e) => e.week !== week && new Date(e.week) >= cutoff)];
  next.sort((a, b) => b.week.localeCompare(a.week) || a.rank - b.rank);

  for (const e of entries) {
    console.log(`\n[${e.tag}] ${e.title} (${e.source})\n  ${e.summary}${e.takeaway ? `\n  Why it matters: ${e.takeaway}` : ''}\n  ${e.url}`);
  }
  if (dryRun) {
    console.log(`\nDry run: ${entries.length} picks for the week of ${week}, nothing written.`);
    return;
  }
  await writeFile(OUT, JSON.stringify(next, null, 2) + '\n');
  console.log(`\nWrote ${entries.length} picks for the week of ${week} (${next.length} entries kept) to ${OUT}`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
