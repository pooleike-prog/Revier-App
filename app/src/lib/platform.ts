/** Läuft die App als eigenständige App — als APK auf dem Telefon oder vom
 *  Startbildschirm aus? Dann füllt sie den Bildschirm, statt im Geräterahmen
 *  der Entwurfsseite zu sitzen.
 *
 *  Zum Ausprobieren im Browser: ?app an die Adresse hängen. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  const cap = (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  if (cap?.isNativePlatform?.()) return true;

  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  if ((window.navigator as Navigator & { standalone?: boolean }).standalone) return true;

  try {
    if (new URLSearchParams(window.location.search).has('app')) return true;
  } catch {
    // ungültige Adresse — dann eben nicht
  }
  return false;
}

/** Färbt die Systemleisten mit: im Rotlichtmodus dunkel, sonst pergamenten. */
export function setThemeColor(night: boolean): void {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', night ? '#0b0908' : '#f2eee2');
}
