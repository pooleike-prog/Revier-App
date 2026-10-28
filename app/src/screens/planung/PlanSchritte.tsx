import { useApp } from '../../state/store';
import { fmt, ha } from '../../lib/geo';
import { currentJagd, treibenOf } from '../../lib/selectors';

/* Untere Leiste des geführten Planungsmodus. Schritt 1 (Revier, Jagdart,
   Datum) liegt im Sheet „Neue Planung“; hier folgen die Flächen und danach
   die Treibrichtungen. Schützen und Stände setzt die freie Planung. */

const knopf = (haupt: boolean, aus = false) => ({
  minHeight: 52, flex: haupt ? 1 : 'none' as const, padding: '0 14px', cursor: aus ? 'default' : 'pointer',
  fontSize: 14, fontWeight: 600, textAlign: 'left' as const, opacity: aus ? 0.45 : 1,
  border: '2px solid ' + (haupt ? 'var(--accent)' : 'var(--line)'),
  background: haupt ? 'var(--accent)' : 'transparent', color: haupt ? '#fff' : 'var(--ink)',
});

export function PlanSchritte() {
  const { state: s, set, flash } = useApp();
  const jagd = currentJagd(s);
  const isDrueck = jagd.art === 'Drückjagd';
  const treiben = treibenOf(s, jagd.id);
  const draw = s.pDraw ?? [];
  const richtung = s.pSchritt === 'richtung';
  const wort = isDrueck ? 'Schussfeld' : 'Treibrichtung';

  const hint = richtung
    ? (s.pPend ? 'Zielpunkt antippen — dorthin wird getrieben' : `${wort}: Startpunkt in der Fläche antippen`)
    : draw.length > 2
      ? `${draw.length} Punkte · ${fmt(ha(draw), ha(draw) < 10 ? 2 : 1)} ha — lang drücken für den nächsten Punkt`
      : draw.length
        ? `${draw.length} von mindestens 3 Punkten — lang drücken für den nächsten`
        : 'Lang auf die Karte drücken setzt den ersten Grenzpunkt. Eine vorhandene Fläche antippen übernimmt sie.';

  const zuRichtung = () => {
    if (!treiben.length) { flash('Erst eine Fläche anlegen.'); return; }
    const sel = treiben.some(t => t.id === s.selTreiben) ? s.selTreiben : treiben[0].id;
    set({ pSchritt: 'richtung', pDraw: null, pTool: 'arrow', pPend: null, selTreiben: sel });
  };

  const fertig = () => {
    set({ pSchritt: null, pDraw: null, pTool: null, pPend: null });
    flash(isDrueck ? 'Planung steht — jetzt die Stände setzen.' : 'Planung steht — jetzt die Schützen setzen.');
  };

  const letzterPfeil = [...s.arrows].reverse().find(a => a.treiben === s.selTreiben);

  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'var(--surf)', borderTop: '2px solid var(--line)', padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' }}>
        {['1 Revier', '2 Flächen', '3 ' + (isDrueck ? 'Schussfelder' : 'Treibrichtung')].map((t, i) => {
          const auf = i === (richtung ? 2 : 1);
          return <span key={t} style={{ color: auf ? 'var(--accent)' : 'var(--muted)', fontWeight: auf ? 700 : 400 }}>{i ? '· ' : ''}{t}</span>;
        })}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.35, color: 'var(--ink)' }}>{hint}</div>

      {(richtung || treiben.length > 0) && (
        <div className="scroll" style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {treiben.map(t => {
            const on = s.selTreiben === t.id;
            const n = s.arrows.filter(a => a.treiben === t.id).length;
            return (
              <button
                key={t.id}
                onClick={() => set({ selTreiben: t.id, pPend: null })}
                style={{
                  minHeight: 40, flex: 'none', padding: '0 10px', fontSize: 12, whiteSpace: 'nowrap', cursor: 'pointer',
                  fontWeight: on ? 600 : 400, border: '2px solid ' + (on ? 'var(--accent)' : 'var(--line)'),
                  background: on && richtung ? 'var(--accent)' : 'transparent', color: on && richtung ? '#fff' : 'var(--ink)',
                }}
              >{t.nr}. {t.name}{richtung && n ? ` · ${n}×` : ''}</button>
            );
          })}
        </div>
      )}

      {!richtung ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => draw.length && set({ pDraw: draw.slice(0, -1) })}
            style={knopf(false, !draw.length)}
          >Zurück</button>
          {draw.length > 2
            ? <button onClick={() => set({ sheet: 'planflaeche', selField: null })} style={knopf(true)}>Fläche fertig</button>
            : <button onClick={zuRichtung} style={knopf(true, !treiben.length)}>Weiter: {isDrueck ? 'Schussfelder' : 'Treibrichtungen'}</button>}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => set({ pSchritt: 'flaechen', pDraw: [], pTool: null, pPend: null })} style={knopf(false)}>Flächen</button>
          <button
            onClick={() => letzterPfeil && set(p => ({ arrows: p.arrows.filter(a => a.id !== letzterPfeil.id), pPend: null }))}
            style={knopf(false, !letzterPfeil)}
          >Zurück</button>
          <button onClick={fertig} style={knopf(true)}>Fertig</button>
        </div>
      )}
    </div>
  );
}
