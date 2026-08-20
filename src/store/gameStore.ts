import { create } from 'zustand'
import type { DrillSite, ScreenId } from '../lib/types'

/**
 * Zentraler Spiel-State.
 *
 * Die Screens sind eine simple Zustandsmaschine statt eines URL-Routers:
 * ANTIPODE ist ein Spiel, kein Dokument – Zurück-Button und Deep-Links
 * würden mitten in einer Bohrung mehr kaputt machen als sie helfen.
 */

/** Erlaubte Übergänge. Verhindert, dass ein Screen ohne Ziel aufgeht. */
const TRANSITIONS: Record<ScreenId, ScreenId[]> = {
  title: ['search'],
  search: ['title', 'globe'],
  globe: ['search', 'drill'],
  drill: ['globe', 'result'],
  result: ['search', 'globe'],
}

interface GameState {
  screen: ScreenId
  /** Screen, der gerade ausgeblendet wird – für die Übergangs-Animation. */
  leavingScreen: ScreenId | null
  site: DrillSite | null

  /** Startet stumm: Browser erlauben Audio erst nach einer Interaktion. */
  muted: boolean
  /** Hat der Spieler schon irgendwo geklickt? Erst dann darf Audio starten. */
  hasInteracted: boolean

  goTo: (screen: ScreenId) => void
  setSite: (site: DrillSite | null) => void
  toggleMute: () => void
  markInteracted: () => void
  /** Zurück auf Anfang, Sammlung und Rekorde bleiben erhalten. */
  reset: () => void
}

/** Dauer der Ausblend-Animation – muss zu `.screen-exit` in index.css passen. */
export const SCREEN_EXIT_MS = 240

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'title',
  leavingScreen: null,
  site: null,
  muted: true,
  hasInteracted: false,

  goTo: (screen) => {
    const current = get().screen
    if (current === screen) return

    if (!TRANSITIONS[current].includes(screen)) {
      // Kein harter Fehler: im Zweifel lieber navigieren als das Spiel blockieren.
      console.warn(`[antipode] Ungültiger Screen-Wechsel: ${current} → ${screen}`)
    }

    set({ screen, leavingScreen: current })
    window.setTimeout(() => {
      // Nur aufräumen, wenn inzwischen kein neuer Wechsel gestartet wurde.
      if (get().leavingScreen === current) set({ leavingScreen: null })
    }, SCREEN_EXIT_MS)
  },

  setSite: (site) => set({ site }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
  markInteracted: () => {
    if (!get().hasInteracted) set({ hasInteracted: true })
  },

  reset: () => set({ screen: 'title', leavingScreen: null, site: null }),
}))
