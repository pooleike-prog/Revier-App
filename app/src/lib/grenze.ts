import { M_PER_PX } from '../data/constants';
import type { Vertex } from './geo';

/* Reviergrenze zeichnen mit Fadenkreuz: die Karte wandert unter ein festes
   Kreuz, ein einziger großer Knopf tut, was dort gerade sinnvoll ist. Hier
   steht die reine Logik — was liegt unter dem Kreuz, kreuzt sich die Grenze,
   Rückgängig/Wiederholen. Koordinaten sind Kartenpixel wie im Rest der App;
   alle Längen gehen über M_PER_PX, damit der Umstieg auf echte Koordinaten
   nur die Abstandsfunktion betrifft. */

export type ZielArt =
  /** Freie Fläche: neuer Punkt genau unter dem Kreuz. */
  | 'frei'
  /** Erster Punkt eines offenen Entwurfs ab drei Punkten: Ring schließen. */
  | 'erster'
  /** Ein Punkt des eigenen Entwurfs: greifen und verschieben. */
  | 'punkt'
  /** Mitte einer eigenen Kante: Punkt einfügen. */
  | 'mitte'
  /** Eckpunkt eines anderen Reviers oder Schlags: dort einrasten. */
  | 'fremdPunkt'
  /** Kante eines anderen Reviers oder Schlags: auf die Linie einrasten. */
  | 'fremdKante';

export interface Ziel {
  art: ZielArt;
  /** Was gesetzt würde — beim Einrasten der Fangpunkt, nicht die Kreuzmitte. */
  pt: Vertex;
  /** Punkt- bzw. Kantenindex im Entwurf, sonst -1. */
  i: number;
}

export interface Entwurf {
  pts: Vertex[];
  closed: boolean;
}

/** Fangradius in Bildschirmpixeln: etwa eine Fingerkuppe mit Handschuh. */
export const FANG_PX = 22;

const dist = (a: Vertex, b: Vertex) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const meter = (a: Vertex, b: Vertex) => dist(a, b) * M_PER_PX;
export const mid = (a: Vertex, b: Vertex): Vertex => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

/** Fußpunkt des Lots von p auf die Strecke a–b. */
export function foot(p: Vertex, a: Vertex, b: Vertex): Vertex {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (!len2) return a;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  return [a[0] + t * dx, a[1] + t * dy];
}

/** Kanten eines Entwurfs: geschlossen mit Schlusskante, offen ohne. */
function edges(e: Entwurf): Array<[Vertex, Vertex]> {
  const n = e.pts.length;
  const out: Array<[Vertex, Vertex]> = [];
  for (let i = 0; i < (e.closed ? n : n - 1); i++) out.push([e.pts[i], e.pts[(i + 1) % n]]);
  return n >= 2 ? out : [];
}

/** Was liegt unter dem Fadenkreuz? `radius` in Kartenpixeln.
 *  Eigene Punkte gehen vor Kantenmitten, die vor fremden Grenzen — wer
 *  korrigieren will, soll nicht auf die Nachbargrenze springen. Während ein
 *  Punkt gegriffen ist, zählen nur fremde Grenzen, sonst klebt er an sich selbst. */
export function zielUnterKreuz(
  c: Vertex, e: Entwurf, fremde: Vertex[][], radius: number, gegriffen: number | null,
): Ziel {
  let best: Ziel | null = null, bestD = radius;
  const probe = (art: ZielArt, pt: Vertex, i = -1) => {
    const d = dist(c, pt);
    if (d <= bestD) { best = { art, pt, i }; bestD = d; }
  };

  if (gegriffen === null) {
    e.pts.forEach((p, i) => probe(i === 0 && !e.closed && e.pts.length >= 3 ? 'erster' : 'punkt', p, i));
    if (best) return best;
    edges(e).forEach(([a, b], i) => probe('mitte', mid(a, b), i));
    if (best) return best;
  }
  for (const ring of fremde) ring.forEach(p => probe('fremdPunkt', p));
  if (best) return best;
  for (const ring of fremde) {
    ring.forEach((a, i) => probe('fremdKante', foot(c, a, ring[(i + 1) % ring.length])));
  }
  return best ?? { art: 'frei', pt: c, i: -1 };
}

