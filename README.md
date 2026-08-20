# ANTIPODE

Ein Browser-Game: Adresse eingeben, senkrecht durch die Erde bohren, im
Querschnitt zusehen, durch welche Gesteinsschichten es geht – und schauen, wo
man auf der anderen Seite des Planeten wieder rauskommt.

Meistens im Ozean. Das ist der Witz.

## Stand

Schritt 1 von 10 ist fertig: Projekt-Setup, Screen-Routing und Design-System.
Die Screens für Globus, Bohrung und Ergebnis sind als Platzhalter angelegt, der
komplette Ablauf lässt sich aber schon durchklicken.

| # | Schritt | Status |
|---|---|---|
| 1 | Setup, Routing, Design-System | ✅ |
| 2 | Geocoding-Service + Autocomplete | offen |
| 3 | Schichtmodell mit Temperatur-/Druck-Interpolation | offen |
| 4 | Querschnitt-Canvas, nicht-lineare Tiefenskala | offen |
| 5 | Bohr-Animation + HUD | offen |
| 6 | Three.js-Globus mit stilisiertem Shader | offen |
| 7 | Antipode-Logik + Ergebnis-Screen | offen |
| 8 | Game-Layer: Hitze, Bohrkerne, Achievements | offen |
| 9 | Sound (Web Audio, synthetisch) | offen |
| 10 | Polish: Partikel, Screenshake, Transitions | offen |

## Entwicklung

```bash
npm install
npm run dev      # Dev-Server
npm run build    # Production-Build nach dist/
npm run lint

# Alles in eine einzige HTML-Datei backen (CSS, JS und Schriften inline).
# Lässt sich ohne Server öffnen und verschicken – praktisch zum Drüberschauen.
npm run build:standalone
```

Kein Backend, keine API-Keys. Deploybar als statische Site.

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · Zustand · Three.js
(`@react-three/fiber`) für den Globus · Canvas 2D für den Querschnitt ·
Web Audio API für den Sound.

## Struktur

```
src/
  components/
    Globe/          # Three.js-Globus + Shader        (Schritt 6)
    CrossSection/   # Canvas-Bohransicht              (Schritte 4–5)
    HUD/                                              (Schritt 5)
    Screens/        # Title, Search, Globe, Drill, Result
    ui/             # Button, Panel, Tag, ScreenFx …
  data/             # Schichtmodell, Fakten, Achievements
  services/         # Geocoding, Elevation, Geologie
  audio/
  store/            # Zustand-Store
  lib/              # Typen, Formatierung, Motion-Hook
```

## Design-System

Alle Tokens stecken in `src/index.css` unter `@theme` und sind damit als
Tailwind-Klassen verfügbar.

- **Flächen** `abyss` · `void` · `night` · `dusk` · `steel` · `ash` · `bone`
- **Kalter Akzent** `cyan` und Abstufungen – für UI und Bohrer, damit sich
  beides immer vom Untergrund abhebt
- **Erdtöne** `soil` → `clay` → `sand` → `ocher` → `rust` → `ember` → `magma`
  → `flare` → `whitehot`; die Rampe wird nach unten hin glühender
- **Signal** `warn` · `danger` · `ok`

Schriften: *Archivo Black* für Headlines, *Space Grotesk* für Fließtext und
Zahlen, *Silkscreen* als Pixel-Font für Labels. Die Dateien liegen lokal unter
`public/fonts` (latin-Subset, zusammen ~57 KB) – keine Requests an Dritte, kein
Aufblitzen der Fallback-Schrift.

Chrome-Utilities: `clip-bevel`, `clip-bevel-sm`, `clip-tag`, `clip-notch`,
`hazard-stripes`, `rivets`. Post-Processing (`ScreenFx`) legt Film-Grain,
Scanlines und Vignette bei je ~5 % Deckkraft über die App.

`prefers-reduced-motion` wird respektiert: dekorative Animationen laufen per
CSS-Media-Query nicht, für alles Weitere gibt es den Hook
`usePrefersReducedMotion()`.

## Routing

Die Screens sind eine Zustandsmaschine im Store (`src/store/gameStore.ts`),
kein URL-Router: ANTIPODE ist ein Spiel, kein Dokument – ein Zurück-Button
mitten in der Bohrung würde mehr kaputt machen als er hilft.

```
title → search → globe → drill → result
                   ↑                 │
                   └─────────────────┘
```
