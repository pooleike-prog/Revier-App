import { useEffect, useState } from 'react';
import { resolveLicht } from '../lib/lightMode';
import type { Licht, LichtWahl } from '../lib/lightMode';

/** Der gerade gültige Lichtmodus. Im Automatikbetrieb wird jede Minute neu
 *  nach dem Sonnenstand geschaut — und sofort, wenn die App wieder in den
 *  Vordergrund kommt, denn Android hält Timer im Hintergrund an. */
export function useLicht(wahl: LichtWahl): Licht {
  const [licht, setLicht] = useState<Licht>(() => resolveLicht(wahl, new Date()));

  useEffect(() => {
    const tick = () => setLicht(prev => resolveLicht(wahl, new Date(), prev));
    tick();
    if (wahl !== 'auto') return;
    const id = setInterval(tick, 60000);
    const onShow = () => { if (document.visibilityState === 'visible') tick(); };
    document.addEventListener('visibilitychange', onShow);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onShow);
    };
  }, [wahl]);

  return licht;
}
