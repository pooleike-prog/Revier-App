import { useApp } from '../state/store';
import { M_PER_PX } from '../data/constants';
import type { Marker } from '../types';
import { gps } from '../lib/geo';
import { chip, inputStyle, label } from '../lib/styles';
import { sheetBody } from '../components/Sheet';

const PRESETS = [50, 80, 100, 150, 200];

export function MarkerSheet({ marker }: { marker: Marker }) {
  const { state: s, set, flash } = useApp();
  const dists = marker.dists ?? [];

  const patchMarker = (fn: (m: Marker) => Marker) =>
    set(p => ({ markers: p.markers.map(m => (m.id === p.sel ? fn(m) : m)) }));

  const summary = !dists.length ? 'keine Ringe'
    : dists.length === 1 ? 'ein Ring'
    : `${dists.length} Ringe · max ${Math.max(...dists)} m`;

  const addDraft = () => {
    const v = parseInt(String(s.distDraft).replace(/[^0-9]/g, ''), 10);
    if (!v || v < 10 || v > 500) { flash('Entfernung zwischen 10 und 500 m eingeben.'); return; }
    set(p => ({
      distDraft: '',
      markers: p.markers.map(m => (m.id !== p.sel || (m.dists ?? []).indexOf(v) >= 0
        ? m
        : { ...m, dists: (m.dists ?? []).concat([v]).sort((a, b) => a - b) })),
    }));
  };

  return (
    <div style={sheetBody}>
      <div>
        <div style={{ ...label, marginBottom: 6 }}>Bezeichnung</div>
        <input
          value={marker.name}
          onChange={(e) => { const v = e.target.value; patchMarker(m => ({ ...m, name: v })); }}
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        <div>
          <div style={label}>Position</div>
          <div style={{ fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{gps(marker.x, marker.y)}</div>
        </div>
        <div>
          <div style={label}>Angelegt</div>
          <div style={{ fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{marker.date}</div>
        </div>
      </div>

      {marker.type === 'ansitz' && (
        <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <div style={label}>Schussentfernung</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{summary}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PRESETS.map(d => {
              const on = dists.indexOf(d) >= 0;
              return (
                <button
                  key={d}
                  onClick={() => patchMarker(m => ({
                    ...m,
                    dists: on
                      ? (m.dists ?? []).filter(x => x !== d)
                      : (m.dists ?? []).concat([d]).sort((a, b) => a - b),
                  }))}
                  style={chip(on, { minHeight: 48, fontSize: 14, flex: 'none', paddingLeft: 14, paddingRight: 14 })}
                >{d} m</button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              value={s.distDraft}
              onChange={(e) => set({ distDraft: e.target.value })}
              placeholder="eigene Entfernung, z. B. 130"
              inputMode="numeric"
              style={{
                flex: 1, minWidth: 0, boxSizing: 'border-box', minHeight: 48,
                border: '2px solid var(--line)', background: 'transparent', color: 'var(--ink)',
                fontSize: 15, padding: '0 12px',
              }}
            />
            <button onClick={addDraft} style={{
              minHeight: 48, border: '2px solid var(--line)', background: 'transparent',
              color: 'var(--ink)', fontSize: 14, padding: '0 16px', cursor: 'pointer',
            }}>Hinzufügen</button>
          </div>
          <div style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--muted)', marginTop: 8 }}>
            Ringe liegen als gestrichelte Kreise um den Ansitz — Reichweite prüfen, Nachbargrenzen und
            Straßen im Blick behalten. Maßstab {M_PER_PX} m/px — Pin und Beschriftung bleiben beim Zoomen
            gleich groß, die Ringe wachsen mit.
          </div>
        </div>
      )}

      <div>
        <div style={{ ...label, marginBottom: 6 }}>Notiz</div>
        <textarea
          value={marker.note}
          onChange={(e) => { const v = e.target.value; patchMarker(m => ({ ...m, note: v })); }}
          rows={3}
          style={{
            width: '100%', boxSizing: 'border-box', border: '2px solid var(--line)',
            background: 'transparent', color: 'var(--ink)', fontSize: 15, padding: '10px 12px', resize: 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => set(p => ({
            sheet: 'entry',
            form: { ...p.form, ort: marker.name, typ: marker.type === 'erleg' ? 'Abschuss' : 'Beobachtung' },
          }))}
          style={{
            flex: 1, minHeight: 52, border: '2px solid var(--accent)', background: 'var(--accent)',
            color: '#fff', fontSize: 15, fontWeight: 600, textAlign: 'left', padding: '0 14px', cursor: 'pointer',
          }}
        >Ins Tagebuch buchen</button>
        <button
          onClick={() => set(p => ({ markers: p.markers.filter(m => m.id !== p.sel), sheet: null, sel: null }))}
          style={{
            minHeight: 52, border: '2px solid var(--line)', background: 'transparent',
            color: 'var(--ink)', fontSize: 14, padding: '0 16px', cursor: 'pointer',
          }}
        >Löschen</button>
      </div>
    </div>
  );
}
