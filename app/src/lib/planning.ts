import type { AppState, Arrow, Extent } from '../types';
import { currentJagd, treibenOf } from './selectors';

/** Linie und Pfeilspitze für eine Treibrichtung — die Spitze sitzt 13 px vor
 *  dem Zielpunkt, damit sie nicht über ihn hinausragt. */
export function arrowGeom(a: Arrow): { line: string; head: string } {
  const dx = a.x2 - a.x1, dy = a.y2 - a.y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const bx = a.x2 - ux * 13, by = a.y2 - uy * 13;
  return {
    line: `M${a.x1} ${a.y1} L${bx.toFixed(1)} ${by.toFixed(1)}`,
    head: [
      `${a.x2},${a.y2}`,
      `${(bx - uy * 5.5).toFixed(1)},${(by + ux * 5.5).toFixed(1)}`,
      `${(bx + uy * 5.5).toFixed(1)},${(by - ux * 5.5).toFixed(1)}`,
    ].join(' '),
  };
}

/** Auf einen gespeicherten Kartenausschnitt springen: Zoom und Lage so, dass
 *  der Ausschnitt die Karte füllt. */
export function extentPatch(x: Extent): Partial<AppState> {
  const w = x.x2 - x.x1, h = x.y2 - x.y1;
  const zoom = Math.max(0.6, Math.min(2.4, Math.min(392 / w, 430 / h)));
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
