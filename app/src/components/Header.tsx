import { logoCrop } from '../lib/assets';
import { LICHT_KURZ, LICHT_LABEL } from '../lib/lightMode';
import type { Licht } from '../lib/lightMode';

interface Props {
  title: string;
  sub: string;
  licht: Licht;
  /** Folgt der Modus gerade dem Sonnenstand? */
  auto: boolean;
  onCycleLicht: () => void;
}

/** Nächster Modus beim Tippen auf den Lichtknopf: Tag → Dämmerung → Rotlicht → Tag. */
export const NEXT_LICHT: Record<Licht, Licht> = { tag: 'daemmerung', daemmerung: 'rotlicht', rotlicht: 'tag' };

export function Header({ title, sub, licht, auto, onCycleLicht }: Props) {
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
        onClick={onCycleLicht}
        aria-label={`Lichtmodus ${LICHT_LABEL[licht]}${auto ? ' (automatisch)' : ''} — weiter zu ${LICHT_LABEL[NEXT_LICHT[licht]]}`}
        style={{
          width: 52, height: 52, flex: 'none', border: '2px solid var(--line)',
          background: 'transparent', color: 'var(--ink)', fontSize: 12, fontWeight: 600,
          letterSpacing: '.06em', cursor: 'pointer', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 1, padding: 0,
        }}
      >
        <span>{LICHT_KURZ[licht]}</span>
        {auto && <span style={{ fontSize: 9, letterSpacing: '.1em', color: 'var(--muted)' }}>AUTO</span>}
      </button>
    </div>
  );
}
