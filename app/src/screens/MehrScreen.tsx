import { useState } from 'react';
import { useApp, typeDef } from '../state/store';
import { ICON } from '../data/constants';
import { KREIS_STANDARD, WERBEFREI } from '../data/settings';
import type { CtrlMode, MarkerType, SignMode } from '../types';
import { block, chip } from '../lib/styles';
import { Icon } from '../components/Icon';

const sectionLabel = {
  padding: '14px 14px 8px', fontSize: 11, letterSpacing: '.12em',
  textTransform: 'uppercase' as const, color: 'var(--muted)',
};
const sectionBody = { padding: '0 14px 14px', display: 'flex', flexDirection: 'column' as const, gap: 8 };
const divider = { height: 2, background: 'var(--line)' };

const CTRL_OPTIONS: Array<{ id: CtrlMode; title: string; desc: string }> = [
  {
    id: 'werkzeug', title: 'Variante A · Werkzeugleiste',
    desc: 'Markertyp unten wählen, dann Stelle antippen. Schnell für viele Marker hintereinander.',
  },
  {
    id: 'zielkreuz', title: 'Variante B · Zielkreuz',
    desc: 'Plus-Taste, Typ wählen, Karte unter das Kreuz schieben, „Hier setzen". Präziser mit Handschuhen und einer Hand.',
  },
];

const SIGN_OPTIONS: Array<{ id: SignMode; title: string; desc: string }> = [
  {
    id: 'symbol', title: 'Symbole',
    desc: 'Piktogramme — schneller erfassbar, auch mit Lesebrille und bei Nässe.',
  },
  {
    id: 'buchstabe', title: 'Buchstaben',
    desc: 'Kürzel A, F, W, K, T, S, E — wie auf gedruckten Revierkarten und Standkarten.',
  },
];

const SAMPLES: MarkerType[] = ['ansitz', 'kirrung', 'erleg'];

/** Sinnvolle Grenzen für Entfernungskreise: Schrotschuss bis weite Kugel. */
const KREIS_MIN = 5, KREIS_MAX = 3000, KREIS_ANZAHL = 8;

const title = { fontSize: 15, fontWeight: 600, marginBottom: 3 };
const desc = { fontSize: 12, lineHeight: 1.4, color: 'var(--muted)' };

/** Abschnittskopf. Mit `open`/`onToggle` klappt der Abschnitt auf und zu. */
function Section({ label, open, onToggle }: { label: string; open?: boolean; onToggle?: () => void }) {
  if (!onToggle) return <div style={sectionLabel}>{label}</div>;
  return (
    <button onClick={onToggle} aria-expanded={open} style={{
      ...sectionLabel, display: 'flex', width: '100%', minHeight: 48, alignItems: 'center',
      border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left',
    }}>
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{ fontSize: 16, letterSpacing: 0 }}>{open ? '−' : '+'}</span>
    </button>
  );
}

