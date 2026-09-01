import { useApp } from '../state/store';
import { WERBEFREI } from '../data/settings';
import { chip, tag } from '../lib/styles';
import { AdSlot } from '../components/AdSlot';

const FILTERS = ['Alle', 'Abschuss', 'Beobachtung', 'Ansitz'];

export function TagebuchScreen() {
  const { state: s, set } = useApp();
  const entries = s.journal.filter(e => s.jfilter === 'Alle' || e.typ === s.jfilter);

  return (
    <div className="scroll" style={{ flex: 1 }}>
      <div className="scroll" style={{
        display: 'flex', gap: 8, padding: 12, overflowX: 'auto',
        borderBottom: '2px solid var(--line)', background: 'var(--surf)',
      }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => set({ jfilter: f })}
            style={chip(s.jfilter === f, { minHeight: 44, fontSize: 13, flex: 'none' })}
          >{f}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {entries.map(e => (
          <div key={e.id} style={{ padding: 14, borderBottom: '1px solid var(--rule)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
              <span style={tag(e.typ === 'Abschuss')}>{e.typ}</span>
              <span style={{
                fontSize: 11, letterSpacing: '.08em', color: 'var(--muted)',
                fontVariantNumeric: 'tabular-nums',
              }}>{e.when}</span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-.01em', marginBottom: 4 }}>{e.title}</div>
            <div style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--muted)' }}>{e.line}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {e.chips.map(c => (
                <span key={c} style={tag(c === 'Meldung offen')}>{c}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!WERBEFREI && (
        <AdSlot text="Platzhalter — Werbeplatz nach der Eintragsliste. Ausgeliefert wird nur, was beim letzten Online-Sync geladen wurde." />
      )}

      <div style={{ padding: 14 }}>
        <button onClick={() => set({ sheet: 'entry' })} style={{
          width: '100%', minHeight: 56, border: '2px solid var(--accent)', background: 'var(--accent)',
          color: '#fff', fontSize: 16, fontWeight: 600, textAlign: 'left', padding: '0 16px', cursor: 'pointer',
        }}>Neuer Eintrag</button>
      </div>
    </div>
  );
}
