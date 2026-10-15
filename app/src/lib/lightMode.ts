/* Die drei Lichtmodi: Tag, Dämmerung, Rotlicht. Im Automatikbetrieb folgt die
   App dem Sonnenstand am Revier — wer um 20:40 auf dem Ansitz sitzt, soll
   nicht erst in die Einstellungen müssen, bevor das Display die Augen blendet.
   Gerechnet wird lokal, damit es ohne Empfang genauso schaltet. */

import { REVIER_LAT, REVIER_LNG } from '../data/constants';

export type Licht = 'tag' | 'daemmerung' | 'rotlicht';
/** Was der Jäger eingestellt hat: fest ein Modus oder nach Sonnenstand. */
export type LichtWahl = 'auto' | Licht;

/** Sonne höher als 6° — volles Tageslicht, Tagmodus. */
const TAG_AB = 6;
/** Sonne tiefer als 6° unter dem Horizont (Ende der bürgerlichen Dämmerung) —
 *  ab hier ist es Nacht fürs Auge, Rotlicht. */
const ROT_AB = -6;
/** Hysterese, damit der Modus an der Schwelle nicht hin- und herflackert. */
const HYST = 0.5;

const RAD = Math.PI / 180;

/** Sonnenhöhe in Grad für Ort und Zeitpunkt (Genauigkeit ~0,1°, reicht zum Umschalten). */
export function sunAltitude(date: Date, lat = REVIER_LAT, lng = REVIER_LNG): number {
  const d = date.valueOf() / 86400000 - 0.5 + 2440588 - 2451545;
  const M = RAD * (357.5291 + 0.98560028 * d);
  const L = M + RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + RAD * 102.9372 + Math.PI;
  const obl = 23.4397 * RAD;
  const dec = Math.asin(Math.sin(obl) * Math.sin(L));
  const ra = Math.atan2(Math.sin(L) * Math.cos(obl), Math.cos(L));
  const H = RAD * (280.16 + 360.9856235 * d) + lng * RAD - ra;
  const phi = lat * RAD;
  return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H)) / RAD;
}

/** Modus zur Sonnenhöhe. `prev` ist der bisherige Modus: Den hält die Schwelle
 *  um die Hysterese länger fest, ein Wechsel braucht den vollen Schritt. */
export function lichtForAltitude(alt: number, prev?: Licht): Licht {
  const tag = TAG_AB + (prev === 'tag' ? -HYST : HYST);
  const rot = ROT_AB + (prev === 'rotlicht' ? HYST : -HYST);
  if (alt >= tag) return 'tag';
  if (alt <= rot) return 'rotlicht';
  return 'daemmerung';
}

/** Der Modus, der gerade gilt. */
export function resolveLicht(wahl: LichtWahl, now: Date, prev?: Licht): Licht {
  return wahl === 'auto' ? lichtForAltitude(sunAltitude(now), prev) : wahl;
}

export const LICHT_LABEL: Record<Licht, string> = {
  tag: 'Tag',
  daemmerung: 'Dämmerung',
  rotlicht: 'Rotlicht',
};

/** Kurzform für den Knopf in der Kopfzeile. */
export const LICHT_KURZ: Record<Licht, string> = {
  tag: 'TAG',
  daemmerung: 'DÄM',
  rotlicht: 'ROT',
};

/** Farbe der Android-Systemleisten je Modus — gleich dem Hintergrund (--bg). */
export const LICHT_BAR: Record<Licht, string> = {
  tag: '#f2eee2',
  daemmerung: '#161c14',
  rotlicht: '#070000',
};
