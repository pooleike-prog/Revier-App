/* Build-time settings. In the design these were the canvas tweaks — no screen
   exposes them, so they stay configuration rather than in-app controls. The
   values here are the design's defaults. */

/** Vollversion: blendet die drei Werbeplätze aus. */
export const WERBEFREI = false;

/** Wie Büchsenlicht definiert ist — je nachdem, was das Landesrecht vorgibt.
 *  daemmerung = bürgerliche Dämmerung (Sonne 6° unter dem Horizont),
 *  sa30 / sa60 = Sonnenauf-/-untergang ± 30 bzw. 60 min. */
export type BuechsenlichtMode = 'daemmerung' | 'sa30' | 'sa60';
export const BUECHSENLICHT: BuechsenlichtMode = 'daemmerung';

/** Wo das Kartenraster der App auf der Erde liegt: die Rastermitte (200, 260).
 *  Das Demo-Revier sitzt bei Hannover, im Abdeckungsgebiet des LGLN-Luftbilds.
 *  Für ein echtes Revier gehört hier dessen Mitte hin. */
export const KARTEN_ANKER = { lat: 52.34608, lng: 9.777 };
