import { SITE } from './site';

const tz = SITE.timeZone;

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, ...opts });

export const day = (d: Date) => fmt({ day: 'numeric' }).format(d);
export const monthShort = (d: Date) => fmt({ month: 'short' }).format(d).replace('.', '');
export const weekdayShort = (d: Date) => fmt({ weekday: 'short' }).format(d).replace('.', '');
export const monthYear = (d: Date) => fmt({ month: 'long', year: 'numeric' }).format(d);
export const longDate = (d: Date) => fmt({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(d);
export const shortDate = (d: Date) => fmt({ month: 'short', day: 'numeric', year: 'numeric' }).format(d);

export function time(d: Date) {
  return fmt({ hour: 'numeric', minute: '2-digit', hour12: true }).format(d).replace(':00', '').replace(/\s?([ap])\.?m\.?/i, ' $1m');
}

export function timeRange(start: Date, end?: Date, allDay = false) {
  if (allDay) return 'All day';
  return end ? `${time(start)} – ${time(end)}` : time(start);
}

/** Toronto calendar date as YYYY-MM-DD, so grouping never drifts across UTC midnight. */
export function ymd(d: Date) {
  return fmt({ year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
export const monthKey = (d: Date) => ymd(d).slice(0, 7);

export function startOfToday() {
  const [y, m, dd] = ymd(new Date()).split('-').map(Number);
  // Midnight Toronto ≈ 04:00/05:00 UTC; using 04:00 UTC keeps "today's" events upcoming all day.
  return new Date(Date.UTC(y, m - 1, dd, 4));
}

export type Status = 'past' | 'this-week' | 'upcoming';
export function status(start: Date, end?: Date): Status {
  const today = startOfToday();
  if ((end ?? start) < today) return 'past';
  const week = new Date(today.valueOf() + 7 * 864e5);
  return start < week ? 'this-week' : 'upcoming';
}

export function groupByMonth<T>(items: T[], getDate: (t: T) => Date) {
  const groups = new Map<string, { label: string; items: T[] }>();
  for (const it of items) {
    const d = getDate(it);
    const k = monthKey(d);
    if (!groups.has(k)) groups.set(k, { label: monthYear(d), items: [] });
    groups.get(k)!.items.push(it);
  }
  return [...groups.entries()].map(([key, g]) => ({ key, ...g }));
}
