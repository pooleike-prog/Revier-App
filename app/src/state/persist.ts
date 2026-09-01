import type { AppState } from '../types';

/* Alles, was der Revierinhaber erfasst hat, überlebt das Schließen der App.
   Gespeichert wird lokal auf dem Gerät — Ansitze und Erlegungsorte sind
   sensible Standorte und gehen niemanden sonst etwas an. */

const KEY = 'revierpilot.stand';
const VERSION = 1;

/** Erfasste Daten und Einstellungen. Was gerade offen oder ausgewählt ist,
 *  gehört nicht dazu: die App startet immer frisch auf der Karte. */
const FIELDS = [
  'markers', 'fieldData', 'revierData', 'activeRevier', 'journal',
  'jagden', 'treiben', 'posts', 'arrows', 'extents',
  'night', 'mapStyle', 'ctrl', 'zeichen', 'openGroups',
] as const;

type Persisted = Pick<AppState, (typeof FIELDS)[number]>;

export function load(): Partial<AppState> | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return null; // Privater Modus oder gesperrter Speicher — dann eben Demo-Daten.
  }
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { v?: number; data?: Persisted };
    // Ein Stand aus einer älteren Fassung wird verworfen, nicht halb geladen.
    if (parsed.v !== VERSION || !parsed.data) return null;
    if (!Array.isArray(parsed.data.revierData) || !parsed.data.revierData.length) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function save(state: AppState): void {
  const data = {} as Record<string, unknown>;
  for (const f of FIELDS) data[f] = state[f];
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: VERSION, data }));
  } catch {
    // Speicher voll oder gesperrt: die Sitzung läuft weiter, nur ohne Sichern.
  }
}

/** Setzt auf den Demo-Stand zurück — für den Fall, dass beim Ausprobieren
 *  zu viel Testkram im Revier gelandet ist. */
export function clear(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nichts zu tun
  }
}
