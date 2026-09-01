/** Ein Piktogramm aus ICON — 24×24-Pfad, gezeichnet in currentColor. */
export function Icon({ d, size = 18, stroke = 1.9 }: { d: string; size?: number; stroke?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}
