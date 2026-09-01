import type { AppState } from '../types';

/* Demo-Revier für den Prototyp. Alle Koordinaten liegen im 400 × 520 großen
   Kartenraster bei 12 m/px. */

export const initialState: AppState = {
  screen: 'karte',
  night: false,
  mapStyle: 'topo',
  ctrl: 'werkzeug',
  zeichen: 'symbol',

  tool: null, radial: false, aim: null,
  pan: { x: 6, y: 40 }, zoom: 1,

  sheet: null, sel: null, selField: null, selPost: null,
  drawing: null, pendingRevier: null, rName: 'Revier Neu',
  toast: '', lastAdded: null, jfilter: 'Alle',
  openGroups: { schalen: true, haar: false, raub: false, feder: false },
  dayOff: 0,
  measure: false, measFrom: null, measTo: null,
  distDraft: '', pickTarget: false,
  form: { typ: 'Beobachtung', wildart: 'Rehwild', gewicht: '', ort: 'Kanzel Eichenschlag', foto: false, text: '', melden: false },

  // ── Jagdplanung ──
  pPan: { x: 6, y: 30 }, pZoom: 0.9,
  selJagd: 'j1', selTreiben: 't1', pTool: null, pPend: null, pView: 'all',
  njArt: 'Treibjagd', njDatum: '05.12.2026',

  jagden: [
    { id: 'j1', art: 'Treibjagd', datum: '28.10.2026', ort: 'Revier Eichenkamp' },
    { id: 'j2', art: 'Drückjagd', datum: '14.11.2026', ort: 'Eichenkamp + Ostkamp' },
  ],
  treiben: [
    { id: 't1', jagd: 'j1', nr: 1, name: 'Eichenkamp Nord', flaeche: 'Schlag Eichenkamp', zeit: '09:30' },
    { id: 't2', jagd: 'j1', nr: 2, name: 'Bachwiese', flaeche: 'Schlag Bachwiese', zeit: '10:45' },
    { id: 't3', jagd: 'j1', nr: 3, name: 'Lange Furche', flaeche: 'Schlag Lange Furche', zeit: '12:15' },
    { id: 'd1', jagd: 'j2', nr: 1, name: 'Gebiet Buchenriegel', flaeche: 'Waldort Nord', zeit: '09:00' },
    { id: 'd2', jagd: 'j2', nr: 2, name: 'Gebiet Südkamp', flaeche: 'Waldort Süd', zeit: '09:00' },
  ],
  posts: [
    { id: 'p1', treiben: 't1', nr: 1, x: 176, y: 118, name: 'H. Meyer' },
    { id: 'p2', treiben: 't1', nr: 2, x: 214, y: 128, name: 'J. Bartels' },
    { id: 'p3', treiben: 't1', nr: 3, x: 250, y: 142, name: '' },
    { id: 'p4', treiben: 't2', nr: 1, x: 112, y: 206, name: 'K. Ahlers' },
    { id: 'p5', treiben: 't2', nr: 2, x: 150, y: 200, name: '' },
    { id: 'p6', treiben: 't3', nr: 1, x: 200, y: 220, name: 'F. Lange' },
    { id: 'p7', treiben: 'd1', nr: 1, x: 70, y: 60, name: 'H. Meyer' },
    { id: 'p8', treiben: 'd1', nr: 2, x: 110, y: 48, name: 'W. Roth' },
    { id: 'p9', treiben: 'd2', nr: 1, x: 90, y: 330, name: 'F. Lange' },
  ],
  arrows: [
    { id: 'a1', treiben: 't1', x1: 200, y1: 200, x2: 214, y2: 146 },
    { id: 'a2', treiben: 't2', x1: 150, y1: 262, x2: 132, y2: 212 },
    { id: 'a3', treiben: 't3', x1: 232, y1: 232, x2: 240, y2: 282 },
    { id: 'a4', treiben: 'd1', x1: 40, y1: 130, x2: 92, y2: 74 },
  ],
  extents: [
    { id: 'x1', jagd: 'j1', name: 'Ausschnitt Nord', x1: 90, y1: 90, x2: 290, y2: 230 },
    { id: 'x2', jagd: 'j1', name: 'Ausschnitt Süd', x1: 90, y1: 190, x2: 300, y2: 320 },
    { id: 'x3', jagd: 'j2', name: 'Ausschnitt Waldorte', x1: 20, y1: 20, x2: 200, y2: 360 },
  ],

  markers: [
    { id: 1, type: 'ansitz', name: 'Kanzel Eichenschlag', x: 150, y: 118, note: 'Blick auf Weizenkante, Anstellung Nordost.', date: '12.04.2024', revier: 'r1', dists: [100, 200] },
    { id: 2, type: 'ansitz', name: 'Bodensitz Bachwiese', x: 104, y: 254, note: 'Nur bei Südwestwind bejagbar.', date: '03.06.2024', revier: 'r1', dists: [80] },
    { id: 3, type: 'ansitz', name: 'Kanzel Rapskante', x: 256, y: 248, note: '', date: '20.07.2025', revier: 'r1', dists: [150] },
    { id: 4, type: 'falle', name: 'Betonrohrfalle Nord', x: 84, y: 108, note: 'Fangmelder aktiv, Kontrolle täglich.', date: '01.02.2025', revier: 'r1' },
    { id: 5, type: 'wechsel', name: 'Wechsel Waldkante', x: 190, y: 188, note: 'Sauen wechseln abends aus der Dickung.', date: '15.09.2024', revier: 'r1' },
    { id: 6, type: 'kirrung', name: 'Kirrung Maisecke', x: 158, y: 266, note: 'Mais, Kontrolle So + Do.', date: '08.08.2026', revier: 'r1' },
    { id: 7, type: 'best', name: 'Rotte, 6 Stück', x: 214, y: 300, note: 'Bestätigt am 24.08. bei Ansitz.', date: '24.08.2026', revier: 'r1' },
    { id: 8, type: 'salz', name: 'Salzlecke Hangweg', x: 120, y: 150, note: '', date: '11.05.2023', revier: 'r1' },
    { id: 9, type: 'erleg', name: 'Überläuferkeiler 42 kg', x: 238, y: 178, note: 'Kammerschuss, 18.08.2026, 06:10.', date: '18.08.2026', revier: 'r1' },
    { id: 10, type: 'ansitz', name: 'Leiter Südfeld', x: 300, y: 398, note: 'Revier Ostkamp.', date: '02.03.2026', revier: 'r2', dists: [100] },
  ],

  fieldData: [
    {
      id: 'f1', points: '180,120 262,140 252,212 174,196', name: 'Schlag Eichenkamp', farmer: 'Hof Meyer', crop: 'Winterweizen',
      history: [
        { year: 2025, crop: 'Winterraps', note: 'starker Fraß' },
        { year: 2024, crop: 'Silomais', note: 'Wildschaden 0,4 ha' },
        { year: 2023, crop: 'Wintergerste', note: '—' },
      ],
    },
    {
      id: 'f2', points: '118,202 174,196 186,268 108,272', name: 'Schlag Bachwiese', farmer: 'Hof Meyer', crop: 'Silomais',
      history: [
        { year: 2025, crop: 'Wintergerste', note: '—' },
        { year: 2024, crop: 'Kleegras', note: 'ruhig' },
        { year: 2023, crop: 'Silomais', note: 'Wildschaden 1,1 ha' },
      ],
    },
    {
      id: 'f3', points: '196,216 252,216 268,292 202,286', name: 'Schlag Lange Furche', farmer: 'Agrar Ostkamp GbR', crop: 'Winterraps',
      history: [
        { year: 2025, crop: 'Winterweizen', note: '—' },
        { year: 2024, crop: 'Zuckerrübe', note: 'Sauen im Herbst' },
        { year: 2023, crop: 'Winterraps', note: '—' },
      ],
    },
    {
      id: 'f4', points: '250,368 342,350 352,420 264,432', name: 'Schlag Südkamp', farmer: 'Agrar Ostkamp GbR', crop: 'Grünland',
      history: [
        { year: 2025, crop: 'Grünland', note: '—' },
        { year: 2024, crop: 'Grünland', note: 'Kitzrettung 2 Kitze' },
        { year: 2023, crop: 'Kleegras', note: '—' },
      ],
    },
  ],

  activeRevier: 'r1',
  revierData: [
    { id: 'r1', name: 'Revier Eichenkamp', points: '40,58 172,28 250,58 272,148 340,190 320,300 230,360 130,340 60,250 30,150', visible: true, kind: 'eigen' },
    { id: 'r2', name: 'Revier Ostkamp (Pacht)', points: '320,300 382,330 392,442 300,472 232,420 230,360', visible: true, kind: 'pacht' },
  ],

  journal: [
    { id: 1, typ: 'Abschuss', when: '26.08.2026 · 20:15', title: 'Rehbock, 18,5 kg', line: 'Kanzel Eichenschlag · Kammerschuss, kurze Flucht · Wind SW', chips: ['Foto', 'Streckenliste gemeldet'], wild: 'Rehwild' },
    { id: 2, typ: 'Beobachtung', when: '24.08.2026 · 05:40', title: 'Schwarzwild, Rotte 6 Stück', line: 'Kirrung Maisecke · zwei Überläufer, vier Frischlinge', chips: ['Marker gesetzt'], wild: 'Schwarzwild' },
    { id: 3, typ: 'Ansitz', when: '21.08.2026 · 20:00', title: 'Ansitz 2 h, kein Anblick', line: 'Kanzel Rapskante · Wind drehend, Raps noch hoch', chips: [], wild: '' },
    { id: 4, typ: 'Abschuss', when: '18.08.2026 · 06:10', title: 'Überläuferkeiler, 42 kg', line: 'Feldkante Lange Furche · Trichinenprobe entnommen', chips: ['Foto', 'Meldung offen'], wild: 'Schwarzwild' },
  ],
};

