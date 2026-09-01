import type { ReactNode } from 'react';

interface Props {
  kicker: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Das Bottom-Sheet über der Karte. Deckt höchstens 78 % der Höhe ab, damit
 *  vom Revier immer etwas sichtbar bleibt. */
export function Sheet({ kicker, title, onClose, children }: Props) {
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(32,30,29,0.45)', zIndex: 20 }}
      />
      <div className="scroll" role="dialog" aria-label={title} style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '78%',
        background: 'var(--surf)', borderTop: '2px solid var(--line)', zIndex: 21,
      }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14,
          borderBottom: '2px solid var(--line)',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase',
              color: 'var(--accent)', marginBottom: 4,
            }}>{kicker}</div>
            <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1.15 }}>{title}</div>
          </div>
          <button onClick={onClose} aria-label="Schließen" style={{
            width: 44, height: 44, flex: 'none', border: '2px solid var(--line)',
            background: 'transparent', color: 'var(--ink)', fontSize: 18, lineHeight: 1, cursor: 'pointer',
          }}>×</button>
        </div>
        {children}
      </div>
    </>
  );
}

/** Der übliche Innenraum eines Sheets. */
export const sheetBody = {
  padding: 14, display: 'flex', flexDirection: 'column' as const, gap: 14,
};
