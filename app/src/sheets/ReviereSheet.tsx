import { useApp } from '../state/store';
import type { RevierKind } from '../types';
import { fmt, ha } from '../lib/geo';
import { activeRevier, kindLabel } from '../lib/selectors';
import { block, chip, inputStyle, label } from '../lib/styles';
import { sheetBody } from '../components/Sheet';

const KINDS: Array<[RevierKind, string]> = [
  ['eigen', 'Eigenjagd'],
  ['pacht', 'Pacht'],
  ['begeh', 'Begehungsschein'],
];

export function ReviereSheet() {
  const { state: s, set } = useApp();
  const act = activeRevier(s);

  return (
    <div style={{ ...sheetBody, gap: 10 }}>
      {s.revierData.map(r => {
        const on = r.id === act.id;
        return (
          <div key={r.id} style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
            <button onClick={() => set({ activeRevier: r.id, sheet: null })} style={block(on)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 20, height: 20, flex: 'none',
                  border: '3px ' + (r.kind === 'eigen' ? 'solid ' : 'dashed ') + (on ? 'var(--accent)' : 'var(--muted)'),
                  opacity: r.visible || on ? 1 : 0.35,
                }} />
                <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(ha(r.points), 0)} ha · {kindLabel(r.kind)} · {s.markers.filter(m => (m.revier || 'r1') === r.id).length} Marker
                  </div>
                </div>
                <div style={{ fontSize: 10, letterSpacing: '.1em', color: 'var(--accent)', fontWeight: 600 }}>
                  {on ? 'AKTIV' : ''}
                </div>
              </div>
            </button>
            {/* Marker ausgeblendeter Reviere verschwinden mit; das aktive bleibt sichtbar. */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                set(p => ({ revierData: p.revierData.map(x => (x.id === r.id ? { ...x, visible: !x.visible } : x)) }));
              }}
              style={{
                minHeight: 40, border: '2px solid var(--line)',
                background: r.visible ? 'var(--chip)' : 'transparent', color: 'var(--ink)',
                fontSize: 11, letterSpacing: '.06em', padding: '0 10px', cursor: 'pointer', flex: 'none',
              }}
            >{r.visible ? 'Sichtbar' : 'Aus'}</button>
          </div>
        );
      })}

      <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={label}>Aktives Revier bearbeiten</div>
        <input
          value={act.name}
          onChange={(e) => {
            const v = e.target.value;
            set(p => ({ revierData: p.revierData.map(x => (x.id === p.activeRevier ? { ...x, name: v } : x)) }));
          }}
          style={inputStyle}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          {KINDS.map(([id, text]) => (
            <button
              key={id}
              onClick={() => set(p => ({ revierData: p.revierData.map(x => (x.id === p.activeRevier ? { ...x, kind: id } : x)) }))}
              style={chip(act.kind === id, { minHeight: 44, fontSize: 13, flex: 1 })}
            >{text}</button>
          ))}
        </div>
        {s.revierData.length > 1 && (
          <button
            onClick={() => set(p => {
              const rest = p.revierData.filter(x => x.id !== p.activeRevier);
              if (!rest.length) return {};
              return {
                revierData: rest,
                activeRevier: rest[0].id,
                markers: p.markers.filter(m => (m.revier || 'r1') !== p.activeRevier),
              };
            })}
            style={{
              minHeight: 48, border: '2px solid var(--line)', background: 'transparent',
              color: 'var(--ink)', fontSize: 14, textAlign: 'left', padding: '0 14px', cursor: 'pointer',
            }}
          >Revier mit allen Markern löschen</button>
        )}
      </div>

      <button
        onClick={() => set({ drawing: [], sheet: null, tool: null, radial: false, aim: null, screen: 'karte' })}
        style={{
          minHeight: 56, border: '2px solid var(--accent)', background: 'var(--accent)',
          color: '#fff', fontSize: 15, fontWeight: 600, textAlign: 'left', padding: '0 14px', cursor: 'pointer',
        }}
      >Neues Revier zeichnen</button>

      <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>
        Marker, Ansitze und Flächen gehören dem beim Anlegen aktiven Revier. Import von Grenzen als GeoJSON,
        GPX oder Shapefile ist geplant — viele Reviere liegen bei der Jagdbehörde schon digital vor.
      </div>
    </div>
  );
}