/** Windbewertung der Ansitze — Demo-Werte. Produktiv aus Open-Meteo / DWD. */
export const ANSITZ_WIND: Array<[string, string, string]> = [
  ['Kanzel Eichenschlag', 'Gut', 'Anstellung NO — Wind SW trägt ab. Weizen abgeerntet, freies Schussfeld.'],
  ['Bodensitz Bachwiese', 'Gut', 'Wind SW steht richtig, Aufstieg trocken über Hangweg.'],
  ['Kanzel Rapskante', 'Mäßig', 'Wind quer, Raps hoch — nur Ansprechen auf der Gasse möglich.'],
  ['Leiter Südfeld', 'Schlecht', 'Wind trägt direkt in die Fläche. Zugang über Feldweg verwittert.'],
];

/** Offline-Kartenpakete: [Name, Meta, Aktion, Aktion verfügbar]. */
export const DOWNLOADS: Array<[string, string, string, boolean]> = [
  ['Revier Eichenkamp · Topo', '148 MB · aktuell (12.08.2026)', 'AKTUELL', false],
  ['Revier Eichenkamp · Orthofoto', '612 MB · Update verfügbar', 'UPDATE', true],
  ['Revier Ostkamp · Topo + Ortho', '470 MB · nicht geladen', 'LADEN', true],
  ['Höhenlinien DGM1 Niedersachsen', '96 MB · aktuell', 'AKTUELL', false],
];
