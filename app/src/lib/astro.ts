/* Sonne, Dämmerung und Mond für den Revierstandort — lokal gerechnet, damit
   das Büchsenlicht auch ohne Empfang stimmt. Die Mondauf-/-untergänge sind auf
   etwa ±10 min genau; produktiv gehört hier das volle Mondmodell hinterlegt. */

import { REVIER_LAT, REVIER_LNG } from '../data/constants';
import type { BuechsenlichtMode } from '../data/settings';

const RAD = Math.PI / 180;
const J1970 = 2440588;
const J2000 = 2451545;
export const DAYMS = 86400000;
const OBL = 23.4397 * RAD;
/** Mittlere Entfernung Erde–Sonne in km. */
const SDIST = 149598000;

const toDays = (d: Date) => d.valueOf() / DAYMS - 0.5 + J1970 - J2000;
const decl = (l: number, b: number) => Math.asin(Math.sin(b) * Math.cos(OBL) + Math.cos(b) * Math.sin(OBL) * Math.sin(l));
const rasc = (l: number, b: number) => Math.atan2(Math.sin(l) * Math.cos(OBL) - Math.tan(b) * Math.sin(OBL), Math.cos(l));
const sMeanAnom = (d: number) => RAD * (357.5291 + 0.98560028 * d);
const eclLon = (M: number) => M + RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + RAD * 102.9372 + Math.PI;
const fromJulian = (j: number) => new Date((j + 0.5 - J1970) * DAYMS);
const sidereal = (d: number, lw: number) => RAD * (280.16 + 360.9856235 * d) - lw;
const clamp1 = (x: number) => Math.max(-1, Math.min(1, x));

function sunCoords(d: number) {
  const M = sMeanAnom(d), L = eclLon(M);
  return { dec: decl(L, 0), ra: rasc(L, 0), M, L };
}

function moonCoords(d: number) {
  const L = RAD * (218.316 + 13.176396 * d);
  const M = RAD * (134.963 + 13.064993 * d);
  const F = RAD * (93.272 + 13.229350 * d);
  const l = L + RAD * 6.289 * Math.sin(M);
  const b = RAD * 5.128 * Math.sin(F);
  const dt = 385001 - 20905 * Math.cos(M);
  return { ra: rasc(l, b), dec: decl(l, b), dist: dt };
}

function altOf(ra: number, dec: number, d: number, lat: number, lng: number) {
  const H = sidereal(d, -lng * RAD) - ra, phi = lat * RAD;
  return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
}

function moonAlt(date: Date, lat: number, lng: number) {
  const d = toDays(date), c = moonCoords(d);
  return altOf(c.ra, c.dec, d, lat, lng);
}

/** Rise/set for a given sun altitude: −0.833° = Sonnenauf-/-untergang,
 *  −6° = bürgerliche Dämmerung. Null when the sun never reaches it. */
function sunEvent(date: Date, lat: number, lng: number, hDeg: number): { rise: Date | null; set: Date | null } {
  const lw = -lng * RAD, phi = lat * RAD, d = toDays(date);
  const n = Math.round(d - 0.0009 - lw / (2 * Math.PI));
  const ds = 0.0009 + lw / (2 * Math.PI) + n;
  const M = sMeanAnom(ds), L = eclLon(M), dec = decl(L, 0);
  const noon = J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
  const h = hDeg * RAD;
  const x = (Math.sin(h) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec));
  if (x < -1 || x > 1) return { rise: null, set: null };
  const w = Math.acos(x);
  const a = 0.0009 + (w + lw) / (2 * Math.PI) + n;
  const jSet = J2000 + a + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
  return { rise: fromJulian(noon - (jSet - noon)), set: fromJulian(jSet) };
}

/** Offset of Europe/Berlin from UTC in whole hours, on the given date. */
function berlinOffset(d: Date): number {
  const s = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  const u = new Date(d.toLocaleString('en-US', { timeZone: 'UTC' }));
  return Math.round((s.getTime() - u.getTime()) / 3600000);
}

/** Berlin wall-clock hour as a fraction — 20:53 → 20.883. */
function berlinHour(d: Date): number {
  const t = new Date(d.getTime() + berlinOffset(d) * 3600000);
  return t.getUTCHours() + t.getUTCMinutes() / 60 + t.getUTCSeconds() / 3600;
}

export function clock(d: Date | null): string {
  return d ? d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Berlin' }) : '—';
}

const NIGHT = '#23231c';
const TWI = 'var(--bl)';
const DAY = 'var(--m-grass)';

export interface Band {
  left: string;
  width: string;
  background: string;
  opacity?: number;
}

