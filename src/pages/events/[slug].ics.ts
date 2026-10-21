import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { calendar } from '../../lib/ics';

export const getStaticPaths = (async () => {
  const events = await getCollection('events', (e) => import.meta.env.DEV || !e.data.draft);
  return events.map((event) => ({ params: { slug: event.id }, props: { event } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
  const event = props.event as CollectionEntry<'events'>;
  return new Response(calendar([event], event.data.title), { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
