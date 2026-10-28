import { useState } from 'react';
import { useApp } from '../state/store';
import { CROPS } from '../data/constants';
import type { Field, Treiben } from '../types';
import { fmt, ha, toStr } from '../lib/geo';
import { currentJagd, treibenOf } from '../lib/selectors';
import { chip, inputStyle, label } from '../lib/styles';
import { sheetBody } from '../components/Sheet';

/** Planungsmodus: Bezeichnung und Frucht einer Fläche. Eine frisch gezeichnete
 *  Fläche wird dabei angelegt, eine vorhandene umbenannt. Jede Fläche wird zu
 *  einem Treiben (bei der Drückjagd: Gebiet) der Jagd. */
export function PlanFlaecheSheet() {
  const { state: s, set, flash } = useApp();
  const jagd = currentJagd(s);
  const isDrueck = jagd.art === 'Drückjagd';
  const neu = s.pDraw && s.pDraw.length > 2 ? s.pDraw : null;
  const alt = neu ? undefined : s.fieldData.find(f => f.id === s.selField);
  const nr = treibenOf(s, jagd.id).length + 1;
  const [name, setName] = useState(alt?.name ?? (isDrueck ? 'Gebiet ' : 'Fläche ') + nr);
  const [frucht, setFrucht] = useState(alt?.crop ?? '');
  const flaeche = neu ? ha(neu) : alt ? ha(alt.points) : 0;

  const save = () => {
    const n = name.trim() || (isDrueck ? 'Gebiet ' : 'Fläche ') + nr;
    const crop = frucht.trim() || '—';
    if (neu) {
      const fid = 'f' + Date.now();
      const tid = (isDrueck ? 'd' : 't') + Date.now();
      const field: Field = { id: fid, points: toStr(neu), name: n, farmer: '', crop, history: [] };
      const t: Treiben = { id: tid, jagd: jagd.id, nr, name: n, flaeche: n, zeit: '—' };
      set(p => ({
        fieldData: p.fieldData.concat([field]), treiben: p.treiben.concat([t]),
        selTreiben: tid, pDraw: [], sheet: null,
      }));
      flash(`${n} · ${crop} · ${fmt(flaeche, 1)} ha angelegt — nächste Fläche oder weiter.`);
      return;
    }
    if (!alt) { set({ sheet: null }); return; }
    set(p => {
      // Treiben, die auf den alten Namen zeigen, ziehen beim Umbenennen mit.
      const treiben = p.treiben.map(t => (t.flaeche === alt.name ? { ...t, flaeche: n, name: t.name === alt.name ? n : t.name } : t));
      const hat = treiben.some(t => t.jagd === jagd.id && t.flaeche === n);
      const tid = (isDrueck ? 'd' : 't') + Date.now();
      return {
        fieldData: p.fieldData.map(f => (f.id === alt.id ? { ...f, name: n, crop } : f)),
        treiben: hat ? treiben : treiben.concat([{ id: tid, jagd: jagd.id, nr, name: n, flaeche: n, zeit: '—' }]),
        selTreiben: hat ? p.selTreiben : tid, sheet: null,
      };
    });
    flash(`${n} · ${crop} übernommen.`);
  };

  return (
    <div style={sheetBody}>
      <div>
        <div style={{ ...label, marginBottom: 6 }}>Bezeichnung</div>
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
      </div>

      <div>
        <div style={{ ...label, marginBottom: 6 }}>Frucht</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CROPS.map(c => (
            <button key={c} onClick={() => setFrucht(c)} style={chip(frucht === c, { minHeight: 44, fontSize: 13 })}>{c}</button>
          ))}
        </div>
        <input
          value={CROPS.includes(frucht) ? '' : frucht}
          placeholder="Andere Frucht, z. B. Wald oder Hecke"
          onChange={(e) => setFrucht(e.target.value)}
          style={{ ...inputStyle, marginTop: 8 }}
        />
      </div>

      <div>
        <div style={label}>Größe</div>
        <div style={{ fontSize: 22, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(flaeche, flaeche < 10 ? 2 : 1)} ha</div>
      </div>

      <button onClick={save} style={{
        minHeight: 58, border: '2px solid var(--accent)', background: 'var(--accent)',
        color: '#fff', fontSize: 16, fontWeight: 600, textAlign: 'left', padding: '0 16px', cursor: 'pointer',
      }}>{neu ? 'Fläche anlegen' : 'Übernehmen'}</button>
    </div>
  );
}
