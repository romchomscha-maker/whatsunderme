import { useEffect, useId, useRef, useState } from 'react'
import { searchPlaces, type Suggestion } from '../services/geocoding'
import { useAppStore } from '../store/gameStore'
import { cn } from '../lib/cn'

/**
 * Adresseingabe mit Vorschlägen von Photon.
 *
 * Getippt wird laufend, gesucht erst nach 300 ms Ruhe – sonst löst jeder
 * Buchstabe eine eigene Anfrage aus. Veraltete Anfragen werden abgebrochen,
 * damit eine langsame frühere Antwort keine neuere überschreibt.
 */

const DEBOUNCE_MS = 300

export function AddressSearch() {
  const selectSite = useAppStore((s) => s.selectSite)
  const site = useAppStore((s) => s.site)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Suggestion[]>([])
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const [failed, setFailed] = useState(false)

  const listId = useId()
  const boxRef = useRef<HTMLDivElement>(null)
  const inFlight = useRef<AbortController | null>(null)
  /**
   * Nach einer Auswahl steht die gewählte Adresse im Feld. Diese Änderung darf
   * keine neue Suche auslösen – sonst klappt die Liste sofort wieder auf und
   * verdeckt den Berechnen-Knopf darunter.
   */
  const skipNextSearch = useRef(false)

  // Der Effekt kümmert sich nur um die Netzanfrage. Alles, was direkt aus
  // einer Eingabe folgt, wird im jeweiligen Handler gesetzt – das erspart
  // synchrone Zustandswechsel im Effekt und damit eine zweite Renderrunde.
  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false
      return
    }

    const q = query.trim()
    if (q.length < 2) return

    const timer = setTimeout(async () => {
      inFlight.current?.abort()
      const controller = new AbortController()
      inFlight.current = controller

      try {
        const found = await searchPlaces(q, controller.signal)
        if (controller.signal.aborted) return
        setResults(found)
        setFailed(found.length === 0)
        setHighlight(0)
        setOpen(true)
      } catch {
        // Abgebrochen, weil weitergetippt wurde – kein Fehlerfall.
      } finally {
        if (!controller.signal.aborted) setBusy(false)
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [query])

  // Klick nach außen schließt die Liste.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [])

  const choose = (s: Suggestion) => {
    selectSite(s)
    skipNextSearch.current = true
    inFlight.current?.abort()
    setQuery(s.label)
    setOpen(false)
    setResults([])
    setBusy(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => (h + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => (h - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(results[highlight])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            const next = e.target.value
            setQuery(next)
            setOpen(true)
            if (next.trim().length < 2) {
              setResults([])
              setFailed(false)
              setBusy(false)
            } else {
              setBusy(true)
            }
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Adresse, Ort oder Sehenswürdigkeit"
          aria-label="Adresse suchen"
          aria-expanded={open}
          aria-controls={listId}
          autoComplete="off"
          className="clip-bevel-sm font-ui w-full border-2 border-steel bg-night px-4 py-3.5 pr-11 text-base text-bone placeholder:text-ash/60 focus:border-cyan focus:outline-none"
        />

        {busy && (
          <span
            aria-hidden
            className="absolute top-1/2 right-4 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-cyan border-t-transparent [animation:spin_0.7s_linear_infinite]"
          />
        )}
      </div>

      {open && (results.length > 0 || failed) && (
        <ul
          id={listId}
          role="listbox"
          className="clip-bevel-sm absolute top-full right-0 left-0 z-30 mt-1 max-h-72 overflow-y-auto border-2 border-steel bg-night shadow-2xl"
        >
          {results.map((s, i) => (
            <li key={`${s.label}-${s.lat}-${s.lon}`} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                onClick={() => choose(s)}
                onPointerEnter={() => setHighlight(i)}
                className={cn(
                  'flex w-full flex-col gap-0.5 border-b border-steel/50 px-4 py-2.5 text-left transition-colors last:border-b-0',
                  i === highlight ? 'bg-dusk' : 'hover:bg-dusk/60',
                )}
              >
                {/* `pointer-events-none`: der Klick soll immer beim Button
                    landen, nie bei einem der Textknoten darin. */}
                <span className="pointer-events-none text-sm text-bone">{s.shortLabel}</span>
                <span className="pointer-events-none truncate text-xs text-ash">
                  {s.label}
                </span>
              </button>
            </li>
          ))}

          {failed && (
            <li className="px-4 py-4 text-center text-sm text-ash">
              Nichts gefunden. Versuch es mit Ort und Land.
            </li>
          )}
        </ul>
      )}

      {site && (
        <p className="mt-2 truncate text-xs text-ash">
          Gewählt: <span className="text-cyan">{site.label}</span>
        </p>
      )}
    </div>
  )
}
