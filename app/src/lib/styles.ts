import type { CSSProperties } from 'react';

/* Die vier Stil-Fabriken aus dem Entwurf. Farbe liegt als Rahmen auf, nicht als
   Fläche — gefüllt wird nur, was gerade aktiv ist. Alle Treffflächen sind
   mindestens 44 px hoch, damit sie mit Handschuhen bedienbar bleiben. */

export function chip(active: boolean, extra?: CSSProperties): CSSProperties {
  return {
    minHeight: 44,
    padding: '0 14px',
    border: '2px solid ' + (active ? 'var(--accent)' : 'var(--line)'),
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--ink)',
    fontSize: 14,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    letterSpacing: '.01em',
    ...extra,
  };
}

export function block(active: boolean): CSSProperties {
  return {
    border: '2px solid ' + (active ? 'var(--accent)' : 'var(--rule)'),
    background: 'transparent',
    color: 'var(--ink)',
    padding: '14px',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
  };
}

export function tag(accent: boolean): CSSProperties {
  return {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '.1em',
    textTransform: 'uppercase',
    padding: '4px 7px',
    border: '2px solid ' + (accent ? 'var(--accent)' : 'var(--rule)'),
    color: accent ? 'var(--accent)' : 'var(--muted)',
  };
}

export function badge(open: boolean): CSSProperties {
  return {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '.1em',
    marginTop: 4,
    display: 'inline-block',
    padding: '3px 6px',
    border: '2px solid ' + (open ? 'var(--accent)' : 'var(--rule)'),
    color: open ? 'var(--accent)' : 'var(--muted)',
  };
}

/** Marker pin: 30 × 30, accent types filled, the selected one ringed. */
export function pinStyle(accent: boolean, active: boolean): CSSProperties {
  return {
    position: 'absolute',
    width: 30,
    height: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: accent ? 'var(--accent)' : 'var(--surf)',
    color: accent ? '#fff' : 'var(--ink)',
    border: '2px solid ' + (active ? 'var(--accent)' : 'var(--line)'),
    outline: active ? '3px solid var(--accent)' : 'none',
    outlineOffset: 2,
    cursor: 'pointer',
    boxSizing: 'border-box',
    zIndex: 5,
  };
}

/** The square 48 px control boxes that sit on top of the map. */
export const ctrlBox: CSSProperties = {
  width: 48,
  height: 48,
  border: '2px solid var(--line)',
  background: 'var(--surf)',
  color: 'var(--ink)',
  cursor: 'pointer',
};

/** Accent-filled primary action at the foot of a sheet. */
export const primaryAction: CSSProperties = {
  border: '2px solid var(--accent)',
  background: 'var(--accent)',
  color: '#fff',
  fontWeight: 600,
  textAlign: 'left',
  cursor: 'pointer',
};

/** Outlined secondary action. */
export const secondaryAction: CSSProperties = {
  border: '2px solid var(--line)',
  background: 'transparent',
  color: 'var(--ink)',
  cursor: 'pointer',
};

/** Text input / textarea in a sheet. */
export const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  minHeight: 52,
  border: '2px solid var(--line)',
  background: 'transparent',
  color: 'var(--ink)',
  fontSize: 16,
  padding: '0 12px',
};

/** The small uppercase caption above a field. */
export const label: CSSProperties = {
  fontSize: 11,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
};
