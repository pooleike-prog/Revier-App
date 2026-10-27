import { useState } from 'react';
import { useApp } from '../state/store';
import { compass } from '../lib/geo';
import { currentJagd, treibenInBox, treibenOf } from '../lib/selectors';
import { addTreibenPatch, extentPatch } from '../lib/planning';
import { block, label, tag } from '../lib/styles';
import { sheetBody } from '../components/Sheet';

export function ListeSheet() {
  const { state: s, set, flash } = useApp();
  const jagd = currentJagd(s);
  const isDrueck = jagd.art === 'Drückjagd';
  const myTreiben = treibenOf(s, jagd.id);
  const boxes = s.extents.filter(x => x.jagd === jagd.id);
  // Löschen braucht einen zweiten Druck — eine versehentlich gelöschte Planung ist weg.
  const [fragen, setFragen] = useState(false);

  /** Entfernt die Jagd samt Treiben, Ständen, Richtungen und Ausschnitten und
   *  springt auf die nächste verbleibende Jagd. */
  const jagdLoeschen = () => {
    if (s.jagden.length < 2) { flash('Die letzte Planung bleibt — erst eine neue Jagd anlegen.'); return; }
    if (!fragen) { setFragen(true); return; }
    const tids = new Set(myTreiben.map(t => t.id));
    const rest = s.jagden.filter(j => j.id !== jagd.id);
    const naechste = rest[0];
    const erstes = s.treiben.filter(t => t.jagd === naechste.id).sort((a, b) => a.nr - b.nr)[0];
    set(p => ({
      jagden: p.jagden.filter(j => j.id !== jagd.id),
      treiben: p.treiben.filter(t => !tids.has(t.id)),
      posts: p.posts.filter(x => !tids.has(x.treiben)),
      arrows: p.arrows.filter(a => !tids.has(a.treiben)),
      extents: p.extents.filter(x => x.jagd !== jagd.id),
      selJagd: naechste.id, selTreiben: erstes ? erstes.id : null,
      pTool: null, pPend: null, pView: 'all', sheet: null,
    }));
    flash(`${jagd.art} vom ${jagd.datum} gelöscht.`);
  };

  return (
    <div style={{ ...sheetBody, gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {myTreiben.map(t => {
          const ps = s.posts.filter(p => p.treiben === t.id);
          const ars = s.arrows.filter(a => a.treiben === t.id);
          // Die Himmelsrichtung folgt aus der Summe der eingezeichneten Pfeile.
          const dir = ars.length
            ? compass(ars.reduce((a, x) => a + (x.x2 - x.x1), 0), ars.reduce((a, x) => a + (x.y2 - x.y1), 0))
            : null;
          const box = boxes.find(x => ps.some(p => p.x >= x.x1 && p.x <= x.x2 && p.y >= x.y1 && p.y <= x.y2));
          const on = t.id === s.selTreiben;
          return (
            <button key={t.id} onClick={() => set({ selTreiben: t.id, sheet: null })} style={block(on)}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{
                  fontSize: 20, fontWeight: 600, letterSpacing: '-.02em',
                  fontVariantNumeric: 'tabular-nums', flex: 'none',
                }}>{t.nr}.</span>
                <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-.01em' }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>{t.flaeche}</div>
                </div>
                <span style={tag(on)}>{t.zeit}</span>
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
                  {ps.length}{isDrueck ? ' Stände' : ' Vorstehschützen'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {dir ? (isDrueck ? 'Schussfeld ' : 'Treibrichtung ') + dir : 'Richtung offen'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{box ? box.name : 'kein Ausschnitt'}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div>
        <div style={{ ...label, marginBottom: 8 }}>Kartenausschnitte</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {boxes.map(x => {
            const inside = treibenInBox(s, x);
            return (
              <div key={x.id} style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { set(extentPatch(x)); set({ sheet: null }); }}
                  style={{ ...block(s.pView === x.id), flex: 1 }}
                >
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{x.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {inside.length ? inside.map(t => t.nr + '. ' + t.name).join(' · ') : 'noch keine Treiben enthalten'}
                  </div>
                </button>
                <button
                  onClick={() => {
                    set(p => ({ extents: p.extents.filter(e => e.id !== x.id), pView: p.pView === x.id ? 'all' : p.pView }));
                    flash(x.name + ' gelöscht.');
                  }}
                  aria-label={x.name + ' löschen'}
                  style={{
                    minWidth: 52, border: '2px solid var(--line)', background: 'transparent',
                    color: 'var(--ink)', fontSize: 18, cursor: 'pointer',
                  }}
                >×</button>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => { const { patch, message } = addTreibenPatch(s); set(patch); flash(message); }}
          style={{
            flex: 1, minHeight: 54, border: '2px solid var(--accent)', background: 'var(--accent)',
            color: '#fff', fontSize: 15, fontWeight: 600, textAlign: 'left', padding: '0 14px', cursor: 'pointer',
          }}
        >{isDrueck ? 'Gebiet hinzufügen' : 'Treiben hinzufügen'}</button>
        <button
          onClick={() => flash('Standkarten + Liste als PDF vorbereitet (Demo)')}
          style={{
            minHeight: 54, border: '2px solid var(--line)', background: 'transparent',
            color: 'var(--ink)', fontSize: 13, padding: '0 14px', cursor: 'pointer',
          }}
        >PDF</button>
      </div>

      <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>
        Der Ausdruck enthält je Ausschnitt eine Kartenseite mit Standnummern und die Liste als Tabelle —
        für Jagdleitung und Standkarten der Schützen.
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={jagdLoeschen}
          style={{
            flex: 1, minHeight: 54, padding: '0 14px', textAlign: 'left', cursor: 'pointer',
            fontSize: 14, fontWeight: 600,
            border: '2px solid ' + (fragen ? '#b3261e' : 'var(--line)'),
            background: fragen ? '#b3261e' : 'transparent',
            color: fragen ? '#fff' : 'var(--ink)',
          }}
        >{fragen ? 'Wirklich löschen? Nochmal drücken' : `Planung löschen (${jagd.art}, ${jagd.datum})`}</button>
        {fragen && (
          <button onClick={() => setFragen(false)} style={{
            minHeight: 54, padding: '0 14px', border: '2px solid var(--line)', background: 'transparent',
            color: 'var(--ink)', fontSize: 14, cursor: 'pointer',
          }}>Behalten</button>
        )}
      </div>
    </div>
  );
}
