import type { APIRoute } from 'astro';
import { getEvents } from '../lib/content';
import { calendar } from '../lib/ics';

export const GET: APIRoute = async () => {
  const { all } = await getEvents();
  return new Response(calendar(all), { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
