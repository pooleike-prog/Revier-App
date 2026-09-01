import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { AppState, MarkerType, Marker } from '../types';
import { initialState } from '../data/seed';
import { TYPES } from '../data/constants';
import { gps } from '../lib/geo';

type Patch = Partial<AppState> | ((s: AppState) => Partial<AppState>);

interface Store {
  state: AppState;
  /** Merges a partial state, like the prototype's setState. */
  set: (patch: Patch) => void;
  /** Shows a toast for a few seconds; `id` marks the marker RÜCKGÄNGIG removes. */
  flash: (msg: string, id?: number | null) => void;
  addMarker: (typeId: MarkerType, x: number, y: number) => void;
}

const AppContext = createContext<Store | null>(null);

export function typeDef(id: MarkerType) {
  return TYPES.find(t => t.id === id) ?? TYPES[0];
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

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

  const value = useMemo<Store>(() => ({ state, set, flash, addMarker }), [state, set, flash, addMarker]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): Store {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp muss innerhalb von <AppProvider> stehen');
  return ctx;
}
