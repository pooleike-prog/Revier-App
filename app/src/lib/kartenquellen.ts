import type { Map as MapLibreMap, StyleSpecification } from 'maplibre-gl';
import type { LuftbildLand, MapStyle } from '../types';
import { holen, rk } from './kachelspeicher';
import { tileBbox3857, tilesFor } from './projection';

/* Die Kartenquellen. Ausgewählt nach drei Kriterien: offen lizenziert (auch
   für eine spätere kommerzielle App), ohne API-Schlüssel und ohne Verbot,
   Kacheln für die Offline-Nutzung vorab zu laden.

   Topografie  basemap.de Relief (BKG) — amtliche Vektorkacheln mit Höhenlinien
               und Schummerung, ganz Deutschland, CC BY 4.0.
   Satellit    DOP20 der Landesvermessung — Luftbild mit 20 cm Bodenauflösung,
               je Bundesland eine Quelle (siehe LUFTBILD).
   Ausweiche   OpenTopoMap (CC BY-SA), falls basemap.de nicht lädt. Nur das, was
               angesehen wird, landet im Speicher — Massendownloads sind dort
               nicht erwünscht, deshalb lädt „Revier offline speichern“ sie nicht. */

const JAHR = new Date().getFullYear();

export const BASEMAP_DE_RELIEF = 'https://sgx.geodatenzentrum.de/gdz_basemapde_vektor/styles/bm_web_top.json';

const wms = (base: string, layer: string) =>
  `${base}${base.includes('?') ? '&' : '?'}SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap`
  + `&LAYERS=${layer}&STYLES=&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&FORMAT=image/jpeg`;

/** Offene Luftbilder (DOP20) der Länder. Jede Adresse ist gegen die
 *  GetCapabilities des Dienstes geprüft: Ebene, EPSG:3857 und Lizenz. Länder
 *  ohne Eintrag bieten ihr DOP nicht frei oder nicht geklärt an. */
export const LUFTBILD: Record<LuftbildLand, { name: string; url: string; vermerk: string }> = {
  NI: { name: 'Niedersachsen', url: wms('https://opendata.lgln.niedersachsen.de/doorman/noauth/dop_wms', 'ni_dop20'), vermerk: `© GeoBasis-DE/LGLN ${JAHR} · CC BY 4.0` },
  NW: { name: 'Nordrhein-Westfalen', url: wms('https://www.wms.nrw.de/geobasis/wms_nw_dop', 'nw_dop_rgb'), vermerk: `© Geobasis NRW ${JAHR} · dl-de/zero-2-0` },
  BB: { name: 'Brandenburg und Berlin', url: wms('https://isk.geobasis-bb.de/mapproxy/dop20c/service/wms', 'bebb_dop20c'), vermerk: '© GeoBasis-DE/LGB, dl-de/by-2-0 · © Geoportal Berlin, dl-de/by-2-0' },
  BY: { name: 'Bayern', url: wms('https://geoservices.bayern.de/od/wms/dop/v1/dop20', 'by_dop20c'), vermerk: '© Bayerische Vermessungsverwaltung · CC BY 4.0' },
};
export const LAENDER = Object.keys(LUFTBILD) as LuftbildLand[];

/** Bundesland (wie es eine Ortssuche liefert) → Luftbildquelle. */
export function luftbildFuer(bundesland: string | undefined): LuftbildLand | null {
  const n = (bundesland ?? '').toLowerCase();
  if (n.includes('niedersachsen') || n.includes('bremen')) return 'NI';
  if (n.includes('nordrhein')) return 'NW';
  if (n.includes('brandenburg') || n.includes('berlin')) return 'BB';
  if (n.includes('bayern') || n.includes('bavaria')) return 'BY';
  return null;
}

export const OPENTOPOMAP = 'https://tile.opentopomap.org/{z}/{x}/{y}.png';

export const QUELLVERMERK = {
  basemap: `© basemap.de / BKG ${JAHR} · CC BY 4.0`,
  otm: 'Kartendaten © OpenStreetMap-Mitwirkende, SRTM · Darstellung © OpenTopoMap (CC BY-SA)',
};

