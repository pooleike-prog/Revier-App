import { useApp } from '../state/store';
import { WILD } from '../data/constants';
import type { EntryTyp } from '../types';
import { block, chip, label } from '../lib/styles';
import { sheetBody } from '../components/Sheet';

const TYPEN: EntryTyp[] = ['Beobachtung', 'Abschuss', 'Ansitz'];

export function EntrySheet() {
  const { state: s, set, flash } = useApp();
  const f = s.form;

  const save = () => {
    const chips: string[] = [];
    if (f.foto) chips.push('Foto');
    if (f.melden) chips.push('Meldung vorgemerkt');
    const title = f.typ === 'Ansitz'
      ? 'Ansitz protokolliert'
      : f.wildart + (f.gewicht ? ', ' + f.gewicht + ' kg' : '');
    const entry = {
      id: Date.now(), typ: f.typ, when: '28.08.2026 · 19:42', title,
      line: f.ort + (f.text ? ' · ' + f.text : ''), chips, wild: f.wildart,
    };
    set(p => ({
      journal: [entry, ...p.journal], sheet: null, screen: 'tagebuch',
      form: { ...p.form, gewicht: '', text: '', foto: false, melden: false },
    }));
    flash('Eintrag gespeichert · offline, Sync bei Empfang');
  };

  return (
    <div style={sheetBody}>
      <div>
        <div style={{ ...label, marginBottom: 6 }}>Art des Eintrags</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {TYPEN.map(o => (
            <button
              key={o}
              onClick={() => set(p => ({ form: { ...p.form, typ: o } }))}
              style={chip(f.typ === o, { minHeight: 48, flex: 1, fontSize: 14 })}
            >{o}</button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ ...label, marginBottom: 6 }}>Wildart</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {WILD.map(o => (
            <button
              key={o}
              onClick={() => set(p => ({ form: { ...p.form, wildart: o } }))}
              style={chip(f.wildart === o, { minHeight: 44, fontSize: 13 })}
            >{o}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ ...label, marginBottom: 6 }}>Gewicht (kg)</div>
          <input
            value={f.gewicht}
            onChange={(e) => { const v = e.target.value; set(p => ({ form: { ...p.form, gewicht: v } })); }}
            placeholder="z. B. 18,5"
            style={{
              width: '100%', boxSizing: 'border-box', minHeight: 52, border: '2px solid var(--line)',
              background: 'transparent', color: 'var(--ink)', fontSize: 16, padding: '0 12px',
              fontVariantNumeric: 'tabular-nums',
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ ...label, marginBottom: 6 }}>Standort</div>
          <button
            onClick={() => {
              set({ sheet: null, screen: 'karte', pickTarget: true });
              flash('Standort auf der Karte antippen');
            }}
            style={{
              width: '100%', minHeight: 52, border: '2px solid var(--line)', background: 'transparent',
              color: 'var(--ink)', fontSize: 14, textAlign: 'left', padding: '0 12px', cursor: 'pointer',
            }}
          >{f.ort}</button>
        </div>
      </div>

      <div>
        <div style={{ ...label, marginBottom: 6 }}>Foto</div>
        <button
          onClick={() => set(p => ({ form: { ...p.form, foto: !p.form.foto } }))}
          style={chip(f.foto, { minHeight: 56, width: '100%', textAlign: 'left', fontSize: 14, boxSizing: 'border-box' })}
        >{f.foto ? 'Foto angehängt · 1 Bild (ohne Standort-EXIF)' : 'Foto aufnehmen oder anhängen'}</button>
      </div>

      <div>
        <div style={{ ...label, marginBottom: 6 }}>Bemerkung</div>
        <textarea
          value={f.text}
          onChange={(e) => { const v = e.target.value; set(p => ({ form: { ...p.form, text: v } })); }}
          rows={3}
          placeholder="Wind, Verhalten, Begleitumstände"
          style={{
            width: '100%', boxSizing: 'border-box', border: '2px solid var(--line)',
            background: 'transparent', color: 'var(--ink)', fontSize: 15, padding: '10px 12px', resize: 'none',
          }}
        />
      </div>

      <button
        onClick={() => set(p => ({ form: { ...p.form, melden: !p.form.melden } }))}
        style={block(f.melden)}
      >
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>
          {f.melden ? 'Für Streckenliste vormerken · aktiv' : 'Für Streckenliste vormerken'}
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--muted)' }}>
          Streckenliste Niedersachsen — Übermittlung erst nach Freigabe, offline vorgemerkt.
        </div>
      </button>

      <button onClick={save} style={{
        minHeight: 58, border: '2px solid var(--accent)', background: 'var(--accent)',
        color: '#fff', fontSize: 16, fontWeight: 600, textAlign: 'left', padding: '0 16px', cursor: 'pointer',
      }}>Eintrag speichern</button>
    </div>
  );
}
