import type { PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from 'react';
import { useApp, typeDef } from '../state/store';
import { ICON, M_PER_PX } from '../data/constants';
import type { Marker, MarkerType } from '../types';
import { compass, fmt, gps, ha, parse } from '../lib/geo';
import { activeRevier, visibleRevierIds } from '../lib/selectors';
import { chip, ctrlBox, pinStyle } from '../lib/styles';
import { MAP_H, MAP_W, mapWrapStyle, toMap, usePan } from '../lib/mapInteraction';
import { MapTerrain } from '../components/MapTerrain';
import { Icon } from '../components/Icon';
import { Toast } from '../components/Toast';
import { DrawPanel } from './karte/DrawPanel';
import { MarkerToolbar } from './karte/MarkerToolbar';
import { AimOverlay, RadialFab } from './karte/AimPanel';

/** Ein Ansitz mit Schussentfernungen wird als kleiner Punkt mit Ringen
 *  gezeichnet, nicht als 30-px-Symbolkasten — sonst verdeckt der Pin die Ringe. */
const ringed = (m: Marker) => m.type === 'ansitz' && !!m.dists && m.dists.length > 0;

export function KarteScreen() {
  const { state: s, set, flash, addMarker } = useApp();
  const pan = usePan(s.pan, p => set({ pan: p }));

  const act = activeRevier(s);
  const visIds = visibleRevierIds(s);
  const inView = (m: Marker) => visIds.indexOf(m.revier || 'r1') >= 0;
  const cur = s.markers.find(m => m.id === s.sel);
  const sym = s.zeichen === 'symbol';

  // Messen: Bezugspunkt ist der gesetzte Punkt, sonst der gewählte Ansitz,
  // sonst der eigene Standort.
  const mFrom = s.measFrom ?? (cur ? { x: cur.x, y: cur.y } : { x: 200, y: 260 });
  const mFromName = s.measFrom ? 'gesetztem Punkt' : (cur ? cur.name : 'eigenem Standort');
  const mTo = s.measTo;
  const measM = mTo ? Math.round(Math.hypot(mTo.x - mFrom.x, mTo.y - mFrom.y) * M_PER_PX / 5) * 5 : 0;
  const measDir = mTo ? compass(mTo.x - mFrom.x, mTo.y - mFrom.y) : '';

  const showToolbar = s.ctrl === 'werkzeug' && !s.drawing && !s.aim;
  const showFab = s.ctrl === 'zielkreuz' && !s.drawing;

  const toolHint = s.measure
    ? (mTo ? `${measM} m · ${measDir} · ab ${mFromName}` : `Über die Karte ziehen — ab ${mFromName}, Tippen setzt Startpunkt`)
    : s.tool ? typeDef(s.tool).label + ' — Stelle auf der Karte antippen'
    : 'Werkzeug wählen, dann Karte antippen';

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (s.measure) { set({ measTo: toMap(e, s.pan, s.zoom) }); return; }
    pan.move(e);
  };

  const onMapClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (pan.moved()) return;
    const pt = toMap(e, s.pan, s.zoom);
    if (s.measure) { set({ measFrom: pt, measTo: pt }); return; }
    if (s.drawing) { set(st => ({ drawing: (st.drawing ?? []).concat([[pt.x, pt.y]]) })); return; }
    if (s.pickTarget) {
      // Standort für den Tagebucheintrag: den nächstgelegenen Marker benennen,
      // sonst die Koordinate.
      const nearest = s.markers.reduce<{ d: number; m: Marker | null }>((b, m) => {
        const d = (m.x - pt.x) ** 2 + (m.y - pt.y) ** 2;
        return d < b.d ? { d, m } : b;
      }, { d: 1e9, m: null });
      const ort = nearest.m && nearest.d < 3000 ? nearest.m.name : gps(pt.x, pt.y);
      set(st => ({ pickTarget: false, sheet: 'entry', form: { ...st.form, ort } }));
      return;
    }
    if (s.tool) addMarker(s.tool, pt.x, pt.y);
  };

  const selectMarker = (id: number) => (e: ReactMouseEvent) => {
    e.stopPropagation();
    set({ sel: id, sheet: 'marker', selField: null });
  };

  const finishDraw = () => {
    if (!s.drawing || s.drawing.length < 3) { flash('Mindestens drei Grenzpunkte nötig.'); return; }
    set({ pendingRevier: s.drawing, drawing: null, sheet: 'naming', rName: 'Revier Neu' });
  };

  const placeAtCenter = () => {
    if (!s.aim) return;
    const x = Math.round((206 - s.pan.x - 200 * (1 - s.zoom)) / s.zoom);
    const y = Math.round((260 - s.pan.y - 260 * (1 - s.zoom)) / s.zoom);
    addMarker(s.aim, x, y);
  };

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--m-grass)' }}>

      <div
        onPointerDown={pan.start}
        onPointerMove={onPointerMove}
        onPointerUp={pan.end}
        // Auch beim Verlassen der Karte lösen — sonst bliebe die Geste hängen
        // und ein folgendes Tippen würde als Ziehen verworfen.
        onPointerCancel={pan.end}
        onPointerLeave={pan.end}
        onClick={onMapClick}
        style={{ position: 'absolute', inset: 0, touchAction: 'none', cursor: 'crosshair' }}
      >
        <div style={mapWrapStyle(s.pan, s.zoom)}>
          <svg width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{ display: 'block', position: 'absolute', left: 0, top: 0 }}>
            <MapTerrain detailed />

            {s.fieldData.map(f => (
              <polygon
                key={f.id}
                points={f.points}
                fill="var(--m-field)"
                stroke={s.selField === f.id ? 'var(--accent)' : 'var(--m-stroke)'}
                strokeWidth={s.selField === f.id ? 3 : 1}
                onClick={(e) => { e.stopPropagation(); set({ selField: f.id, sheet: 'field', sel: null }); }}
                style={{ cursor: 'pointer' }}
              />
            ))}

            {s.revierData.filter(r => r.visible || r.id === act.id).map(r => (
              <polygon
                key={r.id}
                points={r.points}
                fill="none"
                stroke={r.id === act.id ? 'var(--accent)' : 'var(--m-label)'}
                strokeWidth={r.id === act.id ? 3 : 2}
                strokeDasharray={r.kind === 'eigen' ? '0' : '10 6'}
              />
            ))}

            {s.drawing && (
              <polyline
                points={s.drawing.map(p => p.join(',')).join(' ')}
                fill="rgba(111,90,35,0.12)"
                stroke="var(--accent)"
                strokeWidth={2}
              />
            )}
          </svg>

          {/* Fruchtart-Beschriftung an der unteren Schlagkante; kollidierende
              Pins schiebt sie zeilenweise nach unten weg. */}
          {s.fieldData.map(f => {
            const p = parse(f.points);
            const cx = p.reduce((a, q) => a + q[0], 0) / p.length;
            const maxY = p.reduce((a, q) => Math.max(a, q[1]), 0);
            const w = f.crop.length * 5.6 + 8, h = 15;
            let top = maxY + 4;
            for (let pass = 0; pass < 6; pass++) {
              const hit = s.markers.some(m => Math.abs(m.x - cx) < 15 + w / 2 && m.y - 15 < top + h && m.y + 15 > top);
              if (!hit) break;
              top += 18;
            }
            return (
              <div key={f.id} style={{
                position: 'absolute', left: Math.round(cx - w / 2), top: Math.round(top), width: Math.round(w),
                textAlign: 'center', pointerEvents: 'none', fontSize: 9, fontWeight: 600, lineHeight: '15px',
                letterSpacing: '.05em', color: 'var(--m-label)', whiteSpace: 'nowrap',
                background: 'var(--m-grass)', zIndex: 1,
              }}>{f.crop}</div>
            );
          })}

          {(s.drawing ?? []).map((p, i) => (
            <div key={i} style={{
              position: 'absolute', left: p[0] - 5, top: p[1] - 5,
              width: 10, height: 10, background: 'var(--accent)',
            }} />
          ))}

          {/* Schussentfernungen als gestrichelte Goldkreise, maßstabsgerecht. */}
          {s.markers.filter(m => inView(m) && ringed(m)).flatMap(m => {
            const on = s.sel === m.id;
            return [...(m.dists ?? [])].sort((a, b) => b - a).map(d => {
              const r = d / M_PER_PX;
              return (
                <div key={`${m.id}-${d}`} style={{
                  position: 'absolute', left: m.x - r, top: m.y - r, width: r * 2, height: r * 2,
                  borderRadius: '50%', border: (on ? 2 : 1) + 'px dashed var(--gold)', boxSizing: 'border-box',
                  background: `color-mix(in oklab, var(--gold) ${on ? 14 : 7}%, transparent)`,
                  opacity: on ? 1 : 0.75, pointerEvents: 'none',
                }} />
              );
            });
          })}

          {/* Meterbeschriftung nur am ausgewählten Ansitz, zoomfest gestapelt. */}
          {s.markers.filter(m => ringed(m) && s.sel === m.id).flatMap(m => {
            const ds = [...(m.dists ?? [])].sort((a, b) => b - a);
            const top0 = m.y - Math.max(...(m.dists ?? [0])) / M_PER_PX;
            return ds.map((d, i) => (
              <div key={`${m.id}-l-${d}`} style={{
                position: 'absolute', left: m.x, top: top0 - 4 - i * (20 / s.zoom),
                transform: `translate(-50%,-100%) scale(${1 / s.zoom})`, transformOrigin: 'bottom center',
                fontSize: 10, fontWeight: 600, letterSpacing: '.04em', lineHeight: '15px',
                color: 'var(--m-label)', background: 'var(--m-road)', border: '1px solid var(--gold)',
                padding: '0 5px', pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 4,
              }}>{d} m</div>
            ));
          })}

          {s.measure && mTo && (
            <>
              <svg
                width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`}
                style={{ display: 'block', position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: 5 }}
              >
                <line
                  x1={mFrom.x} y1={mFrom.y} x2={mTo.x} y2={mTo.y}
                  stroke="var(--accent)" strokeWidth={2} strokeDasharray="6 4" vectorEffect="non-scaling-stroke"
                />
              </svg>
              <div style={{
                position: 'absolute', left: mFrom.x, top: mFrom.y, width: 20, height: 20,
                marginLeft: -10, marginTop: -10, transform: `scale(${1 / s.zoom})`, borderRadius: '50%',
                border: '2px solid var(--accent)', background: 'color-mix(in oklab, var(--accent) 22%, transparent)',
                boxSizing: 'border-box', pointerEvents: 'none', zIndex: 5,
              }} />
              <div style={{
                position: 'absolute', left: mTo.x, top: mTo.y - 10 / s.zoom,
                transform: `translate(-50%,-100%) scale(${1 / s.zoom})`, transformOrigin: 'bottom center',
                background: 'var(--accent)', color: 'var(--surf)', fontSize: 12, fontWeight: 600,
                letterSpacing: '.03em', lineHeight: '20px', padding: '0 8px', whiteSpace: 'nowrap',
                pointerEvents: 'none', zIndex: 6, fontVariantNumeric: 'tabular-nums',
              }}>{measM} m · {measDir}</div>
            </>
          )}

          {/* Der Punkt skaliert gegen den Zoom — er bleibt klein, die Ringe wachsen. */}
          {s.markers.filter(m => inView(m) && ringed(m)).map(m => {
            const on = s.sel === m.id;
            return (
              <div
                key={m.id}
                onClick={selectMarker(m.id)}
                style={{
                  position: 'absolute', left: m.x, top: m.y, width: 26, height: 26,
                  marginLeft: -13, marginTop: -13, transform: `scale(${1 / s.zoom})`,
                  boxSizing: 'border-box', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', zIndex: 3,
                }}
              >
                <div style={{
                  width: on ? 11 : 8, height: on ? 11 : 8, borderRadius: '50%',
                  background: on ? 'var(--accent)' : 'var(--surf)',
                  border: '2px solid ' + (on ? 'var(--accent)' : 'var(--line)'), boxSizing: 'border-box',
                }} />
              </div>
            );
          })}

          {s.markers.filter(m => inView(m) && !ringed(m)).map(m => {
            const t = typeDef(m.type);
            return (
              <div
                key={m.id}
                onClick={selectMarker(m.id)}
                style={{ ...pinStyle(t.accent, s.sel === m.id), left: m.x - 15, top: m.y - 15 }}
              >
                {sym
                  ? <Icon d={ICON[t.id]} size={18} />
                  : <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1 }}>{t.code}</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', background: 'var(--surf)', border: '2px solid var(--line)' }}>
        <button
          onClick={() => set({ mapStyle: 'topo' })}
          style={chip(s.mapStyle === 'topo', { minHeight: 44, fontSize: 13, borderWidth: 0, borderRight: '2px solid var(--line)' })}
        >Topografie</button>
        <button
          onClick={() => set({ mapStyle: 'sat' })}
          style={chip(s.mapStyle === 'sat', { minHeight: 44, fontSize: 13, borderWidth: 0 })}
        >Satellit</button>
      </div>

      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={() => set({ sheet: 'reviere' })} style={{ ...ctrlBox, fontSize: 11, fontWeight: 600, letterSpacing: '.04em' }}>REV</button>
        <button onClick={() => set({ sheet: 'legend' })} style={{ ...ctrlBox, fontSize: 11, fontWeight: 600, letterSpacing: '.04em' }}>i</button>
        <button onClick={() => set(p => ({ zoom: Math.min(2.4, p.zoom + 0.25) }))} aria-label="Vergrößern" style={{ ...ctrlBox, fontSize: 22, fontWeight: 500, lineHeight: 1 }}>+</button>
        <button onClick={() => set(p => ({ zoom: Math.max(0.6, p.zoom - 0.25) }))} aria-label="Verkleinern" style={{ ...ctrlBox, fontSize: 22, fontWeight: 500, lineHeight: 1 }}>−</button>
      </div>

      <div style={{
        position: 'absolute', left: 12, top: 66, background: 'var(--surf)', border: '2px solid var(--line)',
        padding: '5px 9px', fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)',
      }}>
        {fmt(s.zoom * 100, 0)} % · {M_PER_PX} m/px · {s.mapStyle === 'topo' ? 'OSM + DGM1' : 'DOP20 LGLN'}
      </div>

      {s.drawing && (
        <DrawPanel
          hint={s.drawing.length > 2
            ? `${s.drawing.length} Punkte · ${fmt(ha(s.drawing), 0)} ha umschlossen`
            : 'Grenzpunkte antippen — mindestens drei. Später auch per GPS-Track ablaufbar.'}
          onFinish={finishDraw}
          onUndo={() => set(p => ({ drawing: (p.drawing ?? []).slice(0, -1) }))}
          onCancel={() => set({ drawing: null })}
        />
      )}

      {showToolbar && (
        <MarkerToolbar
          hint={toolHint}
          tool={s.tool}
          sym={sym}
          measure={s.measure}
          onMeasToggle={() => set(p => ({
            measure: !p.measure, tool: null, radial: false, aim: null,
            measFrom: !p.measure ? null : p.measFrom, measTo: null,
          }))}
          onStartDraw={() => set({ drawing: [], sheet: null, tool: null, radial: false, aim: null, screen: 'karte' })}
          onPick={(id: MarkerType) => set(p => ({ tool: p.tool === id ? null : id }))}
        />
      )}

      {showFab && (
        <RadialFab
          open={s.radial}
          onToggle={() => set(p => ({ radial: !p.radial, aim: null }))}
          onPick={(id) => set({ aim: id, radial: false })}
        />
      )}

      {s.aim && (
        <AimOverlay type={s.aim} onPlace={placeAtCenter} onCancel={() => set({ aim: null })} />
      )}

      {s.toast && (
        <Toast
          text={s.toast}
          bottom={170}
          onUndo={() => set(p => ({
            markers: p.lastAdded ? p.markers.filter(m => m.id !== p.lastAdded) : p.markers,
            toast: '', sheet: null, sel: null,
          }))}
        />
      )}
    </div>
  );
}
