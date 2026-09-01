import { useApp } from '../state/store';
import type { LightInfo } from '../lib/astro';
import { ANSITZ_WIND } from '../data/seed';
import { WERBEFREI } from '../data/settings';
import { AdSlot } from '../components/AdSlot';

const caption = {
  fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase' as const, color: 'var(--muted)',
};

export function AnsitzScreen({ light }: { light: LightInfo }) {
  const { set } = useApp();

  return (
    <div className="scroll" style={{ flex: 1 }}>
      <div style={{
        padding: '12px 14px 14px', borderBottom: '2px solid var(--line)', background: 'var(--surf)',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => set(p => ({ dayOff: p.dayOff - 1 }))}
            aria-label="Vorheriger Tag"
            style={{
              width: 44, height: 44, flex: 'none', border: '1px solid var(--line)',
              background: 'transparent', color: 'var(--ink)', fontSize: 20, lineHeight: 1, cursor: 'pointer',
            }}
          >‹</button>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
            <div className="serif" style={{
              fontSize: 19, fontWeight: 600, lineHeight: 1.15,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{light.blDate}</div>
            <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>{light.blPlace}</div>
          </div>
          <button
            onClick={() => set(p => ({ dayOff: p.dayOff + 1 }))}
            aria-label="Nächster Tag"
            style={{
              width: 44, height: 44, flex: 'none', border: '1px solid var(--line)',
              background: 'transparent', color: 'var(--ink)', fontSize: 20, lineHeight: 1, cursor: 'pointer',
            }}
          >›</button>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, border: '1px solid var(--line)', padding: '9px 10px 10px' }}>
            <div style={caption}>Büchsenlicht ab</div>
            <div className="serif" style={{ fontSize: 29, fontWeight: 600, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{light.blStart}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>Sonnenaufgang {light.sunrise}</div>
          </div>
          <div style={{ flex: 1, border: '1px solid var(--line)', padding: '9px 10px 10px' }}>
            <div style={caption}>Büchsenlicht bis</div>
            <div className="serif" style={{ fontSize: 29, fontWeight: 600, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{light.blEnd}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>Sonnenuntergang {light.sunset}</div>
          </div>
        </div>

        {/* 24-Stunden-Balken: Nacht / Büchsenlicht / Tag, darunter als Goldstreifen
            die Zeit, in der der Mond über dem Horizont steht. */}
        <div>
          <div style={{ position: 'relative', height: 30, border: '1px solid var(--line)', overflow: 'hidden' }}>
            {light.bands.map((b, i) => (
              <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: b.left, width: b.width, background: b.background }} />
            ))}
            {light.moonBands.map((b, i) => (
              <div key={`m${i}`} style={{
                position: 'absolute', bottom: 0, height: 7,
                left: b.left, width: b.width, background: b.background, opacity: b.opacity,
              }} />
            ))}
            {light.showNow && (
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: light.nowLeft, width: 2, background: 'var(--accent)' }} />
            )}
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginTop: 3,
            fontSize: 9, letterSpacing: '.08em', color: 'var(--muted)', fontVariantNumeric: 'tabular-nums',
          }}>
            <span>00</span><span>06</span><span>12</span><span>18</span><span>24</span>
          </div>
          <div style={{
            display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 6,
            fontSize: 10, letterSpacing: '.04em', color: 'var(--muted)',
          }}>
            {light.legend.map(l => (
              <span key={l.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <i style={{ width: 12, height: l.height, background: l.background }} />{l.label}
              </span>
            ))}
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10,
          borderTop: '1px solid var(--rule)', paddingTop: 10,
        }}>
          <div>
            <div style={caption}>Mond</div>
            <div style={{ fontSize: 20, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{light.moonLit}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>{light.moonPhase}</div>
          </div>
          <div>
            <div style={caption}>Mond auf</div>
            <div style={{ fontSize: 20, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{light.moonRise}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>{light.moonHigh}</div>
          </div>
          <div>
            <div style={caption}>Mond unter</div>
            <div style={{ fontSize: 20, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{light.moonSet}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>{light.moonAge}</div>
          </div>
        </div>

        <div style={{ borderLeft: '2px solid var(--gold)', padding: '2px 0 2px 10px', fontSize: 12, lineHeight: 1.5 }}>
          {light.moonVerdict}
        </div>

        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', borderTop: '1px solid var(--rule)', paddingTop: 10 }}>
          <div>
            <div style={caption}>Nachtjagd gesperrt</div>
            <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{light.nightBan}</div>
          </div>
          <div>
            <div style={caption}>Wind</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>SW 12 km/h</div>
          </div>
          <div>
            <div style={caption}>Temp</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>14° trocken</div>
          </div>
        </div>

        <div style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--muted)' }}>{light.rule}</div>
      </div>

      {ANSITZ_WIND.map(([name, rating, line]) => (
        <div key={name} style={{ padding: 14, borderBottom: '1px solid var(--rule)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <div style={{ flex: 1, fontSize: 17, fontWeight: 600, letterSpacing: '-.01em' }}>{name}</div>
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', padding: '4px 7px',
              border: '2px solid ' + (rating === 'Gut' ? 'var(--accent)' : 'var(--rule)'),
              color: rating === 'Gut' ? 'var(--accent)' : 'var(--muted)',
            }}>{rating}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, lineHeight: 1.45 }}>{line}</div>
        </div>
      ))}

      {!WERBEFREI && (
        <AdSlot text="Platzhalter — Werbeplatz unter den Ansitzen. Kein Bezug zu Standort, Wildart oder Tagebuchdaten." />
      )}

      <div style={{ padding: 14, fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>
        Demo-Werte. Produktiv: Open-Meteo / DWD Open Data, Mondphase lokal gerechnet — beides offline vorhaltbar für 7 Tage.
      </div>
    </div>
  );
}