/** Ein großer Schalter über die ganze Breite — mit Handschuhen gut zu treffen. */
function Schalter({ an, text, hinweis, onClick }: { an: boolean; text: string; hinweis: string; onClick: () => void }) {
  return (
    <button onClick={onClick} role="switch" aria-checked={an} style={{ ...block(an), display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={title}>{text}</div>
        <div style={desc}>{hinweis}</div>
      </div>
      <span style={{
        flex: 'none', minWidth: 52, padding: '6px 0', textAlign: 'center', fontSize: 12, fontWeight: 600,
        letterSpacing: '.08em', border: '2px solid ' + (an ? 'var(--accent)' : 'var(--line)'),
        background: an ? 'var(--accent)' : 'transparent', color: an ? '#fff' : 'var(--ink)',
      }}>{an ? 'AN' : 'AUS'}</span>
    </button>
  );
}

function Kreise() {
  const { state: s, set } = useApp();
  const [neu, setNeu] = useState('');
  // Der Hinweis steht direkt am Feld — Toasts zeigt nur die Karte.
  const [fehler, setFehler] = useState('');

  const hinzu = () => {
    const d = Math.round(Number(neu.replace(',', '.')));
    if (!Number.isFinite(d) || d < KREIS_MIN || d > KREIS_MAX) {
      setFehler(`Entfernung zwischen ${KREIS_MIN} und ${KREIS_MAX} m eingeben.`); return;
    }
    if (s.kreisDists.includes(d)) { setFehler(`${d} m ist schon dabei.`); return; }
    if (s.kreisDists.length >= KREIS_ANZAHL) { setFehler(`Höchstens ${KREIS_ANZAHL} Kreise.`); return; }
    set(p => ({ kreisDists: [...p.kreisDists, d].sort((a, b) => a - b), kreise: true }));
    setNeu('');
    setFehler('');
  };

  const standard = s.kreisDists.join() === KREIS_STANDARD.join();

  return (
    <>
      <Schalter
        an={s.kreise}
        text="Entfernungskreise"
        hinweis="Ringe um die eigene GPS-Position auf der Karte. Im dichten Bestand kann GPS 10–20 m danebenliegen."
        onClick={() => set(p => ({ kreise: !p.kreise }))}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, opacity: s.kreise ? 1 : 0.5 }}>
        {s.kreisDists.map(d => (
          <button
            key={d}
            onClick={() => set(p => ({ kreisDists: p.kreisDists.filter(x => x !== d) }))}
            aria-label={`${d} m entfernen`}
            style={chip(false, { fontVariantNumeric: 'tabular-nums' })}
          >{d} m <span style={{ marginLeft: 6, color: 'var(--muted)' }}>×</span></button>
        ))}
        {!s.kreisDists.length && <div style={desc}>Keine Entfernungen — unten eine hinzufügen.</div>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={neu}
          onChange={e => { setNeu(e.target.value); setFehler(''); }}
          onKeyDown={e => { if (e.key === 'Enter') hinzu(); }}
          inputMode="numeric"
          placeholder="Meter, z. B. 75"
          aria-label="Neue Entfernung in Metern"
          style={{
            flex: 1, minWidth: 0, minHeight: 48, padding: '0 12px', fontSize: 15, boxSizing: 'border-box',
            border: '2px solid var(--line)', background: 'transparent', color: 'var(--ink)', fontFamily: 'inherit',
          }}
        />
        <button onClick={hinzu} style={chip(true, { minHeight: 48, flex: 'none' })}>Hinzufügen</button>
      </div>
      {fehler && <div role="alert" style={{ ...desc, color: 'var(--accent)', fontWeight: 600 }}>{fehler}</div>}
      {!standard && (
        <button
          onClick={() => set({ kreisDists: [...KREIS_STANDARD] })}
          style={chip(false, { alignSelf: 'flex-start', fontSize: 13 })}
        >Standard: {KREIS_STANDARD.join(' / ')} m</button>
      )}
    </>
  );
}

export function MehrScreen() {
  const { state: s, set, resetData } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);
  const [rechtOffen, setRechtOffen] = useState(false);

  return (
    <div className="scroll" style={{ flex: 1 }}>
      <Section label="Standort & Entfernungskreise" />
      <div style={sectionBody}>
        <Kreise />
      </div>

      <div style={divider} />
      <Section label="Karte · Bedienung" />
      <div style={sectionBody}>
        {CTRL_OPTIONS.map(o => (
          <button
            key={o.id}
            onClick={() => set({ ctrl: o.id, tool: null, radial: false, aim: null })}
            style={block(s.ctrl === o.id)}
          >
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{o.title}</div>
            <div style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--muted)' }}>{o.desc}</div>
          </button>
        ))}
      </div>

      <div style={divider} />
      <Section label="Karte · Zeichen" />
      <div style={sectionBody}>
        {SIGN_OPTIONS.map(o => (
          <button key={o.id} onClick={() => set({ zeichen: o.id })} style={block(s.zeichen === o.id)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              {SAMPLES.map(id => {
                const t = typeDef(id);
                return (
                  <div key={id} style={{
                    width: 28, height: 28, flex: 'none', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    border: '2px solid var(--line)', boxSizing: 'border-box',
                    background: t.accent ? 'var(--accent)' : 'transparent',
                    color: t.accent ? '#fff' : 'var(--ink)',
                  }}>
                    {o.id === 'symbol'
                      ? <Icon d={ICON[id]} size={17} />
                      : <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1 }}>{t.code}</span>}
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{o.title}</div>
            <div style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--muted)' }}>{o.desc}</div>
          </button>
        ))}
      </div>


      <div style={divider} />
      <Section label="Reviere" />
      <div style={sectionBody}>
        <button onClick={() => set({ sheet: 'reviere' })} style={block(false)}>
          <div style={title}>Reviere verwalten</div>
          <div style={desc}>Aktives Revier wählen, ein- und ausblenden, neues Revier zeichnen.</div>
        </button>
        <button onClick={() => set({ sheet: 'standort' })} style={block(false)}>
          <div style={title}>Revierlage auf der Karte</div>
          <div style={desc}>{s.anker.ort} · Ort suchen oder per GPS setzen.</div>
        </button>
      </div>

      <div style={divider} />
      <Section label="Darstellung" />
      <div style={sectionBody}>
        <button onClick={() => set({ night: false })} style={block(!s.night)}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>Tagmodus</div>
          <div style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--muted)' }}>Hoher Kontrast für Sonnenlicht.</div>
        </button>
        <button onClick={() => set({ night: true })} style={block(s.night)}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>Rotlichtmodus</div>
          <div style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--muted)' }}>
            Nur Rottöne, gedimmt — schont die Nachtsicht auf dem Ansitz.
          </div>
        </button>
      </div>

      <div style={divider} />
      <Section label="Daten & Offline" />
      <div style={sectionBody}>
        <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>
          Reviere, Marker, Flächen und Tagebuch liegen verschlüsselbar auf dem Gerät und überstehen
          das Schließen der App. Nichts davon verlässt das Telefon.
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>
          Offline-Karten: Angesehene Kacheln bleiben automatisch gespeichert. Der Knopf OFF auf der Karte
          lädt das aktive Revier samt 300 m Rand im gerade gewählten Kartenstil vorab.
        </div>
        <button onClick={() => setConfirmReset(true)} style={block(false)}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>Demo-Daten wiederherstellen</div>
          <div style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--muted)' }}>
            Verwirft alles Erfasste und setzt auf das Demo-Revier Eichenkamp zurück.
          </div>
        </button>
        {confirmReset && (
          <div style={{ border: '2px solid var(--accent)', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              Wirklich alles verwerfen? Eigene Reviere, Marker und Tagebucheinträge sind danach weg.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setConfirmReset(false); resetData(); }}
                style={{
                  flex: 1, minHeight: 48, border: '2px solid var(--accent)', background: 'var(--accent)',
                  color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >Ja, zurücksetzen</button>
              <button
                onClick={() => setConfirmReset(false)}
                style={{
                  minHeight: 48, border: '2px solid var(--line)', background: 'transparent',
                  color: 'var(--ink)', fontSize: 14, padding: '0 16px', cursor: 'pointer',
                }}
              >Abbrechen</button>
            </div>
          </div>
        )}
      </div>


      <div style={divider} />
      <Section label="Datenquellen & Recht" open={rechtOffen} onToggle={() => setRechtOffen(o => !o)} />
      {rechtOffen && <div style={{ padding: '0 14px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ border: '2px solid var(--rule)', padding: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Topografie</div>
          <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>
            basemap.de Relief des BKG (CC BY 4.0): amtliche Vektorkacheln mit Höhenlinien für ganz Deutschland.
            Ausweiche OpenTopoMap (CC BY-SA). Angesehene Kacheln bleiben offline auf dem Gerät.
          </div>
        </div>
        <div style={{ border: '2px solid var(--rule)', padding: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Satellit / Orthofoto</div>
          <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>
            DOP20 der Landesvermessung als Open Data: Niedersachsen (CC BY 4.0), Nordrhein-Westfalen
            (dl-de/zero-2-0), Brandenburg/Berlin (dl-de/by-2-0), Bayern (CC BY 4.0). Weitere Länder folgen,
            sobald ihr Luftbild frei nutzbar ist. Ortssuche über Photon (Daten © OpenStreetMap-Mitwirkende).
          </div>
        </div>
        <div style={{ border: '1px solid var(--line)', padding: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Werbung</div>
          <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>
            Drei feste Plätze: Tagebuch, Jagdzeiten, Ansitz — je ein Banner am Listenende. Karte, Planung und
            die Werkzeugleisten bleiben frei, damit im Revier nichts verdeckt wird. Kein Targeting über
            Standort, Marker oder Tagebuch; Anzeigen werden beim Sync mitgeladen und offline ohne Nachladen
            ausgespielt.
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--muted)', marginTop: 6 }}>
            {WERBEFREI
              ? 'Werbefrei aktiv — alle drei Plätze sind ausgeblendet.'
              : 'Plätze aktiv. Mit der Vollversion (werbefrei) fallen sie weg.'}
          </div>
        </div>
        <div style={{ border: '2px solid var(--accent)', padding: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: 'var(--accent)' }}>Sensible Standorte</div>
          <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>
            Ansitze, Erlegungsorte und Standplanungen werden verschlüsselt gespeichert und nie in Fotos-EXIF
            geschrieben. Freigabe an Jagdgäste erst in Ausbaustufe 2.
          </div>
        </div>
      </div>}
    </div>
  );
}
