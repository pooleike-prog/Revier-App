import { useApp } from '../state/store';
import { ICON, TYPES } from '../data/constants';
import { Icon } from '../components/Icon';
import { sheetBody } from '../components/Sheet';

export function LegendSheet() {
  const { state: s } = useApp();
  const sym = s.zeichen === 'symbol';

  return (
    <div style={{ ...sheetBody, gap: 10 }}>
      {TYPES.map(t => (
        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 30, height: 30, flex: 'none', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: t.accent ? 'var(--accent)' : 'var(--surf)',
            color: t.accent ? '#fff' : 'var(--ink)',
            border: '2px solid var(--line)', boxSizing: 'border-box',
          }}>
            {sym
              ? <Icon d={ICON[t.id]} size={18} />
              : <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1 }}>{t.code}</span>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{t.label}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {s.markers.filter(m => m.type === t.id).length} auf der Karte
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