/** Ein Tag im Fünf-Tage-Überblick: Lichtbänder über 24 h und die Zeiten dazu. */
export interface DayLight {
  /** „Heute“, „Morgen“ oder Wochentag. */
  label: string;
  /** 16.10. */
  dateShort: string;
  /** Fr., 16.10.2026 */
  dateLong: string;
  blStart: string;
  blEnd: string;
  sunrise: string;
  sunset: string;
  /** Nacht / Büchsenlicht / Tag across the 24-hour bar. */
  bands: Band[];
  /** Mondlicht in der Dunkelheit, je Viertelstunde, als halbhoher Streifen; Deckkraft = Helligkeit. */
  moonGlow: Band[];
  showNow: boolean;
  nowLeft: string;
  moonLit: string;
  moonPhase: string;
  moonRise: string;
  moonSet: string;
  moonHigh: string;
  moonAge: string;
  /** Stunden mit nutzbarem Mondlicht in der Dunkelheit, z. B. „4,5 h“. */
  moonHours: string;
  /** dunkel / mittel / hell — Mondlicht über die Dunkelheit des Tages. */
  moonRating: 'dunkel' | 'mittel' | 'hell';
  moonVerdict: string;
}

export interface LightInfo {
  place: string;
  days: DayLight[];
  legend: Array<{ label: string; background: string; height: number }>;
  rule: string;
  /** Header subtitle on the Ansitz screen. */
  sub: string;
}

const MOON = 'var(--moon)';
/** Mondlicht ab dieser Höhe über dem Horizont zählt; darunter schluckt es Wald und Dunst. */
const MOON_MIN_ALT = 5 * RAD;

function computeDay(dayOff: number, mode: BuechsenlichtMode): DayLight {
  const lat = REVIER_LAT, lng = REVIER_LNG;
  const base = new Date(Date.now() + dayOff * DAYMS);

  // Berliner Mitternacht des Zieltages
  const tzo = berlinOffset(base) * 3600000;
  const mid = new Date(Math.floor((base.getTime() + tzo) / DAYMS) * DAYMS - tzo);

  const sun = sunEvent(base, lat, lng, -0.833);
  const civ = sunEvent(base, lat, lng, -6);
  // Am Revierstandort geht die Sonne jeden Tag auf; die Rückfallwerte greifen
  // nur, falls der Standort einmal jenseits des Polarkreises liegt.
  const sunRise = sun.rise ?? mid;
  const sunSet = sun.set ?? new Date(mid.getTime() + DAYMS - 1);

  const off = mode === 'sa60' ? 60 : mode === 'sa30' ? 30 : 0;
  const blS = mode === 'daemmerung' ? (civ.rise ?? sunRise) : new Date(sunRise.getTime() - off * 60000);
  const blE = mode === 'daemmerung' ? (civ.set ?? sunSet) : new Date(sunSet.getTime() + off * 60000);

  const blSh = berlinHour(blS), blEh = berlinHour(blE);

  // Beleuchteter Anteil der Mondscheibe, zur Tagesmitte gerechnet.
  const dS = toDays(new Date(mid.getTime() + DAYMS / 2)), sc = sunCoords(dS), mc = moonCoords(dS);
  const phi = Math.acos(clamp1(Math.sin(sc.dec) * Math.sin(mc.dec) + Math.cos(sc.dec) * Math.cos(mc.dec) * Math.cos(sc.ra - mc.ra)));
  const inc = Math.atan2(SDIST * Math.sin(phi), mc.dist - SDIST * Math.cos(phi));
  const ang = Math.atan2(
    Math.cos(sc.dec) * Math.sin(sc.ra - mc.ra),
    Math.sin(sc.dec) * Math.cos(mc.dec) - Math.cos(sc.dec) * Math.sin(mc.dec) * Math.cos(sc.ra - mc.ra),
  );
  const frac = (1 + Math.cos(inc)) / 2;
  const ph = 0.5 + 0.5 * inc * (ang < 0 ? -1 : 1) / Math.PI;
  const waxing = ph < 0.5;
  const phaseName = frac > 0.97 ? 'Vollmond' : frac < 0.04 ? 'Neumond'
    : Math.abs(frac - 0.5) < 0.06 ? (waxing ? 'erstes Viertel' : 'letztes Viertel')
    : (waxing ? 'zunehmend' : 'abnehmend');
  const litPct = Math.round(frac * 100);

  // Mond in Viertelstundenschritten durch den Tag verfolgen: Auf- und Untergang,
  // Höchststand, und wie hell er in der Dunkelheit leuchtet. Helligkeit je
  // Schritt = beleuchteter Anteil × Sinus der Höhe (flacher Mond leuchtet
  // schwächer); 1 entspricht etwa Vollmond auf 40° Höhe.
  let mRise: Date | null = null, mSet: Date | null = null, maxAlt = -90, upDark = 0, lightSum = 0;
  const moonGlow: Band[] = [];
  let prev = moonAlt(mid, lat, lng);
  for (let i = 1; i <= 96; i++) {
    const t = new Date(mid.getTime() + i * 900000);
    const a = moonAlt(t, lat, lng);
    const deg = a / RAD;
    if (deg > maxAlt) maxAlt = deg;
    if (prev < 0 && a >= 0 && !mRise) mRise = t;
    if (prev >= 0 && a < 0 && !mSet) mSet = t;
    const h = berlinHour(t) || 24;
    const dark = h - 0.25 < blSh || h - 0.25 >= blEh;
    if (dark && a > MOON_MIN_ALT) {
      const intensity = Math.min(1, frac * Math.sin(a) / 0.64);
      upDark += 0.25;
      lightSum += intensity * 0.25;
      if (intensity > 0.03) {
        moonGlow.push({
          left: ((h - 0.25) / 24 * 100) + '%',
          width: (0.25 / 24 * 100) + '%',
          background: MOON,
          opacity: 0.15 + 0.75 * intensity,
        });
      }
    }
    prev = a;
  }

  const band = (x1: number, x2: number, background: string): Band => ({
    left: (x1 / 24 * 100) + '%',
    width: ((x2 - x1) / 24 * 100) + '%',
    background,
  });
  const srh = berlinHour(sunRise), ssh = berlinHour(sunSet);
  const bands = [
    band(0, blSh, NIGHT), band(blSh, srh, TWI), band(srh, ssh, DAY),
    band(ssh, blEh, TWI), band(blEh, 24, NIGHT),
  ];

  const rating: DayLight['moonRating'] = lightSum < 0.75 || frac < 0.15 ? 'dunkel' : lightSum < 3 ? 'mittel' : 'hell';
  const hours = (Math.round(upDark * 2) / 2).toLocaleString('de-DE') + ' h';
  const verdict = rating === 'dunkel'
    ? 'Dunkle Nacht: nach ' + clock(blE) + ' kaum Mondlicht. Wild bewegt sich früher, Ansitz zeitig besetzen.'
    : rating === 'hell'
    ? 'Helle Nacht: Mond zu ' + litPct + ' %, ' + hours + ' in der Dunkelheit über dem Horizont. Gutes Licht an der Kirrung, Wild aber wachsam und offene Flächen werden gemieden.'
    : 'Mond zu ' + litPct + ' % (' + phaseName + '), ' + hours + ' in der Dunkelheit über dem Horizont, brauchbares Restlicht an offenen Schlägen.';

  const nowH = berlinHour(new Date());
  const tz = { timeZone: 'Europe/Berlin' } as const;
  return {
    label: dayOff === 0 ? 'Heute' : dayOff === 1 ? 'Morgen' : base.toLocaleDateString('de-DE', { weekday: 'short', ...tz }),
    dateShort: base.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', ...tz }),
    dateLong: base.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', ...tz }),
    blStart: clock(blS), blEnd: clock(blE),
    sunrise: clock(sunRise), sunset: clock(sunSet),
    bands, moonGlow,
    showNow: dayOff === 0,
    nowLeft: (nowH / 24 * 100) + '%',
    moonLit: litPct + ' %',
    moonPhase: phaseName,
    moonRise: clock(mRise),
    moonSet: clock(mSet),
    moonHigh: maxAlt > 0 ? 'max ' + Math.round(maxAlt) + '° hoch' : 'bleibt unter Horizont',
    moonAge: Math.round(ph * 29.53) + '. Mondtag',
    moonHours: hours,
    moonRating: rating,
    moonVerdict: verdict,
  };
}

