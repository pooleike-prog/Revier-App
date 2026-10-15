# Revierpilot

Implementierung des Claude-Design-Entwurfs `project/Revier App.dc.html` als
React-App. Sechs Reiter: **Karte**, **Planung**, **Tagebuch**, **Zeiten**,
**Ansitz**, **Mehr**.

Läuft eigenständig: Erfasste Daten bleiben auf dem Gerät, Schriften liegen im Paket, Kartenkacheln im Gerätespeicher, und ohne Empfang startet die App wie gewohnt.

```bash
npm install
npm run dev        # Entwicklung
npm run build      # Typecheck + Produktionsbuild nach dist/
npm run preview    # gebautes Ergebnis auf :4173
npm run smoke      # Rauchtest gegen den laufenden Preview (braucht playwright)
```

## Als Android-App

Das APK entsteht in GitHub Actions: Jeder Push auf `main` baut eines, es hängt
am Lauf unter **Actions → APK bauen → Artifacts**. Ein Tag (`git tag v0.3.0 &&
git push --tags`) legt zusätzlich ein Release mit fester Download-Adresse an.

Auf dem Telefon installieren: APK öffnen und die Installation aus unbekannter
Quelle für den Dateimanager einmalig erlauben. Die Pakete sind debug-signiert —
zum Seitwärtsinstallieren gedacht, nicht für den Play Store (dafür bräuchte es
einen eigenen Schlüssel, ein Entwicklerkonto und eine Datenschutzerklärung).

Selbst bauen, mit Android-SDK und JDK 17:

```bash
npm run android:apk    # Build + Sync + Gradle, APK unter android/app/build/outputs/apk/debug/
```

`npm run icons` erzeugt Launcher-Icons und Startbildschirme neu, `npm run
fonts` holt die Schriften — beides nur nötig, wenn Logo oder Schriften wechseln.

## Vollbild oder Geräterahmen

Als installierte App füllt Revierpilot den Bildschirm. Im Browser sitzt sie im
Android-Rahmen des Entwurfs, damit sich das Format beurteilen lässt. Zum
Ausprobieren des Vollbilds im Browser: `?app` an die Adresse hängen.

## Aufbau

```
src/
  App.tsx                 Präsentationsseite, Geräterahmen, Kopfzeile, Reiterwahl
  theme.css               Design-Tokens: Classical-System + .app-Palette
                          (Satellit- und Rotlicht-Varianten als data-Attribute)
  state/store.tsx         ein Zustandsobjekt mit setState-artigem `set`,
                          dazu `flash` (Toast) und `addMarker`
  types.ts                Datenmodell
  data/
    constants.ts          Markertypen, Symbole, Fruchtarten, Jagdzeiten, Nav
    seed.ts               Demo-Revier: Marker, Schläge, Reviere, Jagden, Tagebuch
    settings.ts           `WERBEFREI` und die Büchsenlicht-Definition
  lib/
    geo.ts                Polygonfläche in ha, Punkt-in-Polygon, Flächenschnitt,
                          Koordinaten, Himmelsrichtung
    astro.ts              Sonne, bürgerliche Dämmerung, Mondphase und -bahn
    planning.ts           Pfeilgeometrie, Ausschnitt-Zoom, Treiben anlegen
    selectors.ts          aktives Revier, Jagd, Treiben, Sichtbarkeit
    mapInteraction.ts     Karten-Pan/Zoom, Bildschirm → Kartenkoordinate
    styles.ts             die Stil-Fabriken des Entwurfs (chip, block, tag, badge)
  screens/                ein Modul je Reiter
  sheets/                 die neun Bottom-Sheets
  components/             Geräterahmen, Kopfzeile, Reiterleiste, Toast, Karte,
                          Sheet-Hülle, Werbeplatz, Piktogramm
```

## Karte

Die Karte ist MapLibre GL JS (BSD-Lizenz) mit offenen, schlüsselfreien Quellen:

| Ansicht | Quelle | Lizenz | Offline vorab |
|---|---|---|---|
| Topografie | basemap.de Relief (BKG), Vektorkacheln mit Höhenlinien, ganz DE | CC BY 4.0 | ja, bis Stufe 16 |
| Satellit | DOP20 LGLN Niedersachsen (20 cm Luftbild, WMS) | CC BY 4.0 | ja, bis Stufe 17 |
| Ausweiche | OpenTopoMap, wenn basemap.de nicht lädt | CC BY-SA | nein, nur Angesehenes |

