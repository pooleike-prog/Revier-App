/* Werbeplatz 320 × 100 am Ende einer Liste. Karte, Planung und die
   Werkzeugleisten bleiben frei — im Revier darf nichts die Karte verdecken,
   und ein Fehlklick auf Werbung statt auf ein Werkzeug wäre teuer. */

export function AdSlot({ text }: { text: string }) {
  return (
    <div style={{ margin: 14, border: '1px dashed var(--line)', background: 'var(--chip)' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        padding: '7px 10px 0', fontSize: 9, letterSpacing: '.14em',
        textTransform: 'uppercase', color: 'var(--muted)',
      }}>
        <span>Anzeige</span><span>320 × 100</span>
      </div>
      <div style={{
        height: 78, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 14px', fontSize: 12, lineHeight: 1.4, textAlign: 'center',
        color: 'var(--muted)', textWrap: 'pretty',
      }}>{text}</div>
    </div>
  );
}
