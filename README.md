# Was ist unter mir?

Adresse eingeben, auf **Berechnen** drücken: Der Globus wird durchscheinend,
ein roter Strich fährt von der Adresse senkrecht durch den Erdmittelpunkt, und
am anderen Ende steht auf den Punkt genau, wo man wieder rauskäme.

Meistens im Meer. Rund 71 % aller Landflächen haben Wasser als Gegenpunkt.

## Entwicklung

```bash
npm install
npm run dev              # Dev-Server
npm run build            # Production-Build nach dist/
npm run build:standalone # alles in eine einzelne HTML-Datei
npm run lint
node --experimental-strip-types src/lib/geo.test.mjs   # Geometrie prüfen
```

Kein Backend, keine API-Schlüssel. Deploybar als statische Site.

## Veröffentlichen

Reine statische Seite – kein Backend, keine Schlüssel, kein Server nötig.

**GitHub Pages** ist vorbereitet: `.github/workflows/deploy.yml` baut und
veröffentlicht bei jedem Push. Einmalig muss unter *Settings → Pages* die
Quelle auf **GitHub Actions** gestellt werden, sonst schlägt der letzte
Schritt fehl. Die Seite liegt danach unter
`https://<name>.github.io/whatsunderme/`.

**Vercel oder Netlify**: Repo verbinden, fertig. Beide erkennen Vite von
selbst (Build `npm run build`, Verzeichnis `dist`). Hier ist nichts
einzustellen – der Basispfad bleibt `/`.

**Ohne alles**: `npm run build:standalone` erzeugt eine einzelne HTML-Datei
mit allem darin. Die lässt sich verschicken oder irgendwo hinlegen.

Pages liefert unter `/<repo-name>/` aus, Vercel und Netlify unter `/`.
Deshalb ist der Basispfad über `VITE_BASE` einstellbar; nur der
Pages-Workflow setzt ihn.

### Was bei echtem Publikum zu beachten ist

Die genutzten Dienste sind kostenlos, aber nicht für Dauerlast gedacht:

- **OpenTopoData/GEBCO** erlaubt **100 Anfragen pro Tag**. Das ist die erste
  Grenze, die fällt. Danach steht bei Gegenpunkten im Meer "Tiefe unbekannt" –
  alles andere funktioniert weiter.
- **Nominatim** erlaubt max. 1 Anfrage/s und untersagt schwere automatisierte
  Nutzung. Ergebnisse werden gecacht und gedrosselt; bei nennenswertem Verkehr
  wäre ein eigener Dienst fällig.
- **Photon** ist großzügiger, bittet aber ebenfalls um faire Nutzung.

Fällt einer davon aus, bleibt die Seite bedienbar: die Suche greift auf das
mitgelieferte Ortsverzeichnis zurück, Land oder Wasser wird gerechnet.

## Wie der Gegenpunkt bestimmt wird

```
lat' = −lat
lon' = lon > 0 ? lon − 180 : lon + 180
```

Das ist reine Rechnung, kein Dienst wird dafür gefragt – die Koordinaten
stimmen also auch dann, wenn gerade keine API erreichbar ist.

`src/lib/geo.test.mjs` prüft das gegen bekannte Punkte. Die wichtigste Zusage
dort: der Ortsvektor des Gegenpunkts ist exakt der negierte Ortsvektor des
Startpunkts. Nur deshalb geht der rote Strich wirklich durch den Mittelpunkt
und nicht knapp daran vorbei.

Die Umrechnung Kugelkoordinaten → Szene muss dabei exakt zur UV-Abbildung von
`THREE.SphereGeometry` passen, sonst sitzt der Marker neben dem Ort. Die
Herleitung steht als Kommentar an `latLonToVector3`.

## Ohne Netz

Nicht überall sind Anfragen an fremde Hosts erlaubt – eine Seite mit strikter
Content-Security-Policy blockiert sie komplett, und dann antwortet Photon nie.
Damit das Tool trotzdem etwas taugt, liegen zwei Dinge bei:

- **Ortsverzeichnis** (`src/data/places.ts`, 17.244 Orte, ~450 kB): weltweit ab
  40.000 Einwohnern, im deutschsprachigen Raum ab 2.000. Findet Orte, keine
  Hausnummern. Erzeugt mit `node scripts/build-places.mjs`.
