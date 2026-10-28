import { ctrlBox } from '../lib/styles';

/** Kompassnadel, solange die Karte gedreht ist. Tippen stellt Norden wieder
 *  nach oben; die Fenstermitte bleibt dabei liegen. */
export function Nordpfeil({ rot, onClick }: { rot: number; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="Norden nach oben" style={{ ...ctrlBox, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={30} height={30} viewBox="-15 -15 30 30" style={{ transform: `rotate(${rot}deg)` }} aria-hidden>
        <polygon points="0,-12 5,0 -5,0" fill="var(--accent)" />
        <polygon points="0,12 5,0 -5,0" fill="none" stroke="var(--ink)" strokeWidth={1.5} />
      </svg>
    </button>
  );
}
