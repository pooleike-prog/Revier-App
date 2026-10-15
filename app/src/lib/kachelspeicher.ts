import { addProtocol } from 'maplibre-gl';
import type { RequestParameters } from 'maplibre-gl';

/* Kachelspeicher für den Wald ohne Empfang. Jede Karten-Adresse läuft über das
   Protokoll rk://, das zuerst im Cache Storage des Geräts nachsieht und nur
   bei Bedarf das Netz fragt. Was einmal angezeigt oder per „Revier offline
   speichern“ geladen wurde, steht danach auch ohne Netz zur Verfügung.

   Frisch geholt wird nach 30 Tagen (basemap.de wird monatlich aktualisiert);
   scheitert das, bleibt die gespeicherte Kachel in Gebrauch. */

const CACHE = 'revierpilot-kacheln-v1';
const ZEIT = 'x-rk-gespeichert';
const MAX_ALTER = 30 * 24 * 3600 * 1000;
export const RK = 'rk://';

/** Leitet eine Adresse über den Kachelspeicher. */
export const rk = (url: string) => (url.startsWith(RK) ? url : RK + url);
const plain = (url: string) => (url.startsWith(RK) ? url.slice(RK.length) : url);

function cacheOpen(): Promise<Cache | null> {
  try {
    return typeof caches === 'undefined' ? Promise.resolve(null) : caches.open(CACHE).catch(() => null);
  } catch {
    return Promise.resolve(null);
  }
}

/** Holt eine Adresse — aus dem Speicher, wenn vorhanden und frisch genug. */
export async function holen(url: string, signal?: AbortSignal, nurNeu = false): Promise<ArrayBuffer> {
  const cache = await cacheOpen();
  const hit = cache ? await cache.match(url).catch(() => undefined) : undefined;
  const alter = hit ? Date.now() - Number(hit.headers.get(ZEIT) || 0) : Infinity;
  if (hit && (alter < MAX_ALTER || nurNeu)) return hit.arrayBuffer();

  try {
    const res = await fetch(url, { signal, mode: 'cors' });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    const body = await res.arrayBuffer();
    if (cache) {
      const headers = new Headers({ [ZEIT]: String(Date.now()) });
      const type = res.headers.get('content-type');
      if (type) headers.set('content-type', type);
      cache.put(url, new Response(body.slice(0), { headers })).catch(() => { /* Speicher voll — dann eben nur anzeigen */ });
    }
    return body;
  } catch (err) {
    if (hit) return hit.arrayBuffer();
    throw err;
  }
}

/** Ist die Adresse schon gespeichert? */
export async function vorhanden(url: string): Promise<boolean> {
  const cache = await cacheOpen();
  return !!cache && !!(await cache.match(url).catch(() => undefined));
}

/** TileJSON-Antworten zeigen auf Kacheladressen — die müssen ebenfalls über
 *  den Speicher laufen. */
function umleiten(json: object): object {
  if (Array.isArray((json as { tiles?: unknown }).tiles)) {
    const tj = json as { tiles: string[] };
    return { ...tj, tiles: tj.tiles.map(rk) };
  }
  return json;
}

let registriert = false;

export function kachelProtokollAnmelden(): void {
  if (registriert) return;
  registriert = true;
  addProtocol('rk', async (params: RequestParameters, abort: AbortController) => {
    const buf = await holen(plain(params.url), abort.signal);
    if (params.type === 'json') return { data: umleiten(JSON.parse(new TextDecoder().decode(buf)) as object) };
    if (params.type === 'string') return { data: new TextDecoder().decode(buf) };
    return { data: buf };
  });
}

/** Lädt eine Liste von Adressen mit wenigen gleichzeitigen Abrufen — die
 *  Server der Vermessungsämter sollen nicht überrannt werden. */
export async function vorladen(
  urls: string[],
  fortschritt: (fertig: number, fehler: number) => void,
  signal: AbortSignal,
  parallel = 4,
): Promise<{ fertig: number; fehler: number }> {
  let i = 0, fertig = 0, fehler = 0;
  const arbeiter = async () => {
    while (i < urls.length && !signal.aborted) {
      const url = urls[i++];
      try {
        if (!(await vorhanden(url))) await holen(url, signal);
        fertig++;
      } catch {
        fehler++;
      }
      fortschritt(fertig, fehler);
    }
  };
  await Promise.all(Array.from({ length: parallel }, arbeiter));
  return { fertig, fehler };
}

/** Wie viel liegt im Kachelspeicher? */
export async function speicherStand(): Promise<{ kacheln: number; mb: number | null }> {
  const cache = await cacheOpen();
  const kacheln = cache ? (await cache.keys()).length : 0;
  let mb: number | null = null;
  try {
    const est = await navigator.storage?.estimate?.();
    if (est?.usage != null) mb = Math.round(est.usage / 1e6);
  } catch { /* nicht verfügbar */ }
  return { kacheln, mb };
}

export async function speicherLeeren(): Promise<void> {
  try { await caches.delete(CACHE); } catch { /* nichts zu leeren */ }
}
