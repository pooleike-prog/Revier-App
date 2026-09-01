import type { MouseEvent as ReactMouseEvent } from 'react';
import { useApp } from '../state/store';
import { ICON } from '../data/constants';
import type { Extent, Field, PlanTool } from '../types';
import type { Vertex } from '../lib/geo';
import { compass, cut, fmt, ha, inPoly, parse, toStr } from '../lib/geo';
import { currentJagd, treibenInBox, treibenOf, treibenName } from '../lib/selectors';
import { addTreibenPatch, arrowGeom, extentPatch } from '../lib/planning';
import { ctrlBox } from '../lib/styles';
import { MAP_H, MAP_W, mapWrapStyle, toMap, usePan } from '../lib/mapInteraction';
import { MapTerrain } from '../components/MapTerrain';
import { Icon } from '../components/Icon';
import { Toast } from '../components/Toast';

export function PlanungScreen() {
  const { state: s, set, flash } = useApp();
  const pan = usePan(s.pPan, p => set({ pPan: p }));

  const jagd = currentJagd(s);
  const isDrueck = jagd.art === 'Drückjagd';
  const myTreiben = treibenOf(s, jagd.id);
  const treibenIds = myTreiben.map(t => t.id);

  /* Eine Fläche geradlinig teilen. Für einbuchtige Schläge bräuchte es einen
     Polylinien-Schnitt — hier läuft die Trennlinie immer gerade durch. */
  const splitField = (a: Vertex, b: Vertex) => {
    const mid: Vertex = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const target = s.fieldData.find(f => inPoly(mid, parse(f.points)));
    if (!target) {
      set({ pPend: null });
      flash('Keine Fläche getroffen — Trennlinie muss durch einen Schlag laufen.');
      return;
    }
    const halves = cut(parse(target.points), a, b);
    if (!halves) {
      set({ pPend: null });
      flash('Trennlinie schneidet die Fläche nicht — beide Punkte außerhalb setzen.');
      return;
    }
    const base = target.name.replace(/ [AB]$/, '');
    // Die Fruchthistorie wandert in beide Hälften mit.
    const parts: Field[] = halves.map((h, i) => ({
      ...target, id: 'f' + Date.now() + i, points: toStr(h), name: base + ' ' + (i === 0 ? 'A' : 'B'),
    }));
    set(p => ({
      fieldData: p.fieldData.filter(f => f.id !== target.id).concat(parts),
      pPend: null, pTool: null,
    }));
    flash(`${base} geteilt · ${fmt(ha(halves[0]), 1)} ha + ${fmt(ha(halves[1]), 1)} ha`);
  };

  const onMapClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (pan.moved()) return;
    if (!s.pTool) return;
    const pt = toMap(e, s.pPan, s.pZoom);

    if (s.pTool === 'post') {
      const nr = s.posts.filter(p => p.treiben === s.selTreiben).length + 1;
      const id = 'p' + Date.now();
      set(p => ({ posts: p.posts.concat([{ id, treiben: p.selTreiben ?? '', nr, x: pt.x, y: pt.y, name: '' }]) }));
      flash((isDrueck ? 'Stand ' : 'Vorstehschütze ') + nr + ' gesetzt · ' + treibenName(s, s.selTreiben));
      return;
    }

    if (s.pTool === 'arrow') {
      if (!s.pPend) { set({ pPend: pt }); return; }
      const from = s.pPend;
      set(p => ({
        arrows: p.arrows.concat([{ id: 'a' + Date.now(), treiben: p.selTreiben ?? '', x1: from.x, y1: from.y, x2: pt.x, y2: pt.y }]),
        pPend: null,
      }));
      flash((isDrueck ? 'Schussfeld' : 'Treibrichtung') + ' ' + compass(pt.x - from.x, pt.y - from.y) + ' eingezeichnet');
      return;
    }

    if (s.pTool === 'split') {
      if (!s.pPend) { set({ pPend: pt }); return; }
      splitField([s.pPend.x, s.pPend.y], [pt.x, pt.y]);
      return;
    }

    // 'extent' — zwei gegenüberliegende Ecken ziehen einen Kartenausschnitt auf.
    if (!s.pPend) { set({ pPend: pt }); return; }
    const x1 = Math.min(s.pPend.x, pt.x), x2 = Math.max(s.pPend.x, pt.x);
    const y1 = Math.min(s.pPend.y, pt.y), y2 = Math.max(s.pPend.y, pt.y);
    if (x2 - x1 < 30 || y2 - y1 < 30) {
      set({ pPend: null });
      flash('Ausschnitt zu klein — zwei gegenüberliegende Ecken antippen.');
      return;
    }
    const n = s.extents.filter(x => x.jagd === s.selJagd).length + 1;
    const box = { id: 'x' + Date.now(), jagd: s.selJagd, name: 'Ausschnitt ' + n, x1, y1, x2, y2 };
    set(p => ({ extents: p.extents.concat([box]), pPend: null, pTool: null }));
    const inside = treibenInBox(s, box);
    flash('Ausschnitt angelegt · ' + (inside.length ? inside.map(t => t.nr + '.').join(' ') + ' Treiben enthalten' : 'noch ohne Treiben'));
    set(extentPatch(box));
  };

  const hint = !s.pTool
    ? (isDrueck ? 'Gebiet wählen, dann Werkzeug' : 'Treiben wählen, dann Werkzeug')
    : s.pTool === 'post' ? (isDrueck ? 'Standort des Standes antippen' : 'Vorstehschützen antippen — Nummer läuft automatisch')
    : s.pTool === 'arrow' ? (s.pPend ? 'Zielpunkt der Richtung antippen' : 'Startpunkt der Richtung antippen')
    : s.pTool === 'split' ? (s.pPend ? 'Zweiten Punkt der Trennlinie antippen' : 'Trennlinie: ersten Punkt außerhalb der Fläche antippen')
    : (s.pPend ? 'Gegenüberliegende Ecke antippen' : 'Erste Ecke des Kartenausschnitts antippen');

  const tools: Array<{ id: PlanTool; label: string; d: string }> = [
    { id: 'post', label: isDrueck ? 'Stand' : 'Schütze', d: isDrueck ? ICON.stand : ICON.schuetze },
    { id: 'arrow', label: isDrueck ? 'Schussfeld' : 'Treibrichtung', d: ICON.arrow },
    { id: 'split', label: 'Fläche teilen', d: ICON.split },
    { id: 'extent', label: 'Ausschnitt', d: ICON.extent },
  ];

  // Chips oben links: Gesamtrevier plus jeder gespeicherte Ausschnitt.
  const views: Array<{ id: string; box: Extent | null }> = [
    { id: 'all', box: null },
    ...s.extents.filter(x => x.jagd === s.selJagd).map(x => ({ id: x.id, box: x })),
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      <div className="scroll" style={{
        display: 'flex', gap: 8, padding: '10px 12px', overflowX: 'auto',
        background: 'var(--surf)', borderBottom: '2px solid var(--line)', flex: 'none',
      }}>
        {s.jagden.map(j => {
          const on = s.selJagd === j.id;
          return (
            <button
              key={j.id}
              onClick={() => {
                const first = treibenOf(s, j.id)[0];
                set({
                  selJagd: j.id, selTreiben: first ? first.id : null,
                  pTool: null, pPend: null, pView: 'all', pPan: { x: 6, y: 30 }, pZoom: 0.9,
                });
              }}
              style={{
                minHeight: 52, flex: 'none', display: 'flex', flexDirection: 'column',
                alignItems: 'flex-start', justifyContent: 'center', gap: 2, padding: '0 14px',
                border: '2px solid ' + (on ? 'var(--accent)' : 'var(--line)'),
                background: on ? 'var(--accent)' : 'transparent',
                color: on ? '#fff' : 'var(--ink)', cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', opacity: .75 }}>{j.art}</span>
              <span style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{j.datum}</span>
            </button>
          );
        })}
        <button onClick={() => set({ sheet: 'newjagd' })} aria-label="Neue Jagd anlegen" style={{
          minWidth: 56, minHeight: 52, flex: 'none', border: '2px dashed var(--line)',
          background: 'transparent', color: 'var(--ink)', fontSize: 20, cursor: 'pointer',
        }}>+</button>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--m-grass)' }}>
        <div
          onPointerDown={pan.start}
          onPointerMove={pan.move}
          onPointerUp={pan.end}
          onPointerCancel={pan.end}
          onPointerLeave={pan.end}
          onClick={onMapClick}
          style={{ position: 'absolute', inset: 0, touchAction: 'none', cursor: 'crosshair' }}
        >
          <div style={mapWrapStyle(s.pPan, s.pZoom)}>
            <svg width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{ display: 'block', position: 'absolute', left: 0, top: 0 }}>
              <MapTerrain />

              {s.fieldData.map(f => {
                const assigned = myTreiben.find(t => t.flaeche === f.name || f.name.indexOf(t.flaeche) === 0);
                const on = !!assigned && assigned.id === s.selTreiben;
                return (
                  <polygon
                    key={f.id}
                    points={f.points}
                    fill="var(--m-field)"
                    stroke={on ? 'var(--accent)' : assigned ? 'var(--m-label)' : 'var(--m-stroke)'}
                    strokeWidth={on ? 3 : assigned ? 2 : 1}
                    strokeDasharray={assigned ? '0' : '4 4'}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (s.pTool) return;
                      if (assigned) set({ selTreiben: assigned.id });
                      else flash(`${f.name} · ${fmt(ha(f.points), 1)} ha — noch keinem Treiben zugeordnet`);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                );
              })}

              {s.revierData.filter(r => r.visible || r.id === s.activeRevier).map(r => (
                <polygon
                  key={r.id}
                  points={r.points}
                  fill="none"
                  stroke={r.id === s.activeRevier ? 'var(--accent)' : 'var(--m-label)'}
                  strokeWidth={1.5}
                  strokeDasharray={r.kind === 'eigen' ? '0' : '10 6'}
                  opacity={0.6}
                />
              ))}

              {s.arrows.filter(a => treibenIds.indexOf(a.treiben) >= 0).map(a => {
                const g = arrowGeom(a);
                const on = a.treiben === s.selTreiben;
                const col = on ? 'var(--accent)' : 'var(--m-label)';
                return (
                  <g key={a.id} opacity={on ? 1 : 0.5}>
                    <path d={g.line} stroke={col} strokeWidth={on ? 4 : 2.5} fill="none" strokeLinecap="round" />
                    <polygon points={g.head} fill={col} />
                  </g>
                );
              })}

              {s.extents.filter(x => x.jagd === s.selJagd).map(x => (
                <rect
                  key={x.id}
                  x={x.x1} y={x.y1} width={x.x2 - x.x1} height={x.y2 - x.y1}
                  fill="none"
                  stroke={s.pView === x.id ? 'var(--accent)' : 'var(--m-label)'}
                  strokeWidth={1.5} strokeDasharray="6 5"
                />
              ))}

              {s.pPend && (
                <circle cx={s.pPend.x} cy={s.pPend.y} r={6} fill="none" stroke="var(--accent)" strokeWidth={2} />
              )}
            </svg>

            {/* Ansitze und Kirrungen bleiben zur Orientierung sichtbar, zurückgenommen. */}
            {s.markers.filter(m => m.type === 'ansitz' || m.type === 'kirrung').map(m => (
              <div key={m.id} style={{
                position: 'absolute', left: m.x - 11, top: m.y - 11, width: 22, height: 22,
                display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
                border: '1.5px solid var(--m-label)', color: 'var(--m-label)', background: 'var(--surf)',
                opacity: 0.55, boxSizing: 'border-box',
              }}>
                <Icon d={ICON[m.type]} size={14} stroke={2} />
              </div>
            ))}

            {s.posts.filter(p => treibenIds.indexOf(p.treiben) >= 0).map(p => {
              const on = p.treiben === s.selTreiben;
              return (
                <div
                  key={p.id}
                  onClick={(e) => { e.stopPropagation(); set({ selPost: p.id, sheet: 'post' }); }}
                  style={{
                    position: 'absolute', left: p.x - 14, top: p.y - 14, width: 28, height: 28,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: isDrueck ? 0 : '50%',
                    border: '2px solid ' + (on ? 'var(--accent)' : 'var(--m-label)'),
                    background: on ? 'var(--accent)' : 'var(--surf)',
                    color: on ? '#fff' : 'var(--m-label)',
                    fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', cursor: 'pointer',
                    boxSizing: 'border-box', zIndex: 6, opacity: on ? 1 : 0.75,
                  }}
                >{p.nr}</div>
              );
            })}

            {myTreiben.map(t => {
              const ps = s.posts.filter(p => p.treiben === t.id);
              if (!ps.length) return null;
              const cx = ps.reduce((a, p) => a + p.x, 0) / ps.length;
              const minY = ps.reduce((a, p) => Math.min(a, p.y), 1e9);
              const on = t.id === s.selTreiben;
              return (
                <div key={t.id} style={{
                  position: 'absolute', left: Math.round(cx - 60), top: Math.round(minY - 32), width: 120,
                  textAlign: 'center', pointerEvents: 'none', fontSize: 10, fontWeight: 600, letterSpacing: '.04em',
                  padding: '3px 0', color: on ? '#fff' : 'var(--m-label)',
                  background: on ? 'var(--accent)' : 'var(--surf)', opacity: on ? 1 : 0.7, zIndex: 4,
                }}>{t.nr}. {t.name}</div>
              );
            })}
          </div>
        </div>

        <div className="scroll" style={{ position: 'absolute', top: 10, left: 10, right: 70, display: 'flex', gap: 6, overflowX: 'auto' }}>
          {views.map(({ id, box }) => {
            const on = s.pView === id;
            const inside = box ? treibenInBox(s, box) : [];
            return (
              <button
                key={id}
                onClick={() => box ? set(extentPatch(box)) : set({ pView: 'all', pPan: { x: 6, y: 30 }, pZoom: 0.9 })}
                style={{
                  minHeight: 40, flex: 'none', padding: '0 12px', fontSize: 12, whiteSpace: 'nowrap',
                  fontWeight: on ? 600 : 400,
                  border: '2px solid ' + (on ? 'var(--accent)' : 'var(--line)'),
                  background: on ? 'var(--accent)' : 'var(--surf)',
                  color: on ? '#fff' : 'var(--ink)', cursor: 'pointer',
                }}
              >{box ? box.name + (inside.length ? ' · ' + inside.map(t => t.nr).join('+') : '') : 'Gesamtrevier'}</button>
            );
          })}
        </div>

        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => set({ sheet: 'liste' })} style={{ ...ctrlBox, fontSize: 10, fontWeight: 600, letterSpacing: '.04em' }}>LISTE</button>
          <button onClick={() => set(p => ({ pZoom: Math.min(2.4, p.pZoom + 0.25) }))} aria-label="Vergrößern" style={{ ...ctrlBox, fontSize: 22, lineHeight: 1 }}>+</button>
          <button onClick={() => set(p => ({ pZoom: Math.max(0.5, p.pZoom - 0.25) }))} aria-label="Verkleinern" style={{ ...ctrlBox, fontSize: 22, lineHeight: 1 }}>−</button>
        </div>

        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'var(--surf)', borderTop: '2px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px 2px' }}>
            <span style={{
              flex: 1, fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase',
              color: s.pTool ? 'var(--accent)' : 'var(--muted)', lineHeight: 1.3,
            }}>{hint}</span>
            {s.pTool && (
              <button onClick={() => set({ pTool: null, pPend: null })} style={{
                border: '2px solid var(--line)', background: 'transparent', color: 'var(--ink)',
                fontSize: 10, fontWeight: 600, letterSpacing: '.08em', padding: '7px 9px', cursor: 'pointer',
              }}>ABBR.</button>
            )}
          </div>

          <div className="scroll" style={{ display: 'flex', gap: 6, padding: '6px 12px 4px', overflowX: 'auto' }}>
            {myTreiben.map(t => {
              const on = s.selTreiben === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => set({ selTreiben: t.id, pPend: null })}
                  style={{
                    minHeight: 44, flex: 'none', padding: '0 12px', fontSize: 13, whiteSpace: 'nowrap',
                    fontWeight: on ? 600 : 400,
                    border: '2px solid ' + (on ? 'var(--accent)' : 'var(--line)'),
                    background: on ? 'var(--accent)' : 'transparent',
                    color: on ? '#fff' : 'var(--ink)', cursor: 'pointer',
                  }}
                >{t.nr}. {t.name}</button>
              );
            })}
            <button
              onClick={() => { const { patch, message } = addTreibenPatch(s); set(patch); flash(message); }}
              aria-label={isDrueck ? 'Gebiet hinzufügen' : 'Treiben hinzufügen'}
              style={{
                minWidth: 44, minHeight: 44, flex: 'none', border: '2px dashed var(--line)',
                background: 'transparent', color: 'var(--ink)', fontSize: 18, cursor: 'pointer',
              }}
            >+</button>
          </div>

          <div className="scroll" style={{ display: 'flex', gap: 8, padding: '6px 12px 12px', overflowX: 'auto' }}>
            {tools.map(t => {
              const on = s.pTool === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => set(p => ({ pTool: p.pTool === t.id ? null : t.id, pPend: null }))}
                  style={{
                    minWidth: 76, minHeight: 58, flex: 'none', display: 'flex', flexDirection: 'column',
                    alignItems: 'flex-start', justifyContent: 'center', gap: 4, padding: '0 10px',
                    border: '2px solid ' + (on ? 'var(--accent)' : 'var(--line)'),
                    background: on ? 'var(--accent)' : 'transparent',
                    color: on ? '#fff' : 'var(--ink)', cursor: 'pointer',
                  }}
                >
                  <Icon d={t.d} size={20} />
                  <span style={{ fontSize: 10, letterSpacing: '.04em', lineHeight: 1.1, whiteSpace: 'nowrap' }}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {s.toast && <Toast text={s.toast} bottom={196} />}
      </div>
    </div>
  );
}
