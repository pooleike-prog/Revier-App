import type { AppState, Extent, RevierKind, Treiben } from '../types';

export function kindLabel(kind: RevierKind): string {
  return kind === 'eigen' ? 'Eigenjagd' : kind === 'begeh' ? 'Begehungsschein' : 'Pacht';
}

export function activeRevier(s: AppState) {
  return s.revierData.find(r => r.id === s.activeRevier) ?? s.revierData[0];
}

export function currentJagd(s: AppState) {
  return s.jagden.find(j => j.id === s.selJagd) ?? s.jagden[0];
}

export function treibenOf(s: AppState, jagdId: string): Treiben[] {
  return s.treiben.filter(t => t.jagd === jagdId).sort((a, b) => a.nr - b.nr);
}

export function treibenName(s: AppState, id: string | null): string {
  const t = s.treiben.find(x => x.id === id);
  return t ? t.nr + '. ' + t.name : '—';
}

/** Welche Treiben liegen mit ihren Ständen in diesem Kartenausschnitt. */
export function treibenInBox(s: AppState, box: Extent): Treiben[] {
  return treibenOf(s, box.jagd).filter(t =>
    s.posts.some(p => p.treiben === t.id && p.x >= box.x1 && p.x <= box.x2 && p.y >= box.y1 && p.y <= box.y2));
}

/** Reviere, deren Marker und Grenzen gezeichnet werden — das aktive immer. */
export function visibleRevierIds(s: AppState): string[] {
  const act = activeRevier(s);
  return s.revierData.filter(r => r.visible || r.id === act.id).map(r => r.id);
}
