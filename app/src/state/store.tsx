import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { AppState, MarkerType, Marker } from '../types';
import { initialState } from '../data/seed';
import { TYPES } from '../data/constants';
import { gps } from '../lib/geo';
import { load, save, clear } from './persist';

type Patch = Partial<AppState> | ((s: AppState) => Partial<AppState>);

interface Store {
  state: AppState;
  /** Merges a partial state, like the prototype's setState. */
  set: (patch: Patch) => void;
  /** Shows a toast for a few seconds; `id` marks the marker RÜCKGÄNGIG removes. */
  flash: (msg: string, id?: number | null) => void;
  addMarker: (typeId: MarkerType, x: number, y: number) => void;
  /** Verwirft den gespeicherten Stand und stellt die Demo-Daten wieder her. */
  resetData: () => void;
}

const AppContext = createContext<Store | null>(null);

export function typeDef(id: MarkerType) {
  return TYPES.find(t => t.id === id) ?? TYPES[0];
}

export function AppProvider({ children }: { children: ReactNode }) {
  // Gespeicherten Stand übernehmen, sonst mit dem Demo-Revier starten.
  const [state, setState] = useState<AppState>(() => ({ ...initialState, ...load() }));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  // Gebündelt sichern statt bei jedem Tastendruck.
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(state), 400);
  }, [state]);

  // Beim Wegschalten der App sofort sichern — Android beendet sie im
  // Hintergrund, ohne dass ein Timer noch feuert.
  useEffect(() => {
    const flush = () => { if (document.visibilityState === 'hidden') save(state); };
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('pagehide', flush);
    };
  }, [state]);

  const set = useCallback((patch: Patch) => {
    setState(s => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }));
  }, []);

  const flash = useCallback((msg: string, id: number | null = null) => {
    setState(s => ({ ...s, toast: msg, lastAdded: id }));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState(s => ({ ...s, toast: '' })), 4200);
  }, []);

  const addMarker = useCallback((typeId: MarkerType, x: number, y: number) => {
    const t = typeDef(typeId);
    const id = Date.now();
    setState(s => {
      const n = s.markers.filter(m => m.type === typeId).length + 1;
      const m: Marker = {
        id, type: typeId, name: t.short + ' ' + n, x, y,
        note: '', date: '28.08.2026', revier: s.activeRevier,
      };
      // Neue Ansitze bekommen automatisch einen 100-m-Ring.
      if (typeId === 'ansitz') m.dists = [100];
      return { ...s, markers: s.markers.concat([m]), sel: id, sheet: 'marker', tool: null, aim: null, radial: false };
    });
    flash(t.label + ' gesetzt · ' + gps(x, y), id);
  }, [flash]);

  const resetData = useCallback(() => {
    clear();
    setState(initialState);
    flash('Demo-Daten wiederhergestellt');
  }, [flash]);

  const value = useMemo<Store>(
    () => ({ state, set, flash, addMarker, resetData }),
    [state, set, flash, addMarker, resetData],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): Store {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp muss innerhalb von <AppProvider> stehen');
  return ctx;
}
