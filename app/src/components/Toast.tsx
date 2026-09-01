interface Props {
  text: string;
  /** Abstand über der Werkzeugleiste des jeweiligen Reiters. */
  bottom: number;
  onUndo?: () => void;
}

export function Toast({ text, bottom, onUndo }: Props) {
  return (
    <div
      role="status"
      style={{
        position: 'absolute', left: 12, right: 12, bottom,
        background: 'var(--ink)', color: 'var(--bg)', padding: '12px 14px',
        fontSize: 13,
        ...(onUndo ? { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 } : null),
      }}
    >
      <span style={{ fontSize: 13 }}>{text}</span>
      {onUndo && (
        <button onClick={onUndo} style={{
          border: '2px solid var(--bg)', background: 'transparent', color: 'var(--bg)',
          fontSize: 11, fontWeight: 600, letterSpacing: '.08em', padding: '7px 10px', cursor: 'pointer',
        }}>RÜCKGÄNGIG</button>
      )}
    </div>
  );
}
