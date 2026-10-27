import type { AppState, Arrow, Extent } from '../types';
import { currentJagd, treibenOf } from './selectors';
import { ZOOM_MAX, ZOOM_MIN } from './mapInteraction';

/** Linie und Pfeilspitze für eine Treibrichtung — die Spitze sitzt 13 px vor
 *  dem Zielpunkt, damit sie nicht über ihn hinausragt. `k` ist der Kehrwert
 *  des Zooms: So bleibt die Spitze auf dem Bildschirm gleich groß. */
export function arrowGeom(a: Arrow, k = 1): { line: string; head: string } {
  const dx = a.x2 - a.x1, dy = a.y2 - a.y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const spitze = Math.min(13 * k, len * 0.6), breit = spitze * 5.5 / 13;
  const bx = a.x2 - ux * spitze, by = a.y2 - uy * spitze;
  const f = (v: number) => v.toFixed(2);
  return {
    line: `M${a.x1} ${a.y1} L${f(bx)} ${f(by)}`,
    head: [
      `${a.x2},${a.y2}`,
      `${f(bx - uy * breit)},${f(by + ux * breit)}`,
      `${f(bx + uy * breit)},${f(by - ux * breit)}`,
    ].join(' '),
  };
}

/** Auf einen gespeicherten Kartenausschnitt springen: Zoom und Lage so, dass
 *  der Ausschnitt die Karte füllt. */
export function extentPatch(x: Extent): Partial<AppState> {
  const w = x.x2 - x.x1, h = x.y2 - x.y1;
  const zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.min(392 / w, 430 / h)));
  const cx = (x.x1 + x.x2) / 2, cy = (x.y1 + x.y2) / 2;
  return {
    pZoom: zoom,
    pView: x.id,
    pPan: { x: 206 - 200 - (cx - 200) * zoom, y: 215 - 260 - (cy - 260) * zoom },
  };
}

/** Ein weiteres Treiben (bzw. Gebiet bei der Drückjagd) an die Jagd hängen. */
export function addTreibenPatch(s: AppState): { patch: Partial<AppState>; message: string } {
  const jagd = currentJagd(s);
  const isDrueck = jagd.art === 'Drückjagd';
  const nr = treibenOf(s, jagd.id).length + 1;
  const id = (isDrueck ? 'd' : 't') + Date.now();
  const wort = isDrueck ? 'Gebiet ' : 'Treiben ';
  return {
    patch: {
      treiben: s.treiben.concat([{ id, jagd: jagd.id, nr, name: wort + nr, flaeche: '—', zeit: '—' }]),
      selTreiben: id,
      sheet: null,
    },
    message: wort + nr + ' angelegt — Stände setzen',
  };
}
