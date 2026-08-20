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

Der Gegenpunkt kennt drei Zustände, die auseinandergehalten werden:

- **benannter Ort** – der seltene Fall, dass drüben Land ist
- **offenes Meer** – der Dienst kennt den Punkt, dort ist schlicht nichts
- **keine Antwort** – der Dienst war nicht erreichbar; dann wird weder Land
  noch Wasser behauptet, nur die gerechneten Koordinaten stehen da

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
  services/         # Geocoding, Höhe, gemeinsame HTTP-Basis
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
