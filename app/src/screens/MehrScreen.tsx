import { useState } from 'react';
import { useApp, typeDef } from '../state/store';
import { ICON } from '../data/constants';
import { DOWNLOADS } from '../data/seed';
import { WERBEFREI } from '../data/settings';
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

export function MehrScreen() {
  const { state: s, set, flash, resetData } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="scroll" style={{ flex: 1 }}>
      <div style={sectionLabel}>Kartenbedienung</div>
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
      <div style={sectionLabel}>Kartenzeichen</div>
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
      <div style={sectionLabel}>Darstellung</div>
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
      <div style={sectionLabel}>Daten</div>
      <div style={sectionBody}>
        <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>
          Reviere, Marker, Flächen und Tagebuch liegen verschlüsselbar auf dem Gerät und überstehen
          das Schließen der App. Nichts davon verlässt das Telefon.
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
      <div style={sectionLabel}>Offline-Karten</div>
      {DOWNLOADS.map(([name, meta, action, available]) => (
        <div key={name} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '13px 14px', borderBottom: '1px solid var(--rule)',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{name}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{meta}</div>
          </div>
          <button
            onClick={() => flash(available ? name + ' — Download in Warteschlange' : name + ' ist aktuell')}
            style={chip(false, {
              minHeight: 44, fontSize: 11, fontWeight: 600, letterSpacing: '.08em',
              flex: 'none', opacity: available ? 1 : 0.45,
            })}
          >{action}</button>
        </div>
      ))}

      <div style={divider} />
      <div style={sectionLabel}>Datenquellen &amp; Recht</div>
      <div style={{ padding: '0 14px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ border: '2px solid var(--rule)', padding: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Topografie</div>
          <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>
            OpenStreetMap-Vektorkacheln (ODbL), eigener Stil mit Höhenlinien aus DGM1. Offline als PMTiles.
          </div>
        </div>
        <div style={{ border: '2px solid var(--rule)', padding: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Satellit / Orthofoto</div>
          <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>
            DOP20 des LGLN Niedersachsen als Open Data (Datenlizenz Deutschland 2.0, kommerziell nutzbar,
            Namensnennung). Andere Länder je Landesamt nachziehen; Sentinel-2 als flächige Rückfallebene.
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
      </div>
    </div>
  );
}
