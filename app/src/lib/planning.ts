import type { AppState, Arrow, Extent, Point } from '../types';
import { currentJagd, treibenOf } from './selectors';
import { MAP_H, MAP_W, ZOOM_MAX, ZOOM_MIN } from './mapInteraction';
import { parse } from './geo';

/** Mitte des sichtbaren Planungsfensters zwischen Ausschnitt-Chips und Werkzeugleiste. */
export const PLAN_MITTE: Point = { x: 206, y: 215 };

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

/** Zoom und Lage der Planungskarte so, dass alle Punkte ins Fenster passen.
 *  Die Drehung bleibt: Gemessen wird die Ausdehnung so, wie sie gedreht auf
 *  dem Bildschirm liegt. */
export function fitPatch(pts: Point[], rot: number): Pick<AppState, 'pPan' | 'pZoom'> {
  const a = rot * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a);
  const O = { x: MAP_W / 2, y: MAP_H / 2 };
  const v = pts.map(p => ({ x: c * (p.x - O.x) - sn * (p.y - O.y), y: sn * (p.x - O.x) + c * (p.y - O.y) }));
  const xs = v.map(q => q.x), ys = v.map(q => q.y);
  const x1 = Math.min(...xs), x2 = Math.max(...xs), y1 = Math.min(...ys), y2 = Math.max(...ys);
  const zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.min(392 / Math.max(x2 - x1, 1), 430 / Math.max(y2 - y1, 1))));
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
  return { pZoom: zoom, pPan: { x: PLAN_MITTE.x - O.x - cx * zoom, y: PLAN_MITTE.y - O.y - cy * zoom } };
}

/** Auf einen gespeicherten Kartenausschnitt springen: Zoom und Lage so, dass
 *  der Ausschnitt die Karte füllt. */
export function extentPatch(x: Extent, rot = 0): Partial<AppState> {
  const ecken = [{ x: x.x1, y: x.y1 }, { x: x.x2, y: x.y1 }, { x: x.x2, y: x.y2 }, { x: x.x1, y: x.y2 }];
  return { ...fitPatch(ecken, rot), pView: x.id };
}

/** Das Revier einer Jagd ganz ins Planungsfenster holen. */
export function revierPatch(s: AppState, revierId: string | undefined, rot = s.pRot): Partial<AppState> {
  const r = s.revierData.find(x => x.id === revierId) ?? s.revierData.find(x => x.id === s.activeRevier) ?? s.revierData[0];
  if (!r) return { pView: 'all' };
  return { ...fitPatch(parse(r.points).map(q => ({ x: q[0], y: q[1] })), rot), pView: 'all' };
}

/** Eine Jagd samt Treiben, Ständen, Richtungen und Ausschnitten entfernen und
 *  auf die nächste verbleibende springen. Auch die letzte darf weg — dann
 *  zeigt die Planung den Start für eine neue. */
export function jagdLoeschenPatch(s: AppState, jagdId: string): Partial<AppState> {
  const tids = new Set(s.treiben.filter(t => t.jagd === jagdId).map(t => t.id));
  const rest = s.jagden.filter(j => j.id !== jagdId);
  const naechste = rest[0];
  const erstes = naechste ? treibenOf(s, naechste.id)[0] : undefined;
  return {
    jagden: rest,
    treiben: s.treiben.filter(t => !tids.has(t.id)),
    posts: s.posts.filter(x => !tids.has(x.treiben)),
    arrows: s.arrows.filter(a => !tids.has(a.treiben)),
    extents: s.extents.filter(x => x.jagd !== jagdId),
    selJagd: naechste ? naechste.id : '', selTreiben: erstes ? erstes.id : null,
    pTool: null, pPend: null, pView: 'all', pSchritt: null, pDraw: null, sheet: null,
    ...(naechste ? revierPatch(s, naechste.revier) : {}),
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
