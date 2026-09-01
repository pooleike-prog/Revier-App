import type { MarkerType } from '../types';

/** Lucide-style single-path pictograms, drawn at 24×24 with currentColor. */
export const ICON: Record<string, string> = {
  ansitz: 'M12 3l6 5H6zM8 8v13M16 8v13M8 14h8',
  falle: 'M12 4l-8 6h16zM7 20v-8M12 20v-8M17 20v-8M4 20h16',
  wechsel: 'M3 17h6l4-10h5M15 3l4 4-4 4',
  kirrung: 'M4 20h16M6 20c1-6 4-9 6-9s5 3 6 9M12 11V5M9 7l3-3 3 3',
  best: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7zM12 9a3 3 0 100 6 3 3 0 000-6',
  salz: 'M8 8h8l-1 12H9zM10 8V5h4v3M10 13h4',
  erleg: 'M12 2v6M12 16v6M2 12h6M16 12h6M12 8a4 4 0 100 8 4 4 0 000-8',
  schuetze: 'M12 3a3 3 0 100 6 3 3 0 000-6M6 21v-2a6 6 0 0112 0v2',
  stand: 'M5 21h14M12 21V9M7 9h10l-5-6z',
  arrow: 'M4 12h13M13 7l5 5-5 5M4 5v14',
  split: 'M4 4l16 16M9 3l-6 6M15 21l6-6',
  extent: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
};

export interface MarkerTypeDef {
  id: MarkerType;
  /** Kürzel wie auf gedruckten Revierkarten. */
  code: string;
  label: string;
  short: string;
  /** Accent pins are filled — they mark events, not installations. */
  accent: boolean;
}

export const TYPES: MarkerTypeDef[] = [
  { id: 'ansitz', code: 'A', label: 'Ansitz / Hochsitz', short: 'Ansitz', accent: false },
  { id: 'falle', code: 'F', label: 'Falle', short: 'Falle', accent: false },
  { id: 'wechsel', code: 'W', label: 'Wechsel', short: 'Wechsel', accent: false },
  { id: 'kirrung', code: 'K', label: 'Kirrung / Luderplatz', short: 'Kirrung', accent: false },
  { id: 'best', code: 'T', label: 'Tierbestätigung', short: 'Bestätigung', accent: true },
  { id: 'salz', code: 'S', label: 'Salzlecke', short: 'Salzlecke', accent: false },
  { id: 'erleg', code: 'E', label: 'Erlegungsort', short: 'Erlegung', accent: true },
];

export const CROPS = [
  'Wintergerste', 'Winterweizen', 'Silomais', 'Winterraps',
  'Zuckerrübe', 'Kleegras', 'Grünland', 'Brache',
];

export const WILD = [
  'Rehwild', 'Schwarzwild', 'Rotwild', 'Damwild',
  'Feldhase', 'Fuchs', 'Waschbär', 'Stockente',
];

/** Map scale of the prototype geometry: one pixel is twelve metres. */
export const M_PER_PX = 12;

export const COMPASS = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];

