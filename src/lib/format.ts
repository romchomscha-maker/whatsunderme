/** Formatierungs-Helfer. Alles auf Deutsch, alles mit Tausenderpunkt. */

const nf = (digits: number) =>
  new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })

export function formatNumber(value: number, digits = 0): string {
  return nf(digits).format(value)
}

/** Koordinaten in der Form "48,1372° N / 11,5756° O". */
export function formatCoords(lat: number, lon: number): string {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lon >= 0 ? 'O' : 'W'
  return `${formatNumber(Math.abs(lat), 3)}° ${ns} / ${formatNumber(Math.abs(lon), 3)}° ${ew}`
}

/** Höhe über NN, mit Vorzeichen und Hinweis unter dem Meeresspiegel. */
export function formatElevation(meters: number | null): string {
  if (meters === null) return '—'
  if (meters < 0) return `${formatNumber(Math.abs(meters))} m unter NN`
  return `${formatNumber(meters)} m ü. NN`
}
