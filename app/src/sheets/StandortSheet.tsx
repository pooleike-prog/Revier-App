import { useState } from 'react';
import { useApp } from '../state/store';
import type { AppState, LuftbildLand } from '../types';
import { parse } from '../lib/geo';
import { activeRevier } from '../lib/selectors';
import { ankerFuer, lngLatToPx } from '../lib/projection';
import { panFuer } from '../lib/mapInteraction';
import { LAENDER, LUFTBILD, luftbildFuer } from '../lib/kartenquellen';
import { block, chip, inputStyle, label } from '../lib/styles';
import { sheetBody } from '../components/Sheet';

/* Revier auf die echte Karte setzen. Ein Ort kommt aus der Ortssuche (Photon,
   OpenStreetMap-Daten) oder vom GPS. Dann entweder nur dorthin springen — etwa
   um ein zweites Revier an seiner Stelle einzuzeichnen — oder das aktive
   Revier dorthin verlegen. Verlegen verschiebt den Kartenanker: Alle Grenzen,
   Schläge und Marker wandern mit, ihre Lage zueinander bleibt. */

interface Ort { name: string; zusatz: string; lat: number; lng: number; land: LuftbildLand | null }

const PHOTON = 'https://photon.komoot.io';
const DE_BBOX = '5.86,47.27,15.04,55.06';

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: { name?: string; city?: string; county?: string; state?: string; postcode?: string; street?: string; housenumber?: string };
}

function ortAus(f: PhotonFeature): Ort {
  const p = f.properties;
  const name = [p.street && [p.street, p.housenumber].filter(Boolean).join(' '), p.name].find(Boolean) ?? p.city ?? 'Ort';
  const zusatz = [p.postcode, p.city !== name ? p.city : '', p.county, p.state].filter(Boolean).join(', ');
  return { name, zusatz, lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], land: luftbildFuer(p.state) };
}

async function photon(pfad: string): Promise<Ort[]> {
  const res = await fetch(PHOTON + pfad);
  if (!res.ok) throw new Error(String(res.status));
  const json = await res.json() as { features?: PhotonFeature[] };
  return (json.features ?? []).map(ortAus);
}

/** pan so, dass Rasterpunkt `px` in der Fenstermitte (206, 260) liegt. */
function panAuf(px: { x: number; y: number }, zoom: number, rot: number) {
  return panFuer(px, { x: 206, y: 260 }, zoom, rot);
}

/** Mitte eines Reviers in Rasterpixeln (Mitte der Ausdehnung). */
export function revierMitte(points: string) {
  const p = parse(points);
  const xs = p.map(q => q[0]), ys = p.map(q => q[1]);
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
}

/** Kartenausschnitt auf ein Revier setzen. */
export function zumRevier(s: AppState, id: string): Partial<AppState> {
  const r = s.revierData.find(x => x.id === id);
  if (!r) return {};
  return { pan: panAuf(revierMitte(r.points), s.zoom, s.rot) };
}

const fmtKoord = (lat: number, lng: number) =>
  `${lat.toFixed(5).replace('.', ',')} N  ${lng.toFixed(5).replace('.', ',')} E`;

