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

/** Mercator-Einheiten je Rasterpixel bei einer Ankerbreite. */
const kFuer = (lat: number) => M_PER_PX / (ERDUMFANG * Math.cos(lat * Math.PI / 180));

let X0 = mercX(KARTEN_ANKER.lng);
let Y0 = mercY(KARTEN_ANKER.lat);
let K = kFuer(KARTEN_ANKER.lat);

/** Setzt den Anker — die Store-Schicht ruft das mit dem gespeicherten Anker
 *  auf, bevor irgendetwas gezeichnet oder umgerechnet wird. */
export function setAnker(a: { lat: number; lng: number }): void {
  X0 = mercX(a.lng);
  Y0 = mercY(a.lat);
  K = kFuer(a.lat);
}

/** Der Anker, bei dem der Rasterpunkt `px` auf `ziel` zu liegen kommt — so
 *  wandert ein Revier samt allem, was dazugehört, an seine echte Stelle. */
export function ankerFuer(ziel: { lat: number; lng: number }, px: { x: number; y: number }): { lat: number; lng: number } {
  let lat = ziel.lat;
  for (let i = 0; i < 3; i++) lat = latOf(mercY(ziel.lat) - (px.y - MAP_H / 2) * kFuer(lat));
  const k = kFuer(lat);
  return { lat, lng: lngOf(mercX(ziel.lng) - (px.x - MAP_W / 2) * k) };
}

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
export function screenToPx(sx: number, sy: number, pan: { x: number; y: number }, zoom: number, rot = 0) {
  const a = -rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  const vx = (sx - pan.x - MAP_W / 2) / zoom, vy = (sy - pan.y - MAP_H / 2) / zoom;
  return { x: MAP_W / 2 + c * vx - s * vy, y: MAP_H / 2 + s * vx + c * vy };
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
