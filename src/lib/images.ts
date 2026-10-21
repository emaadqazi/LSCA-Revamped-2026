import type { ImageMetadata } from 'astro';

const team = import.meta.glob<{ default: ImageMetadata }>('../assets/team/**/*.{png,jpg,jpeg,webp,avif}', { eager: true });
const speakers = import.meta.glob<{ default: ImageMetadata }>('../assets/speakers/*.{png,jpg,jpeg,webp,avif}', { eager: true });

/** Returns the image for a roster `photo` value, or undefined so the card falls back to initials. */
export const teamPhoto = (path?: string) => (path ? team[`../assets/team/${path}`]?.default : undefined);
export const speakerPhoto = (file?: string) => (file ? speakers[`../assets/speakers/${file}`]?.default : undefined);

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
