import { ICON, TYPES } from '../../data/constants';
import type { MarkerType } from '../../types';
import { Icon } from '../../components/Icon';

/* Variante B: Zielkreuz. Die GPS-Position ist mit Handschuh nicht antippbar,
   deshalb wird die Karte unter ein festes Kreuz geschoben. */

interface FabProps {
  open: boolean;
  onToggle: () => void;
  onPick: (id: MarkerType) => void;
}

export function RadialFab({ open, onToggle, onPick }: FabProps) {
  return (
    <div style={{
      position: 'absolute', right: 16, bottom: 20,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10,
    }}>
      {open && TYPES.map(t => (
        <button
          key={t.id}
          onClick={() => onPick(t.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, minHeight: 46, padding: '0 12px',
            border: '2px solid var(--line)', background: 'var(--surf)', color: 'var(--ink)', cursor: 'pointer',
          }}
        >
          <Icon d={ICON[t.id]} size={18} />
          <span style={{ fontSize: 13, letterSpacing: '.02em', whiteSpace: 'nowrap' }}>{t.short}</span>
        </button>
      ))}
      <button
        onClick={onToggle}
        aria-label={open ? 'Auswahl schließen' : 'Marker setzen'}
        style={{
          width: 64, height: 64, border: '2px solid var(--accent)', background: 'var(--accent)',
          color: '#fff', fontSize: 30, fontWeight: 400, lineHeight: 1, cursor: 'pointer',
        }}
      >{open ? '×' : '+'}</button>
    </div>
  );
}

interface AimProps {
  type: MarkerType;
  onPlace: () => void;
  onCancel: () => void;
}

export function AimOverlay({ type, onPlace, onCancel }: AimProps) {
  const label = TYPES.find(t => t.id === type)?.label ?? '';
  return (
    <>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="88" height="88" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r="26" fill="none" stroke="var(--accent)" strokeWidth={2} />
          <path d="M44 4v26M44 58v26M4 44h26M58 44h26" stroke="var(--accent)" strokeWidth={2} />
          <circle cx="44" cy="44" r="3" fill="var(--accent)" />
        </svg>
      </div>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: 'var(--surf)', borderTop: '2px solid var(--accent)', padding: 14,
      }}>
        <div style={{
          fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase',
          color: 'var(--accent)', marginBottom: 6,
        }}>{label}</div>
        <div style={{ fontSize: 14, lineHeight: 1.4, marginBottom: 12 }}>
          Karte unter dem Kreuz verschieben — GPS-Position mit Handschuh nicht antippbar, deshalb Zielkreuz.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onPlace} style={{
            flex: 1, minHeight: 52, border: '2px solid var(--accent)', background: 'var(--accent)',
            color: '#fff', fontSize: 15, fontWeight: 600, textAlign: 'left', padding: '0 14px', cursor: 'pointer',
          }}>Hier setzen</button>
          <button onClick={onCancel} style={{
            minHeight: 52, border: '2px solid var(--line)', background: 'transparent',
            color: 'var(--ink)', fontSize: 14, padding: '0 16px', cursor: 'pointer',
          }}>Abbrechen</button>
        </div>
      </div>
    </>
  );
}
