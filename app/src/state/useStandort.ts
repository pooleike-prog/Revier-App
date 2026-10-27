import { useEffect, useState } from 'react';

/* Die eigene GPS-Position, solange die Karte offen ist. Hochsitz und Pirsch
   brauchen eine laufende Position, keinen einmaligen Abruf — deshalb
   watchPosition, und beim Verlassen der Karte wieder abmelden, damit das GPS
   den Akku nicht leerzieht. */

export interface Standort {
  lat: number;
  lng: number;
  /** Genauigkeit in Metern (68 %-Radius, wie das Gerät sie meldet). */
  genau: number;
}

export function useStandort(onFehler: (msg: string) => void): Standort | null {
  const [pos, setPos] = useState<Standort | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    let gemeldet = false;
    const id = navigator.geolocation.watchPosition(
      p => setPos({ lat: p.coords.latitude, lng: p.coords.longitude, genau: p.coords.accuracy }),
      e => {
        // Nur einmal melden — sonst blinkt bei Funkloch alle paar Sekunden ein Hinweis.
        if (gemeldet) return;
        gemeldet = true;
        onFehler(e.code === e.PERMISSION_DENIED
          ? 'Standort nicht freigegeben — Entfernungskreise brauchen GPS.'
          : 'Noch kein GPS-Empfang.');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 },
    );
    return () => navigator.geolocation.clearWatch(id);
    // onFehler ist ein stabiler Store-Callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return pos;
}