const cross = (o: Vertex, a: Vertex, b: Vertex) =>
  (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

/** Echter Schnitt zweier Strecken; Berühren an Endpunkten zählt nicht. */
function intersects(p1: Vertex, p2: Vertex, p3: Vertex, p4: Vertex): boolean {
  const d1 = cross(p3, p4, p1), d2 = cross(p3, p4, p2);
  const d3 = cross(p1, p2, p3), d4 = cross(p1, p2, p4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

/** Kreuzt sich der Ring selbst (mit gedachter Schlusskante)? */
export function selfIntersects(pts: Vertex[]): boolean {
  const n = pts.length;
  if (n < 4) return false;
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue; // teilen den ersten Punkt
      if (intersects(pts[i], pts[(i + 1) % n], pts[j], pts[(j + 1) % n])) return true;
    }
  }
  return false;
}

/** Würde die Kante vom letzten Punkt nach `next` eine bestehende kreuzen? */
export function nextEdgeCrosses(pts: Vertex[], next: Vertex): boolean {
  const last = pts[pts.length - 1];
  for (let i = 0; i + 2 < pts.length; i++) {
    if (intersects(pts[i], pts[i + 1], last, next)) return true;
  }
  return false;
}

/** Umfang (geschlossen) bzw. Länge (offen) in Metern. */
export function laenge(e: Entwurf): number {
  return edges(e).reduce((s, [a, b]) => s + meter(a, b), 0);
}

export const fertigMoeglich = (e: Entwurf) => e.pts.length >= 3 && !selfIntersects(e.pts);

// ── Bearbeiten mit Verlauf ──────────────────────────────────────────────

export interface Verlauf {
  jetzt: Entwurf;
  zurueck: Entwurf[];
  vor: Entwurf[];
}

export const neuerVerlauf = (pts: Vertex[] = [], closed = false): Verlauf =>
  ({ jetzt: { pts, closed }, zurueck: [], vor: [] });

function weiter(v: Verlauf, neu: Entwurf): Verlauf {
  return { jetzt: neu, zurueck: v.zurueck.concat([v.jetzt]), vor: [] };
}

const round = (p: Vertex): Vertex => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10];

export type Aktion =
  | { t: 'setzen'; pt: Vertex }
  | { t: 'einfuegen'; i: number; pt: Vertex }
  | { t: 'verschieben'; i: number; pt: Vertex }
  | { t: 'loeschen'; i: number }
  | { t: 'schliessen' }
  | { t: 'zurueck' }
  | { t: 'vor' };

export function anwenden(v: Verlauf, a: Aktion): Verlauf {
  const { pts, closed } = v.jetzt;
  switch (a.t) {
    case 'setzen': {
      if (closed) return v;
      // Doppelt gedrückt mit Handschuh: denselben Punkt nicht zweimal.
      if (pts.length && dist(pts[pts.length - 1], a.pt) < 0.5) return v;
      return weiter(v, { pts: pts.concat([round(a.pt)]), closed });
    }
    case 'einfuegen': {
      const n = pts.slice();
      n.splice(a.i + 1, 0, round(a.pt));
      return weiter(v, { pts: n, closed });
    }
    case 'verschieben': {
      const n = pts.slice();
      n[a.i] = round(a.pt);
      return weiter(v, { pts: n, closed });
    }
    case 'loeschen': {
      const n = pts.filter((_, i) => i !== a.i);
      // Unter drei Punkten gibt es keine Fläche mehr.
      return weiter(v, { pts: n, closed: closed && n.length >= 3 });
    }
    case 'schliessen':
      return closed || pts.length < 3 ? v : weiter(v, { pts, closed: true });
    case 'zurueck':
      if (!v.zurueck.length) return v;
      return { jetzt: v.zurueck[v.zurueck.length - 1], zurueck: v.zurueck.slice(0, -1), vor: v.vor.concat([v.jetzt]) };
    case 'vor':
      if (!v.vor.length) return v;
      return { jetzt: v.vor[v.vor.length - 1], zurueck: v.zurueck.concat([v.jetzt]), vor: v.vor.slice(0, -1) };
  }
}
