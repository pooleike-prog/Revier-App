import { useRef } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from 'react';
import type { Point } from '../types';

/** Das Kartenraster des Entwurfs. Der Ursprung der Skalierung liegt in der Mitte. */
export const MAP_W = 400;
export const MAP_H = 520;
const ORIGIN_X = MAP_W / 2;
const ORIGIN_Y = MAP_H / 2;

/** Bildschirmpunkt → Kartenkoordinate, Pan und Zoom herausgerechnet. */
export function toMap(
  e: ReactPointerEvent<HTMLElement> | ReactMouseEvent<HTMLElement>,
  pan: Point,
  zoom: number,
): Point {
  const box = e.currentTarget.getBoundingClientRect();
  return {
    x: Math.round((e.clientX - box.left - pan.x - ORIGIN_X * (1 - zoom)) / zoom),
    y: Math.round((e.clientY - box.top - pan.y - ORIGIN_Y * (1 - zoom)) / zoom),
  };
}

export function mapWrapStyle(pan: Point, zoom: number): CSSProperties {
  return {
    position: 'absolute', left: 0, top: 0, width: MAP_W, height: MAP_H,
    transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
    transformOrigin: `${ORIGIN_X}px ${ORIGIN_Y}px`,
  };
}

export interface PanHandle {
  start: (e: ReactPointerEvent<HTMLElement>) => void;
  move: (e: ReactPointerEvent<HTMLElement>) => void;
  end: () => void;
  /** True while the last gesture was a drag — a drag must not place a marker. */
  moved: () => boolean;
}

/** Verschieben der Karte per Finger. Erst ab 4 px gilt es als Ziehen, damit ein
 *  Tippen mit Handschuh nicht als Verschieben durchgeht. */
export function usePan(pan: Point, apply: (p: Point) => void): PanHandle {
  const drag = useRef<{ x: number; y: number; pan: Point; moved: boolean } | null>(null);

  return {
    start: (e) => { drag.current = { x: e.clientX, y: e.clientY, pan, moved: false }; },
    move: (e) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
      if (d.moved) apply({ x: d.pan.x + dx, y: d.pan.y + dy });
    },
    // Erst nach dem Click-Event zurücksetzen, damit dieses das Ziehen noch sieht.
    end: () => { setTimeout(() => { drag.current = null; }, 0); },
    moved: () => !!drag.current && drag.current.moved,
  };
}
