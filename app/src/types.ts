export type Screen = 'karte' | 'planung' | 'tagebuch' | 'zeiten' | 'ansitz' | 'mehr';

export type MarkerType = 'ansitz' | 'falle' | 'wechsel' | 'kirrung' | 'best' | 'salz' | 'erleg';

/** Which map layer is drawn: Topografie or Orthofoto. */
export type MapStyle = 'topo' | 'sat';

/** Variante A (Werkzeugleiste) oder Variante B (Zielkreuz). */
export type CtrlMode = 'werkzeug' | 'zielkreuz';

/** Pins carry pictograms or the printed-map letter codes. */
export type SignMode = 'symbol' | 'buchstabe';

export type RevierKind = 'eigen' | 'pacht' | 'begeh';

export type JagdArt = 'Treibjagd' | 'Drückjagd';

export type EntryTyp = 'Beobachtung' | 'Abschuss' | 'Ansitz';

/** Planning tools: Schütze/Stand, Treibrichtung, Flächenteilung, Ausschnitt. */
export type PlanTool = 'post' | 'arrow' | 'split' | 'extent';

export interface Point { x: number; y: number; }

export interface Marker {
  id: number;
  type: MarkerType;
  name: string;
  x: number;
  y: number;
  note: string;
  date: string;
  revier: string;
  /** Schussentfernungen in metres — drawn as dashed rings around an Ansitz. */
  dists?: number[];
}

export interface CropYear {
  year: number;
  crop: string;
  note: string;
}

export interface Field {
  id: string;
  points: string;
  name: string;
  farmer: string;
  crop: string;
  history: CropYear[];
}

export interface Revier {
  id: string;
  name: string;
  points: string;
  visible: boolean;
  kind: RevierKind;
}

export interface JournalEntry {
  id: number;
  typ: EntryTyp;
  when: string;
  title: string;
  line: string;
  chips: string[];
  wild: string;
}

export interface Jagd {
  id: string;
  art: JagdArt;
  datum: string;
  ort: string;
}

/** One Treiben (Treibjagd) or Gebiet (Drückjagd) within a Jagd. */
export interface Treiben {
  id: string;
  jagd: string;
  nr: number;
  name: string;
  flaeche: string;
  zeit: string;
}

/** A Vorstehschütze (Treibjagd) or Stand (Drückjagd). */
export interface Post {
  id: string;
  treiben: string;
  nr: number;
  x: number;
  y: number;
  name: string;
}

/** Treibrichtung (Treibjagd) or Schussfeld (Drückjagd). */
export interface Arrow {
  id: string;
  treiben: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** A saved map extent — one printable page holding one or more Treiben. */
export interface Extent {
  id: string;
  jagd: string;
  name: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface EntryForm {
  typ: EntryTyp;
  wildart: string;
  gewicht: string;
  ort: string;
  foto: boolean;
  text: string;
  melden: boolean;
}

export type SheetKind =
  | 'marker' | 'field' | 'reviere' | 'legend'
  | 'entry' | 'naming' | 'liste' | 'post' | 'newjagd';

export interface AppState {
  screen: Screen;
  night: boolean;
  mapStyle: MapStyle;
  ctrl: CtrlMode;
  zeichen: SignMode;

  tool: MarkerType | null;
  radial: boolean;
  aim: MarkerType | null;
  pan: Point;
  zoom: number;

  sheet: SheetKind | null;
  sel: number | null;
  selField: string | null;
  selPost: string | null;

  drawing: Array<[number, number]> | null;
  pendingRevier: Array<[number, number]> | null;
  rName: string;

  toast: string;
  lastAdded: number | null;
  jfilter: string;
  openGroups: Record<string, boolean>;
  dayOff: number;

  measure: boolean;
  measFrom: Point | null;
  measTo: Point | null;
  distDraft: string;
  /** Set while the journal form is waiting for a location tap on the map. */
  pickTarget: boolean;

  form: EntryForm;

  // ── Jagdplanung ──
  pPan: Point;
  pZoom: number;
  selJagd: string;
  selTreiben: string | null;
  pTool: PlanTool | null;
  pPend: Point | null;
  pView: string;
  njArt: JagdArt;
  njDatum: string;

  jagden: Jagd[];
  treiben: Treiben[];
  posts: Post[];
  arrows: Arrow[];
  extents: Extent[];

  markers: Marker[];
  fieldData: Field[];
  activeRevier: string;
  revierData: Revier[];
  journal: JournalEntry[];
}
