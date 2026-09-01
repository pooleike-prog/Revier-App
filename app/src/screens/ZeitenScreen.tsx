import { useApp } from '../state/store';
import { HEUTE, HEUTE_TEXT, MON, ZEIT_GROUPS } from '../data/constants';
import type { ZeitRow } from '../data/constants';
import { WERBEFREI } from '../data/settings';
import { badge } from '../lib/styles';
import { AdSlot } from '../components/AdSlot';

/** Liegt der Stichtag in der Jagdzeit? Zeiträume über den Jahreswechsel hinweg
 *  laufen andersherum. */
function inRange(a: [number, number], b: [number, number]): boolean {
  const v = HEUTE[0] * 100 + HEUTE[1];
  const from = a[0] * 100 + a[1], to = b[0] * 100 + b[1];
  return from <= to ? v >= from && v <= to : v >= from || v <= to;
}

function readRow([art, klasse, a, b]: ZeitRow) {
  const geschuetzt = a[0] === 0;
  const ganz = !geschuetzt && a[0] === 1 && a[1] === 1 && b[0] === 12 && b[1] === 31;
  const open = !geschuetzt && (ganz || inRange(a, b));
  return {
    art, klasse,
    range: geschuetzt ? 'keine Jagdzeit' : ganz ? 'ganzjährig' : `${a[1]}. ${MON[a[0]]} – ${b[1]}. ${MON[b[0]]}`,
    status: geschuetzt ? 'GESCHÜTZT' : open ? 'JAGDZEIT' : 'SCHONZEIT',
    open,
  };
}

export function ZeitenScreen() {
  const { state: s, set } = useApp();

  return (
    <div className="scroll" style={{ flex: 1 }}>
      <div style={{ padding: 14, borderBottom: '2px solid var(--line)', background: 'var(--surf)' }}>
        <div style={{
          fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase',
          color: 'var(--muted)', marginBottom: 4,
        }}>Niedersachsen · Stand Demo</div>
        <div style={{ fontSize: 14, lineHeight: 1.45, color: 'var(--ink)' }}>
          Heute {HEUTE_TEXT}. Kategorien nach jagdlicher Gliederung, Zeiten nach Bundes- und
          Landesverordnung. Elterntierschutz und behördliche Abweichungen sind noch nicht eingepflegt.
        </div>
      </div>

      {ZEIT_GROUPS.map(g => {
        const rows = g.rows.map(readRow);
        const openCount = rows.filter(r => r.open).length;
        const expanded = !!s.openGroups[g.id];
        return (
          <div key={g.id}>
            <button
              onClick={() => set(p => ({ openGroups: { ...p.openGroups, [g.id]: !p.openGroups[g.id] } }))}
              aria-expanded={expanded}
              style={{
                width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 12,
                minHeight: 66, padding: '10px 14px', cursor: 'pointer',
                border: 'none', borderBottom: '2px solid var(--line)',
                borderLeft: '6px solid ' + (expanded ? 'var(--accent)' : 'transparent'),
                background: 'var(--surf)', color: 'var(--ink)',
              }}
            >
              <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-.01em' }}>{g.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '.02em' }}>
                  {rows.length} Arten · {openCount} aktuell in Jagdzeit
                </div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.08em', flex: 'none' }}>
                {expanded ? '−' : '+'}
              </span>
            </button>

            {expanded && rows.map((z, i) => (
              <div key={`${z.art}-${i}`} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px 12px 22px', borderBottom: '1px solid var(--rule)',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-.01em' }}>{z.art}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.35 }}>{z.klasse}</div>
                </div>
                <div style={{ textAlign: 'right', flex: 'none' }}>
                  <div style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{z.range}</div>
                  <div style={badge(z.open)}>{z.status}</div>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {!WERBEFREI && <AdSlot text="Platzhalter — Werbeplatz am Ende der Jagdzeiten-Tabelle." />}
    </div>
  );
}