export const MON = ['', 'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

/** Demo-Stichtag der Jagdzeiten-Auswertung: 28. August. */
export const HEUTE: [number, number] = [8, 28];
export const HEUTE_TEXT = '28.08.2026';

/** [Art, Klasse, von [Monat, Tag], bis [Monat, Tag]] — [0,0] heißt ganzjährig geschützt. */
export type ZeitRow = [string, string, [number, number], [number, number]];

export interface ZeitGroup {
  id: string;
  name: string;
  rows: ZeitRow[];
}

/* Die Kategorien sind jagdpraktisch, nicht taxonomisch trennscharf — Schalen-
   und Raubwild sind streng genommen Teilmengen des Haarwilds. Zeiten nach
   Bundes- und Landesverordnung Niedersachsen; Elterntierschutz und behördliche
   Abweichungen sind noch nicht eingepflegt. */
export const ZEIT_GROUPS: ZeitGroup[] = [
  {
    id: 'schalen', name: 'Schalenwild', rows: [
      ['Rehwild', 'Bock, Schmalreh', [5, 1], [10, 15]],
      ['Rehwild', 'Ricke, Kitz', [9, 1], [1, 31]],
      ['Rotwild', 'Hirsch, Alttier', [8, 1], [1, 31]],
      ['Rotwild', 'Kalb, Schmaltier, Schmalspießer', [8, 1], [2, 28]],
      ['Damwild', 'Hirsch, Alttier', [9, 1], [1, 31]],
      ['Damwild', 'Kalb, Schmaltier', [8, 1], [2, 28]],
      ['Schwarzwild', 'Keiler, Überläufer, Frischling', [1, 1], [12, 31]],
      ['Schwarzwild', 'Bache, nicht führend', [6, 16], [1, 31]],
      ['Muffelwild', 'alle Altersklassen', [8, 1], [1, 31]],
    ],
  },
  {
    id: 'haar', name: 'Haarwild', rows: [
      ['Feldhase', 'alle', [10, 1], [1, 15]],
      ['Wildkaninchen', 'alle', [10, 15], [2, 15]],
      ['Nutria', 'alle (Neozoon)', [1, 1], [12, 31]],
      ['Wildkatze', 'ganzjährig geschützt', [0, 0], [0, 0]],
    ],
  },
  {
    id: 'raub', name: 'Raubwild', rows: [
      ['Fuchs', 'alle', [8, 1], [2, 28]],
      ['Dachs', 'alle', [8, 1], [10, 31]],
      ['Steinmarder', 'alle', [10, 1], [2, 28]],
      ['Baummarder', 'alle', [10, 1], [2, 28]],
      ['Iltis', 'alle', [8, 1], [2, 28]],
      ['Waschbär', 'alle (Neozoon)', [1, 1], [12, 31]],
      ['Marderhund', 'alle (Neozoon)', [1, 1], [12, 31]],
      ['Mink', 'alle (Neozoon)', [1, 1], [12, 31]],
    ],
  },
  {
    id: 'feder', name: 'Federwild', rows: [
      ['Stockente', 'alle', [9, 1], [1, 15]],
      ['Ringeltaube', 'alle', [11, 1], [2, 20]],
      ['Fasan', 'Hahn, Henne', [10, 1], [1, 15]],
      ['Waldschnepfe', 'alle', [10, 16], [1, 15]],
      ['Graugans', 'alle', [8, 1], [1, 15]],
      ['Kanadagans', 'alle', [8, 1], [1, 15]],
      ['Nilgans', 'alle (Neozoon)', [7, 16], [1, 15]],
      ['Blässhuhn', 'alle', [9, 1], [1, 15]],
      ['Rebhuhn', 'behördliche Freigabe nötig', [0, 0], [0, 0]],
    ],
  },
];

/** Revierstandort für Sonne, Dämmerung und Mond. */
export const REVIER_LAT = 52.62;
export const REVIER_LNG = 9.21;

/** Nav bar: [screen, label, icon path]. */
export const NAV_ITEMS: Array<[string, string, string]> = [
  ['karte', 'Karte', 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z'],
  ['planung', 'Planung', 'M4 4v16h16M8 16l4-6 3 4 4-7'],
  ['tagebuch', 'Tagebuch', 'M4 3h13a2 2 0 012 2v14a2 2 0 01-2 2H4zM8 3v18M11 9h6M11 13h6'],
  ['zeiten', 'Zeiten', 'M4 5h16v16H4zM8 3v4M16 3v4M4 11h16'],
  ['ansitz', 'Ansitz', 'M3 8h11a3 3 0 100-6 3 3 0 00-3 3M3 16h7a3 3 0 110 6 3 3 0 01-3-3M3 12h15'],
  ['mehr', 'Mehr', 'M12 9a3 3 0 100 6 3 3 0 000-6M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2'],
];

/** Device frame of the design: Android phone at 412 × 812. */
export const DEVICE_W = 412;
export const DEVICE_H = 812;
