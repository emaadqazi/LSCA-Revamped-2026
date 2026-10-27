// Site-wide motion, loaded by the base layout.
//   [data-reveal]            wipes in once when it scrolls into view (styles in global.css)
//   [data-count]             counts up from 0 to its own text, e.g. "3,000+" or "24"
//   [data-track]             a scroll-driven timeline: --p runs 0→1 across the section and each
//                            [data-stop] gets .is-reached as the package passes it
// Everything settles instantly for prefers-reduced-motion, so the end state is always shown.

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Reveals -------------------------------------------------------------------------------------
const reveals = document.querySelectorAll<HTMLElement>('[data-reveal]');
// Once landed, the attribute comes off so the element's own styles (hover transitions, overflow
// decorations) apply with nothing in the way.
const land = (el: HTMLElement) => el.removeAttribute('data-reveal');
if (reduced || !('IntersectionObserver' in window)) {
  reveals.forEach(land);
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting) continue;
        const el = target as HTMLElement;
        el.classList.add('is-in');
        // The longest transition is 800ms plus the stagger delay.
        const delay = Number(getComputedStyle(el).getPropertyValue('--i') || 0) * 70;
        setTimeout(() => land(el), 900 + delay);
        io.unobserve(el);
      }
    },
    // Threshold 0: Chrome measures the clipped box, and a wiped element is only a sliver wide.
    { rootMargin: '0px 0px -12% 0px', threshold: 0 },
  );
  reveals.forEach((el) => io.observe(el));
}

// Count-ups -----------------------------------------------------------------------------------
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const counters = document.querySelectorAll<HTMLElement>('[data-count]');
if (!reduced && counters.length && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting) continue;
        io.unobserve(target);
        const el = target as HTMLElement;
        const text = el.textContent ?? '';
        const m = text.match(/^(\D*)([\d,]+)(.*)$/);
        if (!m) continue;
        const [, prefix, digits, suffix] = m;
        const end = Number(digits.replace(/,/g, ''));
        const grouped = digits.includes(',');
        const duration = 1100 + Math.min(900, end);
        const t0 = performance.now();
        const step = (now: number) => {
          const p = Math.min(1, (now - t0) / duration);
          const v = Math.round(end * easeOut(p));
          el.textContent = `${prefix}${grouped ? v.toLocaleString('en-CA') : v}${suffix}`;
          if (p < 1) requestAnimationFrame(step);
        };
        el.textContent = `${prefix}${grouped ? (0).toLocaleString('en-CA') : 0}${suffix}`;
        requestAnimationFrame(step);
      }
    },
    { threshold: 0.6 },
  );
  counters.forEach((el) => io.observe(el));
}

// Tracking timelines --------------------------------------------------------------------------
document.querySelectorAll<HTMLElement>('[data-track]').forEach((track) => {
  const path = track.querySelector<HTMLElement>('[data-track-path]');
  const stops = [...track.querySelectorAll<HTMLElement>('[data-stop]')];
  const statusEl = track.querySelector<HTMLElement>('[data-track-status]');
  const pctEl = track.querySelector<HTMLElement>('[data-track-pct]');
  if (!path || !stops.length) return;

  // The route runs from the centre of the first node to the centre of the last, so measure them.
  let start = 0;
  let length = 1;
  let at: number[] = [];
  const measure = () => {
    const centres = stops.map((s) => {
      const n = s.querySelector<HTMLElement>('[data-node]') ?? s;
      return s.offsetTop + n.offsetTop + n.offsetHeight / 2;
    });
    start = centres[0];
    length = Math.max(1, centres[centres.length - 1] - start);
    at = centres.map((c) => (c - start) / length);
    path.style.setProperty('--rail-top', `${start}px`);
    path.style.setProperty('--rail-h', `${length}px`);
  };

  const apply = (p: number) => {
    track.style.setProperty('--p', p.toFixed(4));
    let current = -1;
    stops.forEach((s, i) => {
      const reached = p >= at[i] - 0.01;
      s.classList.toggle('is-reached', reached);
      if (reached) current = i;
    });
    stops.forEach((s, i) => s.classList.toggle('is-current', i === current));
    if (statusEl && current >= 0) statusEl.textContent = stops[current].dataset.status ?? '';
    if (pctEl) pctEl.textContent = `${Math.round(p * 100)}%`;
  };

  measure();
  if (reduced) {
    apply(1);
    return;
  }

  let ticking = false;
  const update = () => {
    ticking = false;
    const top = path.getBoundingClientRect().top + start;
    // The parcel sits on the viewport's 60% line; progress is how far down the route that line is.
    const probe = innerHeight * 0.6;
    apply(Math.min(1, Math.max(0, (probe - top) / length)));
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { measure(); onScroll(); });
  // Fonts and images can shift the layout after first paint.
  addEventListener('load', () => { measure(); update(); });
  update();
});
