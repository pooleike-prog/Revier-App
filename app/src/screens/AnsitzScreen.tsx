import { useState } from 'react';
import type { DayLight, LightInfo } from '../lib/astro';
import { ANSITZ_WIND } from '../data/seed';
import { WERBEFREI } from '../data/settings';
import { AdSlot } from '../components/AdSlot';

const caption = {
  fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase' as const, color: 'var(--muted)',
};
const value = { fontSize: 20, fontWeight: 600, fontVariantNumeric: 'tabular-nums' as const };
const LABEL_W = 52;
const MOON_W = 46;

/** Ein Tag als Lichtband; Antippen klappt die Zeiten in Zahlen auf. */
function DayRow({ day: d, expanded, onToggle }: { day: DayLight; expanded: boolean; onToggle: () => void }) {
  return (
    <div style={{ borderBottom: '1px solid var(--rule)' }}>
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={`${d.label} ${d.dateShort}: Büchsenlicht ${d.blStart} bis ${d.blEnd}, Mondlicht ${d.moonRating}`}
        style={{
          width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 10,
          minHeight: 56, padding: '6px 0', border: 'none', background: 'transparent',
          color: 'var(--ink)', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{ width: LABEL_W, flex: 'none', lineHeight: 1.15 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{d.label}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>{d.dateShort}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            position: 'relative', height: 26, overflow: 'hidden',
            border: '1px solid ' + (expanded ? 'var(--accent)' : 'var(--line)'),
          }}>
            {d.bands.map((b, i) => (
              <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: b.left, width: b.width, background: b.background }} />
            ))}
            {d.moonGlow.map((b, i) => (
              <div key={`m${i}`} style={{
                position: 'absolute', top: '50%', bottom: 0,
                left: b.left, width: b.width, background: b.background, opacity: b.opacity,
              }} />
            ))}
            {d.showNow && (
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: d.nowLeft, width: 2, background: 'var(--accent)' }} />
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
            {d.blStart} – {d.blEnd}
          </div>
        </div>
        <div style={{ width: MOON_W, flex: 'none', textAlign: 'right', lineHeight: 1.15 }}>
          <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{d.moonLit}</div>
          <div style={{ fontSize: 10, color: d.moonRating === 'hell' ? 'var(--gold)' : 'var(--muted)' }}>{d.moonRating}</div>
        </div>
      </button>

      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0 12px' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{d.dateLong}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ border: '1px solid var(--line)', padding: '8px 10px' }}>
              <div style={caption}>Büchsenlicht ab</div>
              <div className="serif" style={{ ...value, fontSize: 26, lineHeight: 1.1 }}>{d.blStart}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>Sonnenaufgang {d.sunrise}</div>
            </div>
            <div style={{ border: '1px solid var(--line)', padding: '8px 10px' }}>
              <div style={caption}>Büchsenlicht bis</div>
              <div className="serif" style={{ ...value, fontSize: 26, lineHeight: 1.1 }}>{d.blEnd}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>Sonnenuntergang {d.sunset}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <div style={caption}>Mond</div>
              <div style={value}>{d.moonLit}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>{d.moonPhase}</div>
            </div>
            <div>
              <div style={caption}>Mond auf</div>
              <div style={value}>{d.moonRise}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>{d.moonHigh}</div>
            </div>
            <div>
              <div style={caption}>Mond unter</div>
              <div style={value}>{d.moonSet}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>{d.moonAge}</div>
            </div>
          </div>
          <div style={{ borderLeft: '2px solid var(--gold)', padding: '2px 0 2px 10px', fontSize: 12, lineHeight: 1.5 }}>
            {d.moonVerdict}
          </div>
        </div>
      )}
    </div>
  );
}

export function AnsitzScreen({ light }: { light: LightInfo }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="scroll" style={{ flex: 1 }}>
      <div style={{
        padding: '12px 14px 14px', borderBottom: '2px solid var(--line)', background: 'var(--surf)',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <div className="serif" style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.15 }}>Licht · 5 Tage</div>
          <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', textAlign: 'right' }}>{light.place}</div>
        </div>

        {/* Stundenleiste über den Bändern, an deren Spalte ausgerichtet. */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ width: LABEL_W, flex: 'none' }} />
          <div style={{
            flex: 1, display: 'flex', justifyContent: 'space-between',
            fontSize: 9, letterSpacing: '.08em', color: 'var(--muted)', fontVariantNumeric: 'tabular-nums',
          }}>
            <span>00</span><span>06</span><span>12</span><span>18</span><span>24</span>
          </div>
          <div style={{ width: MOON_W, flex: 'none' }} />
        </div>

        {light.days.map((d, i) => (
          <DayRow key={d.dateShort} day={d} expanded={open === i} onToggle={() => setOpen(open === i ? null : i)} />
        ))}

        <div style={{
          display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 2,
          fontSize: 10, letterSpacing: '.04em', color: 'var(--muted)',
        }}>
          {light.legend.map(l => (
            <span key={l.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <i style={{ width: 12, height: l.height, background: l.background }} />{l.label}
            </span>
          ))}
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
