type Entry<T> = { value: T; expires: number }

const memory = new Map<string, Entry<unknown>>()
const PREFIX = 'tf-cache:'

function readStore(key: string): Entry<unknown> | null {
  const hit = memory.get(key)
  if (hit) return hit
  try {
    const raw = sessionStorage.getItem(PREFIX + key)
    if (!raw) return null
    return JSON.parse(raw) as Entry<unknown>
  } catch {
    return null
  }
}

function writeStore(key: string, entry: Entry<unknown>) {
  memory.set(key, entry)
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(entry))
  } catch {
    /* quota / private mode */
  }
}

export function cacheGet<T>(key: string): T | null {
  const entry = readStore(key)
  if (!entry) return null
  if (Date.now() > entry.expires) {
    memory.delete(key)
    try {
      sessionStorage.removeItem(PREFIX + key)
    } catch {
      /* ignore */
    }
    return null
  }
  return entry.value as T
}

export function cacheSet<T>(key: string, value: T, ttlMs: number) {
  writeStore(key, { value, expires: Date.now() + ttlMs })
}

export const TTL = {
  weather: 20 * 60 * 1000,
  places: 6 * 60 * 60 * 1000,
  placeDetails: 8 * 60 * 60 * 1000,
  geocode: 7 * 24 * 60 * 60 * 1000,
  route: 6 * 60 * 60 * 1000,
  currency: 6 * 60 * 60 * 1000,
  health: 2 * 60 * 1000,
}
