import { NAV_ITEMS } from '../data/constants';
import type { Screen } from '../types';
import { Icon } from './Icon';

interface Props {
  screen: Screen;
  onSelect: (screen: Screen) => void;
}

export function NavBar({ screen, onSelect }: Props) {
  return (
    <div style={{ display: 'flex', borderTop: '2px solid var(--line)', background: 'var(--surf)', flex: 'none' }}>
      {NAV_ITEMS.map(([id, label, d]) => {
        const on = screen === id;
        return (
          <button
            key={id}
            onClick={() => onSelect(id as Screen)}
            aria-current={on ? 'page' : undefined}
            style={{
              flex: 1, minHeight: 62, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3, border: 'none',
              borderTop: '4px solid ' + (on ? 'var(--accent)' : 'transparent'),
              background: 'transparent', color: on ? 'var(--ink)' : 'var(--muted)',
              fontWeight: on ? 600 : 400, cursor: 'pointer', padding: 0,
            }}
          >
            <Icon d={d} size={21} stroke={1.8} />
            <span style={{ fontSize: 9, letterSpacing: '.02em' }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