- **Küstenlinien**: Land oder Wasser am Gegenpunkt wird per Punkt-in-Polygon
  aus denselben Daten gerechnet, aus denen auch die Globustextur entsteht.
  Bei 1:110 Mio. ist die Küste grob vereinfacht – das Ergebnis wird deshalb
  als *Schätzung* ausgewiesen und der nächste bekannte Ort dazugestellt.

Die Suche nimmt immer erst Photon und fällt nur zurück, wenn es nicht
antwortet oder nichts findet. Sichtbar wird das durch einen Hinweis über der
Vorschlagsliste.

Der Ortsindex entsteht aus zwei GeoNames-Ablegern, weil keiner allein reicht:
`all-the-cities` hat Einwohnerzahlen (zum Sortieren), aber anglisierte Namen
("Munich"); `cities.json` hat die Namen in Landessprache ("Köln", "Zülpich"),
dafür keine Einwohnerzahlen. Zusammengeführt wird über die Koordinaten – aber
nur, wenn sich die Namen allein durch Diakritika unterscheiden, sonst würde
aus "Nurnberg" das englische "Nuremberg". Echte Exonyme stehen als kurze
Liste im Build-Skript.

## Datenquellen

Alle frei und ohne Schlüssel. Jeder Aufruf hat 5 s Zeitlimit und einen
Rückfallplan – die Oberfläche bleibt nie hängen, weil ein Dienst zickt.

| Zweck | Dienst | Hinweis |
|---|---|---|
| Adresssuche | [Photon](https://photon.komoot.io) | 300 ms Debounce, veraltete Anfragen werden abgebrochen |
| Ort am Gegenpunkt | [Nominatim](https://nominatim.openstreetmap.org) | max. 1 Anfrage/s, gedrosselt und gecacht |
| Höhe über NN | [Open-Meteo](https://open-meteo.com) | liefert über Wasser 0 |
| Wassertiefe | [GEBCO via OpenTopoData](https://www.opentopodata.org) | max. 1 Anfrage/s, 100/Tag – wird nur bei Wasser gefragt |

Ergebnisse landen in `localStorage`. **Fehlgeschlagene** Abfragen werden
bewusst *nicht* gecacht: eine kurze Störung für immer festzuschreiben wäre
schlimmer als eine zweite Anfrage.

Der Gegenpunkt kennt drei Güteklassen, die auseinandergehalten werden:

- **benannter Ort** – der Kartendienst kennt ihn; der seltene Fall, dass
  drüben Land ist
- **offenes Meer** – der Dienst kennt den Punkt, dort ist schlicht nichts
- **geschätzt** – kein Dienst erreichbar; Land oder Wasser kommt dann aus den
  mitgelieferten Küstenlinien und wird auch so beschriftet

## Globus

Die Erdtextur wird beim Start aus Vektordaten gezeichnet
([Natural Earth 1:110 m](https://www.naturalearthdata.com) über
`world-atlas`), nicht aus einer Bilddatei – so passen die Farben zur Palette
und es ist kein Bild-Asset nötig.

Beim Aufdecken wechselt das Kugelmaterial die Betriebsart: undurchsichtig
zeichnet es nur Vorderseiten mit Tiefenpuffer, durchscheinend beide Seiten
ohne. Ohne diese Unterscheidung zeichnet die abgewandte Hälfte über die
zugewandte und man schaut versehentlich auf die Rückseite der Erde.

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · Zustand ·
Three.js über `@react-three/fiber`

## Struktur

```
src/
  components/
    Globe/          # Three.js-Szene, Erdtextur, Achse, Kameraführung
    ui/             # Button, Panel, Tag, DataList, ScreenFx
    AddressSearch   # Eingabe mit Vorschlägen
    ResultPanel     # Auswertung des Gegenpunkts
  data/             # ERZEUGT: Ortsverzeichnis, Länderkennungen
  services/         # Geocoding, Höhe, Offline-Suche, Landmaske, HTTP-Basis
  store/            # Zustand-Store
  lib/              # Geometrie (+ Test), Typen, Formatierung
```

## Design-System

Tokens stehen in `src/index.css` unter `@theme` und sind damit als
Tailwind-Klassen verfügbar: dunkle Flächen, eine Erdton-Rampe, Cyan als
einziger kalter Akzent für die Bedienung, Rot allein für die Achse. Schriften
(*Archivo Black*, *Space Grotesk*, *Silkscreen*) liegen lokal unter
`public/fonts` – keine Requests an Dritte, kein Aufblitzen der Fallback-Schrift.

`prefers-reduced-motion` wird respektiert: Kamerafahrten und Pulsringe
entfallen dann, die Anzeige bleibt vollständig.
