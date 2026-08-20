/** Geteilte Domänen-Typen. Wächst mit den späteren Schritten mit. */

/** Ein Punkt auf der Erde, den der Spieler anbohren will. */
export interface GeoPoint {
  lat: number
  lon: number
}

/** Ein aufgelöster Bohrort inklusive allem, was die Services dazu wissen. */
export interface DrillSite extends GeoPoint {
  /** Anzeigename, z. B. "Marienplatz 1, München". */
  label: string
  /** Kurzform für Überschriften, z. B. "München". */
  shortLabel?: string
  /** Meter über NN. Negativ = unter Meeresspiegel. Null = noch unbekannt. */
  elevation: number | null
  /** Land-ISO-Code, falls bekannt. */
  countryCode?: string
}
