/* Der Kartengrund: Grünland, Waldstücke, Bach und Feldweg. Steht als Platzhalter
   für die späteren Vektorkacheln — Geometrie und Maßstab (12 m/px) sind schon
   die der echten Karte. `detailed` blendet Höhenlinien und die gestrichelte
   Wegböschung ein; die Planungskarte kommt ruhiger daher. */

export function MapTerrain({ detailed = false }: { detailed?: boolean }) {
  return (
    <>
      <rect x={-400} y={-520} width={1200} height={1560} fill="var(--m-grass)" />

      {detailed && (
        <g stroke="var(--m-stroke)" strokeWidth={0.5} fill="none" opacity={0.55}>
          <path d="M-40 120 C 60 90 140 150 240 110 S 380 60 460 100" />
          <path d="M-40 160 C 70 130 150 190 250 150 S 390 100 460 140" />
          <path d="M-40 210 C 80 180 160 240 260 200 S 400 150 460 190" />
          <path d="M-40 300 C 90 275 170 330 270 295 S 400 250 460 285" />
          <path d="M-40 380 C 90 355 170 410 270 375 S 400 330 460 365" />
        </g>
      )}

      <polygon points="30,45 175,20 190,105 105,155 20,150" fill="var(--m-forest)" stroke="var(--m-stroke)" strokeWidth={1} />
      <polygon points="255,55 350,80 355,175 265,150" fill="var(--m-forest)" stroke="var(--m-stroke)" strokeWidth={1} />
      <polygon points="60,300 150,330 140,415 45,395" fill="var(--m-forest)" stroke="var(--m-stroke)" strokeWidth={1} />

      <path d="M0 235 C 90 250 150 215 230 240 S 340 300 400 290" fill="none" stroke="var(--m-water)" strokeWidth={5} />
      <path d="M20 470 C 120 400 200 420 280 330 S 360 200 400 150" fill="none" stroke="var(--m-road)" strokeWidth={7} />
      {detailed && (
        <path d="M20 470 C 120 400 200 420 280 330 S 360 200 400 150" fill="none" stroke="var(--m-stroke)" strokeWidth={0.75} strokeDasharray="1 6" />
      )}
    </>
  );
}
