import { M_PER_PX } from '../data/constants';
import { KARTEN_ANKER } from '../data/settings';
import { MAP_H, MAP_W } from './mapInteraction';

/* Brücke zwischen dem Kartenraster der App (Pixel bei 12 m/px) und der echten
   Erde. Das Raster liegt als Ausschnitt der Web-Mercator-Projektion auf der
   Ankerkoordinate: Die Rastermitte (200, 260) ist der Anker, ein Pixel sind am
   Anker 12 m. Weil Web Mercator in sich linear ist, liegen Marker, Grenzen und
   Schläge damit exakt auf den Kacheln — ohne dass ihre Koordinaten umziehen
   müssen. */

const ERDUMFANG = 40075016.686; // m am Äquator, WGS84

const mercX = (lng: number) => (lng + 180) / 360;
const mercY = (lat: number) => {
  const s = Math.sin(lat * Math.PI / 180);
  return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
};
const lngOf = (x: number) => x * 360 - 180;
const latOf = (y: number) => 360 / Math.PI * Math.atan(Math.exp((0.5 - y) * 2 * Math.PI)) - 90;

const X0 = mercX(KARTEN_ANKER.lng);
const Y0 = mercY(KARTEN_ANKER.lat);
/** Mercator-Einheiten je Rasterpixel. */
const K = M_PER_PX / (ERDUMFANG * Math.cos(KARTEN_ANKER.lat * Math.PI / 180));

export interface LngLat { lng: number; lat: number }

export function pxToLngLat(x: number, y: number): LngLat {
  return { lng: lngOf(X0 + (x - MAP_W / 2) * K), lat: latOf(Y0 + (y - MAP_H / 2) * K) };
}

export function lngLatToPx(lng: number, lat: number): { x: number; y: number } {
  return { x: MAP_W / 2 + (mercX(lng) - X0) / K, y: MAP_H / 2 + (mercY(lat) - Y0) / K };
}

/** MapLibre-Zoomstufe für einen App-Zoom. MapLibre rechnet mit 512 px je
 *  Welt auf Stufe 0. */
export function mapLibreZoom(appZoom: number): number {
  return Math.log2(appZoom / (K * 512));
}

/** Kartenpixel unter einem Punkt des Kartenfensters — dieselbe Rechnung wie
 *  toMap() in mapInteraction.ts, nur ohne Ereignis. */
export function screenToPx(sx: number, sy: number, pan: { x: number; y: number }, zoom: number) {
  return {
    x: (sx - pan.x - MAP_W / 2 * (1 - zoom)) / zoom,
    y: (sy - pan.y - MAP_H / 2 * (1 - zoom)) / zoom,
  };
}

/** Kachelnummern (XYZ, 256er-Raster) eines Gebiets in Rasterpixeln. */
export function tilesFor(minPx: { x: number; y: number }, maxPx: { x: number; y: number }, z: number) {
  const n = 2 ** z;
  const x0 = Math.floor((X0 + (minPx.x - MAP_W / 2) * K) * n);
  const x1 = Math.floor((X0 + (maxPx.x - MAP_W / 2) * K) * n);
  const y0 = Math.floor((Y0 + (minPx.y - MAP_H / 2) * K) * n);
  const y1 = Math.floor((Y0 + (maxPx.y - MAP_H / 2) * K) * n);
  const out: { x: number; y: number; z: number }[] = [];
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) out.push({ x, y, z });
  return out;
}

/** Ausdehnung einer Kachel in EPSG:3857-Metern, für WMS-Abrufe. Rechnet
 *  Schritt für Schritt wie MapLibre ({bbox-epsg-3857}), damit die Adresse
 *  zeichengleich ist und der Kachelspeicher sie wiederfindet. */
export function tileBbox3857(x: number, y: number, z: number): string {
  const bb = Math.PI * 6378137;
  const t = 2 ** z - y - 1;
  const r = 2 * bb / 256 / 2 ** z;
  return `${x * 256 * r - bb},${t * 256 * r - bb},${(x + 1) * 256 * r - bb},${(t + 1) * 256 * r - bb}`;
}
