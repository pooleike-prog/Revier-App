import { useState } from 'react';
import { useApp } from '../state/store';
import type { JagdArt } from '../types';
import { fmt, ha } from '../lib/geo';
import { kindLabel } from '../lib/selectors';
import { revierPatch } from '../lib/planning';
import { block, chip, inputStyle, label } from '../lib/styles';
import { sheetBody } from '../components/Sheet';

const ARTEN: JagdArt[] = ['Treibjagd', 'Drückjagd'];

/** Erster Schritt des Planungsmodus: Revier, Jagdart und Datum. Danach öffnet
 *  die Karte auf dem Revier, und die Flächen werden eingezeichnet. */
export function NewJagdSheet() {
  const { state: s, set, flash } = useApp();
  const [revier, setRevier] = useState(s.activeRevier);
  const r = s.revierData.find(x => x.id === revier);

  const save = () => {
    if (!r) { flash('Erst ein Revier wählen.'); return; }
    const id = 'j' + Date.now();
    set(p => ({
      jagden: p.jagden.concat([{ id, art: p.njArt, datum: p.njDatum, ort: r.name, revier: r.id }]),
      selJagd: id, selTreiben: null, sheet: null,
      pTool: null, pPend: null, pSchritt: 'flaechen', pDraw: [],
      ...revierPatch(p, r.id),
    }));
    flash(`${r.name}: Flächen einzeichnen — lang drücken setzt einen Grenzpunkt.`);
  };

  return (
    <div style={sheetBody}>
      <div>
        <div style={{ ...label, marginBottom: 6 }}>1 · Revier</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {s.revierData.map(x => (
            <button key={x.id} onClick={() => setRevier(x.id)} style={{ ...block(x.id === revier), textAlign: 'left' }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{x.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{fmt(ha(x.points), 0)} ha · {kindLabel(x.kind)}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ ...label, marginBottom: 6 }}>2 · Jagdart</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {ARTEN.map(a => (
            <button
              key={a}
              onClick={() => set({ njArt: a })}
              style={chip(s.njArt === a, { minHeight: 48, flex: 1, fontSize: 14 })}
            >{a}</button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ ...label, marginBottom: 6 }}>3 · Datum</div>
        <input
          value={s.njDatum}
          onChange={(e) => set({ njDatum: e.target.value })}
          style={{ ...inputStyle, fontVariantNumeric: 'tabular-nums' }}
        />
      </div>

      <button onClick={save} style={{
        minHeight: 58, border: '2px solid var(--accent)', background: 'var(--accent)',
        color: '#fff', fontSize: 16, fontWeight: 600, textAlign: 'left', padding: '0 16px', cursor: 'pointer',
      }}>Weiter zur Karte</button>
    </div>
  );
}
