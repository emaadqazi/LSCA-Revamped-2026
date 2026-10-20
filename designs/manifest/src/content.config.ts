import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

// A bare date like 2026-10-19 parses as UTC midnight, which is the evening before in Toronto.
// Shift date-only values to noon UTC so they display on the intended day.
const calendarDate = z.coerce.date().transform((d) =>
  d.getUTCHours() === 0 && d.getUTCMinutes() === 0 ? new Date(d.valueOf() + 12 * 3600e3) : d,
);

const member = z.object({
  name: z.string(),
  role: z.string(),
  program: z.string().optional(),
  // Filename inside src/assets/team/, e.g. "2026-27/JaneDoe.jpg". Leave out to show initials.
  photo: z.string().optional(),
  linkedin: z.url().optional(),
  // "hiring" renders an open-position card instead of a person.
  status: z.enum(['active', 'hiring']).default('active'),
  applyUrl: z.url().optional(),
});

const team = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/team' }),
  schema: z.object({
    term: z.string(),
    label: z.string(),
    portfolios: z.array(z.object({ name: z.string(), members: z.array(member) })),
  }),
});

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    // Write with the Toronto offset, e.g. 2026-11-04T19:00:00-05:00
    start: z.coerce.date(),
    end: z.coerce.date().optional(),
    allDay: z.boolean().default(false),
    location: z.string().default('TBD'),
    type: z.enum(['Speaker panel', 'Social', 'Competition', 'Workshop', 'Networking', 'Info session']),
    summary: z.string(),
    audience: z.string().optional(),
    registerUrl: z.url().optional(),
    speakers: z
      .array(z.object({ name: z.string(), title: z.string(), photo: z.string().optional(), linkedin: z.url().optional() }))
      .default([]),
    draft: z.boolean().default(false),
  }),
});

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    author: z.string(),
    authorRole: z.string().optional(),
    date: calendarDate,
    excerpt: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const news = defineCollection({
  loader: file('./src/content/news/links.json'),
  schema: z.object({
    title: z.string(),
    url: z.url(),
    source: z.string(),
    date: calendarDate,
    tag: z.enum(['Logistics', 'Procurement', 'Trade & policy', 'Technology', 'Careers', 'Sustainability']),
    takeaway: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { team, events, articles, news };
