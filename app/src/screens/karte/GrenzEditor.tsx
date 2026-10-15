import { useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useApp } from '../../state/store';
import { MAP_H, MAP_W } from '../../lib/mapInteraction';
import { fmt, ha, parse } from '../../lib/geo';
import type { Vertex } from '../../lib/geo';
import {
  FANG_PX, anwenden, fertigMoeglich, laenge, meter, mid, neuerVerlauf,
  nextEdgeCrosses, selfIntersects, zielUnterKreuz,
} from '../../lib/grenze';
import type { Aktion, Verlauf, Ziel } from '../../lib/grenze';

/* Reviergrenze mit Fadenkreuz zeichnen und bearbeiten.

   Die Karte wird unter ein festes Kreuz geschoben, ein großer Knopf tut, was
   dort sinnvoll ist: Punkt setzen, Grenze schließen, Punkt greifen und
   ablegen, Punkt auf einer Kante einfügen. Nahe an Nachbarrevieren und
   Schlägen rastet das Kreuz auf deren Grenze ein — so entstehen keine Lücken
   oder Überlappungen. Antippen der Karte setzt nichts: mit Handschuh trifft
   man so nicht genau genug. */

/** Höhe der Bedienleiste. Das Kreuz sitzt in der Mitte der Karte darüber. */
export const PANEL_H = 214;

const WARN = 'var(--warn, #b5432b)';

const vibrate = (ms: number) => {
  try { navigator.vibrate?.(ms); } catch { /* nicht jedes Gerät kann das */ }
};

export interface GrenzEditor {
  aktiv: boolean;
  verlauf: Verlauf;
  ziel: Ziel | null;
  gegriffen: number | null;
  kreuzt: boolean;
  fremde: Vertex[][];
  tun: (a: Aktion) => void;
  haupt: () => void;
  greifenAbbrechen: () => void;
  gegriffenLoeschen: () => void;
  fertig: () => void;
  verwerfen: () => void;
}

/** Zustand des Editors. Läuft immer mit, ist aber nur aktiv, solange
 *  `s.drawing` gesetzt ist. Der Verlauf (Zurück/Wieder) lebt hier, der
 *  Entwurf selbst zusätzlich im Store — so übersteht er das Schließen der App. */
