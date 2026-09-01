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
              <button
                key={x.id}
                onClick={() => { set(extentPatch(x)); set({ sheet: null }); }}
                style={block(s.pView === x.id)}
              >
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{x.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {inside.length ? inside.map(t => t.nr + '. ' + t.name).join(' · ') : 'noch keine Treiben enthalten'}
                </div>
              </button>
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
    </div>
  );
}
