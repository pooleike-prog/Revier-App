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
