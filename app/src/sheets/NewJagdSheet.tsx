import { useApp } from '../state/store';
import type { JagdArt } from '../types';
import { chip, inputStyle, label } from '../lib/styles';
import { sheetBody } from '../components/Sheet';

const ARTEN: JagdArt[] = ['Treibjagd', 'Drückjagd'];

export function NewJagdSheet() {
  const { state: s, set, flash } = useApp();

  const save = () => {
    const id = 'j' + Date.now();
    set(p => ({
      jagden: p.jagden.concat([{ id, art: p.njArt, datum: p.njDatum, ort: 'Revier Eichenkamp' }]),
      selJagd: id, selTreiben: null, sheet: null, pView: 'all',
    }));
    flash(s.njArt + ' ' + s.njDatum + ' angelegt — Treiben hinzufügen');
  };

  return (
    <div style={sheetBody}>
      <div>
        <div style={{ ...label, marginBottom: 6 }}>Jagdart</div>
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
        <div style={{ ...label, marginBottom: 6 }}>Datum</div>
        <input
          value={s.njDatum}
          onChange={(e) => set({ njDatum: e.target.value })}
          style={{ ...inputStyle, fontVariantNumeric: 'tabular-nums' }}
        />
      </div>

      <button onClick={save} style={{
        minHeight: 58, border: '2px solid var(--accent)', background: 'var(--accent)',
        color: '#fff', fontSize: 16, fontWeight: 600, textAlign: 'left', padding: '0 16px', cursor: 'pointer',
      }}>Jagd anlegen</button>
    </div>
  );
}
