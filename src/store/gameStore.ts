import { create } from 'zustand'
import type { DrillSite, GeoPoint } from '../lib/types'
import { antipode } from '../lib/geo'
import { reverseGeocode, toSite, type Suggestion } from '../services/geocoding'
import { getElevation, type ElevationResult } from '../services/elevation'

/**
 * Zentraler Zustand des Tools.
 *
 * Drei Phasen, mehr braucht es nicht:
 *   leer      – noch keine Adresse gewählt, Globus dreht sich
 *   gesetzt   – Adresse markiert, Globus ist undurchsichtig
 *   aufgedeckt – Globus wird durchscheinend, die Achse ist sichtbar
 */
export type Phase = 'empty' | 'located' | 'revealed'

export interface PointInfo {
  point: GeoPoint
  label: string | null
  elevation: ElevationResult | null
  /** Konnte die Rückwärtssuche überhaupt antworten? */
  lookup?: 'found' | 'empty' | 'failed'
}

interface State {
  phase: Phase
  site: DrillSite | null
  /** Was am Startpunkt liegt – Höhe über NN. */
  origin: PointInfo | null
  /** Was am Gegenpunkt liegt – Ortsname und Wassertiefe. */
  target: PointInfo | null
  loadingTarget: boolean

  selectSite: (suggestion: Suggestion) => void
  reveal: () => Promise<void>
  reset: () => void
}

export const useAppStore = create<State>((set, get) => ({
  phase: 'empty',
  site: null,
  origin: null,
  target: null,
  loadingTarget: false,

  selectSite: (suggestion) => {
    const site = toSite(suggestion)
    set({ phase: 'located', site, origin: null, target: null, loadingTarget: false })

    // Die Höhe am Startpunkt nachladen – blockiert nichts, der Marker steht schon.
    void getElevation(site).then((elevation) => {
      if (get().site !== site) return // Inzwischen andere Adresse gewählt.
      set({
        origin: { point: site, label: site.label, elevation },
        site: { ...site, elevation: elevation.meters },
      })
    })
  },

  reveal: async () => {
    const site = get().site
    if (!site || get().phase === 'revealed') return

    const point = antipode(site)
    // Sofort umschalten: Der Globus wird durchscheinend, während die Daten laufen.
    set({ phase: 'revealed', loadingTarget: true, target: { point, label: null, elevation: null } })

    const [place, elevation] = await Promise.all([
      reverseGeocode(point),
      getElevation(point),
    ])

    if (get().site !== site) return // Adresse wurde zwischenzeitlich gewechselt.
    set({
      target: { point, label: place.label, elevation, lookup: place.status },
      loadingTarget: false,
    })
  },

  reset: () =>
    set({ phase: 'empty', site: null, origin: null, target: null, loadingTarget: false }),
}))
