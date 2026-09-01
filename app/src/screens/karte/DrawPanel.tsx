interface Props {
  hint: string;
  onFinish: () => void;
  onUndo: () => void;
  onCancel: () => void;
}

/** Reviergrenze zeichnen — Grenzpunkte antippen, dann Fläche schließen. */
export function DrawPanel({ hint, onFinish, onUndo, onCancel }: Props) {
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      background: 'var(--surf)', borderTop: '2px solid var(--accent)', padding: 14,
    }}>
      <div style={{
        fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase',
        color: 'var(--accent)', marginBottom: 6,
      }}>Reviergrenze zeichnen</div>
      <div style={{ fontSize: 14, lineHeight: 1.4, marginBottom: 12 }}>{hint}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onFinish} style={{
          flex: 1, minHeight: 50, border: '2px solid var(--accent)', background: 'var(--accent)',
          color: '#fff', fontSize: 14, fontWeight: 600, textAlign: 'left', padding: '0 14px', cursor: 'pointer',
        }}>Fläche schließen</button>
        <button onClick={onUndo} style={{
          minHeight: 50, border: '2px solid var(--line)', background: 'transparent',
          color: 'var(--ink)', fontSize: 14, padding: '0 14px', cursor: 'pointer',
        }}>Zurück</button>
        <button onClick={onCancel} style={{
          minHeight: 50, border: '2px solid var(--line)', background: 'transparent',
          color: 'var(--ink)', fontSize: 14, padding: '0 14px', cursor: 'pointer',
        }}>Abbr.</button>
      </div>
    </div>
  );
}