export function StandortSheet() {
  const { state: s, set, flash } = useApp();
  const act = activeRevier(s);
  const [frage, setFrage] = useState('');
  const [treffer, setTreffer] = useState<Ort[]>([]);
  const [wahl, setWahl] = useState<Ort | null>(null);
  const [laeuft, setLaeuft] = useState('');

  const suchen = async () => {
    const q = frage.trim();
    if (!q) return;
    setLaeuft('Suche …'); setWahl(null);
    try {
      const r = await photon(`/api/?q=${encodeURIComponent(q)}&limit=6&lang=de&bbox=${DE_BBOX}`);
      setTreffer(r);
      if (!r.length) flash('Nichts gefunden — anders schreiben oder Ort und Landkreis angeben.');
    } catch {
      flash('Ortssuche braucht Netz.');
    }
    setLaeuft('');
  };

  const gps = () => {
    if (!navigator.geolocation) { flash('Dieses Gerät liefert keinen Standort.'); return; }
    setLaeuft('Standort wird bestimmt …'); setTreffer([]);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng, accuracy } = pos.coords;
      let ort: Ort = { name: 'GPS-Standort', zusatz: `± ${Math.round(accuracy)} m`, lat, lng, land: null };
      try {
        const [rev] = await photon(`/reverse?lat=${lat}&lon=${lng}&lang=de`);
        if (rev) ort = { ...ort, name: rev.name || ort.name, zusatz: [rev.zusatz, `± ${Math.round(accuracy)} m`].filter(Boolean).join(' · '), land: rev.land };
      } catch { /* ohne Netz bleibt es beim GPS-Punkt */ }
      setWahl(ort); setLaeuft('');
    }, (err) => {
      setLaeuft('');
      flash(err.code === err.PERMISSION_DENIED ? 'Standortfreigabe fehlt — in den App-Einstellungen erlauben.' : 'Kein GPS-Empfang.');
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 });
  };

  const springen = (o: Ort) => {
    set(p => ({
      pan: panAuf(lngLatToPx(o.lng, o.lat), 2, p.rot), zoom: 2, sheet: null,
      luftbild: o.land ?? p.luftbild,
    }));
    flash(`Karte bei ${o.name}`);
  };

  const verlegen = (o: Ort) => {
    const mitte = revierMitte(act.points);
    const a = ankerFuer({ lat: o.lat, lng: o.lng }, mitte);
    set(p => ({
      anker: { ...a, ort: o.name },
      pan: panAuf(mitte, 1, p.rot), zoom: 1, sheet: null,
      luftbild: o.land ?? p.luftbild,
    }));
    flash(`${act.name} liegt jetzt bei ${o.name}`);
  };

  return (
    <div style={{ ...sheetBody, gap: 12 }}>
      <div>
        <div style={label}>Karte liegt bei</div>
        <div style={{ fontSize: 15 }}>{s.anker.ort}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>{fmtKoord(s.anker.lat, s.anker.lng)}</div>
      </div>

      <button onClick={gps} style={{ ...block(false), minHeight: 52, fontSize: 15, fontWeight: 600, textAlign: 'left' }}>
        Mein Standort (GPS)
      </button>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={frage}
          placeholder="Ort, Straße oder Gemarkung"
          onChange={(e) => setFrage(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') suchen(); }}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={suchen} style={chip(true, { minHeight: 48, fontSize: 14, flex: 'none', padding: '0 14px' })}>Suchen</button>
      </div>

      {laeuft && <div style={{ fontSize: 13, color: 'var(--muted)' }}>{laeuft}</div>}

      {!wahl && treffer.map((o, i) => (
        <button key={i} onClick={() => setWahl(o)} style={{ ...block(false), textAlign: 'left' }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{o.name}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{o.zusatz}</div>
        </button>
      ))}

      {wahl && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--rule)', paddingTop: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{wahl.name}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{wahl.zusatz}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>{fmtKoord(wahl.lat, wahl.lng)}</div>
          </div>
          <button onClick={() => verlegen(wahl)} style={{
            minHeight: 56, border: '2px solid var(--accent)', background: 'var(--accent)', color: '#fff',
            fontSize: 15, fontWeight: 600, textAlign: 'left', padding: '0 14px', cursor: 'pointer',
          }}>„{act.name}“ hierher verlegen</button>
          <button onClick={() => springen(wahl)} style={{ ...block(false), minHeight: 52, fontSize: 15, textAlign: 'left' }}>
            Nur hierhin springen
          </button>
          <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>
            Verlegen setzt die Revier-Mitte auf diesen Punkt. Alle Grenzen, Schläge und Marker wandern mit.
            Springen zeigt nur die Karte dort, etwa um ein weiteres Revier an seiner Stelle einzuzeichnen.
          </div>
          <button onClick={() => setWahl(null)} style={{ ...block(false), minHeight: 44, fontSize: 13 }}>Anderen Ort wählen</button>
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 12 }}>
        <div style={{ ...label, marginBottom: 6 }}>Luftbild</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {LAENDER.map(l => (
            <button key={l} onClick={() => set({ luftbild: l })} style={chip(s.luftbild === l, { minHeight: 44, fontSize: 13 })}>
              {LUFTBILD[l].name}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--muted)', marginTop: 8 }}>
          Die Suche wählt das Land selbst. Für die übrigen Länder ist das Luftbild nicht frei
          oder die Lizenz noch nicht geklärt. Ortssuche: Photon, Daten © OpenStreetMap-Mitwirkende.
        </div>
      </div>
    </div>
  );
}
