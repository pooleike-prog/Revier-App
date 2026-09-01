import { ICON, TYPES } from '../../data/constants';
import type { MarkerType } from '../../types';
import { Icon } from '../../components/Icon';

interface Props {
  hint: string;
  tool: MarkerType | null;
  /** Pins tragen Symbole statt Kürzel. */
  sym: boolean;
  measure: boolean;
  onMeasToggle: () => void;
  onStartDraw: () => void;
  onPick: (id: MarkerType) => void;
}

/** Variante A: Markertyp unten wählen, dann Stelle antippen. */
export function MarkerToolbar({ hint, tool, sym, measure, onMeasToggle, onStartDraw, onPick }: Props) {
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      background: 'var(--surf)', borderTop: '2px solid var(--line)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px 4px' }}>
        <span style={{
          fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted)',
          minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{hint}</span>
        <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
          <button onClick={onMeasToggle} style={{
            border: '2px solid ' + (measure ? 'var(--accent)' : 'var(--line)'),
            background: measure ? 'var(--accent)' : 'transparent',
            color: measure ? 'var(--surf)' : 'var(--ink)',
            fontSize: 11, fontWeight: 600, letterSpacing: '.06em', padding: '8px 10px', cursor: 'pointer',
          }}>MESSEN</button>
          <button onClick={onStartDraw} style={{
            border: '2px solid var(--line)', background: 'transparent', color: 'var(--ink)',
            fontSize: 11, fontWeight: 600, letterSpacing: '.06em', padding: '8px 10px', cursor: 'pointer',
          }}>GRENZE</button>
        </div>
      </div>
      <div className="scroll" style={{ display: 'flex', gap: 8, padding: '8px 12px 14px', overflowX: 'auto' }}>
        {TYPES.map(t => {
          const on = tool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onPick(t.id)}
              style={{
                minWidth: 62, minHeight: 56, flex: 'none', display: 'flex', flexDirection: 'column',
                alignItems: 'flex-start', justifyContent: 'center', gap: 3, padding: '0 10px',
                border: '2px solid ' + (on ? 'var(--accent)' : 'var(--line)'),
                background: on ? 'var(--accent)' : 'transparent',
                color: on ? '#fff' : 'var(--ink)', cursor: 'pointer',
              }}
            >
              {sym
                ? <Icon d={ICON[t.id]} size={20} />
                : <span style={{ fontSize: 17, fontWeight: 600, lineHeight: 1 }}>{t.code}</span>}
              <span style={{ fontSize: 10, letterSpacing: '.04em', lineHeight: 1.1, whiteSpace: 'nowrap' }}>{t.short}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