export function useGrenzEditor(box: RefObject<HTMLDivElement>): GrenzEditor {
  const { state: s, set, flash } = useApp();
  const aktiv = s.drawing !== null;

  const [verlauf, setVerlauf] = useState<Verlauf>(() => neuerVerlauf(s.drawing ?? [], s.drawClosed));
  const [gegriffen, setGegriffen] = useState<number | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Zeichnen beginnt von außen (Werkzeugleiste, Reviere-Sheet): dann frisch
  // aus dem Store übernehmen.
  const startKey = aktiv ? (s.drawEdit ?? 'neu') : null;
  useEffect(() => {
    setVerlauf(neuerVerlauf(s.drawing ?? [], s.drawClosed));
    setGegriffen(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startKey]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.offsetWidth, h: el.offsetHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [box]);

  // Kartenmitte über der Bedienleiste → Kartenkoordinate.
  const sx = size.w / 2, sy = (size.h - PANEL_H) / 2;
  const kreuz: Vertex = [
    (sx - s.pan.x - (MAP_W / 2) * (1 - s.zoom)) / s.zoom,
    (sy - s.pan.y - (MAP_H / 2) * (1 - s.zoom)) / s.zoom,
  ];

  const fremde = useMemo(() => [
    ...s.revierData.filter(r => r.id !== s.drawEdit).map(r => parse(r.points)),
    ...s.fieldData.map(f => parse(f.points)),
  ], [s.revierData, s.fieldData, s.drawEdit]);

  const e = verlauf.jetzt;
  const ziel = aktiv && size.w
    ? zielUnterKreuz(kreuz, e, fremde, FANG_PX / s.zoom, gegriffen)
    : null;
  const kreuzt = !!ziel && gegriffen === null && !e.closed && e.pts.length >= 3 && nextEdgeCrosses(e.pts, ziel.pt);

  // Kurzer Ruck beim Einrasten — spürbar durch den Handschuh.
  const zielKey = ziel ? ziel.art + ziel.i : '';
  const letzterKey = useRef('');
  useEffect(() => {
    if (zielKey && zielKey !== letzterKey.current && ziel?.art !== 'frei') vibrate(12);
    letzterKey.current = zielKey;
  }, [zielKey, ziel?.art]);

  const tun = (a: Aktion) => {
    const v = anwenden(verlauf, a);
    if (v === verlauf) return;
    setVerlauf(v);
    set({ drawing: v.jetzt.pts, drawClosed: v.jetzt.closed });
  };

  const haupt = () => {
    if (!ziel) return;
    vibrate(30);
    if (gegriffen !== null) {
      tun({ t: 'verschieben', i: gegriffen, pt: ziel.pt });
      setGegriffen(null);
      return;
    }
    switch (ziel.art) {
      case 'erster': tun({ t: 'schliessen' }); break;
      case 'punkt': setGegriffen(ziel.i); break;
      case 'mitte': tun({ t: 'einfuegen', i: ziel.i, pt: ziel.pt }); break;
      default: tun({ t: 'setzen', pt: ziel.pt });
    }
  };

  const beenden = () => {
    setGegriffen(null);
    set({ drawing: null, drawClosed: false, drawEdit: null });
  };

  const fertig = () => {
    if (!fertigMoeglich(e)) {
      flash(e.pts.length < 3 ? 'Mindestens drei Grenzpunkte nötig.' : 'Die Grenze kreuzt sich selbst.');
      return;
    }
    const pts = e.pts.map(p => [Math.round(p[0]), Math.round(p[1])] as Vertex);
    if (s.drawEdit) {
      const id = s.drawEdit;
      set(p => ({
        revierData: p.revierData.map(r => (r.id === id ? { ...r, points: pts.map(q => q.join(',')).join(' ') } : r)),
      }));
      beenden();
      flash('Grenze gespeichert · ' + fmt(ha(pts), 0) + ' ha');
      return;
    }
    beenden();
    set({ pendingRevier: pts, sheet: 'naming', rName: 'Revier Neu' });
  };

  return {
    aktiv, verlauf, ziel, gegriffen, kreuzt, fremde, tun, haupt, fertig,
    greifenAbbrechen: () => setGegriffen(null),
    gegriffenLoeschen: () => {
      if (gegriffen === null) return;
      tun({ t: 'loeschen', i: gegriffen });
      setGegriffen(null);
    },
    verwerfen: beenden,
  };
}

/** Linien, Punkte und Gummiband — liegt im verschobenen Kartenrahmen. */
export function GrenzLayer({ ed, zoom }: { ed: GrenzEditor; zoom: number }) {
  if (!ed.aktiv) return null;
  const { pts, closed } = ed.verlauf.jetzt;
  const z = ed.ziel?.pt;
  const g = ed.gegriffen;
  const fehler = closed && selfIntersects(pts);
  const k = 1 / zoom;

  // Gummiband: vom letzten Punkt zum Kreuz; beim Verschieben von beiden
  // Nachbarn des gegriffenen Punkts.
  const baender: Array<[Vertex, Vertex]> = [];
  if (z) {
    const n = pts.length;
    if (g !== null) {
      if (g > 0 || closed) baender.push([pts[(g - 1 + n) % n], z]);
      if (g < n - 1 || closed) baender.push([z, pts[(g + 1) % n]]);
    } else if (!closed && n) {
      baender.push([pts[n - 1], z]);
    }
  }
  const mitten = g === null && pts.length >= 2
    ? pts.slice(0, closed ? pts.length : pts.length - 1).map((p, i) => mid(p, pts[(i + 1) % pts.length]))
    : [];
  const linie = fehler ? WARN : 'var(--accent)';

  return (
    <svg
      width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      style={{ display: 'block', position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 6 }}
    >
      {closed && pts.length >= 3 && (
        <polygon
          points={pts.map(p => p.join(',')).join(' ')}
          fill={fehler ? 'color-mix(in oklab, var(--warn, #b5432b) 18%, transparent)' : 'color-mix(in oklab, var(--accent) 14%, transparent)'}
          stroke="none"
        />
      )}
      {pts.length >= 2 && (
        <polyline
          points={(closed ? pts.concat([pts[0]]) : pts).map(p => p.join(',')).join(' ')}
          fill="none" stroke={linie} strokeWidth={3} strokeLinejoin="round" vectorEffect="non-scaling-stroke"
        />
      )}
      {baender.map(([a, b], i) => (
        <line
          key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}
          stroke={ed.kreuzt ? WARN : 'var(--accent)'} strokeWidth={2.5} strokeDasharray="7 5"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {mitten.map((p, i) => (
        <circle
          key={i} cx={p[0]} cy={p[1]} r={5 * k}
          fill="var(--surf)" stroke="var(--accent)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" opacity={0.85}
        />
      ))}
      {pts.map((p, i) => {
        const erster = i === 0 && !closed;
        const greif = i === g;
        return (
          <rect
            key={i}
            x={p[0] - (erster ? 8 : 6) * k} y={p[1] - (erster ? 8 : 6) * k}
            width={(erster ? 16 : 12) * k} height={(erster ? 16 : 12) * k}
            fill={greif ? 'var(--surf)' : linie}
            stroke={greif ? WARN : 'var(--surf)'} strokeWidth={2} vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}

/** Das feste Kreuz. Füllt sich, wenn es einrastet; wird rot, wenn die nächste
 *  Kante die Grenze kreuzen würde. */
export function Fadenkreuz({ ed }: { ed: GrenzEditor }) {
  if (!ed.aktiv) return null;
  const rastet = ed.gegriffen !== null || (!!ed.ziel && ed.ziel.art !== 'frei');
  const farbe = ed.kreuzt ? WARN : 'var(--accent)';
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, top: 0, bottom: PANEL_H, pointerEvents: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 7,
    }}>
      <svg width="96" height="96" viewBox="0 0 96 96" style={{ overflow: 'visible' }}>
        {/* Heller Rand unter der Linie, damit das Kreuz auf jedem Kartengrund steht. */}
        <g stroke="var(--surf)" strokeWidth={6} strokeLinecap="round" fill="none">
          <circle cx="48" cy="48" r="22" />
          <path d="M48 4v30M48 62v30M4 48h30M62 48h30" />
        </g>
        <g stroke={farbe} strokeWidth={2.5} strokeLinecap="round" fill="none">
          <circle cx="48" cy="48" r="22" fill={rastet ? `color-mix(in oklab, ${farbe} 28%, transparent)` : 'none'} />
          <path d="M48 4v30M48 62v30M4 48h30M62 48h30" />
        </g>
        <circle cx="48" cy="48" r="3" fill={farbe} />
      </svg>
    </div>
  );
}

const btn = (primary: boolean, on = true): React.CSSProperties => ({
  minHeight: 56, border: '2px solid ' + (primary ? 'var(--accent)' : 'var(--line)'),
  background: primary ? 'var(--accent)' : 'transparent',
  color: primary ? '#fff' : 'var(--ink)', fontSize: 15, fontWeight: primary ? 600 : 500,
  padding: '0 10px', cursor: on ? 'pointer' : 'default', opacity: on ? 1 : 0.4,
});

function hauptText(ed: GrenzEditor): string {
  if (ed.gegriffen !== null) return 'Hier ablegen';
  switch (ed.ziel?.art) {
    case 'erster': return 'Grenze schließen';
    case 'punkt': return 'Punkt greifen';
    case 'mitte': return 'Punkt einfügen';
    case 'fremdPunkt':
    case 'fremdKante': return 'An Nachbargrenze setzen';
    default: return 'Punkt setzen';
  }
}

function hinweis(ed: GrenzEditor): string {
  const { pts, closed } = ed.verlauf.jetzt;
  if (ed.gegriffen !== null) return 'Karte verschieben, dann ablegen.';
  if (ed.kreuzt) return 'Diese Kante würde die Grenze kreuzen.';
  if (closed && selfIntersects(pts)) return 'Die Grenze kreuzt sich. Punkt greifen und verschieben.';
  if (closed) return 'Eckpunkt anpeilen zum Verschieben, Kantenmitte zum Einfügen.';
  if (!pts.length) return 'Karte unter das Kreuz schieben, ersten Grenzpunkt setzen.';
  if (pts.length < 3) return 'Weiter entlang der Grenze.';
  return 'Zum Schließen den ersten Punkt anpeilen oder „Fertig“.';
}

/** Bedienleiste: Messwerte, Zurück/Wieder, großer Hauptknopf, Fertig. */
export function GrenzPanel({ ed, bearbeiten }: { ed: GrenzEditor; bearbeiten: boolean }) {
  const [sicher, setSicher] = useState(false);
  useEffect(() => setSicher(false), [ed.aktiv]);
  useEffect(() => {
    if (!sicher) return;
    const t = setTimeout(() => setSicher(false), 3000);
    return () => clearTimeout(t);
  }, [sicher]);
  if (!ed.aktiv) return null;

  const e = ed.verlauf.jetzt;
  const naechste = !e.closed && e.pts.length && ed.ziel && ed.gegriffen === null
    ? meter(e.pts[e.pts.length - 1], ed.ziel.pt) : null;
  const warn = ed.kreuzt || (e.closed && selfIntersects(e.pts));
  const hauptAn = ed.gegriffen !== null || (!!ed.ziel && (!e.closed || ed.ziel.art === 'punkt' || ed.ziel.art === 'mitte'));
  const m = (v: number) => (v >= 1000 ? fmt(v / 1000, 2) + ' km' : Math.round(v) + ' m');

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, height: PANEL_H, boxSizing: 'border-box',
      background: 'var(--surf)', borderTop: '2px solid var(--accent)', padding: '10px 12px 12px',
      display: 'flex', flexDirection: 'column', gap: 8, zIndex: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>
          {bearbeiten ? 'Grenze bearbeiten' : 'Grenze zeichnen'}
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 13, fontVariantNumeric: 'tabular-nums', color: 'var(--ink)', whiteSpace: 'nowrap' }}>
          {e.pts.length} Pkt · {fmt(e.pts.length >= 3 ? ha(e.pts) : 0, 1)} ha · {m(laenge(e))}
          {naechste !== null && <> · <b>→ {m(naechste)}</b></>}
        </div>
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.3, minHeight: 18, color: warn ? WARN : 'var(--muted)', fontWeight: warn ? 600 : 400 }}>
        {hinweis(ed)}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {ed.gegriffen !== null ? (
          <>
            <button onClick={ed.greifenAbbrechen} style={{ ...btn(false), flex: 1 }}>Nicht verschieben</button>
            <button onClick={ed.gegriffenLoeschen} style={{ ...btn(false), flex: 1, color: WARN, borderColor: WARN }}>Punkt löschen</button>
          </>
        ) : (
          <>
            <button onClick={() => ed.tun({ t: 'zurueck' })} disabled={!ed.verlauf.zurueck.length} style={{ ...btn(false, !!ed.verlauf.zurueck.length), flex: 1 }}>↶ Zurück</button>
            <button onClick={() => ed.tun({ t: 'vor' })} disabled={!ed.verlauf.vor.length} style={{ ...btn(false, !!ed.verlauf.vor.length), flex: 1 }}>Wieder ↷</button>
            <button
              onClick={() => (sicher || !e.pts.length ? ed.verwerfen() : setSicher(true))}
              style={{ ...btn(false), flex: 1, ...(sicher ? { color: WARN, borderColor: WARN, fontWeight: 600 } : {}) }}
            >{sicher ? 'Wirklich?' : 'Abbrechen'}</button>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={ed.haupt}
          disabled={!hauptAn}
          style={{ ...btn(true, hauptAn), flex: 1, minHeight: 64, fontSize: 18, textAlign: 'left', padding: '0 16px' }}
        >{hauptText(ed)}</button>
        <button
          onClick={ed.fertig}
          disabled={!fertigMoeglich(e) || ed.gegriffen !== null}
          style={{ ...btn(false, fertigMoeglich(e) && ed.gegriffen === null), minHeight: 64, minWidth: 96, borderColor: 'var(--accent)', fontWeight: 600 }}
        >Fertig</button>
      </div>
    </div>
  );
}
