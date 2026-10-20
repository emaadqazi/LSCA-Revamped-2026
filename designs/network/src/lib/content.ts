import { getCollection, type CollectionEntry } from 'astro:content';
import { startOfToday } from './dates';

// Drafts show while running `npm run dev` so you can preview them, never in the built site.
const visible = (e: { data: { draft?: boolean } }) => import.meta.env.DEV || !e.data.draft;

export async function getEvents() {
  const all = (await getCollection('events')).filter(visible);
  all.sort((a, b) => a.data.start.valueOf() - b.data.start.valueOf());
  const cutoff = startOfToday();
  const isPast = (e: CollectionEntry<'events'>) => (e.data.end ?? e.data.start) < cutoff;
  return {
    all,
    upcoming: all.filter((e) => !isPast(e)),
    past: all.filter(isPast).reverse(),
  };
}

export async function getArticles() {
  const all = (await getCollection('articles')).filter(visible);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getNews() {
  const all = (await getCollection('news')).filter(visible);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getRosters() {
  const all = await getCollection('team');
  // Newest term first: "2026-27" sorts after "2025-26".
  return all.sort((a, b) => b.data.term.localeCompare(a.data.term));
}

export function readingMinutes(body = '') {
  return Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 225));
}
