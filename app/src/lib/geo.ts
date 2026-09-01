import { COMPASS, M_PER_PX } from '../data/constants';

export type Vertex = [number, number];

/** "30,45 175,20" → [[30,45],[175,20]] */
export function parse(pts: string): Vertex[] {
  return pts.trim().split(/\s+/).map(p => p.split(',').map(Number) as Vertex);
}

export function toStr(p: Vertex[]): string {
  return p.map(q => Math.round(q[0]) + ',' + Math.round(q[1])).join(' ');
}

/** Shoelace area of a polygon, converted from map pixels to hectares. */
export function ha(pts: string | Vertex[]): number {
  const p = Array.isArray(pts) ? pts : parse(pts);
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const q = p[(i + 1) % p.length];
    a += p[i][0] * q[1] - q[0] * p[i][1];
  }
  return Math.abs(a / 2) * M_PER_PX * M_PER_PX / 10000;
}

/** Ray casting — used to find which Schlag a Trennlinie runs through. */
export function inPoly(pt: Vertex, poly: Vertex[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Split a polygon along the infinite line a→b. Straight cuts only — an
 *  einbuchtiger Schlag would need a polyline cut. Null if the line misses. */
export function cut(poly: Vertex[], a: Vertex, b: Vertex): [Vertex[], Vertex[]] | null {
  const side = (p: Vertex) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  const isect = (p: Vertex, q: Vertex): Vertex => {
    const s1 = side(p), s2 = side(q), t = s1 / (s1 - s2);
    return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  };
  const L: Vertex[] = [], R: Vertex[] = [];
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i], nxt = poly[(i + 1) % poly.length];
    const sc = side(cur), sn = side(nxt);
    if (sc >= 0) L.push(cur);
    if (sc <= 0) R.push(cur);
    if ((sc > 0 && sn < 0) || (sc < 0 && sn > 0)) { const X = isect(cur, nxt); L.push(X); R.push(X); }
  }
  if (L.length < 3 || R.length < 3) return null;
  return [L, R];
}

/** German decimal notation: 12.5 → "12,5" */
export function fmt(n: number, d = 1): string {
  return n.toFixed(d).replace('.', ',');
}

/** Map pixels → the demo Revier's coordinates. */
export function gps(x: number, y: number): string {
  return (52.318 + (520 - y) * 0.000108).toFixed(5).replace('.', ',') + ' N  '
    + (9.742 + x * 0.000175).toFixed(5).replace('.', ',') + ' E';
}

/** Himmelsrichtung of a vector in screen space (y grows southward). */
export function compass(dx: number, dy: number): string {
  const ang = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
  return COMPASS[Math.round(ang / 45) % 8];
}
