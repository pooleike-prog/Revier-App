import { useEffect, useRef, useState } from 'react';
import { Map as MapLibreMap, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// Der Kachel-Worker wird mitgebündelt, damit er auch ohne Netz im Paket liegt.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import type { MapStyle, Point } from '../types';
import { kachelProtokollAnmelden } from '../lib/kachelspeicher';
import { stilFuer } from '../lib/kartenquellen';
import { mapLibreZoom, pxToLngLat, screenToPx } from '../lib/projection';

/* Die echte Karte unter der Zeichenebene. MapLibre bekommt keine eigenen
   Gesten: Verschieben und Zoomen bleiben bei der App (pan/zoom im Zustand),
   die Karte folgt nur. So liegen Marker, Grenzen und Schläge — weiter in
   Rasterpixeln gespeichert — deckungsgleich auf den Kacheln. */

interface Props {
  pan: Point;
  zoom: number;
  art: MapStyle;
  night: boolean;
  /** Bekommt die Karte, sobald sie steht — für „Revier offline speichern“. */
  onMap?: (map: MapLibreMap | null) => void;
  /** Abstand des Quellvermerks von oben — unten liegen die Werkzeugleisten. */
  vermerkOben: number;
}

/** Rotlicht als echte Farbmatrix statt Tönung: Aus der Helligkeit wird reines
 *  Rot, Grün und Blau fallen weg. Die Topografie wird dabei umgekehrt (dunkler
 *  Grund, rote Linien), das Luftbild bleibt positiv. */
const ROT_TOPO = '-0.3 -0.59 -0.11 0 1  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0';
const ROT_SAT = '0.3 0.59 0.11 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0';

export function RealMap({ pan, zoom, art, night, onMap, vermerkOben }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const view = useRef({ pan, zoom });
  view.current = { pan, zoom };
  const [vermerk, setVermerk] = useState('');
  const [fehler, setFehler] = useState(false);

  const folgen = () => {
    const m = map.current, el = box.current;
    if (!m || !el) return;
    const { pan: p, zoom: z } = view.current;
    const c = screenToPx(el.clientWidth / 2, el.clientHeight / 2, p, z);
    const ll = pxToLngLat(c.x, c.y);
    m.jumpTo({ center: [ll.lng, ll.lat], zoom: mapLibreZoom(z) });
  };

  useEffect(() => {
    if (!box.current) return;
    kachelProtokollAnmelden();
    setWorkerUrl(workerUrl);
    let m: MapLibreMap;
    try {
      m = new MapLibreMap({
        container: box.current,
        style: { version: 8, sources: {}, layers: [] },
        interactive: false,
        attributionControl: false,
        maxZoom: 19,
        fadeDuration: 0,
      });
    } catch {
      setFehler(true); // kein WebGL — die Zeichenebene bleibt trotzdem nutzbar
      return;
    }
    map.current = m;
    // Fehlende Kacheln ohne Netz sind der Normalfall im Wald — kein Fehlerlärm.
    m.on('error', () => {});
    folgen();
    onMap?.(m);
    const ro = new ResizeObserver(() => { m.resize(); folgen(); });
    ro.observe(box.current);
    return () => { ro.disconnect(); onMap?.(null); m.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let aktuell = true;
    stilFuer(art).then(({ style, vermerk: v }) => {
      if (!aktuell || !map.current) return;
      map.current.setStyle(style, { diff: false });
      setVermerk(v);
    });
    return () => { aktuell = false; };
  }, [art]);

  useEffect(folgen, [pan.x, pan.y, zoom]);

  const filterId = art === 'sat' ? 'rk-rot-sat' : 'rk-rot-topo';

  return (
    <>
      <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden>
        <filter id="rk-rot-topo" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values={ROT_TOPO} /></filter>
        <filter id="rk-rot-sat" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values={ROT_SAT} /></filter>
      </svg>
      <div
        ref={box}
        aria-hidden
        style={{
          position: 'absolute', inset: 0,
          filter: night ? `url(#${filterId}) brightness(0.55)` : undefined,
        }}
      />
      <div style={{
        position: 'absolute', left: 12, top: vermerkOben, zIndex: 2, pointerEvents: 'none',
        maxWidth: 'calc(100% - 80px)', padding: '1px 5px', fontSize: 9, lineHeight: '13px',
        color: 'var(--muted)', background: 'color-mix(in oklab, var(--surf) 82%, transparent)',
      }}>
        {fehler ? 'Karte braucht WebGL' : vermerk}
      </div>
    </>
  );
}
