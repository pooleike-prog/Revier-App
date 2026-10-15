/* Nachtzeit-Verbot je Bundesland. Die Dauer ist überall gleich (1,5 h nach
   Sonnenuntergang bis 1,5 h vor Sonnenaufgang, § 19 Abs. 1 Nr. 4 BJagdG);
   die Länder unterscheiden sich darin, welches Wild das Verbot erfasst und
   welche Ausnahmen gelten. Stand der Recherche: Oktober 2026. Viele Angaben
   beruhen auf nichtamtlichen Volltextsammlungen — `sicherheit` sagt, wie gut
   die Quelle ist. Behördliche Zulassungen und Anordnungen kennt die App nicht. */

export type Bundesland =
  | 'BW' | 'BY' | 'BE' | 'BB' | 'HB' | 'HH' | 'HE' | 'MV'
  | 'NI' | 'NW' | 'RP' | 'SL' | 'SN' | 'ST' | 'SH' | 'TH';

export interface NachtzeitProfil {
  name: string;
  /** Minuten vor Sonnenaufgang, ab denen die Nachtzeit endet. */
  vorSA: number;
  /** Minuten nach Sonnenuntergang, ab denen die Nachtzeit beginnt. */
  nachSU: number;
  /** Welches Wild zur Nachtzeit nicht erlegt werden darf. */
  gesperrt: string;
  /** Landesrechtliche Ausnahmen, leer wenn keine bekannt. */
  ausnahmen: string;
  rechtsgrundlage: string;
  /** primaer = amtlicher Text gelesen, sekundaer = nichtamtliche Volltextsammlung. */
  sicherheit: 'primaer' | 'sekundaer' | 'unsicher';
}

const BUND = 'Schalenwild außer Schwarzwild sowie Federwild außer Möwen, Waldschnepfen, Auer-, Birk- und Rackelwild';

const p = (
  name: string, gesperrt: string, ausnahmen: string, rechtsgrundlage: string,
  sicherheit: NachtzeitProfil['sicherheit'],
): NachtzeitProfil => ({ name, vorSA: 90, nachSU: 90, gesperrt, ausnahmen, rechtsgrundlage, sicherheit });

export const NACHTZEIT: Record<Bundesland, NachtzeitProfil> = {
  BW: p('Baden-Württemberg', 'Schalenwild außer Schwarzwild sowie alles Federwild',
    'Weibliches Rotwild und Kälber nach Sonnenuntergang bis 22:00 Uhr.',
    '§ 31 Abs. 1 Nr. 9 JWMG', 'sekundaer'),
  BY: p('Bayern', 'alles Wild außer Schwarzwild, Haarraubwild, invasiven Haarwildarten, Möwen, Waldschnepfen und Raufußhühnern',
    '', 'Art. 29 Abs. 2 Nr. 1 BayJG (gültig ab 01.04.2026)', 'primaer'),
  BE: p('Berlin', BUND, '', '§ 19 Abs. 1 Nr. 4 BJagdG; LJagdG Bln ungeprüft', 'unsicher'),
  BB: p('Brandenburg', BUND,
    'Nachtjagd auf Schalenwild nur mit Zulassung der Jagdbehörde.',
    '§ 19 Abs. 1 Nr. 4 BJagdG; § 26 BbgJagdG', 'primaer'),
  HB: p('Bremen', BUND, '', '§ 19 Abs. 1 Nr. 4 BJagdG; Art. 20 Abs. 2 BremLJagdG', 'sekundaer'),
  HH: p('Hamburg', BUND, '', '§ 19 Abs. 1 Nr. 4 BJagdG; HmbJagdG ungeprüft', 'unsicher'),
  HE: p('Hessen', BUND,
    'Rotwild außerhalb von Rotwildgebieten bzw. außerhalb des Waldes, soweit der Abschussplan es erfordert.',
    '§ 19 Abs. 1 Nr. 4 BJagdG; § 23 Abs. 2 HJagdG', 'sekundaer'),
  MV: p('Mecklenburg-Vorpommern', BUND,
    'Rot- und Damwild vom 1. Oktober bis 31. Januar auch zur Nachtzeit.',
    '§ 19 Abs. 1 Nr. 4 BJagdG; § 17 LJagdG M-V', 'sekundaer'),
  NI: p('Niedersachsen', BUND,
    'Rot- und Damwild nur mit Zulassung der Jagdbehörde.',
    '§ 19 Abs. 1 Nr. 4 BJagdG; § 24 Abs. 9 Nr. 1 NJagdG', 'sekundaer'),
  NW: p('Nordrhein-Westfalen', 'alles Wild außer Schwarzwild und Raubwild',
    '', '§ 19 Abs. 1 Nr. 6 LJG-NRW', 'sekundaer'),
  RP: p('Rheinland-Pfalz', 'Schalenwild außer Schwarzwild sowie alles Federwild',
    'Weibliches Rot-, Dam- und Muffelwild, Kälber und Spießer 01.07.–15.10. per Anordnung. Ab 01.04.2027 gilt das neue LJG.',
    '§ 23 LJG (bis 31.03.2027), § 26 LJG 2025 (ab 01.04.2027)', 'sekundaer'),
  SL: p('Saarland', 'Schalenwild außer Schwarzwild, Federwild sowie Haarwild außer Raubwild und Wildkaninchen',
    'Rot-, Dam- und Muffelwild nur mit Zulassung der Jagdbehörde.',
    '§ 19 Abs. 1 Nr. 4 BJagdG; § 32 Abs. 1 Nr. 4 SJG', 'sekundaer'),
  SN: p('Sachsen', BUND,
    'Schalenwild nur mit Genehmigung der Jagdbehörde.',
    '§ 19 Abs. 1 Nr. 4 BJagdG; § 18 Abs. 3 SächsJagdG', 'primaer'),
  ST: p('Sachsen-Anhalt', BUND,
    'Weibliches Rot- und Damwild und Kälber per Allgemeinverfügung.',
    '§ 19 Abs. 1 Nr. 4 BJagdG; § 23 Abs. 6 LJagdG LSA', 'sekundaer'),
  SH: p('Schleswig-Holstein', BUND,
    'Rot- und Damwild vom 1. November bis 31. Januar, soweit der Abschussplan es erfordert.',
    '§ 19 Abs. 1 Nr. 4 BJagdG; § 29 LJagdG SH', 'sekundaer'),
  TH: p('Thüringen', BUND,
    'Ausnahmen durch die untere Jagdbehörde.',
    '§ 19 Abs. 1 Nr. 4 BJagdG; § 29 Abs. 4 Nr. 3 ThJG', 'sekundaer'),
};