/** Licht für heute und die folgenden Tage, am Revierstandort gerechnet. */
export function computeLight(mode: BuechsenlichtMode, dayCount = 5): LightInfo {
  const days = Array.from({ length: dayCount }, (_, i) => computeDay(i, mode));
  const off = mode === 'sa60' ? 60 : mode === 'sa30' ? 30 : 0;
  return {
    place: 'Revier Eichenkamp · 52,62° N 9,21° O',
    days,
    legend: [
      { label: 'Nacht', background: NIGHT, height: 8 },
      { label: 'Büchsenlicht', background: TWI, height: 8 },
      { label: 'Tag', background: DAY, height: 8 },
      { label: 'Mondlicht', background: MOON, height: 4 },
    ],
    rule: mode === 'daemmerung'
      ? 'Büchsenlicht = bürgerliche Dämmerung (Sonne 6° unter dem Horizont), für den Revierstandort gerechnet. Mondlicht: silberner Streifen in der unteren Hälfte, je kräftiger, desto mehr Licht (Mondphase × Höhe über dem Horizont).'
      : 'Büchsenlicht = Sonnenaufgang/-untergang ± ' + off + ' min (in Einstellungen umstellbar). Mondlicht: silberner Streifen in der unteren Hälfte, je kräftiger, desto mehr Licht (Mondphase × Höhe über dem Horizont).',
    sub: 'Büchsenlicht ' + days[0].blStart + ' – ' + days[0].blEnd,
  };
}
