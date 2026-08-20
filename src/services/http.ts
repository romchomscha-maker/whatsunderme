/**
 * Gemeinsame Basis für alle externen Aufrufe.
 *
 * Grundregel: Die App darf nie hängen bleiben, weil ein Dienst zickt.
 * Jeder Aufruf hat ein Zeitlimit und jeder Aufrufer einen Rückfallplan.
 */

export const REQUEST_TIMEOUT_MS = 5000

/** `fetch` mit hartem Zeitlimit. Wirft bei Timeout, Netzfehler und HTTP-Fehler. */
export async function fetchJson<T>(
  url: string,
  { timeoutMs = REQUEST_TIMEOUT_MS, signal }: { timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  // Ein von außen abgebrochener Aufruf (z. B. veraltete Autocomplete-Anfrage)
  // muss den internen Controller mitnehmen.
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} für ${url}`)
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

/**
 * Kleiner localStorage-Cache mit Namensraum.
 *
 * Nominatim und OpenTopoData erlauben nur ~1 Anfrage/Sekunde; ohne Cache
 * wäre man bei mehrmaligem Ausprobieren derselben Adresse sofort gesperrt.
 */
export function makeCache<T>(namespace: string, maxEntries = 300) {
  const key = (k: string) => `antipode:${namespace}:${k}`

  return {
    get(k: string): T | undefined {
      try {
        const raw = localStorage.getItem(key(k))
        return raw ? (JSON.parse(raw) as T) : undefined
      } catch {
        return undefined // Privater Modus o. ä. – Cache ist optional.
      }
    },
    set(k: string, value: T) {
      try {
        localStorage.setItem(key(k), JSON.stringify(value))
        this.prune()
      } catch {
        /* Speicher voll oder gesperrt: nicht schlimm. */
      }
    },
    /** Hält den Cache klein, damit localStorage nicht vollläuft. */
    prune() {
      try {
        const prefix = `antipode:${namespace}:`
        const keys = Object.keys(localStorage).filter((k) => k.startsWith(prefix))
        if (keys.length <= maxEntries) return
        for (const k of keys.slice(0, keys.length - maxEntries)) {
          localStorage.removeItem(k)
        }
      } catch {
        /* egal */
      }
    },
  }
}

/**
 * Serialisiert Aufrufe und hält einen Mindestabstand ein.
 * Nominatim und OpenTopoData verlangen beide max. 1 Anfrage pro Sekunde.
 */
export function makeRateLimiter(minIntervalMs: number) {
  let chain: Promise<unknown> = Promise.resolve()
  let last = 0

  return function run<T>(task: () => Promise<T>): Promise<T> {
    const result = chain.then(async () => {
      const wait = last + minIntervalMs - Date.now()
      if (wait > 0) await new Promise((r) => setTimeout(r, wait))
      last = Date.now()
      return task()
    })
    // Die Kette darf nicht durch einen Fehler abreißen.
    chain = result.catch(() => undefined)
    return result
  }
}
