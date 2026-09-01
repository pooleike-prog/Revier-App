import { logoCrop } from '../lib/assets';

interface Props {
  title: string;
  sub: string;
  night: boolean;
  onToggleNight: () => void;
}

export function Header({ title, sub, night, onToggleNight }: Props) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
      background: 'var(--surf)', borderBottom: '2px solid var(--line)', flex: 'none',
    }}>
      <div role="img" aria-label="Revierpilot" style={{ width: 28, height: 28, flex: 'none', ...logoCrop }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="serif" style={{
          fontSize: 19, fontWeight: 600, letterSpacing: '.01em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{title}</div>
        <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>{sub}</div>
      </div>
      <button
        onClick={onToggleNight}
        aria-label={night ? 'Tagmodus einschalten' : 'Rotlichtmodus einschalten'}
        style={{
          width: 46, height: 46, flex: 'none', border: '2px solid var(--line)',
          background: 'transparent', color: 'var(--ink)', fontSize: 11, fontWeight: 600,
          letterSpacing: '.06em', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}
      >{night ? 'TAG' : 'ROT'}</button>
    </div>
  );
}
