import { feature } from 'topojson-client';
import { geoContains } from 'd3-geo';
import type { Topology, GeometryCollection } from 'topojson-specification';
import land110 from 'world-atlas/land-110m.json';

/**
 * Evenly spaced dots on land, as a flat [lat*10, lon*10, ...] array.
 * Computed once at build time so the browser never downloads map data.
 */
function compute(step = 1.5) {
  const topo = land110 as unknown as Topology<{ land: GeometryCollection }>;
  const land = feature(topo, topo.objects.land);
  const out: number[] = [];
  for (let lat = -56; lat <= 78; lat += step) {
    const lonStep = step / Math.max(0.2, Math.cos((lat * Math.PI) / 180));
    for (let lon = -180; lon < 180; lon += lonStep) {
      if (geoContains(land, [lon, lat])) out.push(Math.round(lat * 10), Math.round(lon * 10));
    }
  }
  return out;
}

export const landDots = compute();
