const base = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')

export function apiUrl(path: string) {
  const next = path.startsWith('/') ? path : `/${path}`
  return `${base}${next}`
}