/** Quellen, die „Revier offline speichern“ laden darf, und bis zu welcher Stufe. */
export const VORLADEN_BIS: Record<string, number> = {
  'sgx.geodatenzentrum.de': 16,
  'opendata.lgln.niedersachsen.de': 17,
  'www.wms.nrw.de': 17,
  'isk.geobasis-bb.de': 17,
  'geoservices.bayern.de': 17,
};

type Style = StyleSpecification;

/** Ein Stil, dessen sämtliche Adressen über den Kachelspeicher laufen. */
function durchSpeicher(style: Style): Style {
  const sources: Style['sources'] = {};
  for (const [id, src] of Object.entries(style.sources)) {
    const s = { ...src } as Record<string, unknown>;
    if (typeof s.url === 'string') s.url = rk(s.url);
    if (Array.isArray(s.tiles)) s.tiles = (s.tiles as string[]).map(rk);
    sources[id] = s as Style['sources'][string];
  }
  const sprite = typeof style.sprite === 'string'
    ? rk(style.sprite)
    : style.sprite?.map(sp => ({ ...sp, url: rk(sp.url) }));
  return { ...style, sources, sprite, glyphs: style.glyphs ? rk(style.glyphs) : undefined };
}

const rasterStil = (id: string, tiles: string, tileSize: number, maxzoom: number, attribution: string): Style => ({
  version: 8,
  sources: { [id]: { type: 'raster', tiles: [rk(tiles)], tileSize, maxzoom, attribution } },
  layers: [{ id, type: 'raster', source: id }],
});

export const opentopomapStil = () => rasterStil('otm', OPENTOPOMAP, 256, 17, QUELLVERMERK.otm);

export async function stilFuer(art: MapStyle, land: LuftbildLand): Promise<{ style: Style; vermerk: string }> {
  if (art === 'sat') {
    const q = LUFTBILD[land] ?? LUFTBILD.NI;
    return { style: rasterStil('dop-' + land, q.url, 256, 19, q.vermerk), vermerk: q.vermerk };
  }
  try {
    const buf = await holen(BASEMAP_DE_RELIEF);
    const style = JSON.parse(new TextDecoder().decode(buf)) as Style;
    return { style: durchSpeicher(style), vermerk: QUELLVERMERK.basemap };
  } catch {
    return { style: opentopomapStil(), vermerk: QUELLVERMERK.otm };
  }
}

/* ── Revier offline speichern ────────────────────────────────────────────── */

interface QuelleInfo { tiles?: string[]; minzoom?: number; maxzoom?: number; tileSize?: number; type?: string }

/** Alle Kacheladressen, die die Karte für ein Gebiet (in Rasterpixeln) braucht
 *  — für jede Quelle des aktuellen Stils, die vorab geladen werden darf. */
export function kachelAdressen(map: MapLibreMap, min: { x: number; y: number }, max: { x: number; y: number }): string[] {
  const urls = new Set<string>();
  for (const id of Object.keys(map.getStyle().sources)) {
    const src = map.getSource(id) as unknown as QuelleInfo | undefined;
    const vorlage = src?.tiles?.[0]?.replace(/^rk:\/\//, '');
    if (!vorlage) continue;
    const host = new URL(vorlage.replace(/\{[^}]+\}/g, '0')).host;
    const bis = VORLADEN_BIS[host];
    if (bis == null) continue;
    const zMax = Math.min(bis, src?.maxzoom ?? bis);
    const zMin = Math.max(src?.minzoom ?? 0, 8);
    for (let z = zMin; z <= zMax; z++) {
      for (const t of tilesFor(min, max, z)) {
        urls.add(vorlage
          .replace(/{z}/g, String(t.z)).replace(/{x}/g, String(t.x)).replace(/{y}/g, String(t.y))
          .replace(/{bbox-epsg-3857}/g, tileBbox3857(t.x, t.y, t.z)));
      }
    }
  }
  return [...urls];
}
