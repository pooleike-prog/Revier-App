import { useApp } from '../state/store';
import { fmt, ha } from '../lib/geo';
import { inputStyle, label } from '../lib/styles';
import { sheetBody } from '../components/Sheet';

export function NamingSheet() {
  const { state: s, set, flash } = useApp();
  const pending = s.pendingRevier;

  const save = () => {
    if (!pending) return;
    const pts = pending.map(p => p.join(',')).join(' ');
    const rid = 'r' + Date.now();
    // Neu gezeichnete Reviere werden sofort aktiv — die nächsten Marker gehören ihnen.
    set(p => ({
      revierData: p.revierData.concat([{ id: rid, name: p.rName || 'Revier Neu', points: pts, visible: true, kind: 'pacht' }]),
      activeRevier: rid, pendingRevier: null, sheet: null,
    }));
    flash('Revier angelegt · ' + fmt(ha(pending), 0) + ' ha');
  };

  return (
    <div style={sheetBody}>
      <div>
        <div style={{ ...label, marginBottom: 6 }}>Revier-Bezeichnung</div>
        <input value={s.rName} onChange={(e) => set({ rName: e.target.value })} style={inputStyle} />
      </div>

      <div>
        <div style={label}>Berechnete Fläche</div>
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>
          {pending ? fmt(ha(pending), 1) + ' ha' : '—'}
        </div>
      </div>

      <button onClick={save} style={{
        minHeight: 58, border: '2px solid var(--accent)', background: 'var(--accent)',
        color: '#fff', fontSize: 16, fontWeight: 600, textAlign: 'left', padding: '0 16px', cursor: 'pointer',
      }}>Revier anlegen</button>
    </div>
  );
}
