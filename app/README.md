# Revierpilot

Implementierung des Claude-Design-Entwurfs `project/Revier App.dc.html` als
React-App. Sechs Reiter: **Karte**, **Planung**, **Tagebuch**, **Zeiten**,
**Ansitz**, **Mehr**.

Läuft eigenständig: Erfasste Daten bleiben auf dem Gerät, Schriften und
Kartenbild liegen im Paket, und ohne Empfang startet die App wie gewohnt.

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
- **Schriften im Paket** (`public/fonts/`) statt von Google — sonst stünde die
  App im Revier ohne Empfang in Georgia.
- **Offline startklar**: Service Worker legt die 45 Dateien der App auf dem
  Gerät ab; als APK sind sie ohnehin mit installiert.

**Demo-Stand:**

- Das Kartenbild ist der Platzhalter aus dem Entwurf (SVG, Pixelkoordinaten bei
  12 m/px), nicht MapLibre. Der Wechsel Topografie/Satellit tauscht die
  Farbtöne, keine echten Kacheln.
- Jagdzeiten, Reviere, Schläge, Marker, Tagebuch und Jagden sind Demo-Daten aus
  `data/seed.ts`; Wind und Temperatur auf dem Ansitz-Reiter sind fest.
- Der Stichtag der Jagdzeiten ist der 28.08.2026 (`HEUTE` in `constants.ts`),
  wie im Entwurf. Das Büchsenlicht rechnet dagegen mit dem echten Datum.
- PDF-Export und Offline-Downloads quittieren nur.

## Nächste Schritte in Richtung Produktion

- **Karte auf MapLibre GL** umstellen: OSM-Vektorkacheln als PMTiles offline,
  Orthofoto DOP20 der Landesvermessungsämter. Dafür bekommen Marker, Grenzen,
  Schläge, Stände und Pfeile echte Koordinaten; `lib/geo.ts` und
  `lib/mapInteraction.ts` sind die Stellen, an denen das Pixelraster steckt.
- **Jagdzeiten je Bundesland** konfigurierbar machen (16 Varianten), dazu
  Elterntierschutz und behördliche Abweichungen.
- **Flächenteilung** als Polylinien-Schnitt, damit auch einbuchtige Schläge
  sauber getrennt werden — aktuell schneidet die Trennlinie immer gerade.
- **Speichern und Sync**: lokale Persistenz, verschlüsselte Ablage der sensiblen
  Standorte, Export der Streckenliste.
