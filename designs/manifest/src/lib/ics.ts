import type { CollectionEntry } from 'astro:content';
import { SITE } from './site';

type Ev = CollectionEntry<'events'>;

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const dateOnly = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');

// RFC 5545: lines longer than 75 octets are folded with CRLF + space.
function fold(line: string) {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = ' ' + rest.slice(74);
  }
  out.push(rest);
  return out.join('\r\n');
}

const endOf = (e: Ev) => e.data.end ?? new Date(e.data.start.valueOf() + 2 * 3600e3);

function vevent(e: Ev) {
  const url = `${SITE.url}/events/${e.id}`;
  const lines = [
    'BEGIN:VEVENT',
    `UID:${e.id}@lauriersupplychain.ca`,
    `DTSTAMP:${stamp(new Date())}`,
    ...(e.data.allDay
      ? [`DTSTART;VALUE=DATE:${dateOnly(e.data.start)}`]
      : [`DTSTART:${stamp(e.data.start)}`, `DTEND:${stamp(endOf(e))}`]),
    `SUMMARY:${esc(e.data.title)}`,
    `DESCRIPTION:${esc(`${e.data.summary}\n\n${url}`)}`,
    `LOCATION:${esc(e.data.location)}`,
    `URL:${url}`,
    'END:VEVENT',
  ];
  return lines.map(fold).join('\r\n');
}

export function calendar(events: Ev[], name = 'LSCA events') {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Laurier Supply Chain Association//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(name)}`,
    'X-WR-TIMEZONE:America/Toronto',
    'REFRESH-INTERVAL;VALUE=DURATION:PT12H',
    ...events.map(vevent),
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}

export function googleCalendarUrl(e: Ev) {
  const dates = e.data.allDay
    ? `${dateOnly(e.data.start)}/${dateOnly(new Date(e.data.start.valueOf() + 864e5))}`
    : `${stamp(e.data.start)}/${stamp(endOf(e))}`;
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.data.title,
    dates,
    details: `${e.data.summary}\n\n${SITE.url}/events/${e.id}`,
    location: e.data.location,
    ctz: SITE.timeZone,
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}