- `components/RealMap.tsx` — die Karte unter der Zeichenebene. Sie hat keine
  eigenen Gesten, sondern folgt `pan`/`zoom` der App. So bleiben Marker,
  Grenzen und Schläge in Rasterpixeln gespeichert und liegen trotzdem exakt
  auf den Kacheln (`lib/projection.ts`: das Raster ist ein Ausschnitt von Web
  Mercator um `KARTEN_ANKER`, 12 m/px bei Zoom 1).
- `lib/kachelspeicher.ts` — jede Kartenadresse läuft über das Protokoll
  `rk://` und den Cache Storage des Geräts. Was einmal angezeigt wurde, geht
  auch ohne Netz; nach 30 Tagen wird frisch geholt, sonst bleibt der alte Stand.
- **OFF** auf der Karte lädt das aktive Revier plus 300 m Rand für den
  gewählten Stil (je etwa 850 Kacheln beim 1043-ha-Demo-Revier). Ein zweiter
  Druck bricht ab.
- **Rotlicht** filtert die Kacheln mit einer echten Farbmatrix (nur Rotkanal,
  Topografie invertiert), nicht mit einer Tönung.
- Sentinel-2 von EOX ist bewusst nicht dabei: nur nicht-kommerziell frei
  (CC BY-NC-SA) und nur 10 m Auflösung. Die Kacheln von openstreetmap.org
  scheiden aus, weil deren Nutzungsregeln das Vorabladen verbieten.

## Was echt gerechnet wird — und was Demo ist

**Echt gerechnet:**

- **Büchsenlicht** (`lib/astro.ts`) — Sonnenauf- und -untergang, bürgerliche
  Dämmerung, Mondphase, Mondauf- und -untergang, Höchststand und die Stunden
  Mondlicht in der Dunkelheit, für 52,62° N / 9,21° O in Europe/Berlin. Die
  Mondzeiten sind auf etwa ±10 min genau; produktiv gehört das volle Mondmodell
  mit der echten Revierkoordinate hinterlegt.
- **Flächen** — Reviergrößen, Schlaggrößen und die Hälften nach einer Teilung
  kommen aus der Polygonfläche bei 12 m/px.
- **Entfernungen und Richtungen** — Messen-Modus, Schussentfernungsringe und die
  aus den Pfeilen abgeleitete Treibrichtung.
- **Jagdzeiten-Status** — JAGDZEIT / SCHONZEIT / GESCHÜTZT gegen den Stichtag,
  auch über den Jahreswechsel hinweg.

**Eigenständig:**

- **Gespeichert wird lokal** (`state/persist.ts`): Reviere, Marker, Flächen,
  Tagebuch, Jagdplanung und Einstellungen überstehen das Schließen. Nichts
  verlässt das Gerät. *Mehr → Daten* stellt die Demo-Daten wieder her.
- **Karte offline** über den Kachelspeicher, siehe *Karte* oben.
- **Schriften im Paket** (`public/fonts/`) statt von Google — sonst stünde die
  App im Revier ohne Empfang in Georgia.
- **Offline startklar**: Service Worker legt die 45 Dateien der App auf dem
  Gerät ab; als APK sind sie ohnehin mit installiert.

**Demo-Stand:**

- Das Demo-Revier liegt fiktiv bei Hannover (`KARTEN_ANKER` in
  `data/settings.ts`); Grenzen und Schläge passen deshalb nicht zum echten
  Gelände darunter.
- Jagdzeiten, Reviere, Schläge, Marker, Tagebuch und Jagden sind Demo-Daten aus
  `data/seed.ts`; Wind und Temperatur auf dem Ansitz-Reiter sind fest.
- Der Stichtag der Jagdzeiten ist der 28.08.2026 (`HEUTE` in `constants.ts`),
  wie im Entwurf. Das Büchsenlicht rechnet dagegen mit dem echten Datum.
- PDF-Export und Offline-Downloads quittieren nur.

## Nächste Schritte in Richtung Produktion

- **Revier verorten**: Anker je Revier statt fest in `settings.ts`, gesetzt
  über Adresssuche oder GPS; danach Marker, Grenzen und Schläge als echte
  Koordinaten speichern statt als Rasterpixel.
- **Luftbild weiterer Länder** (NRW, Brandenburg, Hessen …) als Einträge in
  `lib/kartenquellen.ts`, gewählt nach Lage des Reviers.
- **Zwei-Finger-Zoom** auf der Karte.
- **Jagdzeiten je Bundesland** konfigurierbar machen (16 Varianten), dazu
  Elterntierschutz und behördliche Abweichungen.
- **Flächenteilung** als Polylinien-Schnitt, damit auch einbuchtige Schläge
  sauber getrennt werden — aktuell schneidet die Trennlinie immer gerade.
- **Speichern und Sync**: lokale Persistenz, verschlüsselte Ablage der sensiblen
  Standorte, Export der Streckenliste.
