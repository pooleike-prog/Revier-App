import { useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import { useApp } from '../state/store';
import { ICON, M_PER_PX } from '../data/constants';
import type { Extent, Field, PlanTool } from '../types';
import type { Vertex } from '../lib/geo';
import { compass, cut, fmt, ha, inPoly, parse, toStr } from '../lib/geo';
import { currentJagd, treibenInBox, treibenOf, treibenName } from '../lib/selectors';
import { PLAN_MITTE, addTreibenPatch, arrowGeom, extentPatch, jagdLoeschenPatch, revierPatch } from '../lib/planning';
import { ctrlBox } from '../lib/styles';
import { MAP_H, MAP_W, ZOOM_MAX, ZOOM_MIN, ZOOM_STUFE, aufrecht, mapWrapStyle, panFuer, screenToMap, toMap, useLongPress, usePan, usePinch, zoomUm } from '../lib/mapInteraction';
import { Nordpfeil } from '../components/Nordpfeil';
import { PlanSchritte } from './planung/PlanSchritte';
import { lngLatToPx } from '../lib/projection';
import { useStandort } from '../state/useStandort';
import { RealMap } from '../components/RealMap';
import { Icon } from '../components/Icon';
import { Toast } from '../components/Toast';

export function PlanungScreen() {
  const { state: s, set, flash } = useApp();
  const pan = usePan(s.pPan, p => set({ pPan: p }));
  const pinch = usePinch({ pan: s.pPan, zoom: s.pZoom, rot: s.pRot }, (p, z, r) => set({ pPan: p, pZoom: z, pRot: r }), ZOOM_MIN, ZOOM_MAX);
  // Punkte, Pfeile und Linien bleiben auf dem Bildschirm gleich groß, egal wie weit gezoomt ist.
  const inv = 1 / s.pZoom;
  // Schilder bleiben zudem aufrecht, wenn die Karte gedreht ist.
  const auf = aufrecht(inv, s.pRot);
  // Flächen zeichnen: Ein langer Druck setzt den nächsten Grenzpunkt.
  const halten = useLongPress({ pan: s.pPan, zoom: s.pZoom, rot: s.pRot }, pt =>
    set(st => (st.pSchritt === 'flaechen' && st.pDraw ? { pDraw: st.pDraw.concat([[pt.x, pt.y]]) } : {})));
  // Löschen der Planung braucht einen zweiten Druck.
  const [loeschFrage, setLoeschFrage] = useState(false);
  const standort = useStandort(flash);
  const ich = standort ? lngLatToPx(standort.lng, standort.lat) : null;

  const MITTE = PLAN_MITTE;

  /** Holt die eigene Position in die Mitte, bei kleinem Zoom etwas näher heran. */
  const zuMir = () => {
    if (!ich) { flash('Noch kein GPS-Empfang.'); return; }
    set(p => {
      const zoom = Math.max(p.pZoom, 2);
      return { pZoom: zoom, pView: 'all', pPan: panFuer(ich, MITTE, zoom, p.pRot) };
    });
  };

  const zeichnen = s.pSchritt === 'flaechen' && !!s.pDraw;

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pinch.down(e)) { pan.end(); halten.cancel(); return; }
    halten.down(e, zeichnen);
    pan.start(e);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pinch.move(e)) { halten.cancel(); return; }
    halten.move(e);
    pan.move(e);
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    pinch.up(e);
    pan.end();
    halten.cancel();
  };

  const jagd = currentJagd(s);
  const isDrueck = jagd.art === 'Drückjagd';
  const jagdRevier = jagd.revier ?? s.activeRevier;
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
    if (pan.moved() || pinch.recent() || halten.fired()) return;
    if (!s.pTool) return;
    const pt = toMap(e, s.pPan, s.pZoom, s.pRot);

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
    set(extentPatch(box, s.pRot));
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
                setLoeschFrage(false);
                set(p => ({
                  selJagd: j.id, selTreiben: first ? first.id : null,
                  pTool: null, pPend: null, pSchritt: null, pDraw: null, ...revierPatch(p, j.revier),
                }));
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
        <button onClick={() => set({ sheet: 'newjagd' })} aria-label="Neue Planung anlegen" style={{
          minWidth: 56, minHeight: 52, flex: 'none', border: '2px dashed var(--line)',
          background: 'transparent', color: 'var(--ink)', fontSize: 20, cursor: 'pointer',
        }}>+</button>
        {jagd.id && (
          <button
            onClick={() => {
              if (!loeschFrage) { setLoeschFrage(true); return; }
              setLoeschFrage(false);
              set(jagdLoeschenPatch(s, jagd.id));
              flash(`${jagd.art} vom ${jagd.datum} gelöscht.`);
            }}
            onBlur={() => setLoeschFrage(false)}
            aria-label="Planung löschen"
            style={{
              minHeight: 52, flex: 'none', padding: '0 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              border: '2px solid ' + (loeschFrage ? '#b3261e' : 'var(--line)'),
              background: loeschFrage ? '#b3261e' : 'transparent', color: loeschFrage ? '#fff' : 'var(--ink)',
              whiteSpace: 'nowrap',
            }}
          >{loeschFrage ? 'Wirklich löschen?' : 'Löschen'}</button>
        )}
      </div>

      {!jagd.id && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14, padding: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 600 }}>Noch keine Planung</div>
          <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--muted)' }}>
            Erst das Revier wählen, dann auf der Karte die Flächen einzeichnen und benennen, danach die Treibrichtungen.
          </div>
          <button onClick={() => set({ sheet: 'newjagd' })} style={{
            minHeight: 58, border: '2px solid var(--accent)', background: 'var(--accent)',
            color: '#fff', fontSize: 16, fontWeight: 600, textAlign: 'left', padding: '0 16px', cursor: 'pointer',
          }}>Neue Planung starten</button>
        </div>
      )}

      {jagd.id && <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--m-grass)' }}>
        <RealMap pan={s.pPan} zoom={s.pZoom} rot={s.pRot} art={s.mapStyle} night={s.night} vermerkOben={62} />
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={onPointerUp}
          onClick={onMapClick}
          style={{ position: 'absolute', inset: 0, touchAction: 'none', cursor: 'crosshair' }}
        >
          <div style={mapWrapStyle(s.pPan, s.pZoom, s.pRot)}>
            <svg width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{ display: 'block', position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>

              {s.fieldData.map(f => {
                const assigned = myTreiben.find(t => t.flaeche === f.name || f.name.indexOf(t.flaeche) === 0);
                const on = !!assigned && assigned.id === s.selTreiben;
                return (
                  <polygon
                    key={f.id}
                    points={f.points}
                    fill="var(--m-field)"
                    fillOpacity={0.35}
                    stroke={on ? 'var(--accent)' : assigned ? 'var(--m-label)' : 'var(--m-stroke)'}
                    strokeWidth={(on ? 2.5 : assigned ? 1.5 : 1) * inv}
                    strokeDasharray={assigned ? '0' : `${4 * inv} ${4 * inv}`}
                    // Mit gewähltem Werkzeug oder beim Zeichnen gehört der Tipp der Karte —
                    // sonst ließen sich in einer Fläche keine Schützen und Pfeile setzen.
                    pointerEvents={s.pTool || (zeichnen && (s.pDraw?.length ?? 0) > 0) ? 'none' : undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Im Planungsmodus öffnet ein Tipp Bezeichnung und Frucht der Fläche.
                      if (s.pSchritt === 'flaechen') { set({ selField: f.id, sheet: 'planflaeche' }); return; }
                      if (assigned) set({ selTreiben: assigned.id });
                      else flash(`${f.name} · ${fmt(ha(f.points), 1)} ha — noch keinem Treiben zugeordnet`);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                );
              })}

              {s.revierData.filter(r => r.visible || r.id === jagdRevier).map(r => (
                <polygon
                  key={r.id}
                  points={r.points}
                  fill="none" pointerEvents="none"
                  stroke={r.id === jagdRevier ? 'var(--accent)' : 'var(--m-label)'}
                  strokeWidth={(r.id === jagdRevier ? 2.5 : 1.5) * inv}
                  strokeDasharray={r.kind === 'eigen' ? '0' : `${10 * inv} ${6 * inv}`}
                  opacity={r.id === jagdRevier ? 0.9 : 0.6}
                />
              ))}

              {/* Die entstehende Fläche wächst mit jedem Punkt sichtbar mit. */}
              {zeichnen && s.pDraw!.length > 2 && (
                <polygon points={s.pDraw!.map(p => p.join(',')).join(' ')} fill="var(--accent)" fillOpacity={0.22} stroke="none" pointerEvents="none" />
              )}
              {zeichnen && s.pDraw!.length > 1 && (
                <polyline points={s.pDraw!.map(p => p.join(',')).join(' ')} fill="none" stroke="var(--accent)" strokeWidth={2 * inv} strokeLinejoin="round" pointerEvents="none" />
              )}
              {zeichnen && s.pDraw!.length > 2 && (
                <line
                  x1={s.pDraw![s.pDraw!.length - 1][0]} y1={s.pDraw![s.pDraw!.length - 1][1]} x2={s.pDraw![0][0]} y2={s.pDraw![0][1]}
                  stroke="var(--accent)" strokeWidth={1.5 * inv} strokeDasharray={`${5 * inv} ${4 * inv}`} pointerEvents="none"
                />
              )}

              {s.arrows.filter(a => treibenIds.indexOf(a.treiben) >= 0).map(a => {
                const g = arrowGeom(a, inv);
                const on = a.treiben === s.selTreiben;
                const col = on ? 'var(--accent)' : 'var(--m-label)';
                return (
                  <g key={a.id} opacity={on ? 1 : 0.5}>
                    <path d={g.line} stroke={col} strokeWidth={(on ? 3 : 2) * inv} fill="none" strokeLinecap="round" />
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
                  strokeWidth={1.5 * inv} strokeDasharray={`${6 * inv} ${5 * inv}`}
                />
              ))}

              {s.pPend && (
                <circle cx={s.pPend.x} cy={s.pPend.y} r={6 * inv} fill="none" stroke="var(--accent)" strokeWidth={2 * inv} />
              )}
            </svg>

            {zeichnen && s.pDraw!.map((p, i) => (
              <div key={'d' + i} style={{
                position: 'absolute', left: p[0] - 5, top: p[1] - 5, width: 10, height: 10,
                background: i === 0 ? 'var(--surf)' : 'var(--accent)', border: '2px solid var(--accent)',
                boxSizing: 'border-box', transform: auf, pointerEvents: 'none', zIndex: 8,
              }} />
            ))}

            {/* Bezeichnung und Frucht jeder Fläche in ihrer Mitte. */}
            {s.fieldData.map(f => {
              const p = parse(f.points);
              const cx = p.reduce((a, q) => a + q[0], 0) / p.length;
              const cy = p.reduce((a, q) => a + q[1], 0) / p.length;
              return (
                <div key={'l' + f.id} style={{
                  position: 'absolute', left: cx, top: cy, transform: `translate(-50%,-50%) ${auf}`,
                  textAlign: 'center', pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 3,
                  padding: '1px 5px', background: 'color-mix(in oklab, var(--surf) 78%, transparent)',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, lineHeight: '14px', color: 'var(--ink)' }}>{f.name}</div>
                  {f.crop && f.crop !== '—' && <div style={{ fontSize: 9, letterSpacing: '.05em', lineHeight: '12px', color: 'var(--m-label)' }}>{f.crop}</div>}
                </div>
              );
            })}

            {/* Ansitze und Kirrungen bleiben zur Orientierung sichtbar, zurückgenommen. */}
            {s.markers.filter(m => m.type === 'ansitz' || m.type === 'kirrung').map(m => (
              <div key={m.id} style={{
                position: 'absolute', left: m.x - 9, top: m.y - 9, width: 18, height: 18,
                transform: auf, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
                border: '1.5px solid var(--m-label)', color: 'var(--m-label)', background: 'var(--surf)',
                opacity: 0.55, boxSizing: 'border-box',
              }}>
                <Icon d={ICON[m.type]} size={12} stroke={2} />
              </div>
            ))}

            {s.posts.filter(p => treibenIds.indexOf(p.treiben) >= 0).map(p => {
              const on = p.treiben === s.selTreiben;
              return (
                <div
                  key={p.id}
                  onClick={(e) => { e.stopPropagation(); set({ selPost: p.id, sheet: 'post' }); }}
                  style={{
                    position: 'absolute', left: p.x - 11, top: p.y - 11, width: 22, height: 22,
                    transform: auf, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: isDrueck ? 0 : '50%',
                    border: '2px solid ' + (on ? 'var(--accent)' : 'var(--m-label)'),
                    background: on ? 'var(--accent)' : 'var(--surf)',
                    color: on ? '#fff' : 'var(--m-label)',
                    fontSize: 11, fontWeight: 600, fontVariantNumeric: 'tabular-nums', cursor: 'pointer',
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
                  position: 'absolute', left: cx, top: minY - 14 * inv,
                  transform: `translate(-50%,-100%) ${auf}`, transformOrigin: 'bottom center',
                  whiteSpace: 'nowrap', textAlign: 'center', pointerEvents: 'none', fontSize: 10, fontWeight: 600, letterSpacing: '.04em',
                  padding: '2px 6px', color: on ? '#fff' : 'var(--m-label)',
                  background: on ? 'var(--accent)' : 'var(--surf)', opacity: on ? 1 : 0.7, zIndex: 4,
                }}>{t.nr}. {t.name}</div>
              );
            })}

            {/* Eigene Position: Genauigkeitskreis maßstabsgerecht, Punkt zoomfest. */}
            {ich && standort && (
              <>
                <div style={{
                  position: 'absolute', left: ich.x - standort.genau / M_PER_PX, top: ich.y - standort.genau / M_PER_PX,
                  width: 2 * standort.genau / M_PER_PX, height: 2 * standort.genau / M_PER_PX, borderRadius: '50%',
                  background: 'color-mix(in oklab, var(--accent) 12%, transparent)', pointerEvents: 'none', zIndex: 7,
                }} />
                <div style={{
                  position: 'absolute', left: ich.x - 7, top: ich.y - 7, width: 14, height: 14,
                  transform: auf, borderRadius: '50%', boxSizing: 'border-box',
                  background: 'var(--accent)', border: '3px solid var(--surf)',
                  boxShadow: '0 0 0 2px var(--accent)', pointerEvents: 'none', zIndex: 7,
                }} />
              </>
            )}
          </div>
        </div>

        <div className="scroll" style={{ position: 'absolute', top: 10, left: 10, right: 70, display: 'flex', gap: 6, overflowX: 'auto' }}>
          {views.map(({ id, box }) => {
            const on = s.pView === id;
            const inside = box ? treibenInBox(s, box) : [];
            return (
              <button
                key={id}
                onClick={() => set(p => (box ? extentPatch(box, p.pRot) : revierPatch(p, jagd.revier)))}
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
          <button onClick={() => set(p => { const z = zoomUm(p.pPan, p.pZoom, Math.min(ZOOM_MAX, p.pZoom * ZOOM_STUFE), MITTE); return { pZoom: z.zoom, pPan: z.pan }; })} aria-label="Vergrößern" style={{ ...ctrlBox, fontSize: 22, lineHeight: 1 }}>+</button>
          <button onClick={() => set(p => { const z = zoomUm(p.pPan, p.pZoom, Math.max(ZOOM_MIN, p.pZoom / ZOOM_STUFE), MITTE); return { pZoom: z.zoom, pPan: z.pan }; })} aria-label="Verkleinern" style={{ ...ctrlBox, fontSize: 22, lineHeight: 1 }}>−</button>
          {s.pRot !== 0 && <Nordpfeil rot={s.pRot} onClick={() => set(p => ({ pRot: 0, pPan: panFuer(screenToMap(MITTE.x, MITTE.y, p.pPan, p.pZoom, p.pRot), MITTE, p.pZoom, 0) }))} />}
          <button onClick={zuMir} aria-label="Auf eigenen Standort" style={{ ...ctrlBox, fontSize: 20, lineHeight: 1, ...(ich ? null : { opacity: 0.5 }) }}>◎</button>
        </div>

        {s.pSchritt && <PlanSchritte />}

        {!s.pSchritt && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'var(--surf)', borderTop: '2px solid var(--line)' }}>
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
            <button
              onClick={() => set({ pSchritt: 'flaechen', pDraw: [], pTool: null, pPend: null })}
              style={{
                minWidth: 76, minHeight: 58, flex: 'none', display: 'flex', flexDirection: 'column',
                alignItems: 'flex-start', justifyContent: 'center', gap: 4, padding: '0 10px',
                border: '2px solid var(--line)', background: 'transparent', color: 'var(--ink)', cursor: 'pointer',
              }}
            >
              <Icon d="M4 8 L12 3 L20 8 L18 19 L6 18 Z" size={20} />
              <span style={{ fontSize: 10, letterSpacing: '.04em', lineHeight: 1.1, whiteSpace: 'nowrap' }}>Flächen</span>
            </button>
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
        </div>}

        {s.toast && <Toast text={s.toast} bottom={196} />}
      </div>}
    </div>
  );
}
